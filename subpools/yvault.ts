var ethers = require('ethers')

module.exports = class YVault {
    provider

    constructor(provider) {
        this.provider = provider
    }

    getCurrencyApys() {
        return {
            DAI: ethers.constants.Zero,
            USDC: ethers.constants.Zero,
            USDT:  ethers.constants.Zero,
            TUSD:  ethers.constants.Zero,
        }
    }
}