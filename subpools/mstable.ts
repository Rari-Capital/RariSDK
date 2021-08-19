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


}