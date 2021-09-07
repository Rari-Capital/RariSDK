// Axios
import axios from "axios";

// Ethers
import { Contract, BigNumber, constants } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";

// Cache
import RariCache from "../cache.js";

// ERC20ABI
import erc20Abi from '../abi/ERC20.json'

// Current ABIs
import RariFundControllerABI from "./stable/abi/RariFundController.json";
import RariFundManagerABI from "./stable/abi/RariFundManager.json";
import RariFundTokenABI from "./stable/abi/RariFundToken.json";
import RariFundPriceConsumerABI from "./stable/abi/RariFundPriceConsumer.json";
import RariFundProxyABI from "./stable/abi/RariFundProxy.json";


// Legacy ABIs (v1.0.0)
import RariFundManagerABIv100 from "./stable/abi/legacy/v1.0.0/RariFundManager.json";
import RariFundTokenABIv100 from "./stable/abi/legacy/v1.0.0/RariFundToken.json";
import RariFundProxyABIv100 from "./stable/abi/legacy/v1.0.0/RariFundProxy.json";

// Legacy ABIs (v1.1.0)
import RariFundManagerABIv110 from "./stable/abi/legacy/v1.1.0/RariFundManager.json";
import RariFundControllerABIv110 from "./stable/abi/legacy/v1.1.0/RariFundController.json";
import RariFundProxyABIv110 from "./stable/abi/legacy/v1.1.0/RariFundProxy.json";

// Legacy ABIs (v1.2.0)
import RariFundProxyABIv120 from "./stable/abi/legacy/v1.2.0/RariFundProxy.json";

// Legacy ABIs (v2.0.0)
import RariFundManagerABIv200 from "./stable/abi/legacy/v2.0.0/RariFundManager.json";
import RariFundControllerABIv200 from "./stable/abi/legacy/v2.0.0/RariFundController.json";
import RariFundProxyABIv200 from "./stable/abi/legacy/v2.0.0/RariFundProxy.json";

// Legacy ABIs (v2.2.0)
import RariFundProxyABIv220 from "./stable/abi/legacy/v2.2.0/RariFundProxy.json";

// Legacy ABIs (v2.4.0)
import RariFundProxyABIv240 from "./stable/abi/legacy/v2.4.0/RariFundProxy.json";

// Legacy ABIs (v2.5.0)
import RariFundControllerABIv250 from "./stable/abi/legacy/v2.5.0/RariFundController.json";

// Contract addresses
const contractAddressesStable = {
    RariFundController: "0x66f4856f1bbd1eb09e1c8d9d646f5a3a193da569",
    RariFundManager: "0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a",
    RariFundToken: "0x016bf078ABcaCB987f0589a6d3BEAdD4316922B0",
    RariFundPriceConsumer: "0xFE98A52bCAcC86432E7aa76376751DcFAB202244",
    RariFundProxy: "0x4a785fa6fcd2e0845a24847beb7bddd26f996d4d",
};

const abisStable = {
  RariFundController: RariFundControllerABI,
  RariFundManager: RariFundManagerABI,
  RariFundToken: RariFundTokenABI,
  RariFundPriceConsumer: RariFundPriceConsumerABI,
  RariFundProxy: RariFundProxyABI,
};

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

// Legacy addresses
const legacyAbis = {
  "v1.0.0": {
    RariFundManager: RariFundManagerABIv100,
    RariFundToken: RariFundTokenABIv100,
    RariFundProxy: RariFundProxyABIv100,
  },
  "v1.1.0": {
    RariFundController: RariFundControllerABIv110,
    RariFundManager: RariFundManagerABIv110,
    RariFundProxy: RariFundProxyABIv110,
  },
  "v1.2.0": {
    RariFundProxy: RariFundProxyABIv120,
  },
  "v2.0.0": {
    RariFundController: RariFundControllerABIv200,
    RariFundManager: RariFundManagerABIv200,
    RariFundProxy: RariFundProxyABIv200,
  },
  "v2.2.0": {
    RariFundProxy: RariFundProxyABIv220,
  },
  "v2.4.0": {
    RariFundProxy: RariFundProxyABIv240,
  },
  "v2.5.0": {
    RariFundController: RariFundControllerABIv250,
  },
};

export default class StablePool {
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
    rspt
    poolToken
    fees
    deposits
    withdrawals
    history
    static CONTRACT_ADDRESSES = contractAddressesStable;
    static CONTRACT_ABIS = abisStable;

    constructor(provider: JsonRpcProvider, subpools, getAllTokens) {
        this.provider = provider;
        this.pools = subpools;
        this.getAllTokens = getAllTokens;
        this.cache = new RariCache({
            usdPrices: 300,
            allBalances: 30,
            accountBalanceLimit: 3600,
            coinGeckoList: 3600,
            coinGeckoUsdPrices: 900,
            acceptedCurrencies: 30,
        });

        this.contracts = {};
        for (const contractName of Object.keys(contractAddressesStable))
            this.contracts[contractName] = new Contract(contractAddressesStable[contractName], abisStable[contractName], this.provider);
        
        this.legacyContracts = {};
        for (const version of Object.keys(legacyContractAddresses)) {
            if (!this.legacyContracts[version]) this.legacyContracts[version] = {};
            for (const contractName of Object.keys(legacyContractAddresses[version]))
                this.legacyContracts[version][
                    contractName
                ] = new Contract(legacyContractAddresses[version][contractName], legacyAbis[version][contractName], this.provider);
        };

        for (const currencyCode of Object.keys(this.internalTokens))
            this.internalTokens[currencyCode].contract = new Contract(this.internalTokens[currencyCode].address, erc20Abi, this.provider);

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
                if ( !amount || !BigNumber.from(amount) || !amount.gt(constants.Zero) ) 
                    throw new Error("Amount is not a valid BN instance greater than 0.");

                var fundBalanceBN = BigNumber.from( await self.contracts.RariFundManager.callStatic.getFundBalance() )
                var rftTotalSupplyBN = BigNumber.from( await self.contracts.RariFundToken.callStatic.totalSupply() )
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
                    DAI: constants.Zero,
                    USDC: constants.Zero,
                    USDT: constants.Zero,
                    TUSD: constants.Zero,
                    BUSD: constants.Zero,
                    sUSD: constants.Zero,
                    mUSD: constants.Zero,
                };
                var allBalances = await self.cache.getOrUpdate("allBalances", self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices)
                
                for (var i = 0; i < allBalances["0"].length; i++) {
                    const currencyCode = allBalances["0"][i]
                    const contractBalanceBN = BigNumber.from(allBalances["1"][i])
                    allocationsByCurrency[currencyCode] = contractBalanceBN;
                    const pools = allBalances["2"][i];
                    const poolBalances = allBalances["3"][i];

                    for (let j = 0; j < pools.length; j ++) {
                        const poolBalanceBN = BigNumber.from(poolBalances[j]);
                        allocationsByCurrency[currencyCode] = allocationsByCurrency[currencyCode].add(poolBalanceBN)
                    }
                }
                return allocationsByCurrency;
            },
            getRawCurrencyAllocationsInUsd: async () => {
                const allocationsByCurrency = {
                    DAI: constants.Zero,
                    USDC: constants.Zero,
                    USDT: constants.Zero,
                    TUSD: constants.Zero,
                    BUSD: constants.Zero,
                    sUSD: constants.Zero,
                    mUSD: constants.Zero,
                };
                const allBalances = await self.cache.getOrUpdate("allBalances", self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices )

                for (var i = 0; i < allBalances["0"].length; i++) {
                    const currencyCode = allBalances["0"][i];
                    const priceInUsdBN = BigNumber.from(allBalances["4"][i]);
                    const contractBalanceBN = BigNumber.from(allBalances["1"][i]);
                    const contractBalanceUsdBN = contractBalanceBN
                        .mul(priceInUsdBN)
                        .div(
                            self.internalTokens[currencyCode].decimals === 18 
                                ? constants.WeiPerEther 
                                : BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                        );
                    allocationsByCurrency[currencyCode] = contractBalanceUsdBN;

                    const pools = allBalances["2"][i];
                    const poolBalances = allBalances["3"][i];

                    for(var j = 0; j < pools.length; j++ ){
                        const poolBalanceBN = BigNumber.from(poolBalances[j]);
                        const poolBalanceUsdBN = poolBalanceBN
                            .mul(priceInUsdBN)
                            .div(
                                self.internalTokens[currencyCode].decimals === 18 
                                ? constants.WeiPerEther 
                                : BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                            );
                        allocationsByCurrency[currencyCode] = allocationsByCurrency[currencyCode].add(poolBalanceUsdBN)
                    };
                };

                return allocationsByCurrency;
            },
            getRawPoolAllocations: async () => {
                const allocationsByPool = {
                    _cash: constants.Zero,
                };
                for (const poolName of self.allocations.POOLS)
                    if(poolName !== undefined)
                        allocationsByPool[poolName] = constants.Zero;
                const allBalances = await self.cache.getOrUpdate(
                    "allBalances",
                    self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices
                )

                for (var i = 0; i < allBalances["0"].length; i++) {
                    const currencyCode = allBalances["0"][i];
                    const priceInUsdBN = BigNumber.from(allBalances["4"][i]);
                    const contractBalanceBN = BigNumber.from(allBalances["1"][i]);
                    const contractBalanceUsdBN = contractBalanceBN
                        .mul(priceInUsdBN)
                        .div(
                            self.internalTokens[currencyCode].decimals === 18 
                            ? constants.WeiPerEther 
                            : BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                        );
                    allocationsByPool._cash = allocationsByPool._cash.add(contractBalanceUsdBN);
                    const pools = allBalances["2"][i];
                    const poolBalances = allBalances["3"][i];
                    
                    for (let j = 0; j < pools.length; j++) {
                        const pool = pools[j];
                        const poolBalanceBN = BigNumber.from(poolBalances[j]);
                        const poolBalanceUsdBN = poolBalanceBN
                            .mul(priceInUsdBN)
                            .div(
                                self.internalTokens[currencyCode].decimals === 18 
                                ? constants.WeiPerEther 
                                : BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
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

                for (var i = 0; i < allBalances["0"].length; i++) {
                    const currencyCode = allBalances["0"][i];
                    const contractBalanceBN = BigNumber.from(allBalances["1"][i]);
                    currencies[currencyCode] = { _cash: contractBalanceBN };
                    const pools = allBalances["2"][i];
                    const poolBalances = allBalances["3"][i];

                    for (let j = 0; j < pools.length; j++) {
                        const pool = pools[j];
                        const poolBalanceBN = BigNumber.from(poolBalances[j]);
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
                for (var i = 0; i < allBalances["0"].length; i++) {
                    prices[allBalances["0"][i]] = BigNumber.from(allBalances["4"][i]);
                }
                return prices;
            }
        };

        this.apy = {
            getCurrentRawApy: async () => {
                let factors: Array<any> = [];
                let totalBalanceUsdBN = constants.Zero;

                // Get all Balances
                const allBalances = await self.cache.getOrUpdate(
                    "allBalances",
                    self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices
                );

                // Get raw balance
                for (var i = 0; i < allBalances["0"].length; i++) {
                    const currencyCode = allBalances["0"][i];
                    const priceInUsdBN = BigNumber.from(allBalances["4"][i]);
                    const contractBalanceBN = BigNumber.from(allBalances["1"][i]);

                    const contractBalanceUsdBN = contractBalanceBN
                        .mul(priceInUsdBN)
                        .div(
                            self.internalTokens[currencyCode].decimals === 18 
                            ? constants.WeiPerEther 
                            : BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                        );
                    
                    factors.push([contractBalanceUsdBN, constants.Zero]);
                    totalBalanceUsdBN = totalBalanceUsdBN.add(contractBalanceUsdBN)
                    const pools = allBalances["2"][i];
                    const poolBalances = allBalances["3"][i];

                    for (let j = 0; j < pools.length; j++ ) {
                        const pool = pools[j]
                        const poolBalanceBN = BigNumber.from(poolBalances[j])
                        const poolBalanceUsdBN = poolBalanceBN
                            .mul(priceInUsdBN)
                            .div(
                                self.internalTokens[currencyCode].decimals === 18 
                                ? constants.WeiPerEther 
                                : BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                            );

                        const poolApyBN = poolBalanceUsdBN.gt(constants.Zero) 
                            ? ( await self.pools[self.allocations.POOLS[pool]].getCurrencyApys() )[currencyCode]
                            : constants.Zero
                        
                        factors.push([poolBalanceUsdBN, poolApyBN]);
                        totalBalanceUsdBN = totalBalanceUsdBN.add(poolBalanceUsdBN)
                    }
                }
                
                console.log(totalBalanceUsdBN.isZero())
                if (totalBalanceUsdBN.isZero()) {
                    let maxApyBN = constants.Zero;
                    for (var i = 0; i < factors.length; i++ ){
                        if(factors[i][1].gt(maxApyBN)) 
                            maxApyBN = factors[i][1];
                        }
                    return maxApyBN;
                }

                let apyBN = constants.Zero
                for (var i =0; i < factors.length; i++){
                    apyBN = apyBN.add(
                        factors[i][0]
                        .mul(
                            factors[i][1].gt(constants.Zero)
                            ? factors[i][1]
                            : constants.Zero
                        ).div(totalBalanceUsdBN)
                    );
                };
                return apyBN;
            },
            getCurrentApy: async function () {
                var rawFundApy = await self.apy.getCurrentRawApy();
                var fee = await self.contracts.RariFundManager.getInterestFeeRate();
                return rawFundApy.sub(
                    rawFundApy.mul(fee).div(constants.WeiPerEther)
                )
            },
            calculateApy: function (
                startTimestamp,
                startRsptExchangeRate,
                endTimestamp,
                endRsptExchangeRate
            ) {
                const SECONDS_PER_YEAR = 365 * 86400
                var timeDiff = endTimestamp - startTimestamp
                const division = (endRsptExchangeRate.toString() / startRsptExchangeRate.toString()) 
                const response = (division ** (SECONDS_PER_YEAR / timeDiff) -1) * 1e18
                return Math.trunc(response)
            },
        };

        this.rspt = this.poolToken = {
            getExchangeRate: async function (blockNumber) {
                if (!blockNumber) blockNumber =  (await self.provider.getBlock()).number;

                var balance = await self.contracts.RariFundManager.callStatic.getFundBalance({ blockTag: blockNumber });
                var supply = await self.contracts.RariFundToken.callStatic.totalSupply({blockTag: blockNumber});

                return balance.toString() / supply.toString()
            },
            balanceOf: async function (account) {
                return await self.contracts.RariFundToken.callStatic.balanceOf(account)
            },
            transfer: async function (recipient, amount, options) {
                return await self.contracts.RariFundToken.transfer(recipient, amount, {options})
            } 
        };

        this.fees = {
            getInterestFeeRate: async function () {
                return await self.contracts.RariFundManager.callStatic.getInterestFeeRate();
            }
        };

        this.history = {
            getApyHistory: async function (
              fromTimestamp,
              toTimestamp,
              intervalSeconds = 86400
            ) {
              if (fromTimestamp === undefined || fromTimestamp === "latest")
                fromTimestamp = Math.trunc(new Date().getTime() / 1000);
              if (toTimestamp === undefined || toTimestamp === "latest")
                toTimestamp = Math.trunc(new Date().getTime() / 1000);
              if (!intervalSeconds) intervalSeconds = 86400;
      
              try {
                return (
                  await axios.get(self.API_BASE_URL + "apys", {
                    params: { fromTimestamp, toTimestamp, intervalSeconds },
                  })
                ).data;
              } catch (error) {
                throw new Error("Error in Rari API: " + error);
              }
            },
            getTotalSupplyHistory: async function (
              fromTimestamp: string | number = "latest",
              toTimestamp: string | number= "latest",
              intervalSeconds = 86400
            ) {
              if (fromTimestamp === undefined || fromTimestamp === "latest")
                fromTimestamp = Math.trunc(new Date().getTime() / 1000);
              if (toTimestamp === undefined || toTimestamp === "latest")
                toTimestamp = Math.trunc(new Date().getTime() / 1000);
              if (!intervalSeconds) intervalSeconds = 86400;
      
              try {
                return (
                  await axios.get(self.API_BASE_URL + "balances", {
                    params: { fromTimestamp, toTimestamp, intervalSeconds },
                  })
                ).data;
              } catch (error) {
                throw new Error("Error in Rari API: " + error);
              }
            },
            getBalanceHistoryOf: async function (
              account,
              fromBlock,
              toBlock,
              intervalBlocks = 6500
            ) {
              if (!account) throw new Error("No account specified");
              if (fromBlock === undefined) fromBlock = "latest";
              if (toBlock === undefined) toBlock = "latest";
              if (!intervalBlocks) intervalBlocks = 6500;
      
              try {
                return (
                  await axios.get(self.API_BASE_URL + "balances/" + account, {
                    params: { fromBlock, toBlock, intervalBlocks },
                  })
                ).data;
              } catch (error) {
                throw new Error("Error in Rari API: " + error);
              }
            },
            getPoolTokenExchangeRateHistory: async function (
              fromTimestamp,
              toTimestamp,
              intervalSeconds = 86400
            ) {
              if (fromTimestamp === undefined || fromTimestamp === "latest")
                fromTimestamp = Math.trunc(new Date().getTime() / 1000);
              if (toTimestamp === undefined || toTimestamp === "latest")
                toTimestamp = Math.trunc(new Date().getTime() / 1000);
              if (!intervalSeconds) intervalSeconds = 86400;
      
              try {
                return (
                  await axios.get(
                    self.API_BASE_URL +
                      self.POOL_TOKEN_SYMBOL.toLowerCase() +
                      "/rates",
                    {
                      params: { fromTimestamp, toTimestamp, intervalSeconds },
                    }
                  )
                ).data;
              } catch (error) {
                throw new Error("Error in Rari API: " + error);
              }
            },
            getRsptExchangeRateHistory: this.history.getPoolTokenExchangeRateHistory,
            getPredictedDailyRawFundApyHistoryLastYear: async function () {
              // TODO: Get results from app.rari.capital
            },
            getPredictedDailyFundApyHistoryLastYear: async function () {
              var history = await self.history.getDailyRawFundApyHistoryLastYear();
              for (const timestamp of Object.keys(history))
                history[timestamp] -=
                  (history[timestamp] *
                    parseFloat(
                      await self.contracts.RariFundManager.methods
                        .getInterestFeeRate()
                        .call()
                    )) /
                  1e18;
            },
            getPredictedDailyRawFundReturnHistoryLastYear: async function (
              principal
            ) {
              var apyHistory = await self.history.getPredictedDailyRawFundApyHistoryLastYear();
              var returns = {};
              for (const timestamp of Object.keys(apyHistory))
                returns[timestamp] = principal *=
                  1 + apyHistory[timestamp] / 100 / 365;
              return returns;
            },
            getPredictedDailyFundReturnHistoryLastYear: async function (principal) {
              var apyHistory = await self.history.getPredictedDailyFundApyHistoryLastYear();
              var returns = {};
              for (const timestamp of Object.keys(apyHistory))
                returns[timestamp] = principal *=
                  1 + apyHistory[timestamp] / 100 / 365;
              return returns;
            },
            getPoolAllocationHistory: async function (fromBlock, toBlock, filter) {
              var events = [];
              if (toBlock >= 10909705 && fromBlock <= 11821040)
                events = await self.legacyContracts[
                  "v2.0.0"
                ].RariFundController.getPastEvents("PoolAllocation", {
                  fromBlock: Math.max(fromBlock, 10909705),
                  toBlock: Math.min(toBlock, 11821040),
                  filter,
                });
              if (toBlock >= 11821040)
                events = events.concat(
                  await self.contracts.RariFundController.getPastEvents(
                    "PoolAllocation",
                    {
                      fromBlock: Math.max(fromBlock, 11821040),
                      toBlock,
                      filter,
                    }
                  )
                );
              return events;
            },
            getCurrencyExchangeHistory: async function (fromBlock, toBlock, filter) {
              var events = [];
              if (toBlock >= 10926182 && fromBlock <= 11821040)
                events = await self.legacyContracts[
                  "v2.0.0"
                ].RariFundController.getPastEvents("CurrencyTrade", {
                  fromBlock: Math.max(fromBlock, 10926182),
                  toBlock: Math.min(toBlock, 11821040),
                  filter,
                });
              if (toBlock >= 11821040)
                events = events.concat(
                  await self.contracts.RariFundController.getPastEvents(
                    "CurrencyTrade",
                    {
                      fromBlock: Math.max(fromBlock, 11821040),
                      toBlock,
                      filter,
                    }
                  )
                );
              return events;
            },
            getDepositHistory: async function (fromBlock, toBlock, filter) {
              var events = [];
              if (toBlock >= 10365607 && fromBlock <= 10457338)
                events = await self.legacyContracts[
                  "v1.0.0"
                ].RariFundManager.getPastEvents("Deposit", {
                  fromBlock: Math.max(fromBlock, 10365607),
                  toBlock: Math.min(toBlock, 10457338),
                  filter,
                });
              if (toBlock >= 10458405 && fromBlock <= 10889999)
                events = events.concat(
                  await self.legacyContracts["v1.1.0"].RariFundManager.getPastEvents(
                    "Deposit",
                    {
                      fromBlock: Math.max(fromBlock, 10458405),
                      toBlock: Math.min(toBlock, 10889999),
                      filter,
                    }
                  )
                );
              if (toBlock >= 10922173)
                events = events.concat(
                  await self.contracts.RariFundManager.getPastEvents("Deposit", {
                    fromBlock: Math.max(fromBlock, 10922173),
                    toBlock,
                    filter,
                  })
                );
              return events;
            },
            getWithdrawalHistory: async function (fromBlock, toBlock, filter) {
              var events = [];
              if (toBlock >= 10365668 && fromBlock <= 10365914)
                events = await self.legacyContracts[
                  "v1.0.0"
                ].RariFundManager.getPastEvents("Withdrawal", {
                  fromBlock: Math.max(fromBlock, 10365668),
                  toBlock: Math.min(toBlock, 10365914),
                  filter,
                });
              if (toBlock >= 10468624 && fromBlock <= 10890985)
                events = events.concat(
                  await self.legacyContracts["v1.1.0"].RariFundManager.getPastEvents(
                    "Withdrawal",
                    {
                      fromBlock: Math.max(fromBlock, 10468624),
                      toBlock: Math.min(toBlock, 10890985),
                      filter,
                    }
                  )
                );
              if (toBlock >= 10932051)
                events = events.concat(
                  await self.contracts.RariFundManager.getPastEvents("Withdrawal", {
                    fromBlock: Math.max(fromBlock, 10932051),
                    toBlock,
                    filter,
                  })
                );
              return events;
            },
            getPreDepositExchangeHistory: async function (
              fromBlock,
              toBlock,
              filter
            ) {
              var events = [];
              if (toBlock >= 10365738 && fromBlock <= 10395897)
                events = await self.legacyContracts[
                  "v1.0.0"
                ].RariFundProxy.getPastEvents("PreDepositExchange", {
                  fromBlock: Math.max(fromBlock, 10365738),
                  toBlock: Math.min(toBlock, 10395897),
                  filter,
                });
              if (toBlock >= 10458408 && fromBlock <= 10489095)
                events = events.concat(
                  await self.legacyContracts["v1.1.0"].RariFundProxy.getPastEvents(
                    "PreDepositExchange",
                    {
                      fromBlock: Math.max(fromBlock, 10458408),
                      toBlock: Math.min(toBlock, 10489095),
                      filter,
                    }
                  )
                );
              if (toBlock >= 10499014 && fromBlock <= 10833530)
                events = events.concat(
                  await self.legacyContracts["v1.2.0"].RariFundProxy.getPastEvents(
                    "PreDepositExchange",
                    {
                      fromBlock: Math.max(fromBlock, 10499014),
                      toBlock: Math.min(toBlock, 10833530),
                      filter,
                    }
                  )
                );
              if (toBlock >= 10967766)
                events = events.concat(
                  await self.contracts.RariFundProxy.getPastEvents(
                    "PreDepositExchange",
                    { fromBlock: Math.max(fromBlock, 10967766), toBlock, filter }
                  )
                );
              return events;
            },
            getPostWithdrawalExchangeHistory: async function (
              fromBlock,
              toBlock,
              filter
            ) {
              var events = [];
              if (toBlock >= 10365914 && fromBlock <= 10365914)
                events = await self.legacyContracts[
                  "v1.0.0"
                ].RariFundToken.getPastEvents("PostWithdrawalExchange", {
                  fromBlock: Math.max(fromBlock, 10365914),
                  toBlock: Math.min(toBlock, 10365914),
                  filter,
                });
              if (toBlock >= 10545467 && fromBlock <= 10545467)
                events = events.concat(
                  await self.legacyContracts["v1.2.0"].RariFundProxy.getPastEvents(
                    "PostWithdrawalExchange",
                    {
                      fromBlock: Math.max(fromBlock, 10545467),
                      toBlock: Math.min(toBlock, 10545467),
                      filter,
                    }
                  )
                );
              if (toBlock >= 10932051 && fromBlock <= 10932051)
                events = events.concat(
                  await self.legacyContracts["v2.0.0"].RariFundProxy.getPastEvents(
                    "PostWithdrawalExchange",
                    {
                      fromBlock: Math.max(fromBlock, 10932051),
                      toBlock: Math.min(toBlock, 10932051),
                      filter,
                    }
                  )
                );
              if (toBlock >= 11141845)
                events = events.concat(
                  self.contracts.RariFundProxy.getPastEvents(
                    "PostWithdrawalExchange",
                    {
                      fromBlock: Math.max(fromBlock, 11141845),
                      toBlock,
                      filter,
                    }
                  )
                );
              return events;
            },
            getPoolTokenTransferHistory: async function (fromBlock, toBlock, filter) {
              var events = [];
              if (toBlock >= 10365607 && fromBlock <= 10890985)
                events = await self.legacyContracts[
                  "v1.0.0"
                ].RariFundToken.getPastEvents("Transfer", {
                  fromBlock: Math.max(fromBlock, 10365607),
                  toBlock: Math.min(toBlock, 10890985),
                  filter,
                });
              if (toBlock >= 10909582)
                events = events.concat(
                  await self.contracts.RariFundToken.getPastEvents("Transfer", {
                    fromBlock: Math.max(fromBlock, 10909582),
                    toBlock,
                    filter,
                  })
                );
              return events;
            },
            getRsptTransferHistory: this.history.getPoolTokenTransferHistory,
          };
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