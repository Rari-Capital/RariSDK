var ethers = require('ethers')
var axios = require('axios')
var Caches = require('../cache.ts') 

const externalContractAddresses = {
    Masset: "0xe2f2a5c287993345a840db3b0845fbc70f5935a5",
    MassetValidationHelper: "0xabcc93c3be238884cc3309c19afd128fafc16911",
  };

let externalAbis = {};
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
        
        return data;
    }


}