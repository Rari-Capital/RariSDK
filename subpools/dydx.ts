var ethers = require('ethers')
var axios = require('axios')

var Caches = require('../cache.ts')

module.exports = class DydxSubpool {
    provider
    cache

    constructor(provider) {
        this.provider = provider
        this.cache = new Caches({
            dydxCurrencyApys: 300,
        });
    }

    async getCurrencyApys() {
        return await this.cache.getOrUpdate("dydxCurrencyApys", async function () {
            const data = ( await axios.get("https://api.dydx.exchange/v1/markets")).data
            console.log(data)
            let apyBNs= {};

            for (let i =0; i < data.markets.length; i++) {
                apyBNs[data.markets[i].symbol] = ethers.utils.parseUnits(data.markets[i].totalSupplyAPR, 77)
            }
            return apyBNs
        })
    }

}