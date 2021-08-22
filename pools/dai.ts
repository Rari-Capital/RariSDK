// Axios
var axios = require('axios')

// Ethers
var ethers = require('ethers')

// Cache
var Caches = require('../cache.ts')

// StablePool
var StablePools = require('./stable')

// Contract Addresses
const contractAddressesDai = {
    RariFundController: "0xaFD2AaDE64E6Ea690173F6DE59Fc09F5C9190d74",
    RariFundManager: "0xB465BAF04C087Ce3ed1C266F96CA43f4847D9635",
    RariFundToken: "0x0833cfcb11A5ba89FbAF73a407831c98aD2D7648",
    RariFundPriceConsumer: "0x96ce4C781eDF07F4e3D210c919CA4F9A7ad82a7f",
    RariFundProxy: "0x7C332FeA58056D1EF6aB2B2016ce4900773DC399"
  };


// Legacy Addresses
const legacyContractAddressesDai = {
    "v1.0.0": {
        RariFundController: "0xD7590e93a2e04110Ad50ec70EADE7490F7B8228a",
        RariFundProxy: "0x3F579F097F2CE8696Ae8C417582CfAFdE9Ec9966"
    }
};

// For every contractName require the ABI
const legacyAbisDai = {}

for (const version of Object.keys(legacyContractAddressesDai))
            legacyAbisDai[version] = {}

for (const version of Object.keys(legacyAbisDai))
    for (const contractName of Object.keys(legacyContractAddressesDai[version]))
        legacyAbisDai[version][contractName] = require("./dai/abi/legacy/" + version + "/" + contractName + ".json") 


module.exports = class DaiPool extends StablePools {
    API_BASE_URL = "https://api.rari.capital/pools/dai/";
    POOL_NAME = "Rari DAI Pool";
    POOL_TOKEN_SYMBOL = "RDPT";

    static CONTRACT_ADDRESSES = contractAddressesDai;
    static LEGACY_CONTRACT_ADDRESSES = legacyContractAddressesDai;
    static LEGACY_CONTRACT_ABIS = legacyAbisDai;

    constructor(provider, subpools, getAllTokens) {
        super(provider, subpools, getAllTokens);

        this.contracts = {};
        for (const contractName of Object.keys(contractAddressesDai))
            this.contracts[contractName] = new ethers.Contract(contractAddressesDai[contractName], DaiPool.CONTRACT_ABIS[contractName], this.provider)

        this.legacyContracts = {};
        for (const version of Object.keys(legacyContractAddressesDai)) {
            if (!this.legacyContracts[version]) this.legacyContracts[version] = {};

            for (const contractName of Object.keys(legacyContractAddressesDai[version])) {
              this.legacyContracts[version][
                contractName
              ] = new ethers.Contract(legacyContractAddressesDai[version][contractName], legacyAbisDai[version][contractName], this.provider);
            }
        }
    }

}
