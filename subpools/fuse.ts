var ethers = require('ethers')
var Caches = require('../cache.ts')

var cErc20DelegateAbi = require('./fuse/abi/CErc20Delegate.json')

module.exports = class FuseSubpool {
    provider
    cTokens
    cache

    constructor(provider, cTokens) {
        this.provider = provider;
        this.cTokens = cTokens;
        this.cache = new Caches({
            currencyApys: 300,
        });
    }

    async getCurrencyApy(cTokenAddress) {
        const cToken = new ethers.Contract(cTokenAddress, cErc20DelegateAbi, this.provider);
        const supplyRatePerBlock = await cToken.callStatic.supplyRatePerBlock();
        return supplyRatePerBlock
    }

    async getCurrencyApys() {
        var self = this;

        return await self.cache.getOrUpdate("currencyApys", async function () {
            let apyBNs = {};
            for (const currencyCode of Object.keys(self.cTokens)) {
                apyBNs[currencyCode] = await self.getCurrencyApy(self.cTokens[currencyCode]);
            }
            return apyBNs
        } )
    }
}