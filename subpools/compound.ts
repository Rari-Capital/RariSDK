var ethers = require('ethers')
var axios = require('axios')
var Caches = require('../cache.ts')

module.exports = class CompoundSubpool {
    provider
    cache

    constructor(provider) {
        this.provider = provider;
        this.cache = new Caches({
            compoundCurrencySupplierAndCompApys: 300,
        });
    }

    async getCurrencySupplierAndCompApys() {
        return await this.cache.getOrUpdate(
            "compoundCurrencySupplierAndCompApys",
            async function () {
                const data = (
                    await axios.get("https://api.compound.finance/api/v2/ctoken")
                ).data

                let apyBNs = {};

                for(let i = 0; i < data.cToken.length; i++){
                    const supplyApy = ethers.utils.parseUnits(data.cToken[i].supply_rate.value, 28)
                    const compApy = ethers.utils.parseUnits(data.cToken[i].comp_supply_apy.value, 16)
                    apyBNs[data.cToken[i].underlying_symbol] = [supplyApy, compApy];
                }
                return apyBNs
            }
        )
    }
    // async getCurrencyApys() {
    //     const compoundApyBNs = await this.
    // }
}