
// Axios
var axios = require('axios')

// Ethers
var { ethers } = require('ethers')

// Cache
var Caches = require('./cache.ts')

// Subpools
const AaveSubpool = require("./subpools/aave.ts")
const DydxSubpool = require("./subpools/dydx.ts")
const CompoundSubpool = require("./subpools/compound.ts")

// Pools
const StablePool = require("./pools/stable.ts")

// ERC20ABI
var erc20Abi = require('./abi/ERC20.json')

module.exports = class Rari {
    provider
    cache
    price
    getEthUsdPriceBN
    getAllTokens
    subpools
    pools

    constructor(web3Provider) {
        this.provider = new ethers.getDefaultProvider(web3Provider, "homestead");
        this.cache = new Caches({ allTokens: 8600, ethUSDPrice: 300 });

        for (const currencyCode of Object.keys(this.internalTokens))
            this.internalTokens[currencyCode].contract = new ethers.Contract(this.internalTokens[currencyCode].address, erc20Abi, this.provider);
        
        var self = this;
        this.price = async function () { 
            try {
                return await axios.get( "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=ethereum")  
               

            } catch (e) {
                console.log(e)
            }

        }

        this.getEthUsdPriceBN = async function () {
            return await self.cache.getOrUpdate("ethUSDPrice", async function () {
                try {
                    const usdPrice = (await axios.get( "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=ethereum" )).data.ethereum.usd
                    const usdPriceBN = ethers.utils.parseUnits(usdPrice.toString(), 'ether')
                    return usdPriceBN
                } catch (error) {
                    throw new Error("Error retrieving data from Coingecko API: " + error);
                }
            });
        };

        this.getAllTokens = async function (cacheTimeout = 86400) { 
            self.cache._raw["allTokens"].timeout = typeof cacheTimeout === "undefined" ? 86400 : cacheTimeout;
            return await self.cache.getOrUpdate("allTokens", async function() {
                var allTokens = Object.assign({}, self.internalTokens);
                var data = (await axios.get("https://api.0x.org/swap/v0/tokens")).data;
                data.records.sort((a,b) => (a.symbol > b.symbol ? 1 : -1));

                for (const token of data.records)
                    if (
                        [
                            "DAI",
                            "USDC",
                            "USDT",
                            "TUSD",
                            "BUSD",
                            "bUSD",
                            "sUSD",
                            "SUSD",
                            "mUSD"
                        ].indexOf(token.symbol) < 0 
                    ) {
                        token.contract = new ethers.Contract(token.address, erc20Abi);
                        allTokens[token.symbol] = token;
                    }
                return allTokens;
            });
        };

        this.subpools = {
            Aave: new AaveSubpool(this.provider),
            dYdX: new DydxSubpool(this.provider),
            Compound: new CompoundSubpool(this.provider),
        }

        this.pools = {
            stable: new StablePool(
                this.provider, 
                {
                   Aave: "Aave"
                },
                this.getAllTokens)
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
