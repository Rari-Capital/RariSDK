var ethers = require('ethers')
var Caches = require('../cache.ts')

var externalContractAddresses: any = {
    Bank: "0x67B66C99D3Eb37Fa76Aa3Ed1ff33E8e39F0b9c7A",
    ConfigurableInterestBankConfig: "0x97a49f8eec63c0dfeb9db4c791229477962dc692",
  };

var externalAbis = {};
for (const contractName of Object.keys(externalContractAddresses)) {
    externalAbis[contractName] = require('./alpha/abi/' + contractName + '.json')
}

