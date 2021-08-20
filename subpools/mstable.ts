var ethers = require('ethers')
var axios = require('axios')
var Caches = require('../cache.ts') 
var erc20Abi = require('../abi/ERC20.json')

var externalContractAddresses = {
    Masset: "0xe2f2a5c287993345a840db3b0845fbc70f5935a5",
    MassetValidationHelper: "0xabcc93c3be238884cc3309c19afd128fafc16911",
  };

var externalAbis = {};
for (const contractName of Object.keys(externalContractAddresses)) {
    externalAbis[contractName] = require('./mstable/abi/' + contractName + '.json')
}

module.exports = class mStableSubpool {
    provider
    cache
    externalContracts

    constructor(provider) {
        this.provider = provider
        this.cache = new Caches({
            mStableCurrencyApys: 300,
            mUsdSwapFee: 3600,
        })

        this.externalContracts = {};

        for (const contractName of Object.keys(externalContractAddresses)) {
            this.externalContracts[contractName] = new ethers.Contract(externalContractAddresses[contractName], externalAbis[contractName])
        }
    }

    async getMUsdSavingsApy(includeIMUsdVaultApy) {
        const data = (
            await axios.post("https://api.thegraph.com/subgraphs/name/mstable/mstable-protocol-staging",
                {
                    operationName: "MUSD",
                    query:
                    'query MUSD {\n  masset(id: "0xe2f2a5c287993345a840db3b0845fbc70f5935a5") {\n    feeRate\n    savingsContractsV2: savingsContracts(where: {version: 2}) {\n      ...SavingsContractAll\n      token {\n        ...TokenAll\n        __typename\n      }\n      boostedSavingsVaults {\n        id\n        lastUpdateTime\n        lockupDuration\n        unlockPercentage\n        periodDuration\n        periodFinish\n        rewardPerTokenStored\n        rewardRate\n        stakingContract\n        totalStakingRewards\n        totalSupply\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment TokenAll on Token {\n  id\n  address\n  decimals\n  symbol\n  totalSupply {\n    ...MetricFields\n    __typename\n  }\n  __typename\n}\n\nfragment MetricFields on Metric {\n  exact\n  decimals\n  simple\n  __typename\n}\n\nfragment SavingsContractAll on SavingsContract {\n  id\n  totalSavings {\n    ...MetricFields\n    __typename\n  }\n  latestExchangeRate {\n    rate\n    timestamp\n    __typename\n  }\n  dailyAPY\n  version\n  active\n  __typename\n}\n',
                }
            )
        ).data;

        if (!data || !data.data)
                return console.error("Failed to decode exchange rates from The Graph when calculating mStable 24-hour APY");
        
        this.cache.update("mUsdSwapFee", ethers.BigNumber.from(data.data.masset.feeRate));

        let apy = ethers.utils.parseUnits(data.data.masset.savingsContractsV2[0].dailyAPY, 16);

        if(includeIMUsdVaultApy)
                apy = apy.add(
                    await this.getIMUsdVaultApy(data.data.masset.savingsContractsV2[0].boostedSavingsVaults[0].totalStakingRewards, data.data.masset.savingsContractsV2[0].latestExchangeRate.rate )
                );

        return apy;
    }

    async getCurrencyApys() {
        var self = this;
        return await self.cache.getOrUpdate(
            "mStableCurrencyApys",
            async function () {
                return { mUSD: await self.getMUsdSavingsApy(true) };
            }
        )
    }

    async getMtaUsdPrice() {
        return (
            await axios(
                "https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xa3bed4e1c75d00fa6f4e5e6922db7261b5e9acd2&vs_currencies=USD"
            )
        ).data["0xa3bed4e1c75d00fa6f4e5e6922db7261b5e9acd2"].usd;
    }

    async getIMUsdVaultWeeklyRoi(totalStakingRewards, stakingTokenPrice) {
        // Get Total Staked by our account
        const contract = new ethers.Contract("0x30647a72dc82d7fbb1123ea74716ab8a317eac19", erc20Abi, this.provider)
        const totalStaked = await contract.balanceOf("0x78befca7de27d07dc6e71da295cc2946681a6c7b") / ethers.constants.WeiPerEther.toString()
       
        // https://github.com/mstable/mStable-app/blob/56055318f23b43479455cdf0a9521dfec493b01c/src/hooks/useVaultWeeklyROI.ts#L43
        const mtaPerWeekInUsd = totalStakingRewards * (await this.getMtaUsdPrice());
        const totalStakedInUsd = stakingTokenPrice * totalStaked;
        return mtaPerWeekInUsd / totalStakedInUsd;
    }

    async getIMUsdVaultApy(totalStakingRewards, stakingTokenPrice) {
        const weeklyROI = await this.getIMUsdVaultWeeklyRoi(totalStakingRewards, stakingTokenPrice)
        const apyBN = ethers.utils.parseUnits(
                            ethers.utils.formatUnits(
                                (
                                    (
                                        (
                                            (weeklyROI + 1) 
                                        ** 52) 
                                    - 1) 
                                * 1e18)
                            .toFixed(0), 18) , 18)

        return apyBN
    }


}