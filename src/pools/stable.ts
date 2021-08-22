var { ethers: ethers} = require('ethers')
var Caches = require('../cache.ts')
var axios = require('axios')

var erc20Abi = require('../abi/ERC20.json')

// Contract addresses
const contractAddressesStable = {
    RariFundController: "0x66f4856f1bbd1eb09e1c8d9d646f5a3a193da569",
    RariFundManager: "0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a",
    RariFundToken: "0x016bf078ABcaCB987f0589a6d3BEAdD4316922B0",
    RariFundPriceConsumer: "0xFE98A52bCAcC86432E7aa76376751DcFAB202244",
    RariFundProxy: "0x4a785fa6fcd2e0845a24847beb7bddd26f996d4d",
};

// For every contractName require the ABI
var abisStable = {};
for (const contractName of Object.keys(contractAddressesStable))
    abisStable[contractName] = require("./stable/abi/" + contractName + ".json")

// Legacy addresses
const legacyContractAddresses = {
    "v1.0.0": {
        RariFundManager: "0x686ac9d046418416d3ed9ea9206f3dace4943027",
        RariFundToken: "0x9366B7C00894c3555c7590b0384e5F6a9D55659f",
        RariFundProxy: "0x27C4E34163b5FD2122cE43a40e3eaa4d58eEbeaF",
    },
    "v1.1.0": {
        RariFundController: "0x15c4ae284fbb3a6ceb41fa8eb5f3408ac485fabb",
        RariFundManager: "0x6bdaf490c5b6bb58564b3e79c8d18e8dfd270464",
        RariFundProxy: "0x318cfd99b60a63d265d2291a4ab982073fbf245d",
    },
    "v1.2.0": {
        RariFundProxy: "0xb6b79D857858004BF475e4A57D4A446DA4884866",
    },
    "v2.0.0": {
        RariFundController: "0xEe7162bB5191E8EC803F7635dE9A920159F1F40C",
        RariFundManager: "0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a",
        RariFundProxy: "0xD4be7E211680e12c08bbE9054F0dA0D646c45228",
    },
    "v2.2.0": {
        RariFundProxy: "0xB202cAd3965997f2F5E67B349B2C5df036b9792e",
    },
    "v2.4.0": {
        RariFundProxy: "0xe4deE94233dd4d7c2504744eE6d34f3875b3B439",
    },
    "v2.5.0": {
        RariFundController: "0x369855b051d1b2dbee88a792dcfc08614ff4e262",
    },
};

var legacyAbis = {};
for (const version of Object.keys(legacyContractAddresses))
            legacyAbis[version] = {}

for (const version of Object.keys(legacyAbis))
    for (const contractName of Object.keys(legacyContractAddresses[version]))
    legacyAbis[version][contractName] = require("./stable/abi/legacy/" + version + "/" + contractName + ".json") 

module.exports = class StablePool {
    API_BASE_URL = "https://api.rari.capital/pools/stable/";
    POOL_NAME = "Rari Stable Pool";
    POOL_TOKEN_SYMBOL = "RSPT";
    provider
    pools
    getAllTokens
    cache 
    contracts
    legacyContracts
    balances
    allocations
    apy

    static CONTRACT_ADDRESSES = contractAddressesStable;
    static CONTRACT_ABIS = abisStable;

    constructor(provider, subpools, getAllTokens) {
        this.provider = provider;
        this.pools = subpools;
        this.getAllTokens = getAllTokens;
        this.cache = new Caches({
            usdPrices: 300,
            allBalances: 30,
            accountBalanceLimit: 3600,
            coinGeckoList: 3600,
            coinGeckoUsdPrices: 900,
            acceptedCurrencies: 30,
        });

        this.contracts = {};
        for (const contractName of Object.keys(contractAddressesStable))
            this.contracts[contractName] = new ethers.Contract(contractAddressesStable[contractName], abisStable[contractName], this.provider);
        
        this.legacyContracts = {};
        for (const version of Object.keys(legacyContractAddresses)) {
            if (!this.legacyContracts[version]) this.legacyContracts[version] = {};
            for (const contractName of Object.keys(legacyContractAddresses[version]))
                this.legacyContracts[version][
                    contractName
                ] = new ethers.Contract(legacyContractAddresses[version][contractName], legacyAbis[version][contractName], this.provider);
        };

        for (const currencyCode of Object.keys(this.internalTokens))
            this.internalTokens[currencyCode].contract = new ethers.Contract(this.internalTokens[currencyCode].address, erc20Abi, this.provider);

        var self = this;
        
        this.balances = {
            getTotalSupply: async () => {
                return ( await self.contracts.RariFundManager.callStatic.getFundBalance() )
            },
            getTotalInterestAccrued: async (fromBlock = 0, toBlock = "latest") => {
                if(!fromBlock) fromBlock = 0;
                if(toBlock === undefined) toBlock = "latest";

                if( fromBlock === 0 && toBlock === "latest")
                    return ( await self.contracts.RariFundManager.callStatic.getInterestAccrued() );
                else 
                    try {
                        return (await axios.get(self.API_BASE_URL + "interest", { params: {fromBlock, toBlock}, }) ).data;
                    } catch (e) {
                        throw new Error("Error in Rari API: " + e)
                    }
            },
            balanceOf: async (account) => {
                if(!account) throw new Error("No account specified");
                return ( await self.contracts.RariFundManager.callStatic.balanceOf(account) );

            },
            interestAccruedBy: async (account, fromTimestamp = 0, toTimestamp = "latest") => {
                if (!account) throw new Error("No account specified");
                if (!fromTimestamp) fromTimestamp = 0;
                if (toTimestamp === undefined) toTimestamp = "latest";

                try {
                    return ( await axios.get(self.API_BASE_URL + "interest/" + account, { params: {fromTimestamp, toTimestamp}})).data;
                } catch (e) {
                    throw new Error("Error in Rari API: " + e);
                }
            },
            transfer: async (recipient, amount, options) => {
                if (!recipient) throw new Error("No recipient specified.");
                if ( !amount || !ethers.BigNumber.from(amount) || !amount.gt(ethers.constants.Zero) ) 
                    throw new Error("Amount is not a valid BN instance greater than 0.");

                var fundBalanceBN = ethers.BigNumber.from( await self.contracts.RariFundManager.callStatic.getFundBalance() )
                var rftTotalSupplyBN = ethers.BigNumber.from( await self.contracts.RariFundToken.callStatic.totalSupply() )
                var rftAmountBN = amount.mul(rftTotalSupplyBN).div(fundBalanceBN);
                return await self.contracts.RariFundToken.transfer(recipient, rftAmountBN).send(options)
            }
        };

        this.allocations = {
            CURRENCIES: ["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD", "mUSD"],
            POOLS: (function () {
                var pools = ["dYdX", "Compound", "Aave", "mStable"];
                pools[100] = "Fuse3";
                pools[101] = "Fuse7";
                pools[102] = "Fuse13";
                pools[103] = "Fuse14";
                pools[104] = "Fuse15";
                pools[105] = "Fuse16";
                pools[106] = "Fuse11";
                pools[107] = "Fuse2";
                pools[108] = "Fuse18";
                pools[109] = "Fuse6";
                return pools
            })(),
            POOLS_BY_CURRENCY: {
                DAI: ["dYdX", "Compound", "Aave"],
                USDC: ["dYdX", "Compound", "Aave", "Fuse3", "Fuse7", "Fuse13", "Fuse14", "Fuse15", "Fuse16", "Fuse11", "Fuse2", "Fuse18", "Fuse6"],
                USDT: ["Compound", "Aave"],
                TUSD: ["Aave"],
                BUSD: ["Aave"],
                sUSD: ["Aave"],
                mUSD: ["mStable"],
            },
            CURRENCIES_BY_POOL: {
                dYdX: ["DAI", "USDC"],
                Compound: ["DAI", "USDC", "USDT"],
                Aave: ["DAI", "USDC", "USDT", "TUSD", "BUSD", "sUSD"],
                mStable: ["mUSD"],
                Fuse3: ["USDC"],
                Fuse7: ["USDC"],
                Fuse13: ["USDC"],
                Fuse14: ["USDC"],
                Fuse15: ["USDC"],
                Fuse16: ["USDC"],
                Fuse11: ["USDC"],
                Fuse2: ["USDC"],
                Fuse18: ["USDC"],
                Fuse6: ["USDC"],
            },
            getRawCurrencyAllocations: async () => {
                var allocationsByCurrency = {
                    DAI: ethers.constants.Zero,
                    USDC: ethers.constants.Zero,
                    USDT: ethers.constants.Zero,
                    TUSD: ethers.constants.Zero,
                    BUSD: ethers.constants.Zero,
                    sUSD: ethers.constants.Zero,
                    mUSD: ethers.constants.Zero,
                };
                var allBalances = await self.cache.getOrUpdate("allBalances", self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices)
                
                for (let i = 0; i < allBalances["0"].length; i++) {
                    const currencyCode = allBalances["0"][i]
                    const contractBalanceBN = ethers.BigNumber.from(allBalances["1"][i])
                    allocationsByCurrency[currencyCode] = contractBalanceBN;
                    const pools = allBalances["2"][i];
                    const poolBalances = allBalances["3"][i];

                    for (let j = 0; j < pools.length; j ++) {
                        const poolBalanceBN = ethers.BigNumber.from(poolBalances[j]);
                        allocationsByCurrency[currencyCode] = allocationsByCurrency[currencyCode].add(poolBalanceBN)
                    }
                }
                return allocationsByCurrency;
            },
            getRawCurrencyAllocationsInUsd: async () => {
                const allocationsByCurrency = {
                    DAI: ethers.constants.Zero,
                    USDC: ethers.constants.Zero,
                    USDT: ethers.constants.Zero,
                    TUSD: ethers.constants.Zero,
                    BUSD: ethers.constants.Zero,
                    sUSD: ethers.constants.Zero,
                    mUSD: ethers.constants.Zero,
                };
                const allBalances = await self.cache.getOrUpdate("allBalances", self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices )

                for (let i = 0; i < allBalances["0"].length; i++) {
                    const currencyCode = allBalances["0"][i];
                    const priceInUsdBN = ethers.BigNumber.from(allBalances["4"][i]);
                    const contractBalanceBN = ethers.BigNumber.from(allBalances["1"][i]);
                    const contractBalanceUsdBN = contractBalanceBN
                        .mul(priceInUsdBN)
                        .div(
                            self.internalTokens[currencyCode].decimals === 18 
                                ? ethers.constants.WeiPerEther 
                                : ethers.BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                        );
                    allocationsByCurrency[currencyCode] = contractBalanceUsdBN;

                    const pools = allBalances["2"][i];
                    const poolBalances = allBalances["3"][i];

                    for(var j = 0; j < pools.length; j++ ){
                        const poolBalanceBN = ethers.BigNumber.from(poolBalances[j]);
                        const poolBalanceUsdBN = poolBalanceBN
                            .mul(priceInUsdBN)
                            .div(
                                self.internalTokens[currencyCode].decimals === 18 
                                ? ethers.constants.WeiPerEther 
                                : ethers.BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                            );
                        allocationsByCurrency[currencyCode] = allocationsByCurrency[currencyCode].add(poolBalanceUsdBN)
                    };
                };

                return allocationsByCurrency;
            },
            getRawPoolAllocations: async () => {
                const allocationsByPool = {
                    _cash: ethers.constants.Zero,
                };
                for (const poolName of self.allocations.POOLS)
                    if(poolName !== undefined)
                        allocationsByPool[poolName] = ethers.constants.Zero;
                const allBalances = await self.cache.getOrUpdate(
                    "allBalances",
                    self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices
                )

                for (let i = 0; i < allBalances["0"].length; i++) {
                    const currencyCode = allBalances["0"][i];
                    const priceInUsdBN = ethers.BigNumber.from(allBalances["4"][i]);
                    const contractBalanceBN = ethers.BigNumber.from(allBalances["1"][i]);
                    const contractBalanceUsdBN = contractBalanceBN
                        .mul(priceInUsdBN)
                        .div(
                            self.internalTokens[currencyCode].decimals === 18 
                            ? ethers.constants.WeiPerEther 
                            : ethers.BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                        );
                    allocationsByPool._cash = allocationsByPool._cash.add(contractBalanceUsdBN);
                    const pools = allBalances["2"][i];
                    const poolBalances = allBalances["3"][i];
                    
                    for (let j = 0; j < pools.length; j++) {
                        const pool = pools[j];
                        const poolBalanceBN = ethers.BigNumber.from(poolBalances[j]);
                        const poolBalanceUsdBN = poolBalanceBN
                            .mul(priceInUsdBN)
                            .div(
                                self.internalTokens[currencyCode].decimals === 18 
                                ? ethers.constants.WeiPerEther 
                                : ethers.BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                            )
                        allocationsByPool[self.allocations.POOLS[pool]] = allocationsByPool[self.allocations.POOLS[pool]].add(poolBalanceUsdBN);
                    }
                }
                return allocationsByPool;
            },
            getRawAllocations: async () => {
                const currencies = {};
                const allBalances = await self.cache.getOrUpdate(
                    "allBalances",
                    self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices
                );

                for (let i = 0; i < allBalances["0"].length; i++) {
                    const currencyCode = allBalances["0"][i];
                    const contractBalanceBN = ethers.BigNumber.from(allBalances["1"][i]);
                    currencies[currencyCode] = { _cash: contractBalanceBN };
                    const pools = allBalances["2"][i];
                    const poolBalances = allBalances["3"][i];

                    for (let j = 0; j < pools.length; j++) {
                        const pool = pools[j];
                        const poolBalanceBN = ethers.BigNumber.from(poolBalances[j]);
                        currencies[currencyCode][self.allocations.POOLS[pool]] = poolBalanceBN

                    }
                } 
                return currencies;
            },
            getCurrencyUsdPrices: async () => {
                const prices = {};
                const allBalances = await self.cache.getOrUpdate(
                    "allBalances", 
                    self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices
                );
                for (let i = 0; i < allBalances["0"].length; i++) {
                    prices[allBalances["0"][i]] = ethers.BigNumber.from(allBalances["4"][i]);
                }
                return prices;
            }
        };

        this.apy = {
            getCurrentRawApy: async () => {
                let factors = [];
                let totalBalanceUsdBN = ethers.constants.Zero;

                // Get all Balances
                const allBalances = await self.cache.getOrUpdate(
                    "allBalances",
                    self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices
                );

                // Get raw balance
                for (let i = 0; i < allBalances["0"].length; i++) {
                    const currencyCode = allBalances["0"][i];
                    const priceInUsdBN = ethers.BigNumber.from(allBalances["4"][i]);
                    const contractBalanceBN = ethers.BigNumber.from(allBalances["1"][i]);

                    const contractBalanceUsdBN = contractBalanceBN
                        .mul(priceInUsdBN)
                        .div(
                            self.internalTokens[currencyCode].decimals === 18 
                            ? ethers.constants.WeiPerEther 
                            : ethers.BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                        );
                    
                    factors.push([contractBalanceUsdBN, ethers.constants.Zero]);
                    totalBalanceUsdBN = totalBalanceUsdBN.add(contractBalanceUsdBN)
                    const pools = allBalances["2"][i];
                    const poolBalances = allBalances["3"][i];

                    for (let j = 0; j < pools.length; j++ ) {
                        const pool = pools[j]
                        const poolBalanceBN = ethers.BigNumber.from(poolBalances[j])
                        const poolBalanceUsdBN = poolBalanceBN
                            .mul(priceInUsdBN)
                            .div(
                                self.internalTokens[currencyCode].decimals === 18 
                                ? ethers.constants.WeiPerEther 
                                : ethers.BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                            );

                        const poolApyBN = poolBalanceUsdBN.gt(ethers.constants.Zero) 
                            ? ( await self.pools[self.allocations.POOLS[pool]].getCurrencyApys() )[currencyCode]
                            : ethers.constants.Zero
                        
                        factors.push([poolBalanceUsdBN, poolApyBN]);
                        totalBalanceUsdBN = totalBalanceUsdBN.add(poolBalanceUsdBN)
                    }
                }
                
                console.log(totalBalanceUsdBN.isZero())
                if (totalBalanceUsdBN.isZero()) {
                    let maxApyBN = ethers.constants.Zero;
                    for (let i = 0; i < factors.length; i++ ){
                        if(factors[i][1].gt(maxApyBN)) 
                            maxApyBN = factors[i][1];
                        }
                    return maxApyBN;
                }

                let apyBN = ethers.constants.Zero
                for (let i =0; i < factors.length; i++){
                    apyBN = apyBN.add(
                        factors[i][0]
                        .mul(
                            factors[i][1].gt(ethers.constants.Zero)
                            ? factors[i][1]
                            : ethers.constants.Zero
                        ).div(totalBalanceUsdBN)
                    );
                };
                return apyBN;
            }
        }
    }
    
  internalTokens = {
    DAI: {
      symbol: "DAI",
      address: "0x6b175474e89094c44da98b954eedeac495271d0f",
      name: "Dai Stablecoin",
      decimals: 18,
    },
    USDC: {
      symbol: "USDC",
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      name: "USD Coin",
      decimals: 6,
    },
    USDT: {
      symbol: "USDT",
      address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      name: "Tether USD",
      decimals: 6,
    },
    TUSD: {
      symbol: "TUSD",
      address: "0x0000000000085d4780b73119b644ae5ecd22b376",
      name: "TrueUSD",
      decimals: 18,
    },
    BUSD: {
      symbol: "BUSD",
      address: "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
      name: "Binance USD",
      decimals: 18,
    },
    sUSD: {
      symbol: "sUSD",
      address: "0x57ab1ec28d129707052df4df418d58a2d46d5f51",
      name: "sUSD",
      decimals: 18,
    },
    mUSD: {
      symbol: "mUSD",
      address: "0xe2f2a5c287993345a840db3b0845fbc70f5935a5",
      name: "mStable USD",
      decimals: 18,
    },
  };
}