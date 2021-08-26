var ethers = require('ethers')
var Caches = require('../cache.ts')
var axios = require('axios')
const hey = require('../0x.ts')
var erc20Abi = require('../abi/ERC20.json')

var MStablePool = require('../subpools/mstable.ts')

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
    rspt
    poolToken
    fees
    deposits
    withdrawals
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
                
                for (var i = 0; i < allBalances["0"].length; i++) {
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

                for (var i = 0; i < allBalances["0"].length; i++) {
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

                for (var i = 0; i < allBalances["0"].length; i++) {
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

                for (var i = 0; i < allBalances["0"].length; i++) {
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
                for (var i = 0; i < allBalances["0"].length; i++) {
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
                for (var i = 0; i < allBalances["0"].length; i++) {
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
                    for (var i = 0; i < factors.length; i++ ){
                        if(factors[i][1].gt(maxApyBN)) 
                            maxApyBN = factors[i][1];
                        }
                    return maxApyBN;
                }

                let apyBN = ethers.constants.Zero
                for (var i =0; i < factors.length; i++){
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
            },
            getCurrentApy: async function () {
                var rawFundApy = await self.apy.getCurrentRawApy();
                var fee = await self.contracts.RariFundManager.getInterestFeeRate();
                return rawFundApy.sub(
                    rawFundApy.mul(fee).div(ethers.constants.WeiPerEther)
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

        this.deposits = {
            getDepositCurrencies: async function () {
                let currencyCodes = self.allocations.CURRENCIES.slice();
                currencyCodes.push("ETH");
                let allTokens = await self.getAllTokens();
                for ( const currencyCode of Object.keys(allTokens)) {
                    if (currencyCodes.indexOf(currencyCode) < 0) currencyCodes.push(currencyCode)
                }
                return currencyCodes;
            },
            getDirectDepositCurrencies: async function () {
                return await self.contracts.RariFundManager.callStatic.getAcceptedCurrencies();
            },
            validateDeposit: async function (
                currencyCode,
                amount,
                sender,
                getSlippage
            ) {
                // Input validation
                if (!sender) throw new Error("Sender parameter not set.");
                const allTokens = await self.getAllTokens();
                if (currencyCode !== "ETH" && !allTokens[currencyCode]) throw new Error("Invalid currency code!");
                if (!amount || amount.lte(ethers.constants.Zero)) throw new Error("Deposit amount must be greater than 0!");
                const accountBalanceBN = await ( currencyCode == "ETH" 
                    ? self.provider.getBalance(sender)
                    : allTokens[currencyCode].contract.balanceOf(sender)
                );

                if(amount.gt(accountBalanceBN))  throw new Error("Not enough balance in your account to make a deposit of this amount.");


                // Get currencies we can directly deposit (no swap needed)
                const directlyDepositableCurrencyCodes = await self.cache.getOrUpdate(
                    "acceptedCurrencies",
                    self.contracts.RariFundManager.callStatic.getAcceptedCurrencies
                );
                
                // Check if theres something
                if(!directlyDepositableCurrencyCodes|| directlyDepositableCurrencyCodes.length === 0) throw new Error("No directly depositable currencies found.");

                // If currencyCode is directly depositable, return amount that would be added to users balance, null, and no slippage (because theres no swap)
                if(directlyDepositableCurrencyCodes.indexOf(currencyCode) >= 0) {
                    const allBalances = await self.cache.getOrUpdate(
                        "allBalances",
                        self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices
                    );

                    const amountUsdBN = amount.mul(ethers.BigNumber.from(allBalances["4"][self.allocations.CURRENCIES.indexOf(currencyCode)]))
                        .div(
                            ethers.BigNumber.from(10)
                            .pow(
                                ethers.BigNumber.from(self.internalTokens[currencyCode].decimals)
                            )
                        )

                    return [amountUsdBN.toString(), null, ethers.constants.Zero]
                } else {
                // If currency Code is not directly depositable we try swapping.
                // First with mStable (if currencyCode is supported), then with 0xSwap

                    // Get mStable output currency if possible
                    let mStableOutputCurrency = null;
                    let mStableOutputAmountAfterFeeBN = null;

                    // if currency we want to depost, is mUSD or if its supported by mStable exchange
                    if (currencyCode === "mUSD" || MStablePool.SUPPORTED_EXCHANGE_CURRENCIES.indexOf(currencyCode) >= 0) {
                        // for every acceptedCurrency
                        for (let acceptedCurrency of directlyDepositableCurrencyCodes) {
                            // if accepted currency is mUSD or if its supported by the exchange
                            if ( acceptedCurrency === "mUSD" || MStablePool.SUPPORTED_EXCHANGE_CURRENCIES.indexOf(acceptedCurrency) >= 0) {
                                // if currency we want to deposit is mUSD
                                if (currencyCode === "mUSD") {
                                    // try to get validation to exchange token for the accepted token
                                    try {
                                        var redeemValidity = await self.pools["mStable"].externalContracts.MassetValidationHelper.getRedeemValidity(
                                            "0xe2f2a5c287993345a840db3b0845fbc70f5935a5",
                                             amount, 
                                             self.internalTokens[acceptedCurrency].address
                                        )
                                    } catch (err) {
                                        console.error("Failed to check mUSD redeem validity: ", err);
                                        continue
                                    }

                                    if (!redeemValidity || !redeemValidity["0"]) continue;
                                    mStableOutputAmountAfterFeeBN = ethers.BigNumber.from(redeemValidity["2"]);
                                // If currency we want to deposit is not mUSD but its still supported by mStable exchange
                                } else {
                                    // try to get validation to exchange token. This returns validation (boolean), and maxExchangeable amount
                                    try {
                                        var maxSwap = await self.pools["mStable"].externalContracts.MassetValidationHelper.getMaxSwap(
                                            "0xe2f2a5c287993345a840db3b0845fbc70f5935a5",
                                            self.internalTokens[currencyCode].address,
                                            self.internalTokens[acceptedCurrency].address
                                        )
                                    } catch (err) {
                                        console.error("Failed to check mUSD max swap:", err);
                                        continue
                                    }

                                    // if validation is false continue (as in stop executing for loop iteration) 
                                    if (!maxSwap || !maxSwap["0"] ||amount.gt(ethers.BigNumber.from(maxSwap["2"])) )
                                        continue;
                                    
                                    
                                    // if validation is true

                                    // define outputAmountBeforeFeedBN as 
                                    // amount * accepted currency decimals / decimals of the currency we want to use
                                    var outputAmountBeforeFeesBN = amount
                                    .mul(
                                        self.internalTokens[acceptedCurrency].decimals >= 18 
                                        ? ethers.constants.WeiPerEther
                                        : ethers.BigNumber.from(10 ** self.internalTokens[acceptedCurrency].decimals)
                                    )
                                    .div(
                                        self.internalTokens[currencyCode].decimals >= 18 
                                        ? ethers.constants.WeiPerEther
                                        : ethers.BigNumber.from(10 ** self.internalTokens[currencyCode].decimals)
                                    );
                
                                    // if acceptedCurrency is mUSD there is no fee so
                                    // mStableOutputAmountAfterFeeBN is the same as outputAmountBeforeFeesBN
                                    if (acceptedCurrency === "mUSD")
                                        mStableOutputAmountAfterFeeBN = outputAmountBeforeFeesBN;
                                    else {
                                    // if acceptedCurrency is not mUSD
                                    // get the swap fee
                                        var swapFeeBN = await self.pools[
                                            "mStable"
                                        ].getMUsdSwapFeeBN();

                                        // mStableOutputAmountAfterFeeBN = outputAmountBeforeFeesBN - outputAmountBeforeFeesNM * swapFee / 10^18
                                        mStableOutputAmountAfterFeeBN = outputAmountBeforeFeesBN.sub(
                                            outputAmountBeforeFeesBN
                                            .mul(swapFeeBN)
                                            .div(ethers.constanst.WeiPerEther)
                                        );
                                    }
                                }

                                mStableOutputCurrency = acceptedCurrency;
                                break;
                            }
                        }
                    }

                    // if mStableOutputCurrency is not null, it meant its exchangeable by mStable
                    if (mStableOutputCurrency !== null) {
                        // Get USD amount added to sender's fund balance
                        var allBalances = await self.cache.getOrUpdate(
                            "allBalances",
                            self.contracts.RariFundProxy.getRawFundBalancesAndPrices()
                        )

                        // mStableOutputAmountAfterFee is turned into dollars
                        const outputAmountUsdBN = mStableOutputAmountAfterFeeBN
                            .mul(
                                ethers.BigNumber.from(allBalances["4"][self.allocations.CURRENCIES.indexOf(mStableOutputCurrency)])
                            )
                            .div(
                                (ethers.BigNumber.from(10)).pow(self.internalTokens[mStableOutputCurrency].decimals)
                            )

                        return [
                            outputAmountUsdBN,
                            null,
                            getSlippage
                                ? await self.deposits.getDepositSlippage(
                                    currencyCode,
                                    amount,
                                    outputAmountUsdBN
                                )
                                : null,
                        ];
                    } else {
                        // if its not exchangeable by mStable use 0x
                        // Turn currency we want to use int first accepted currency
                        var acceptedCurrency = directlyDepositableCurrencyCodes[0];
                        // Get orders from 0x swap API
                        try {
                            var [
                                orders,
                                inputFilledAmountBN,
                                protocolFee,
                                takerAssetFilledAmountBN,
                                makerAssetFilledAmountBN,
                                gasPrice,
                            ] = await hey.get0xSwapOrders(
                                currencyCode === "ETH"
                                 ? "WETH"
                                 : allTokens[currencyCode].address,
                                allTokens[acceptedCurrency].address,
                                amount
                            );
                        } catch (err) {
                            throw new Error("Failed to get swap orders from 0x API: " + err);
                        }

                        // Get USD amount added to senders fund balance
                        var allBalances = await self.cache.getOrUpdate(
                            "allBalances",
                            self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices
                        );

                        var makerAssetFilledAmountUsdBN = makerAssetFilledAmountBN.mul(
                            ethers.BigNumber.from(allBalances["4"][self.allocations.CURRENCIES.indexOf(acceptedCurrency)])
                        ).div(
                            ethers.BigNumber.from(10).pow(ethers.BigNumber.from(self.internalTokens[acceptedCurrency].decimals))
                        );

                        // Make sure input amount is completely filled
                        if (inputFilledAmountBN.lt(amount))
                        throw new Error(
                        "Unable to find enough liquidity to exchange " +
                            currencyCode +
                            " before depositing."
                        );

                        // Multiply protocol fee by 1.5 to account for user upping the gas price
                        var protocolFeeBN = ethers.BigNumber.from(protocolFee).mul(ethers.BigNumber.from(15)).div(ethers.BigNumber.from(10));
                            
                        // Make sure we have enough ETH for protocol fee
                        var ethBalanceBN = currencyCode === "ETH" 
                            ? accountBalanceBN
                            : ethers.BigNumber.from(await ethers.provider.getBalance(sender))

                        if (protocolFeeBN.gt(currencyCode === "ETH" ? ethBalanceBN.sub(amount) : ethBalanceBN ))
                            throw new Error( "ETH balance too low to cover 0x exchange protocol fee." );
                        
                        return [
                            makerAssetFilledAmountBN,
                            protocolFeeBN,
                            getSlippage
                                ? await self.deposits.getDepositSlippage(currencyCode, amount, makerAssetFilledAmountUsdBN)
                                : null
                        ]
                    }
                }
            },
            getDepositSlippage: async function (currencyCode, amount, usdAmount) {
                if (self.POOL_TOKEN_SYMBOL === "RYPT") {
                    var directlyDepositableCurrencyCodes = await self.cache.getOrUpdate(
                        "acceptedCurrencies",
                        self.contracts.RariFundManager.callStatic.getAcceptedCurrencies
                    );
                    if (directlyDepositableCurrencyCodes && directlyDepositableCurrencyCodes.length > 0 && directlyDepositableCurrencyCodes.indexOf(currencyCode) >= 0 ) {
                        var allBalances = await self.cache.getOrUpdate(
                            "allBalances",
                            self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices
                        );

                        return ethers.constants.WeiPerEther.sub(
                            usdAmount.mul(
                                ethers.BigNumber.from(10)
                                .pow(ethers.BigNumber.from(self.internalTokens[currencyCode].decimals))
                            ).div(
                                amount
                                .mul(ethers.BigNumber.from(allBalances["4"][self.allocations.CURRENCIES.indexOf(currencyCode)]))
                                .div(ethers.constants.WeiPerEther)
                            )
                        )
                    }
                } else if (self.POOL_TOKEN_SYMBOL === "RSPT") {
                    if(currencyCode === "USDC") {
                        return ethers.constants.WeiPerEther
                        .sub(usdAmount
                            .mul(ethers.BigNumber.from(1e6))
                            .div(amount)
                        ).toString()
                    }
                } else if (self.POOL_TOKEN_SYMBOL === "RDPT") {
                    if (currencyCode === "DAI") {
                        return ethers.constants.WeiPerEther
                        .sub(usdAmount
                            .mul(ethers.constants.WeiPerEther)
                            .div(amount)
                        ).toString();
                    }
                } else {
                    throw "Not implemented for " + self.POOL_TOKEN_SYMBOL;
                }

                // Get tokens
                var allTokens = await self.getAllTokens();
                if( currencyCode !== "ETH" && !allTokens[currencyCode]) {
                    throw new Error("Invalid currency code!")
                }

                // Try cache
                if (self.cache._raw.coinGeckoUsdPrices 
                    && self.cache._raw.coinGeckoUsdPrices.value
                    && self.cache._raw.coinGeckoUsdPrices.value["USDC"]
                    && self.cache._raw.coinGeckoUsdPrices.value[currencyCode]
                    &&  new Date().getTime() / 1000 <= (self.cache._raw.coinGeckoUsdPrices.lastUpdated + self.cache._raw.coinGeckoUsdPrices.timeout)
                ) {
                    if (self.POOL_TOKEN_SYMBOL === "RSPT") {
                        usdAmount = 
                            parseFloat(usdAmount.toString())  *
                            self.cache._raw.coinGeckoUsdPrices.value["USDC"];
                    } else if (self.POOL_TOKEN_SYMBOL === "RDPT") {
                        usdAmount =
                            parseFloat(usdAmount.toString()) *
                            self.cache._raw.coinGeckoUsdPrices.value["DAI"];
                    } else {
                        usdAmount = parseFloat(usdAmount.toString())
                    }

                    return ethers.constants.WeiPerEther.sub(ethers.BigNumber.from(
                        Math.trunc(
                            usdAmount * (10 ** (currencyCode === "ETH" ? 18 : allTokens[currencyCode].decimals) 
                            / (parseFloat(amount.toString()) * self.cache._raw.coinGeckoUsdPrices.value[currencyCode]))
                        )
                    ));
                }

                // Build currency code arraw
                var currencyCodes = [...self.allocations.CURRENCIES];
                if (currencyCodes.indexOf(currencyCode) < 0) {
                    currencyCodes.push(currencyCode)
                }

                // Get CoinGecko IDs
                var decoded = await self.cache.getOrUpdate(
                    "coinGeckoList",
                    async function () {
                      return (
                        await axios.get("https://api.coingecko.com/api/v3/coins/list")
                      ).data;
                    }
                  );
                  if (!decoded)
                    throw new Error("Failed to decode coins list from CoinGecko");
                  var currencyCodesByCoinGeckoIds = {};
          
                  for (const currencyCode of currencyCodes) {
                    var filtered = decoded.filter(
                      (coin) => coin.symbol.toLowerCase() === currencyCode.toLowerCase()
                    );
                    if (!filtered)
                      throw new Error("Failed to get currency IDs from CoinGecko");
                    for (const coin of filtered)
                      currencyCodesByCoinGeckoIds[coin.id] = currencyCode;
                  }

                // Get prices
                var decoded = (
                    await axios.get("https://api.coingecko.com/api/v3/simple/price", {
                    params: {
                        vs_currencies: "usd",
                        ids: Object.keys(currencyCodesByCoinGeckoIds).join(","),
                        include_market_cap: true,
                    },
                    })
                ).data;
                if (!decoded)
                    throw new Error("Failed to decode USD exchange rates from CoinGecko");
                var prices = {};
                var maxMarketCaps = {};
        
                for (const key of Object.keys(decoded))
                    if (
                    prices[currencyCodesByCoinGeckoIds[key]] === undefined ||
                    decoded[key].usd_market_cap >
                        maxMarketCaps[currencyCodesByCoinGeckoIds[key]]
                    ) {
                    maxMarketCaps[currencyCodesByCoinGeckoIds[key]] =
                        decoded[key].usd_market_cap;
                    prices[currencyCodesByCoinGeckoIds[key]] = decoded[key].usd;
                    }

                // Update cache
                self.cache.update("coinGeckoUsdPrices", prices);

                
                // Return slippage
                if (
                    self.cache._raw.coinGeckoUsdPrices.value["USDC"] &&
                    self.cache._raw.coinGeckoUsdPrices.value[currencyCode]
                ) {
                    if (self.POOL_TOKEN_SYMBOL === "RSPT")
                    usdAmount =
                        parseFloat(usdAmount.toString()) *
                        self.cache._raw.coinGeckoUsdPrices.value["USDC"];
                    else if (self.POOL_TOKEN_SYMBOL === "RDPT")
                    usdAmount =
                        parseFloat(usdAmount.toString()) *
                        self.cache._raw.coinGeckoUsdPrices.value["DAI"];
                    else usdAmount = parseFloat(usdAmount.toString());
                    return ethers.constants.WeiPerETher
                    .sub(
                        ethers.BigNumber.from(
                        Math.trunc(
                            usdAmount *
                            (10 **
                                (currencyCode === "ETH"
                                ? 18
                                : allTokens[currencyCode].decimals) /
                                (parseFloat(amount.toString()) *
                                self.cache._raw.coinGeckoUsdPrices.value[currencyCode]))
                        )
                        )
                    );
                } else throw new Error("Failed to get currency prices from CoinGecko");
            },
            deposit: async function (currencyCode, amount, minUsdAmount, options) {
                // Input validation
                if (!options || !options.from)
                throw new Error("Options parameter not set or from address not set.");
                var allTokens = await self.getAllTokens();
                if (currencyCode !== "ETH" && !allTokens[currencyCode])
                throw new Error("Invalid currency code!");
                if (!amount || amount.lte(ethers.constants.Zero))
                throw new Error("Deposit amount must be greater than 0!");
                var accountBalanceBN = ethers.BigNumber.from(
                await (currencyCode == "ETH"
                    ? self.provider.getBalance(options.from)
                    : allTokens[currencyCode].contract.methods
                        .balanceOf(options.from)
                        .call())
                );
                if (amount.gt(accountBalanceBN))
                throw new Error(
                    "Not enough balance in your account to make a deposit of this amount."
                );

                // Check if currency is directly depositable
                var directlyDepositableCurrencyCodes = await self.cache.getOrUpdate(
                    "acceptedCurrencies",
                    self.contracts.RariFundManager.methods.getAcceptedCurrencies().call
                );
                if (
                    !directlyDepositableCurrencyCodes ||
                    directlyDepositableCurrencyCodes.length == 0
                )
                    throw new Error("No directly depositable currencies found.");
                
                if (directlyDepositableCurrencyCodes.indexOf(currencyCode) >= 0) {
                    // Get USD amount added to sender's fund balance
                    var allBalances = await self.cache.getOrUpdate(
                        "allBalances",
                        self.contracts.RariFundProxy.methods.getRawFundBalancesAndPrices()
                        .call
                    );

                    var amountUsdBN = amount
                    .mul(ethers.BigNumber.from(allBalances["4"][self.allocations.CURRENCIES.indexOf(currencyCode)]))
                    .div(
                        ethers.BigNumber.from(10)
                        .pow(ethers.BigNumber.from(self.internalTokens[currencyCode].decimals))
                    )

                     // Check amountUsdBN against minUsdAmount
                    if ( typeof minUsdAmount !== "undefined" && minUsdAmount !== null && amountUsdBN.lt(minUsdAmount))
                        return [amountUsdBN];

                    // Get deposit contract
                    var useGsn = /* amountUsdBN.gte(Web3.utils.toBN(250e18)) && myFundBalanceBN.isZero() */ false;
                    var approvalReceipt = null;
                    var receipt;

                    var approveAndDeposit = async function () {
                        var depositContract = self.contracts.RariFundManager;

                         // Approve tokens to RariFundManager
                        try {
                            var allowanceBN = ethers.BigNumber.from(
                            await allTokens[currencyCode].contract.methods
                                .allowance(options.from, depositContract.options.address)
                                .call()
                            );
                            if (allowanceBN.lt(amount)) {
                            if (
                                allowanceBN.gt(ethers.constants.Zero) &&
                                currencyCode === "USDT"
                            )
                                await allTokens[currencyCode].contract.methods
                                .approve(depositContract.options.address, "0")
                                .send(options);
                            approvalReceipt = await allTokens[currencyCode].contract.methods
                                .approve(depositContract.options.address, amount)
                                .send(options);
                            }
                        } catch (err) {
                            throw new Error(
                            "Failed to approve tokens: " + (err.message ? err.message : err)
                            );
                        }

                        
                        // Deposit tokens to RariFundManager
                        try {
                            receipt = await depositContract.methods
                            .deposit(currencyCode, amount)
                            .send(options);
                        } catch (err) {
                            if (useGsn) {
                            useGsn = false;
                            return await approveAndDeposit();
                            }
            
                            throw err;
                        }
                    };

                    await approveAndDeposit();
                    self.cache.clear("allBalances");
                    return [amountUsdBN, null, approvalReceipt, receipt];

                } else {
                    // Get mStable output currency if possible
                    var mStableOutputCurrency = null;
                    var mStableOutputAmountAfterFeeBN = null;
                    
                    if ( currencyCode === "mUSD" || MStablePool.SUPPORTED_EXCHANGE_CURRENCIES.indexOf(currencyCode ) >= 0 ) {
                        for (var acceptedCurrency of directlyDepositableCurrencyCodes) {
                            if ( acceptedCurrency === "mUSD" || MStablePool.SUPPORTED_EXCHANGE_CURRENCIES.indexOf( acceptedCurrency) >= 0 ) {
                                if (currencyCode === "mUSD") {
                                    try {
                                        var redeemValidity = await self.pools[
                                          "mStable"
                                        ].externalContracts.MassetValidationHelper.methods
                                          .getRedeemValidity(
                                            "0xe2f2a5c287993345a840db3b0845fbc70f5935a5",
                                            amount,
                                            self.internalTokens[acceptedCurrency].address
                                          )
                                          .call();
                                      } catch (err) {
                                        console.error("Failed to check mUSD redeem validity:", err);
                                        continue;
                                      }
                    
                                      if (!redeemValidity || !redeemValidity["0"]) continue;
                                      mStableOutputAmountAfterFeeBN = ethers.BigNumber.from(
                                        redeemValidity["2"]
                                      );
                                }
                            } else {
                                try {
                                    var maxSwap = await self.pools[
                                      "mStable"
                                    ].externalContracts.MassetValidationHelper.methods
                                      .getMaxSwap(
                                        "0xe2f2a5c287993345a840db3b0845fbc70f5935a5",
                                        self.internalTokens[currencyCode].address,
                                        self.internalTokens[acceptedCurrency].address
                                      )
                                      .call();
                                  } catch (err) {
                                    console.error("Failed to check mUSD max swap:", err);
                                    continue;
                                  }

                                if ( !maxSwap || !maxSwap["0"] || amount.gt(ethers.BigNumber.from(maxSwap["2"])) ) continue;

                                var outputAmountBeforeFeesBN = amount
                                    .mul(
                                        self.internalTokens[acceptedCurrency].decimals === 18 
                                        ? ethers.constants.WeiPerEther
                                        : ethers.BigNumber.from( 10 ** self.internalTokens[acceptedCurrency].decimals)
                                    ).div(
                                        self.internalTokens[currencyCode].decimals === 18 
                                        ? ethers.constants.WeiPerEther
                                        : ethers.BigNumber.from( 10 ** self.internalTokens[currencyCode].decimals)
                                    );
                                
                                if (acceptedCurrency === "mUSD") mStableOutputAmountAfterFeeBN = outputAmountBeforeFeesBN;
                                else {
                                    var swapFeeBN = await self.pools["mStable"].getMUsdSwapFeeBN();

                                    mStableOutputAmountAfterFeeBN = outputAmountBeforeFeesBN.sub(outputAmountBeforeFeesBN.mul(swapFeeBN).div(ethers.constants.WeiPerEther));
                                }
                            }
                            
                            mStableOutputCurrency = acceptedCurrency;
                            break;
                        }
                    }
                    // Ideally mStable, but 0x works too
                    if (mStableOutputCurrency !== null) {

                        // Get USD amount added to sender's fund balance
                        var allBalances = await self.cache.getOrUpdate("allBalances", self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices);
                        var outputAmountUsdBN = mStableOutputAmountAfterFeeBN
                                .mul(ethers.BigNumber.from(allBalances["4"][self.allocations.CURRENCIES.indexOf(mStableOutputCurrency)]))
                                .div(ethers.BigNumber.from(10)
                                        .pow( ethers.BigNumber.from(self.internalTokens[mStableOutputCurrency].decimals) )
                                    );

                        // Check outputAmountUsdBN against minUsdAmount
                        if (typeof minUsdAmount !== "undefined" && minUsdAmount !== null && outputAmountUsdBN.lt(minUsdAmount)) return [outputAmountUsdBN];

                        // Approve tokens to RariFundProxy
                        try {
                            var allowanceBN = ethers.BigNumber.from(
                                await self.internalTokens[currencyCode].contract.callStatic.allowance(options.from, self.contracts.RariFundProxy.options.address)
                            );

                            if (allowanceBN.lt(amount)) {
                                if (allowanceBN.gt(ethers.constants.Zero) && currencyCode === "USDT") {
                                    await self.internalTokens[currencyCode].contract
                                    .approve(self.contracts.RariFundProxy.options.address, "0", options)
                                }
                            var approvalReceipt = await self.internalTokens[currencyCode].contract
                                .approve(self.contracts.RariFundProxy.options.address, amount, options)
                            }
                        } catch (err) {
                            throw new Error(
                            "Failed to approve tokens to RariFundProxy: " +
                                (err.message ? err.message : err)
                            );
                        }

                        // Exchange and deposit tokens via mStable via RariFundProxy
                        try {
                            var receipt = await self.contracts.RariFundProxy.exchangeAndDeposit(currencyCode, amount, mStableOutputCurrency, options);
                        } catch (err) {
                            throw new Error("RariFundProxy.exchangeAndDeposit failed: " + (err.message ? err.message : err));
                        }
            
                        self.cache.clear("allBalances");
                        return [
                            mStableOutputAmountAfterFeeBN,
                            null,
                            approvalReceipt,
                            receipt,
                        ];
                    } else {
                        // Use first accepted currency for 0x
                        var acceptedCurrency = directlyDepositableCurrencyCodes[0];

                        // Get orders from 0x swap API
                        try {
                            var [
                            orders,
                            inputFilledAmountBN,
                            protocolFee,
                            takerAssetFilledAmountBN,
                            makerAssetFilledAmountBN,
                            gasPrice,
                            ] = await hey.get0xSwapOrders(
                            currencyCode === "ETH"
                                ? "WETH"
                                : allTokens[currencyCode].address,
                            allTokens[acceptedCurrency].address,
                            amount
                            );
                        } catch (err) {
                            throw new Error("Failed to get swap orders from 0x API: " + err);
                        }
                        
                        // Get USD amount added to sender's fund balance
                        var allBalances = await self.cache.getOrUpdate(
                            "allBalances",
                            self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices
                        );

                        var makerAssetFilledAmountUsdBN = makerAssetFilledAmountBN
                        .mul(
                          ethers.BigNumber.from(
                            allBalances["4"][
                              self.allocations.CURRENCIES.indexOf(acceptedCurrency)
                            ]
                          )
                        )
                        .div(
                          ethers.BigNumber.from(10)
                            .pow(
                              ethers.BigNumber.from(
                                self.internalTokens[acceptedCurrency].decimals
                              )
                            )
                        );

                        
                        // Make sure input amount is completely filled
                        if (inputFilledAmountBN.lt(amount))
                        throw new Error(
                        "Unable to find enough liquidity to exchange " +
                            currencyCode +
                            " before depositing."
                        );

                        
                        // Multiply protocol fee by 1.5 to account for user upping the gas price
                        var protocolFeeBN = ethers.BigNumber.from(protocolFee).mul(ethers.BigNumber.from(15)).div(ethers.BigNumber.from(10));

                        // Make sure we have enough ETH for the protocol fee
                        var ethBalanceBN =
                        currencyCode == "ETH"
                        ? accountBalanceBN
                        : ethers.BigNumber.from(await self.provider.getBalance(options.from));

                        if ( protocolFeeBN.gt( currencyCode === "ETH" ? ethBalanceBN.sub(amount) : ethBalanceBN ) ) {
                            throw new Error( "ETH balance too low to cover 0x exchange protocol fee.");
                        }


                        // Check makerAssetFilledAmountUsdBN against minUsdAmount
                        if ( typeof minUsdAmount !== "undefined" && minUsdAmount !== null && makerAssetFilledAmountUsdBN.lt(minUsdAmount) )
                            return [makerAssetFilledAmountUsdBN];

                        // Approve tokens to RariFundProxy if token is not ETH
                        if (currencyCode !== "ETH") {
                            try {
                                var allowanceBN = ethers.BigNumber.from(
                                    await allTokens[currencyCode].contract
                                        .allowance(
                                        options.from,
                                        self.contracts.RariFundProxy.options.address
                                        )
                                    );
                                if (allowanceBN.lt(amount)) {
                                  if (
                                    allowanceBN.gt(ethers.constants.Zero) &&
                                    currencyCode === "USDT"
                                  )
                                    await allTokens[currencyCode].contract.methods
                                      .approve(
                                        self.contracts.RariFundProxy.options.address,
                                        "0"
                                      )
                                      .send(options);
                                  var approvalReceipt = await allTokens[
                                    currencyCode
                                  ].contract.methods
                                    .approve(
                                      self.contracts.RariFundProxy.options.address,
                                      amount
                                    )
                                    .send(options);
                                }
                            } catch (err) {
                                throw new Error( "Failed to approve tokens to RariFundProxy: " + (err.message ? err.message : err));
                            }
                        }

                                    
                        // Build array of orders and signatures
                        var signatures = [];
                        for (var j = 0; j < orders.length; j++) {
                            signatures[j] = orders[j].signature;
            
                            orders[j] = {
                            makerAddress: orders[j].makerAddress,
                            takerAddress: orders[j].takerAddress,
                            feeRecipientAddress: orders[j].feeRecipientAddress,
                            senderAddress: orders[j].senderAddress,
                            makerAssetAmount: orders[j].makerAssetAmount,
                            takerAssetAmount: orders[j].takerAssetAmount,
                            makerFee: orders[j].makerFee,
                            takerFee: orders[j].takerFee,
                            expirationTimeSeconds: orders[j].expirationTimeSeconds,
                            salt: orders[j].salt,
                            makerAssetData: orders[j].makerAssetData,
                            takerAssetData: orders[j].takerAssetData,
                            makerFeeAssetData: orders[j].makerFeeAssetData,
                            takerFeeAssetData: orders[j].takerFeeAssetData,
                            };
                        }

                        
                        // Exchange and deposit tokens via RariFundProxy
                        try {
                            var receipt = await self.contracts.RariFundProxy.methods
                            .exchangeAndDeposit(
                                currencyCode === "ETH"
                                ? "0x0000000000000000000000000000000000000000"
                                : allTokens[currencyCode].address,
                                amount,
                                acceptedCurrency,
                                orders,
                                signatures,
                                takerAssetFilledAmountBN
                            )
                            .send(
                                Object.assign(
                                {
                                    value:
                                    currencyCode === "ETH"
                                        ? protocolFeeBN.add(amount).toString()
                                        : protocolFeeBN.toString(),
                                    gasPrice: gasPrice,
                                },
                                options
                                )
                            );
                        } catch (err) {
                            throw new Error(
                            "RariFundProxy.exchangeAndDeposit failed: " +
                                (err.message ? err.message : err)
                            );
                        }

                        
                        self.cache.clear("allBalances");
                        return [
                        makerAssetFilledAmountUsdBN,
                        protocolFeeBN,
                        approvalReceipt,
                        receipt,
                        ];
                    }
                }
            }   
        };

        this.withdrawals = {
            getWithdrawalCurrencies: async function () {
                var currencyCodes = self.allocations.CURRENCIES.slice();
                currencyCodes.push("ETH");
                var allTokens = await self.getAllTokens();
                for (const currencyCode of Object.keys(allTokens))
                  if (currencyCodes.indexOf(currencyCode) < 0)
                    currencyCodes.push(currencyCode);
                return currencyCodes; 
            },
            getWithdrawalCurrenciesWithoutSlippage: async function () {
                return await self.allocations.getRawCurrencyAllocations();
            },
            getMaxWithdrawalAmount: async function (currencyCode, senderUsdBalance) {
                var allTokens = await self.getAllTokens();
                if (currencyCode !== "ETH" && !allTokens[currencyCode])
                  throw new Error("Invalid currency code!");
                if (!senderUsdBalance || senderUsdBalance.lte(ethers.constants.Zero))
                  return [ethers.constants.Zero];
        
                // Get user fund balance
                if (senderUsdBalance === undefined)
                  senderUsdBalance = ethers.BigNumber.from(
                    await self.contracts.RariFundManager.callStatic
                      .balanceOf(sender)
                  );
        
                // Check balances to find withdrawal source
                var allBalances = await self.cache.getOrUpdate(
                  "allBalances",
                  self.contracts.RariFundProxy.methods.getRawFundBalancesAndPrices()
                    .call
                );
        
                // See how much we can withdraw directly if token is supported by the fund
                var i = allBalances["0"].indexOf(currencyCode);
                var tokenRawFundBalanceBN = ethers.constants.Zero;
        
                if (i >= 0) {
                  tokenRawFundBalanceBN = ethers.BigNumber.from(allBalances["1"][i]);
                  for (var j = 0; j < allBalances["3"][i].length; j++)
                    tokenRawFundBalanceBN.iadd(ethers.BigNumber.from(allBalances["3"][i][j]));
                }
        
                if (tokenRawFundBalanceBN.gt(ethers.constants.Zero)) {
                  var maxWithdrawalAmountBN = senderUsdBalance
                    .mul(
                      ethers.BigNumber.from(10)
                        .pow(
                          ethers.BigNumber.from(self.internalTokens[currencyCode].decimals)
                        )
                    )
                    .div(
                      ethers.BigNumber.from(
                        allBalances["4"][
                          self.allocations.CURRENCIES.indexOf(currencyCode)
                        ]
                      )
                    );
        
                  if (
                    maxWithdrawalAmountBN
                      .mul(
                        ethers.BigNumber.from(
                          allBalances["4"][
                            self.allocations.CURRENCIES.indexOf(currencyCode)
                          ]
                        )
                      )
                      .div(
                        ethers.BigNumber.from(10)
                          .pow(
                            ethers.BigNumber.from(self.internalTokens[currencyCode].decimals)
                          )
                      )
                      .gt(senderUsdBalance)
                  )
                    maxWithdrawalAmountBN = maxWithdrawalAmountBN.sub(ethers.constants.One);
        
                  // If tokenRawFundBalanceBN >= maxWithdrawalAmountBN, return maxWithdrawalAmountBN
                  if (tokenRawFundBalanceBN.gte(maxWithdrawalAmountBN))
                    return [maxWithdrawalAmountBN];
                }
        
                // Otherwise, exchange as few currencies as possible (ideally those with the lowest balances)
                var amountInputtedUsdBN = ethers.constants.Zero;
                var amountWithdrawnBN = ethers.constants.Zero;
                var totalProtocolFeeBN = ethers.constants.Zero;
        
                // Withdraw as much as we can of the output token first
                if (tokenRawFundBalanceBN.gt(ethers.constants.Zero)) {
                  amountInputtedUsdBN = amountInputtedUsdBN.add(
                    tokenRawFundBalanceBN
                      .mul(
                        ethers.BigNumber.from(
                          allBalances["4"][
                            self.allocations.CURRENCIES.indexOf(currencyCode)
                          ]
                        )
                      )
                      .div(
                        ethers.BigNumber.from(10)
                          .pow(
                            ethers.BigNumber.from(self.internalTokens[currencyCode].decimals)
                          )
                      )
                  );
                  amountWithdrawnBN = amountWithdrawnBN.add(tokenRawFundBalanceBN);
                }
        
                // Get input candidates
                var inputCandidates = [];
        
                for (var i:any = 0; i < allBalances["0"].length; i++) {
                  var inputCurrencyCode = allBalances["0"][i];
                  if (inputCurrencyCode !== currencyCode) {
                    var rawFundBalanceBN = ethers.BigNumber.from(allBalances["1"][i]);
                    for (var j = 0; j < allBalances["3"][i].length; j++)
                      rawFundBalanceBN.iadd(ethers.BigNumber.from(allBalances["3"][i][j]));
        
                    if (rawFundBalanceBN.gt(ethers.constants.Zero)) {
                      inputCandidates.push({
                        currencyCode: inputCurrencyCode,
                        rawFundBalanceBN,
                      });
                    }
                  }
                }
        
                // Calculate max inputs
                function updateMaxInputs() {
                  var inputCandidates2 = [];
        
                  for (const inputCandidate of inputCandidates) {
                    // Calculate inputAmountBN as maximum of sender USD balance left and rawFundBalanceBN
                    var usdAmountLeft = senderUsdBalance.sub(amountInputtedUsdBN);
                    var maxInputAmountLeftBN = usdAmountLeft
                      .mul(
                        ethers.BigNumber.from(10)
                          .pow(
                            ethers.BigNumber.from(
                              self.internalTokens[inputCandidate.currencyCode].decimals
                            )
                          )
                      )
                      .div(
                        ethers.BigNumber.from(
                          allBalances["4"][
                            self.allocations.CURRENCIES.indexOf(
                              inputCandidate.currencyCode
                            )
                          ]
                        )
                      );
                    if (
                      maxInputAmountLeftBN
                        .mul(
                          ethers.BigNumber.from(
                            allBalances["4"][
                              self.allocations.CURRENCIES.indexOf(
                                inputCandidate.currencyCode
                              )
                            ]
                          )
                        )
                        .div(
                          ethers.BigNumber.from(10)
                            .pow(
                              ethers.BigNumber.from(
                                self.internalTokens[inputCandidate.currencyCode]
                                  .decimals
                              )
                            )
                        )
                        .gt(usdAmountLeft)
                    )
                      maxInputAmountLeftBN = maxInputAmountLeftBN.sub(ethers.constants.One);
                    var inputAmountBN = maxInputAmountLeftBN.lt(inputCandidate.rawFundBalanceBN) ? maxInputAmountLeftBN : inputCandidate.rawFundBalanceBN;
        
                    if (inputAmountBN.gt(ethers.constants.Zero))
                      inputCandidates2.push({
                        currencyCode: inputCandidate.currencyCode,
                        rawFundBalanceBN: inputCandidate.rawFundBalanceBN,
                        inputAmountBN,
                      });
                  }
        
                  inputCandidates = inputCandidates2;
                }
        
                updateMaxInputs();
        
                // TODO: Sort candidates from lowest to highest inputAmountUsdBN (or highest to lowest inputAmountUsdBN?)
                /* inputCandidates.sort((a, b) =>
                  a.inputAmountUsdBN.gt(b.inputAmountUsdBN) ? 1 : -1
                ); */
        
                // mStable
                if (
                  currencyCode === "mUSD" ||
                  MStablePool.SUPPORTED_EXCHANGE_CURRENCIES.indexOf(currencyCode) >=
                    0
                ) {
                  var mStableSwapFeeBN = null;
        
                  for (var i:any = 0; i < inputCandidates.length; i++) {
                    if (
                      inputCandidates[i].currencyCode !== "mUSD" &&
                      MStablePool.SUPPORTED_EXCHANGE_CURRENCIES.indexOf(
                        inputCandidates[i].currencyCode
                      ) < 0
                    )
                      continue;
        
                    var mStableInputAmountBN = inputCandidates[i].inputAmountBN;
                    var mStableOutputAmountAfterFeesBN = ethers.constants.Zero;
        
                    // Check max swap/redeem validity
                    if (inputCandidates[i].currencyCode === "mUSD") {
                      try {
                        var redeemValidity = await self.pools[
                          "mStable"
                        ].externalContracts.MassetValidationHelper
                          .getRedeemValidity(
                            "0xe2f2a5c287993345a840db3b0845fbc70f5935a5",
                            mStableInputAmountBN,
                            self.internalTokens[currencyCode].address
                          )
                      } catch (err) {
                        console.error("Failed to check mUSD redeem validity:", err);
                        continue;
                      }
        
                      if (!redeemValidity || !redeemValidity["0"]) continue;
                      mStableOutputAmountAfterFeesBN = ethers.BigNumber.from(
                        redeemValidity["2"]
                      );
                    } else {
                      try {
                        var maxSwap = await self.pools[
                          "mStable"
                        ].externalContracts.MassetValidationHelper
                          .getMaxSwap(
                            "0xe2f2a5c287993345a840db3b0845fbc70f5935a5",
                            self.internalTokens[inputCandidates[i].currencyCode]
                              .address,
                            self.internalTokens[currencyCode].address
                          )
                      } catch (err) {
                        console.error("Failed to check mUSD max swap:", err);
                        continue;
                      }
        
                      if (
                        !maxSwap ||
                        !maxSwap["0"] ||
                        ethers.BigNumber.from(maxSwap["2"]).lte(ethers.constants.Zero)
                      )
                        continue;
                      mStableInputAmountBN =
                        mStableInputAmountBN.lt(ethers.BigNumber.from(maxSwap["2"])) ? mStableInputAmountBN : ethers.BigNumber.from(maxSwap["2"])
                      var outputAmountBeforeFeesBN = mStableInputAmountBN
                        .mul(
                          ethers.BigNumber.from(10).pow(ethers.BigNumber.from(self.internalTokens[currencyCode].decimals))
                        )
                        .div(
                          ethers.BigNumber.from(10).pow(ethers.BigNumber.from(self.internalTokens[inputCandidates[i].currencyCode].decimals))
                        );
        
                      if (currencyCode === "mUSD")
                        mStableOutputAmountAfterFeesBN = outputAmountBeforeFeesBN;
                      else {
                        if (mStableSwapFeeBN === null)
                          mStableSwapFeeBN = await self.pools[
                            "mStable"
                          ].getMUsdSwapFeeBN();
                        mStableOutputAmountAfterFeesBN = outputAmountBeforeFeesBN.sub(
                          outputAmountBeforeFeesBN
                            .mul(mStableSwapFeeBN)
                            .div(ethers.constants.WeiPerEther)
                        );
                      }
                    }
        
                    amountInputtedUsdBN = amountInputtedUsdBN.add(
                      mStableInputAmountBN
                        .mul(
                          ethers.BigNumber.from(
                            allBalances["4"][
                              self.allocations.CURRENCIES.indexOf(
                                inputCandidates[i].currencyCode
                              )
                            ]
                          )
                        )
                        .div(
                          ethers.BigNumber.from(10)
                            .pow(
                              ethers.BigNumber.from(
                                self.internalTokens[inputCandidates[i].currencyCode]
                                  .decimals
                              )
                            )
                        )
                    );
                    amountWithdrawnBN= amountWithdrawnBN.add(mStableOutputAmountAfterFeesBN);
        
                    // Update inputCandidates
                    updateMaxInputs();
        
                    // Stop if we have filled the USD amount
                    if (amountInputtedUsdBN.gt(senderUsdBalance))
                      throw new Error(
                        "Amount inputted in USD greater than sender USD fund balance"
                      );
                    if (
                      amountInputtedUsdBN.gte(
                        senderUsdBalance.sub(ethers.BigNumber.from(10).mul(ethers.BigNumber.from(16)))
                      )
                    )
                      break;
                  }
                }
        
                // Use 0x if necessary
                // Deal with amountInputtedUsdBN.lt(senderUsdBalance) not being accurate better than 1 cent margin of error
                if (
                  amountInputtedUsdBN.lt(senderUsdBalance.sub(ethers.BigNumber.from(10).mul(ethers.BigNumber.from(16)))) &&
                  inputCandidates.length > 0
                ) {
                  // Get orders from 0x swap API for each input currency candidate
                  for (var i:any = 0; i < inputCandidates.length; i++) {
                    try {
                      var [
                        orders,
                        inputFilledAmountBN,
                        protocolFee,
                        takerAssetFilledAmountBN,
                        makerAssetFilledAmountBN,
                        gasPrice,
                      ] = await hey.get0xSwapOrders(
                        self.internalTokens[inputCandidates[i].currencyCode].address,
                        currencyCode === "ETH"
                          ? "WETH"
                          : allTokens[currencyCode].address,
                        inputCandidates[i].inputAmountBN
                      );
                    } catch (err) {
                      if (err === "Insufficient liquidity") {
                        inputCandidates.splice(i, 1);
                        i--;
                        continue;
                      }
        
                      throw new Error("Failed to get swap orders from 0x API: " + err);
                    }
        
                    inputCandidates[i].inputFillAmountBN = inputFilledAmountBN;
                    inputCandidates[i].protocolFeeBN = ethers.BigNumber.from(protocolFee).mul(ethers.BigNumber.from(15)).div(ethers.BigNumber.from(10)); // Multiply protocol fee by 1.5 to account for user upping the gas price
                    inputCandidates[i].takerAssetFillAmountBN = takerAssetFilledAmountBN;
                    inputCandidates[i].makerAssetFillAmountBN = makerAssetFilledAmountBN;
                    inputCandidates[i].takerAssetFillAmountUsdBN = takerAssetFilledAmountBN
                      .mul(
                        ethers.BigNumber.from(
                          allBalances["4"][
                            self.allocations.CURRENCIES.indexOf(
                              inputCandidates[i].currencyCode
                            )
                          ]
                        )
                      )
                      .div(
                        ethers.BigNumber.from(10)
                          .pow(
                            ethers.BigNumber.from(
                              self.internalTokens[inputCandidates[i].currencyCode]
                                .decimals
                            )
                          )
                      );
                  }
        
                  // Sort candidates from highest to lowest output per USD burned
                  inputCandidates.sort((a, b) =>
                    b.makerAssetFillAmountBN
                      .mul(ethers.constants.WeiPerEther)
                      .div(b.takerAssetFillAmountUsdBN)
                      .gt(
                        a.makerAssetFillAmountBN
                          .mul(ethers.constants.WeiPerEther)
                          .div(a.takerAssetFillAmountUsdBN)
                      )
                      ? 1
                      : -1
                  );
        
                  // Loop through input currency candidates until we fill the withdrawal
                  for (var i:any = 0; i < inputCandidates.length; i++) {
                    // Is this order enough to cover the rest of the withdrawal?
                    var usdAmountLeft = senderUsdBalance.sub(amountInputtedUsdBN);
                    var inputFillAmountUsdBN = inputCandidates[i].inputFillAmountBN
                      .mul(
                        ethers.BigNumber.from(
                          allBalances["4"][
                            self.allocations.CURRENCIES.indexOf(
                              inputCandidates[i].currencyCode
                            )
                          ]
                        )
                      )
                      .div(
                        ethers.BigNumber.from(10)
                          .pow(
                            ethers.BigNumber.from(
                              self.internalTokens[inputCandidates[i].currencyCode]
                                .decimals
                            )
                          )
                      );
                    if (
                      inputFillAmountUsdBN.gte(usdAmountLeft.sub(ethers.BigNumber.from(10).mul(ethers.BigNumber.from(16))))
                    ) {
                      // If order is enough to cover the rest of the withdrawal, cover it and stop looping through input candidates
                      var thisInputAmountBN = inputCandidates[i].inputFillAmountBN
                        .mul(usdAmountLeft)
                        .div(inputFillAmountUsdBN);
                      var thisOutputAmountBN = inputCandidates[i].makerAssetFillAmountBN
                        .mul(usdAmountLeft)
                        .div(inputFillAmountUsdBN);
        
                      amountInputtedUsdBN.iadd(
                        thisInputAmountBN
                          .mul(
                            ethers.BigNumber.from(
                              allBalances["4"][
                                self.allocations.CURRENCIES.indexOf(
                                  inputCandidates[i].currencyCode
                                )
                              ]
                            )
                          )
                          .div(
                            ethers.BigNumber.from(10)
                              .pow(
                                ethers.BigNumber.from(
                                  self.internalTokens[inputCandidates[i].currencyCode]
                                    .decimals
                                )
                              )
                          )
                      );
                      amountWithdrawnBN = amountWithdrawnBN.add(thisOutputAmountBN);
                      totalProtocolFeeBN = totalProtocolFeeBN.add(inputCandidates[i].protocolFeeBN);
        
                      break;
                    } else {
                      // Otherwise, add the whole order and keep looping through input candidates
                      amountInputtedUsdBN.iadd(
                        inputCandidates[i].inputFillAmountBN
                          .mul(
                            ethers.BigNumber.from(
                              allBalances["4"][
                                self.allocations.CURRENCIES.indexOf(
                                  inputCandidates[i].currencyCode
                                )
                              ]
                            )
                          )
                          .div(
                            ethers.BigNumber.from(10)
                              .pow(
                                ethers.BigNumber.from(
                                  self.internalTokens[inputCandidates[i].currencyCode]
                                    .decimals
                                )
                              )
                          )
                      );
                      amountWithdrawnBN = amountWithdrawnBN.add(inputCandidates[i].makerAssetFillAmountBN);
                      totalProtocolFeeBN = totalProtocolFeeBN.add(inputCandidates[i].protocolFeeBN);
                    }
        
                    // Stop if we have filled the USD amount
                    if (amountInputtedUsdBN.gt(senderUsdBalance))
                      throw new Error(
                        "Amount inputted in USD greater than sender USD fund balance"
                      );
                    if (
                      amountInputtedUsdBN.gte(
                        senderUsdBalance.sub(ethers.BigNumber.from(10).mul(ethers.BigNumber.from(16)))
                      )
                    )
                      break;
                  }
        
                  // Make sure input amount is completely filled
                  if (
                    amountInputtedUsdBN.lt(senderUsdBalance.sub(ethers.BigNumber.from(10).mul(ethers.BigNumber.from(16))))
                  )
                    throw new Error(
                      "Unable to find enough liquidity to exchange withdrawn tokens to " +
                        currencyCode +
                        "."
                    );
                }
        
                // Return amountWithdrawnBN and totalProtocolFeeBN
                return [amountWithdrawnBN, totalProtocolFeeBN];
              },
            validateWithdrawal: async function (
                currencyCode,
                amount,
                sender,
                getSlippage
            ) {
                var allTokens = await self.getAllTokens();
                if (currencyCode !== "ETH" && !allTokens[currencyCode])
                    throw new Error("Invalid currency code!");
                if (!amount || amount.lte(ethers.constants.Zero))
                    throw new Error("Withdrawal amount must be greater than 0!");

                // Check balances to find withdrawal source
                var allBalances = await self.cache.getOrUpdate(
                    "allBalances",
                    self.contracts.RariFundProxy.callStatic.getRawFundBalancesAndPrices
                );

                // See how much we can withdraw directly if token is supported by the fund
                var i: any = allBalances["0"].indexOf(currencyCode);
                var tokenRawFundBalanceBN = ethers.constants.Zero;

                    
                if (i >= 0) {
                    tokenRawFundBalanceBN = ethers.BigNumber.from(allBalances["1"][i]);
                    for (var j = 0; j < allBalances["3"][i].length; j++)
                    tokenRawFundBalanceBN = tokenRawFundBalanceBN.add(ethers.BigNumber.from(allBalances["3"][i][j]));
                }

                if (tokenRawFundBalanceBN.gte(amount)) {
                    var amountUsdBN = amount
                        .mul(
                            ethers.BigNumber.from( allBalances["4"][self.allocations.CURRENCIES.indexOf(currencyCode)])
                        )
                        .div(
                            ethers.BigNumber.from(10).pow(ethers.BigNumber.from(self.internalTokens[currencyCode].decimals))
                        )

                    // Check amountUsdBN against user fund balance
                    var senderUsdBalance = ethers.BigNumber.from(
                        await self.contracts.RariFundManager.callStatic
                        .balanceOf(sender)
                    );

                    if (amountUsdBN.gt(senderUsdBalance))
                    throw new Error(
                      "Requested withdrawal amount is greater than the sender's " +
                        self.POOL_NAME +
                        " balance. Please click the max button and try again (or reload and try again later if the issue persists)."
                    );
        
                    // Return amountUsdBN
                    return [amountUsdBN, null, ethers.constants.Zero];
                } else {
                    // Otherwise, exchange as few currencies as possible (ideally those with the lowest balances)
                    var amountInputtedUsdBN = ethers.constants.Zero;
                    var amountWithdrawnBN = ethers.constants.Zero;
                    var totalProtocolFeeBN = ethers.constants.Zero;

                    // Withdraw as much as we can of the output token first
                    if (tokenRawFundBalanceBN.gt(ethers.constants.Zero)) {
                        amountInputtedUsdBN = amountInputtedUsdBN.add(
                        tokenRawFundBalanceBN
                            .mul(
                                ethers.BigNumber.from(allBalances["4"][self.allocations.CURRENCIES.indexOf(currencyCode)])
                            )
                            .div(
                                ethers.BigNumber.from(10).pow(ethers.BigNumber.from(self.internalTokens[currencyCode].decimals))
                            )
                        );
                        amountWithdrawnBN = amountWithdrawnBN.add(tokenRawFundBalanceBN);
                    }

                    // Get input candidates
                    var inputCandidates = [];

                    for (var i:any = 0; i < allBalances["0"].length; i++) {
                    if (allBalances["0"][i] !== currencyCode) {
                      var rawFundBalanceBN = ethers.constants.Zero;
                      for (var j = 0; j < allBalances["3"][i].length; j++)
                        rawFundBalanceBN = rawFundBalanceBN.add(ethers.BigNumber.from(allBalances["3"][i][j]));
                      if (rawFundBalanceBN.gt(ethers.constants.Zero))
                        inputCandidates.push({
                          currencyCode: allBalances["0"][i],
                          rawFundBalanceBN,
                        });
                    }}

                    // mStable
                    if (
                        currencyCode === "mUSD" ||
                        MStablePool.SUPPORTED_EXCHANGE_CURRENCIES.indexOf(
                          currencyCode
                        ) >= 0
                      ) {
                            var mStableSwapFeeBN = null;
                            for (var i: any = 0; i < inputCandidates.length; i++) {
                                if (
                                    inputCandidates[i].currencyCode !== "mUSD" &&
                                    MStablePool.SUPPORTED_EXCHANGE_CURRENCIES.indexOf(
                                      inputCandidates[i].currencyCode
                                    ) < 0
                                  ) continue
                            }

                            // Get swap fee and calculate input amount needed to fill output amount
                            if (currencyCode !== "mUSD" && mStableSwapFeeBN === null) {
                                mStableSwapFeeBN = await self.pools[
                                    "mStable"
                                  ].getMUsdSwapFeeBN();

                                var inputAmountBN = amount
                                    .sub(amountWithdrawnBN)
                                    .mul(ethers.constants.WeiPerEther)
                                    .div(ethers.constants.WeiPerEther.sub(mStableSwapFeeBN))
                                    .mul(
                                        self.internalTokens[inputCandidates[i].currencyCode].decimals === 18 
                                        ? ethers.constants.WeiPerEther 
                                        : ethers.BigNumber.from( 10 ** self.internalTokens[inputCandidates[i].currencyCode].decimals) 
                                    ).div(
                                        allTokens[currencyCode].decimals === 18 
                                        ? ethers.constants.WeiPerEther 
                                        : ethers.BigNumber.from( 10 ** allTokens[currencyCode].decimals) 
                                    );

                                var outputAmountBeforeFeesBN = inputAmountBN
                                    .mul(
                                        allTokens[currencyCode].decimals === 18 
                                        ? ethers.constants.WeiPerEther 
                                        : ethers.BigNumber.from( 10 ** allTokens[currencyCode].decimals) 
                                    )
                                    .div(
                                        self.internalTokens[inputCandidates[i].currencyCode].decimals === 18 
                                        ? ethers.constants.WeiPerEther 
                                        : ethers.BigNumber.from( 10 ** self.internalTokens[inputCandidates[i].currencyCode].decimals) 
                                    );

                                var outputAmountBN =
                                currencyCode === "mUSD"
                                    ? outputAmountBeforeFeesBN
                                    : outputAmountBeforeFeesBN.sub(
                                        outputAmountBeforeFeesBN
                                        .mul(mStableSwapFeeBN)
                                        .div(ethers.constants.WeiPerEther)
                                    );

                                var tries = 0;
                                while (outputAmountBN.lt(amount.sub(amountWithdrawnBN))) {
                                    if (tries >= 1000)
                                      throw new Error(
                                        "Failed to get increment order input amount to achieve desired output amount."
                                      );
                                    inputAmountBN = inputAmountBN.add(ethers.constants.One); // Make sure we have enough input amount to receive amount.sub(amountWithdrawnBN)
                                    outputAmountBeforeFeesBN = inputAmountBN
                                      .mul(ethers.BigNumber.from(10).pow(ethers.BigNumber.from(allTokens[currencyCode].decimals)))
                                      .div(
                                        ethers.BigNumber.from(10).pow(self.internalTokens[inputCandidates[i].currencyCode].decimals)
                                        );
                                    outputAmountBN =
                                      currencyCode === "mUSD"
                                        ? outputAmountBeforeFeesBN
                                        : outputAmountBeforeFeesBN.sub(
                                            outputAmountBeforeFeesBN
                                              .mul(mStableSwapFeeBN)
                                              .div(ethers.constants.WeiPerEther)
                                          );
                                    tries++;
                                }

                                if (inputAmountBN.gt(inputCandidates[i].rawFundBalanceBN)) {
                                    inputAmountBN = inputCandidates[i].rawFundBalanceBN;
                                    outputAmountBeforeFeesBN = inputAmountBN
                                      .mul(ethers.BigNumber.from(10).pow(allTokens[currencyCode].decimals))
                                      .div(
                                        ethers.BigNumber.from(10).pow(self.internalTokens[inputCandidates[i].currencyCode].decimals)
                                      );
                                    outputAmountBN =
                                      currencyCode === "mUSD"
                                        ? outputAmountBeforeFeesBN
                                        : outputAmountBeforeFeesBN.sub(
                                            outputAmountBeforeFeesBN
                                              .mul(mStableSwapFeeBN)
                                              .div(ethers.constants.WeiPerEther)
                                          );
                                }

                                // Check max swap/redeem validity
                                if (inputCandidates[i].currencyCode === "mUSD") {
                                    try {
                                        var redeemValidity = await self.pools[
                                          "mStable"
                                        ].externalContracts.MassetValidationHelper
                                          .getRedeemValidity(
                                            "0xe2f2a5c287993345a840db3b0845fbc70f5935a5",
                                            inputAmountBN,
                                            self.internalTokens[currencyCode].address
                                          )
                                      } catch (err) {
                                        console.error("Failed to check mUSD redeem validity:", err);
                                        //@ts-ignore
                                        continue
                                      }

                                      //@ts-ignore
                                      if (!redeemValidity || !redeemValidity["0"]) continue;
                                      if (!outputAmountBN.eq(ethers.BigNumber.from(redeemValidity["2"])))
                                        throw new Error(
                                          "Predicted mStable output amount and output amount returned by getRedeemValidity not equal."
                                        );
                                } else {
                                    try {
                                        var maxSwap = await self.pools[
                                          "mStable"
                                        ].externalContracts.MassetValidationHelper
                                          .getMaxSwap(
                                            "0xe2f2a5c287993345a840db3b0845fbc70f5935a5",
                                            self.internalTokens[inputCandidates[i].currencyCode]
                                              .address,
                                            self.internalTokens[currencyCode].address
                                          )
                                      } catch (err) {
                                        console.error("Failed to check mUSD max swap:", err);
                                        //@ts-ignore
                                        continue;
                                      }

                                      if (
                                        !maxSwap ||
                                        !maxSwap["0"] ||
                                        ethers.BigNumber.from(maxSwap["2"]).lt(inputAmountBN)
                                      )
                                      //@ts-ignore
                                        continue;
                                }

                                amountInputtedUsdBN = amountInputtedUsdBN.add(
                                    inputAmountBN
                                      .mul(
                                        ethers.BigNumber.from(
                                          allBalances["4"][
                                            self.allocations.CURRENCIES.indexOf(
                                              inputCandidates[i].currencyCode
                                            )
                                          ]
                                        )
                                      ).div(
                                        ethers.BigNumber.from(10)
                                          .pow(
                                            ethers.BigNumber.from(
                                              self.internalTokens[inputCandidates[i].currencyCode]
                                                .decimals
                                            )
                                          )
                                      )
                                )

                                amountWithdrawnBN = amountWithdrawnBN.add(outputAmountBN);
                                inputCandidates[i].rawFundBalanceBN = inputCandidates[i].rawFundBalanceBN.sub(inputAmountBN);
                                if (inputCandidates[i].rawFundBalanceBN.isZero()) {
                                    inputCandidates.splice(i, 1);
                                    i--;
                                }

                                // Stop if we have filled the withdrawal
                                //@ts-ignore
                                if (amountWithdrawnBN.gte(amount)) break;
                            }
                    }

                    // Use 0x if necessary
                    if (amountWithdrawnBN.lt(amount)) {
                    
                        // Get orders from 0x swap API for each input currency candidate
                        for (var i:any = 0; i < inputCandidates.length; i++) {
                            try {
                                var [
                                  orders,
                                  inputFilledAmountBN,
                                  protocolFee,
                                  takerAssetFilledAmountBN,
                                  makerAssetFilledAmountBN,
                                  gasPrice,
                                ] = await hey.get0xSwapOrders(
                                  self.internalTokens[inputCandidates[i].currencyCode].address,
                                  currencyCode === "ETH"
                                    ? "WETH"
                                    : allTokens[currencyCode].address,
                                  inputCandidates[i].rawFundBalanceBN,
                                  amount.sub(amountWithdrawnBN)
                                );
                              } catch (err) {
                                if (err === "Insufficient liquidity") {
                                  inputCandidates.splice(i, 1);
                                  i--;
                                  continue;
                                }
                
                                throw new Error(
                                  "Failed to get swap orders from 0x API: " + err
                                );
                              }

                            inputCandidates[i].inputFillAmountBN = inputFilledAmountBN;
                            inputCandidates[i].protocolFeeBN = ethers.BigNumber.from(protocolFee)
                                .mul(ethers.BigNumber.from(15))
                                .div(ethers.BigNumber.from(10)); // Multiply protocol fee by 1.5 to account for user upping the gas price

                            inputCandidates[i].takerAssetFillAmountBN = takerAssetFilledAmountBN;
                            inputCandidates[i].makerAssetFillAmountBN = makerAssetFilledAmountBN;
                            inputCandidates[i].takerAssetFillAmountUsdBN = takerAssetFilledAmountBN
                                .mul(
                                  ethers.BigNumber.from(
                                    allBalances["4"][
                                      self.allocations.CURRENCIES.indexOf(
                                        inputCandidates[i].currencyCode
                                      )
                                    ]
                                  )
                                )
                                .div(
                                    ethers.BigNumber.from(10)
                                    .pow(
                                      ethers.BigNumber.from(
                                        self.internalTokens[inputCandidates[i].currencyCode]
                                          .decimals
                                      )
                                    )
                                );
                        }

                        // Sort candidates from highest to lowest output per USD burned
                        inputCandidates.sort((a, b) =>
                            b.makerAssetFillAmountBN
                            .mul(ethers.constants.WeiPerEther)
                            .div(b.takerAssetFillAmountUsdBN)
                            .gt(
                                a.makerAssetFillAmountBN
                                .mul(ethers.constants.WeiPerEther)
                                .div(a.takerAssetFillAmountUsdBN)
                            )
                            ? 1
                            : -1
                        );

                        
                        // Loop through input currency candidates until we fill the withdrawal
                        for (var i:any = 0; i < inputCandidates.length; i++) {
                            if (inputCandidates[i].makerAssetFillAmountBN.gte( amount.sub(amountWithdrawnBN))) {
                                 // If order is enough to cover the rest of the withdrawal, cover it and stop looping through input candidates
                                var thisOutputAmountBN = amount.sub(amountWithdrawnBN);
                                var thisInputAmountBN = inputCandidates[i].inputFillAmountBN
                                    .mul(thisOutputAmountBN)
                                    .div(inputCandidates[i].makerAssetFillAmountBN);

                                var tries = 0;
                                while (
                                inputCandidates[i].makerAssetFillAmountBN
                                    .mul(thisInputAmountBN)
                                    .div(inputCandidates[i].inputFillAmountBN)
                                    .lt(thisOutputAmountBN)
                                ) {
                                if (tries >= 1000)
                                    throw new Error(
                                    "Failed to get increment order input amount to achieve desired output amount."
                                    );
                                thisInputAmountBN.iadd(ethers.constants.One); // Make sure we have enough input fill amount to achieve this maker asset fill amount
                                tries++;
                                }


                                amountInputtedUsdBN = amountInputtedUsdBN.add(
                                    thisInputAmountBN
                                      .mul(
                                        ethers.BigNumber.from(
                                          allBalances["4"][
                                            self.allocations.CURRENCIES.indexOf(
                                              inputCandidates[i].currencyCode
                                            )
                                          ]
                                        )
                                      )
                                      .div(
                                        ethers.BigNumber.from(10)
                                          .pow(
                                            ethers.BigNumber.from(
                                              self.internalTokens[inputCandidates[i].currencyCode]
                                                .decimals
                                            )
                                          )
                                      )
                                    );
                                amountWithdrawnBN = amountWithdrawnBN.add(thisOutputAmountBN);
                                totalProtocolFeeBN = totalProtocolFeeBN.add(inputCandidates[i].protocolFeeBN);

                                break
                            } else {
                                // Otherwise, add the whole order and keep looping through input candidates
                                amountInputtedUsdBN = amountInputtedUsdBN.add(
                                    inputCandidates[i].inputFillAmountBN
                                    .mul(
                                        ethers.BigNumber.from(
                                        allBalances["4"][
                                            self.allocations.CURRENCIES.indexOf(
                                            inputCandidates[i].currencyCode
                                            )
                                        ]
                                        )
                                    )
                                    .div(
                                        ethers.BigNumber.from(10)
                                        .pow(
                                            ethers.BigNumber.from(
                                            self.internalTokens[inputCandidates[i].currencyCode]
                                                .decimals
                                            )
                                        )
                                    )
                                );

                                amountWithdrawnBN= amountWithdrawnBN.add(inputCandidates[i].makerAssetFillAmountBN);
                                totalProtocolFeeBN = totalProtocolFeeBN.add(inputCandidates[i].protocolFeeBN);
                            }

                            // Stop if we have filled the withdrawal
                            if (amountWithdrawnBN.gte(amount)) break;
                        }

                        // Make sure input amount is completely filled
                        if (amountWithdrawnBN.lt(amount))
                            throw new Error("Unable to find enough liquidity to exchange withdrawn tokens to " +currencyCode +".");
                    }

                    // Check amountInputtedUsdBN against user fund balance
                    var senderUsdBalance = ethers.BigNumber.from(
                        await self.contracts.RariFundManager.calStatic.balanceOf(sender)
                    );

                    if (amountInputtedUsdBN.gt(senderUsdBalance))
                    throw new Error(
                      "Requested withdrawal amount is greater than the sender's " +
                        self.POOL_NAME +
                        " balance. Please click the max button and try again (or reload and try again later if the issue persists)."
                    );

                    // Return amountInputtedUsdBN
                    return [
                        amountInputtedUsdBN,
                        totalProtocolFeeBN,
                        getSlippage
                        ? await self.withdrawals.getWithdrawalSlippage(
                            currencyCode,
                            amount,
                            amountInputtedUsdBN
                            )
                        : null,
                    ];
                }
            },
            
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