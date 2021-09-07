// Ethers
import { BigNumber, Contract, utils, ContractFactory, constants, ethers} from "ethers";
import { JsonRpcProvider} from "@ethersproject/providers";
// Axios
import axios from 'axios';

// ABIs
import fusePoolDirectoryAbi from './abi/FusepoolDirectory.json';
import fusePoolLensAbi from './abi/FusePoolLens.json';
import fuseSafeLiquidatorAbi from './abi/FuseSafeLiquidator.json';
import fuseFeeDistributorAbi from './abi/FuseFeeDistributor.json';

// Contracts
import Compound from './contracts/compound-protocol.min.json';
import openOracle from './contracts/open-oracle.min.json';
import Oracle from './contracts/oracles.min.json';

// InterestRate Models
import JumpRateModel from "./irm/JumpRateModel";
import JumpRateModelV2 from "./irm/JumpRateModelV2";
import DAIInterestRateModelV2 from "./irm/DAIInterestRateModelV2";
import WhitePaperInterestRateModel from "./irm/WhitePaperInterestRateModel";

type MinifiedContracts = {
    [key: string]: {
        abi?: any
        bin?: any;
    }
}

type interestRateModelType = 
                JumpRateModel |
                JumpRateModelV2 |
                DAIInterestRateModelV2 |
                WhitePaperInterestRateModel |
                null

type cERC20Conf = {
    underlying: string // underlying ERC20
    comptroller: string // Address of the comptroller
    interestRateModel: string // Address of the IRM
    initialExchangeRateMantissa: BigNumber // Initial exchange rate scaled by 1e18
    name: string // ERC20 name of this token
    symbol: string // ERC20 Symbol
    decimals: number // decimal precision
    admin: string // Address of the admin
}

type ComptrollerConf = {
    anchorPeriod?: any;
    tokenConfigs?: any;
    canAdminOverwrite?: any;
    isPublic?: any;
    maxSecondsBeforePriceIsStale?: any;
    chainlinkPriceOracle?: any;
    secondaryPriceOracle?: any;
    reporter?: any;
    anchorMantissa?: any;
    isSecure?: any;
    useRootOracle?: any;
    underlyings?: any;
    sushiswap?: any;
    oracles?: any;
    admin?: any;
    rootOracle?: any;
    uniswapV2Factory?: any;
    baseToken?: any;
    uniswapV3Factory?: any;
    feeTier?: any;
}

type interestRateModelConf = {
    interestRateModel?: any;
    interestRateModelConf?: any;
    baseRatePerYear?: string;
    multiplierPerYear?: string;
    jumpMultiplierPerYear?: string;
    kink?: string;

}

export default class Fuse {
    provider: JsonRpcProvider
    Contract: typeof Contract
    utils: typeof utils
    contracts: {
        [key: string]: Contract
    }
    compoundContracts: MinifiedContracts
    openOracleContracts: MinifiedContracts
    oracleContracts: MinifiedContracts
    getEthUsdPriceBN
    deployPool
    deployPriceOracle
    deployComptroller
    deployAsset
    deployInterestRateModel
    deployCToken
    deployCEther
    deployCErc20
    identifyInterestRateModel
    getInterestRateModel
    checkForCErc20PriceFeed
    getPriceOracle

    static FUSE_POOL_DIRECTORY_CONTRACT_ADDRESS = "0x835482FE0532f169024d5E9410199369aAD5C77E";

    static CERC20_DELEGATE_CONTRACT_ADDRESS = "0x67e70eeb9dd170f7b4a9ef620720c9069d5e706c";
    static CETHER_DELEGATE_CONTRACT_ADDRESS = "0x60884c8faad1b30b1c76100da92b76ed3af849ba";
    static PUBLIC_INTEREST_RATE_MODEL_CONTRACT_ADDRESSES = {
      WhitePaperInterestRateModel_Compound_ETH: "0x14ee0270C80bEd60bDC117d4F218DeE0A4909F28",
      WhitePaperInterestRateModel_Compound_WBTC: "0x7ecAf96C79c2B263AFe4f486eC9a74F8e563E0a6",
      JumpRateModel_Compound_Stables: "0x640dce7c7c6349e254b20eccfa2bb902b354c317",
      JumpRateModel_Compound_UNI: "0xc35DB333EF7ce4F246DE9DE11Cc1929d6AA11672",
      JumpRateModel_Cream_Stables_Majors: "0xb579d2761470bba14018959d6dffcc681c09c04b",
      JumpRateModel_Cream_Gov_Seeds: "0xcdC0a449E011249482824efFcfA05c883d36CfC7",
      JumpRateModel_Cream_SLP: "",
      JumpRateModel_ALCX: "0x58c3e7119ec200c09b2b3a9f8ce3bd77b6b47012",
      JumpRateModel_Fei_FEI: "0x8f47be5692180079931e2f983db6996647aba0a5",
      JumpRateModel_Fei_TRIBE: "0x075538650a9c69ac8019507a7dd1bd879b12c1d7",
      JumpRateModel_Fei_ETH: "0xbab47e4b692195bf064923178a90ef999a15f819",
      JumpRateModel_Fei_DAI: "0xede47399e2aa8f076d40dc52896331cba8bd40f7",
      JumpRateModel_Olympus_Majors: "0xe1d35fae219e4d74fe11cb4246990784a4fe6680",
    };
    static PUBLIC_PRICE_ORACLE_CONTRACT_ADDRESSES = {
        PreferredPriceOracle: "", // TODO: Set correct mainnet address after deployment
        ChainlinkPriceOracle: "0xe102421A85D9C0e71C0Ef1870DaC658EB43E1493",
        ChainlinkPriceOracleV2: "0xb0602af43Ca042550ca9DA3c33bA3aC375d20Df4",
        UniswapView: "", // NOT IN USE
        Keep3rPriceOracle_Uniswap: "0xb90de476d438b37a4a143bf729a9b2237e544af6", // NO LONGER IN USE
        Keep3rPriceOracle_SushiSwap: "0x08d415f90ccfb971dfbfdd6266f9a7cb1c166fc0", // NO LONGER IN USE
        Keep3rV2PriceOracle_Uniswap: "0xd6a8cac634e59c00a3d4163f839d068458e39869", // NO LONGER IN USE
        UniswapTwapPriceOracle_Uniswap: "0xCd8f1c72Ff98bFE3B307869dDf66f5124D57D3a9",
        UniswapTwapPriceOracle_SushiSwap: "0xfD4B4552c26CeBC54cD80B1BDABEE2AC3E7eB324",
        UniswapLpTokenPriceOracle: "", // TODO: Set correct mainnet address after deployment
        RecursivePriceOracle: "", // TODO: Set correct mainnet address after deployment
        YVaultV1PriceOracle: "", // TODO: Set correct mainnet address after deployment
        YVaultV2PriceOracle: "", // TODO: Set correct mainnet address after deployment
        AlphaHomoraV1PriceOracle: "", // TODO: Set correct mainnet address after deployment
        AlphaHomoraV2PriceOracle: "", // TODO: Set correct mainnet address after deployment
        SynthetixPriceOracle: "", // TODO: Set correct mainnet address after deployment
        BalancerLpTokenPriceOracle: "", // TODO: Set correct mainnet address after deployment
        MasterPriceOracle: "0x1887118E49e0F4A78Bd71B792a49dE03504A764D",
        CurveLpTokenPriceOracle: "0x43c534203339bbf15f62b8dde91e7d14195e7a60",
        CurveLiquidityGaugeV2PriceOracle: "0xd9eefdb09d75ca848433079ea72ef609a1c1ea21",
    };

    static PRICE_ORACLE_RUNTIME_BYTECODE_HASHES:{[key: string]: string} = {
        "ChainlinkPriceOracle": "0x7a2a5633a99e8abb759f0b52e87875181704b8e29f6567d4a92f12c3f956d313",
        "ChainlinkPriceOracleV2": "0x8d2bcaa1429031ae2b19a4516e5fdc68fb9346f158efb642fcf9590c09de2175",
        "UniswapTwapPriceOracle_Uniswap": "0xa2537dcbd2b55b1a690db3b83fa1042f86b21ec3e1557f918bc3930b6bbb9244",
        "UniswapTwapPriceOracle_SushiSwap": "0x9b11abfe7bfc1dcef0b1bc513959f1172cfe2cb595c5131b9cabc3b6448d89ac",
        "UniswapV3TwapPriceOracle_Uniswap_3000": "0xb300f7f64110b952340e896d33f133482de6715f1b8b7e0acbd2416e0e6593c1",
        "UniswapV3TwapPriceOracleV2_Uniswap_10000_USDC": "0xc301f891f1f905e68d1c5df5202cf0eec2ee8abcf3a510d5bd00d46f7dea01b4",
        "YVaultV1PriceOracle": "0xd0dda181a4eb699a966b23edb883cff43377297439822b1b0f99b06af2002cc3",
        "YVaultV2PriceOracle": "0x177c22cc7d05280cea84a36782303d17246783be7b8c0b6f9731bb9002ffcc68",
        "MasterPriceOracle": "0xfa1349af05af40ffb5e66605a209dbbdc8355ba7dda76b2be10bafdf5ffd1dc6",
        "CurveLpTokenPriceOracle": "0x6742ae836b1f7df0cfd9b858c89d89da3ee814c28c5ee9709a371bcf9dfd2145",
        "CurveLiquidityGaugeV2PriceOracle": "0xfcf0d93de474152898668c4ebd963e0237bfc46c3d5f0ce51b7045b60c831734",
        "FixedEthPriceOracle": "0xcb669c93632a1c991adced5f4d97202aa219fab3d5d86ebd28f4f62ad7aa6cb3",
        "FixedEurPriceOracle": "0x678dbe9f2399a44e89edc934dc17f6d4ee7004d9cbcee83c0fa0ef43de924b84",
        "WSTEthPriceOracle": "0x11daa8dfb8957304aa7d926ce6876c523c7567b4052962e65e7d6a324ddcb4cc",
        "FixedTokenPriceOracle_OHM": "0x136d369f53594c2f10e3ff3f14eaaf0bada4a63964f3cfeda3923e3531e407dc",
        "UniswapTwapPriceOracleV2_SushiSwap_DAI": "0xb4d279232ab52a2fcaee6dc47db486a733c24a499ade9d7de1b0d417d4730817",
        "SushiBarPriceOracle": "0x3736e8b6c11fcd413c0b60c3291a3a2e2ebe496a2780f3c45790a123f5ee9705"
    };
    
    static UNISWAP_TWAP_PRICE_ORACLE_ROOT_CONTRACT_ADDRESS = "0xa170dba2cd1f68cdd7567cf70184d5492d2e8138";
    static UNISWAP_TWAP_PRICE_ORACLE_V2_ROOT_CONTRACT_ADDRESS = "0xf1860b3714f0163838cf9ee3adc287507824ebdb";
    static COMPTROLLER_IMPLEMENTATION_CONTRACT_ADDRESS = "0x94b2200d28932679def4a7d08596a229553a994e";

    static DAI_POT = "0x197e90f9fad81970ba7976f33cbd77088e5d7cf7";
    static DAI_JUG = "0x19c0976f590d67707e62397c87829d896dc0f1f1";

    static UNISWAP_V2_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    static UNISWAP_V2_PAIR_INIT_CODE_HASH = "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";
    static WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    
    static ORACLES = [
        "SimplePriceOracle",
        "PreferredPriceOracle",
        "ChainlinkPriceOracle",
        // "Keep3rPriceOracle",
        "MasterPriceOracle",
        // "UniswapAnchoredView",
        // "UniswapView",
        "UniswapLpTokenPriceOracle",
        "RecursivePriceOracle",
        "YVaultV1PriceOracle",
        "YVaultV2PriceOracle",
        "AlphaHomoraV1PriceOracle",
        "SynthetixPriceOracle",
        "ChainlinkPriceOracleV2",
        "CurveLpTokenPriceOracle",
        "CurveLiquidityGaugeV2PriceOracle",
        "FixedEthPriceOracle",
        "FixedEurPriceOracle",
        "FixedTokenPriceOracle",
        "WSTEthPriceOracle",
        "UniswapTwapPriceOracle",
        "UniswapTwapPriceOracleV2",
        "UniswapV3TwapPriceOracle",
        "UniswapV3TwapPriceOracleV2",
        "SushiBarPriceOracle"
      ];

    static FusePoolDirectoryAddress = "0x835482FE0532f169024d5E9410199369aAD5C77E";
    static FuseSafeLiquidatorAddress = "0x41C7F2D48bde2397dFf43DadA367d2BD3527452F";
    static FuseFeeDistributorAddress = "0xa731585ab05fC9f83555cf9Bff8F58ee94e18F85";
    static FusePoolLensAddress = "0x8dA38681826f4ABBe089643D2B3fE4C6e4730493";

    constructor(web3Provider: string) {
        this.provider = new JsonRpcProvider(web3Provider)
        this.Contract = Contract
        this.utils = utils 
        this.compoundContracts = Compound.contracts;
        this.openOracleContracts = openOracle.contracts;
        this.oracleContracts = Oracle.contracts;
        this.contracts = {
            FusePoolDirectory: new Contract(Fuse.FusePoolDirectoryAddress, fusePoolDirectoryAbi, this.provider),
            FusePoolLens: new Contract(Fuse.FusePoolLensAddress, fusePoolLensAbi, this.provider),
            FuseSafeLiquidator: new Contract(Fuse.FuseSafeLiquidatorAddress, fuseSafeLiquidatorAbi, this.provider),
            FuseFeeDistributorAbi: new Contract(Fuse.FuseFeeDistributorAddress, fuseFeeDistributorAbi, this.provider)
        }

        let accountToImpersonate  = "0xB81473F20818225302b8FfFB905B53D58a793D84"
      

        this.getEthUsdPriceBN = async function () {
            // Returns a USD price. Which means its a floating point of at least 2 decimal numbers.
            const UsdPrice: number = (await axios.get("https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=ethereum")).data.ethereum.usd

            // Decimal numbres are unsafe for bigNumber so we have to get rid of them
            const usdPriceParsed = UsdPrice * 1e2

            // Now we turn it into a big number
            const usdPriceBN = BigNumber.from(usdPriceParsed)
            
            // To parse this back into USD (parseInt(usdPriceBN.toString()) * 1e-2).toFixed(2)
            return usdPriceBN

            // Web3.utils.toBN(
            //   new BigNumber(
            //     (
            //       await axios.get(
            //         "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=ethereum"
            //       )
            //     ).data.ethereum.usd
            //   )
            //     .multipliedBy(1e18)
            //     .toFixed(0)
            // );
        };

        this.deployPool = async function (
            poolName : string,
            enforceWhitelist: boolean,
            closeFactor: number,
            maxAssets: number,
            liquidationIncentive: number,
            priceOracle: string, // Contract address
            priceOracleConf: any,
            options: any, // We might need to add sender as argument. Getting address from options will colide with the override arguments in ethers contract method calls. It doesnt take address.
            whitelist: string[] // An array of whitelisted addresses
          ) {

            await this.provider.send("hardhat_impersonateAccount", [accountToImpersonate])

                // 1. Deploy new price oracle via SDK if requested
                if (Fuse.ORACLES.indexOf(priceOracle) >= 0) {
                    try {
                    priceOracle = (await this.deployPriceOracle(
                        priceOracle,
                        priceOracleConf,
                        options
                    )).address; // TODO: anchorMantissa / anchorPeriod
                    } catch (error: any) {
                      throw Error(
                          "Deployment of price oracle failed: " +
                          (error.message ? error.message : error)
                      );
                    }
                }

                    // 2. Deploy Comptroller implementation if necessary
                    let implementationAddress = Fuse.COMPTROLLER_IMPLEMENTATION_CONTRACT_ADDRESS;

                    if (!implementationAddress) {
                        const comptrollerContract = new ContractFactory( JSON.parse(this.compoundContracts["contracts/Comptroller.sol:Comptroller"].abi), this.contracts["contracts/Comptroller.sol:Comptroller"].bin, this.provider.getSigner(accountToImpersonate));
                        const deployedComptroller = await comptrollerContract.deploy({...options})
                        implementationAddress = deployedComptroller.options.address;
                    }

                    //3. Register new pool with FusePoolDirectory
                    let receipt
                    try {

                        const contract  = this.contracts.FusePoolDirectory.connect(this.provider.getSigner(accountToImpersonate)) 
                        receipt = await contract
                        .deployPool(
                            poolName,
                            implementationAddress,
                            enforceWhitelist,
                            closeFactor,
                            maxAssets,
                            liquidationIncentive,
                            priceOracle,
                        )
                    } catch (error: any) {
                        throw Error(
                        "Deployment and registration of new Fuse pool failed: " +
                        (error.message ? error.message : error)
                        );
                    }
                                    
                    //4. Compute Unitroller address
                    const saltsHash = utils.solidityKeccak256(["address", "string", "uint"], [accountToImpersonate, poolName, receipt.deployTransaction.blockNumber])
                    const byteCodeHash = utils.keccak256("0x" + this.contracts["contracts/Unitroller.sol:Unitroller"].bin)

                    let poolAddress = utils.getCreate2Address(
                        Fuse.FUSE_POOL_DIRECTORY_CONTRACT_ADDRESS,
                        saltsHash,
                        byteCodeHash
                    );

                    let unitroller = new Contract(
                        poolAddress,
                        JSON.parse(this.contracts["contracts/Unitroller.sol:Unitroller"].abi),
                        this.provider.getSigner(accountToImpersonate)
                    );

                    
                    // Accept admin status via Unitroller
                    try {
                        await unitroller._acceptAdmin();
                    } catch (error: any) {
                        throw Error(
                        "Accepting admin status failed: " +
                        (error.message ? error.message : error)
                        );
                    }

                    // Whitelist
                    if (enforceWhitelist) {
                        let comptroller = new Contract(
                            poolAddress,
                            JSON.parse(this.compoundContracts["contracts/Comptroller.sol:Comptroller"].abi)
                        );

                        // Already enforced so now we just need to add the addresses
                        await comptroller._setWhitelistStatuses(whitelist, Array(whitelist.length).fill(true))
                    }

                    return [poolAddress, implementationAddress, priceOracle];
        };

        this.deployPriceOracle = async function (
            model: string, // TODO: find a way to use this.ORACLES 
            conf: ComptrollerConf, // This conf depends on which comptroller model we're deploying
            options: any
        )  {
              await this.provider.send("hardhat_impersonateAccount", [accountToImpersonate])

                let deployArgs: any[] = [];

                let priceOracleContract;
                let deployedPriceOracle;

                if (!model) model = "ChainlinkPriceOracle";
                if (!conf) conf = {};

                switch (model) {
                    case "ChainlinkPriceOracle":
                        deployArgs = [
                                        conf.maxSecondsBeforePriceIsStale
                                                ? conf.maxSecondsBeforePriceIsStale
                                                : 0,
                                    ]
                        priceOracleContract = new ContractFactory(this.oracleContracts["ChainlinkPriceOracle"].abi, this.oracleContracts["ChainlinkPriceOracle"].bin, await this.provider.getSigner(accountToImpersonate) );
                        deployedPriceOracle = await priceOracleContract.deploy({...options});
                        break;
                    case "UniswapLpTokenPriceOracle":
                        deployArgs = [conf.useRootOracle ? true : false];
                        priceOracleContract = new ContractFactory(this.oracleContracts["UniswapLpTokenPriceOracle"].abi, this.oracleContracts["UniswapLpTokenPriceOracle"].bin, this.provider.getSigner(accountToImpersonate))
                        deployedPriceOracle = priceOracleContract.deploy(deployArgs, {...options}) 
                        break;
                    case "UniswapTwapPriceOracle": // Uniswap V2 TWAPs
                        deployArgs = [
                                    conf.rootOracle 
                                        ? conf.rootOracle 
                                        : Fuse.UNISWAP_TWAP_PRICE_ORACLE_ROOT_CONTRACT_ADDRESS, 
                                    conf.uniswapV2Factory 
                                        ? conf.uniswapV2Factory 
                                        : "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
                                    ]; // Default to official Uniswap V2 factory
                        priceOracleContract = new ContractFactory(this.oracleContracts["UniswapTwapPriceOracle"].abi, this.oracleContracts["UniswapTwapPriceOracle"].bin, this.provider.getSigner(accountToImpersonate))
                        deployedPriceOracle = await priceOracleContract.deploy(deployArgs, {options})
                        break;
                    case "UniswapTwapPriceOracleV2": // Uniswap V2 TWAPs
                        deployArgs = [
                                    conf.rootOracle 
                                        ? conf.rootOracle 
                                        : Fuse.UNISWAP_TWAP_PRICE_ORACLE_ROOT_CONTRACT_ADDRESS, 
                                    conf.uniswapV2Factory 
                                        ? conf.uniswapV2Factory 
                                        : "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", 
                                    conf.baseToken 
                                        ? conf.baseToken 
                                        : Fuse.WETH_ADDRESS
                                    ]; // Default to official Uniswap V2 factory
                        priceOracleContract = new ContractFactory( this.oracleContracts["UniswapTwapPriceOracleV2"].abi, this.oracleContracts["UniswapTwapPriceOracleV2"].bin, this.provider.getSigner(accountToImpersonate));
                        deployedPriceOracle = await priceOracleContract.deploy(deployArgs, {...options})
                        break;                  
                    case "ChainlinkPriceOracleV2":
                        priceOracleContract = new ContractFactory(this.oracleContracts["ChainlinkPriceOracleV2"].abi, this.oracleContracts["ChainlinkPriceOracleV2"].bin, this.provider.getSigner(accountToImpersonate) );
                        deployArgs = [
                                    conf.admin 
                                        ? conf.admin 
                                        : options.from,
                                    conf.canAdminOverwrite 
                                        ? true 
                                        : false,
                                    ];
                        deployedPriceOracle = await priceOracleContract.deploy(deployArgs, {...options})
                        break;
                    case "UniswapV3TwapPriceOracle":
                        if ([500, 3000, 10000].indexOf(parseInt(conf.feeTier)) < 0) throw Error ("Invalid fee tier passed to UniswapV3TwapPriceOracle deployment.");
                        deployArgs = [conf.uniswapV3Factory ? conf.uniswapV3Factory : "0x1f98431c8ad98523631ae4a59f267346ea31f984", conf.feeTier]; // Default to official Uniswap V3 factory
                        priceOracleContract = new ContractFactory( this.oracleContracts["UniswapV3TwapPriceOracle"].abi, this.oracleContracts["UniswapV3TwapPriceOracle"].bin, this.provider.getSigner(accountToImpersonate));
                        deployedPriceOracle = await priceOracleContract.deploy(deployArgs, {...options})
                        break;
                    case "UniswapV3TwapPriceOracleV2":
                        if ([500, 3000, 10000].indexOf(parseInt(conf.feeTier)) < 0) throw Error ("Invalid fee tier passed to UniswapV3TwapPriceOracleV2 deployment.");
                        priceOracleContract = new ContractFactory( this.oracleContracts["UniswapV3TwapPriceOracleV2"].abi, this.oracleContracts["UniswapV3TwapPriceOracleV2"].bin, this.provider.getSigner(accountToImpersonate));
                        deployArgs = [
                                    conf.uniswapV3Factory 
                                        ? conf.uniswapV3Factory 
                                        : "0x1f98431c8ad98523631ae4a59f267346ea31f984", 
                                    conf.feeTier, 
                                    conf.baseToken
                                ]; // Default to official Uniswap V3 factory
                        deployedPriceOracle = await priceOracleContract.deploy(deployArgs, {...options})
                        break;
                    case "FixedTokenPriceOracle":
                        priceOracleContract = new ContractFactory(this.oracleContracts["FixedTokenPriceOracle"].abi, this.oracleContracts["FixedTokenPriceOracle"].bin, this.provider.getSigner(accountToImpersonate));
                        deployArgs = [ conf.baseToken];
                        deployedPriceOracle = await priceOracleContract.deploy(deployArgs, {...options})
                        break;
                    case "MasterPriceOracle":
                        priceOracleContract = new ContractFactory(this.oracleContracts["MasterPriceOracle"].abi, this.oracleContracts["MasterPriceOracle"].bin, this.provider.getSigner(accountToImpersonate) );
                        deployArgs = [
                            conf.underlyings ? conf.underlyings : [],
                            conf.oracles ? conf.oracles : [],
                            conf.admin ? conf.admin : options.from,
                            conf.canAdminOverwrite ? true : false,
                        ];
                        deployedPriceOracle = await priceOracleContract.deploy(deployArgs, {...options})
                        break;
                    case "SimplePriceOracle":
                        priceOracleContract = new ContractFactory(
                            JSON.parse( this.contracts["contracts/SimplePriceOracle.sol:SimplePriceOracle"].abi ),
                            this.contracts["contracts/SimplePriceOracle.sol:SimplePriceOracle"].bin,
                            this.provider.getSigner(accountToImpersonate)
                        );
                        deployedPriceOracle = await priceOracleContract.deploy({...options})
                        break;
                    default:
                        priceOracleContract = new ContractFactory(this.oracleContracts[model].abi, this.oracleContracts[model].bin, this.provider.getSigner(accountToImpersonate) );
                        deployedPriceOracle = await priceOracleContract.deploy({...options})
                        break;
                }
            return deployedPriceOracle;
            //return deployedPriceOracle.options.address;
        };

        this.deployComptroller = async function (
            closeFactor: number,
            maxAssets: number,
            liquidationIncentive: number,
            priceOracle: string, // Contract address
            implementationAddress: string, // Address of comptroller if its already deployed
            options: any
          ) {
            await this.provider.send("hardhat_impersonateAccount", [accountToImpersonate])

            let deployedComptroller
            // 1. Deploy comptroller if necessary
            if (!implementationAddress) {
              const comptrollerContract = new Contract( 
                  JSON.parse(
                      this.compoundContracts["contracts/Comptroller.sol:Comptroller"].abi),
                      this.compoundContracts["contracts/Comptroller.sol:Comptroller"].bin,
                      this.provider.getSigner(accountToImpersonate)
              );
              deployedComptroller = await comptrollerContract.deploy(...options);
              implementationAddress = deployedComptroller.options.address;
            }
      
            // 2. Get Unitroller to set the comptroller implementation address for the pool
            const unitrollerContract = new ContractFactory(
              JSON.parse(this.compoundContracts["contracts/Unitroller.sol:Unitroller"].abi),
              this.compoundContracts["contracts/Unitroller.sol:Unitroller"].bin,
              this.provider.getSigner(accountToImpersonate)
            );

            const deployedUnitroller = await unitrollerContract.deploy({...options})
            await deployedUnitroller
              ._setPendingImplementation(deployedComptroller.options.address, {...options})

            // Comptroller becomes unitroller. 
            await deployedComptroller
              ._become(deployedUnitroller.options.address, {...options}) 
      
            deployedComptroller.options.address = deployedUnitroller.options.address;

            // Set comptroller configuration
            if (closeFactor)
              await deployedComptroller._setCloseFactor(closeFactor, {...options});
            if (maxAssets)
              await deployedComptroller._setMaxAssets(maxAssets, {...options});
            if (liquidationIncentive)
              await deployedComptroller.methods
                ._setLiquidationIncentive(liquidationIncentive, {...options})
            if (priceOracle)
              await deployedComptroller._setPriceOracle(priceOracle, {...options});
      
            return [deployedUnitroller.options.address, implementationAddress];
        };

        this.deployAsset = async function (
            conf: interestRateModelConf,
            collateralFactor: number,
            reserveFactor: number, // Amount of accrue interest that will go to the pool's reserves. Usually 0.1
            adminFee: number,
            options: any,
            bypassPriceFeedCheck: any // ?
          ) {

            await this.provider.send("hardhat_impersonateAccount", [accountToImpersonate])

            // Deploy new interest rate model via SDK if requested
            if (
              [
                "WhitePaperInterestRateModel",
                "JumpRateModel",
                "DAIInterestRateModelV2",
              ].indexOf(conf.interestRateModel) >= 0
            ) {
              try {
                conf.interestRateModel = await this.deployInterestRateModel(
                  conf.interestRateModel,
                  conf.interestRateModelConf,
                  options
                ); // TODO: anchorMantissa
              } catch (error: any) {
                throw Error (
                  "Deployment of interest rate model failed: " +
                  (error.message ? error.message : error)
                );
              }
            }
      
            // Deploy new asset to existing pool via SDK
            try {
              var [assetAddress, implementationAddress] = await this.deployCToken(
                conf,
                true,
                collateralFactor,
                reserveFactor,
                adminFee,
                options,
                bypassPriceFeedCheck
              );
            } catch (error: any) {
              throw  Error(
                "Deployment of asset to Fuse pool failed: " +
                (error.message ? error.message : error)
              );
            }
      
            return [assetAddress, implementationAddress, conf.interestRateModel];
        };

        this.deployInterestRateModel = async function (
            model: string, 
            conf: interestRateModelConf, 
            options: any
        ) {

          await this.provider.send("hardhat_impersonateAccount", [accountToImpersonate])

            // Default model = JumpRateModel
            if (!model) {
              model = "JumpRateModel";
            }
      
            // Get deployArgs
            let deployArgs: any[] = [];
      
            switch (model) {
              case "JumpRateModel":
                if (!conf)
                  conf = {
                    baseRatePerYear: "20000000000000000",
                    multiplierPerYear: "200000000000000000",
                    jumpMultiplierPerYear: "2000000000000000000",
                    kink: "900000000000000000",
                  };
                deployArgs = [
                  conf.baseRatePerYear,
                  conf.multiplierPerYear,
                  conf.jumpMultiplierPerYear,
                  conf.kink,
                ];
                break;
              case "DAIInterestRateModelV2":
                if (!conf)
                  conf = {
                    jumpMultiplierPerYear: "2000000000000000000",
                    kink: "900000000000000000",
                  };
                deployArgs = [
                  conf.jumpMultiplierPerYear,
                  conf.kink,
                  Fuse.DAI_POT,
                  Fuse.DAI_JUG,
                ];
                break;
              case "WhitePaperInterestRateModel":
                if (!conf)
                  conf = {
                    baseRatePerYear: "20000000000000000",
                    multiplierPerYear: "200000000000000000",
                  };
                deployArgs = [conf.baseRatePerYear, conf.multiplierPerYear];
                break;
            }
      
            // Deploy InterestRateModel
            const interestRateModelContract = new ContractFactory(
              JSON.parse(this.compoundContracts["contracts/" + model + ".sol:" + model].abi),
              this.compoundContracts["contracts/" + model + ".sol:" + model].bin,
              this.provider.getSigner(accountToImpersonate)
            );
            
            const deployedInterestRateModel = await interestRateModelContract.deploy(deployArgs, {...options})
            return deployedInterestRateModel.options.address;
        };

        this.deployCToken = async function (
            conf: any,
            supportMarket: boolean,
            collateralFactor: any, 
            reserveFactor: number,
            adminFee: number,
            options: any,
            bypassPriceFeedCheck: boolean
          ) {
            await this.provider.send("hardhat_impersonateAccount", [accountToImpersonate])

            // BigNumbers
            const reserveFactorBN = BigNumber.from(reserveFactor)
            const adminFeeBN = BigNumber.from(adminFee)
            const collateralFactorBN = utils.parseUnits(collateralFactor, 18) // TODO: find out if this is a number or string. If its a number, parseUnits will not work. Also parse Units works if number is between 0 - 0.9


            // Check collateral factor
            if (
              (!collateralFactorBN.gte(constants.Zero)) ||
              collateralFactorBN.gt(utils.parseUnits("0.9", 18))
            )
              throw Error ("Collateral factor must range from 0 to 0.9.");
      
            // Check reserve factor + admin fee + Fuse fee
            if (!reserveFactorBN.gte(constants.Zero))
              throw Error ("Reserve factor cannot be negative.");
            if (!adminFeeBN.gte(constants.Zero))
              throw Error ("Admin fee cannot be negative.");

            // If reserveFactor or adminFee is greater than zero, we get fuse fee.
            // Sum of reserveFactor and adminFee should not be greater than fuse fee. ? i think
            if (
              reserveFactorBN.gt(constants.Zero) ||
                adminFeeBN.gt(constants.Zero)
            ) {
              const fuseFee = await this.contracts.FuseFeeDistributor.callStatic.interestFeeRate()
              if (
                reserveFactorBN
                  .add(adminFeeBN)
                  .add(BigNumber.from(fuseFee))
                  .gt(constants.WeiPerEther)
              )
                throw Error(
                  "Sum of reserve factor and admin fee should range from 0 to " +
                  (1 - parseInt(fuseFee) / 1e18) +
                  "."
                );
            }
      
            return conf.underlying !== undefined &&
              conf.underlying !== null &&
              conf.underlying.length > 0 &&
              !BigNumber.from(conf.underlying).isZero()
              ? await this.deployCErc20(
                  conf,
                  supportMarket,
                  collateralFactor,
                  reserveFactor,
                  adminFee,
                  options,
                  bypassPriceFeedCheck,
                  Fuse.CERC20_DELEGATE_CONTRACT_ADDRESS
                    ? Fuse.CERC20_DELEGATE_CONTRACT_ADDRESS
                    : undefined,
                )
              : await this.deployCEther(
                  conf,
                  supportMarket,
                  collateralFactor,
                  reserveFactor,
                  adminFee,
                  Fuse.CETHER_DELEGATE_CONTRACT_ADDRESS
                    ? Fuse.CETHER_DELEGATE_CONTRACT_ADDRESS
                    : null,
                  options
                );
        };

        this.deployCEther = async function (
            conf: cERC20Conf,
            supportMarket: boolean,
            collateralFactor: number,
            reserveFactor: number,
            adminFee: number,
            options: any,
            implementationAddress?: string,
          ) {
            await this.provider.send("hardhat_impersonateAccount", [accountToImpersonate])

            // Check conf.initialExchangeRateMantissa
            if (
              conf.initialExchangeRateMantissa === undefined ||
              conf.initialExchangeRateMantissa === null ||
              ethers.BigNumber.from(conf.initialExchangeRateMantissa).isZero()
            ) {
              conf.initialExchangeRateMantissa = utils.parseUnits("0.02", 18)
                .mul(constants.WeiPerEther)
                .div(BigNumber.from(10).pow(BigNumber.from(conf.decimals)));
            }
      
            // Deploy CEtherDelegate implementation contract if necessary
            if (!implementationAddress) {
              const cEtherDelegateContract = new ContractFactory(
                JSON.parse(this.compoundContracts["contracts/CEtherDelegate.sol:CEtherDelegate"].abi),
                this.compoundContracts["contracts/CEtherDelegate.sol:CEtherDelegate"].bin,
                this.provider.getSigner(accountToImpersonate)
              );
              const deployedCEtherDelegate = await cEtherDelegateContract.deploy({...options})
              implementationAddress = deployedCEtherDelegate.options.address;
            }
      
            // Deploy CEtherDelegator proxy contract if necessary
            const cEtherDelegatorContract = new ContractFactory(
              JSON.parse(this.compoundContracts["contracts/CEtherDelegator.sol:CEtherDelegator"].abi),
              this.compoundContracts["contracts/CEtherDelegator.sol:CEtherDelegator"].bin,
              this.provider.getSigner(accountToImpersonate)
            );
            let deployArgs = [
              conf.comptroller,
              conf.interestRateModel,
              conf.initialExchangeRateMantissa.toString(),
              conf.name,
              conf.symbol,
              conf.decimals,
              conf.admin,
              implementationAddress,
              "0x0",
              reserveFactor ? reserveFactor : 0,
              adminFee ? adminFee : 0,
            ];
            const deployedCEtherDelegator = await cEtherDelegatorContract.deploy(deployArgs, {...options})
      
            // Register new asset with Comptroller
            const comptrollerContract = new Contract(
              JSON.parse(this.compoundContracts["contracts/Comptroller.sol:Comptroller"].abi),
              conf.comptroller,
              this.provider.getSigner(accountToImpersonate)
            );
            deployedCEtherDelegator.options.jsonInterface = JSON.parse(this.compoundContracts["contracts/CEtherDelegate.sol:CEtherDelegate"].abi);
      
            if (supportMarket) {
              if (collateralFactor)
                await comptrollerContract
                  ._supportMarketAndSetCollateralFactor(
                        deployedCEtherDelegator.options.address,
                        collateralFactor,
                        {...options}
                  )
              else
                await comptrollerContract
                  ._supportMarket(deployedCEtherDelegator.options.address, {...options})
            }
      
            // Return cToken proxy and implementation contract addresses
            return [deployedCEtherDelegator.options.address, implementationAddress];
        };

        this.deployCErc20 = async function (
            conf: cERC20Conf,
            supportMarket: boolean,
            collateralFactor: number,
            reserveFactor: number,
            adminFee: number,
            options: any,
            bypassPriceFeedCheck: boolean,
            implementationAddress?: string // cERC20Delegate implementation
          ) {
            await this.provider.send("hardhat_impersonateAccount", [accountToImpersonate])

            // Check conf.initialExchangeRateMantissa
            if (
              conf.initialExchangeRateMantissa === undefined ||
              conf.initialExchangeRateMantissa === null ||
              ethers.BigNumber.from(conf.initialExchangeRateMantissa).isZero()
            ) {
              const erc20 = new Contract(
                JSON.parse(this.compoundContracts["contracts/EIP20Interface.sol:EIP20Interface"].abi),
                conf.underlying,
                this.provider
              );
              const underlyingDecimals: number = await erc20.methods.decimals()
              conf.initialExchangeRateMantissa = utils.parseUnits("0.02", 18)
                .mul(BigNumber.from(10).pow(BigNumber.from(underlyingDecimals)))
                .div(BigNumber.from(10).pow(BigNumber.from(conf.decimals)));
            }
      
            // Get Comptroller
            const comptroller = new Contract(
              JSON.parse(this.compoundContracts["contracts/Comptroller.sol:Comptroller"].abi),
              conf.comptroller, 
              this.provider.getSigner(accountToImpersonate)
            );
      
            // Check for price feed assuming !bypassPriceFeedCheck
            if (!bypassPriceFeedCheck) await this.checkForCErc20PriceFeed(comptroller, conf, options);
      
            // Deploy CErc20Delegate implementation contract if necessary
            if (!implementationAddress) {
              const cErc20DelegateContract = new ContractFactory(
                JSON.parse(this.compoundContracts["contracts/CErc20Delegate.sol:CErc20Delegate"].abi),
                this.compoundContracts["contracts/CErc20Delegate.sol:CErc20Delegate"].bin,
                this.provider.getSigner(accountToImpersonate)
              );
              const deployedCErc20Delegate = await cErc20DelegateContract.deploy({...options})
              implementationAddress = deployedCErc20Delegate.options.address;
            }
      
            // Deploy CErc20Delegator proxy contract if necessary
            const cErc20DelegatorContract = new Contract(
              JSON.parse(this.compoundContracts["contracts/CErc20Delegator.sol:CErc20Delegator"].abi),
              this.compoundContracts["contracts/CErc20Delegator.sol:CErc20Delegator"].bin,
              this.provider.getSigner(accountToImpersonate)
            );

            let deployArgs = [
              conf.underlying,
              conf.comptroller,
              conf.interestRateModel,
              conf.initialExchangeRateMantissa.toString(),
              conf.name,
              conf.symbol,
              conf.decimals,
              conf.admin,
              implementationAddress,
              "0x0",
              reserveFactor ? reserveFactor : 0,
              adminFee ? adminFee : 0,
            ];
            const deployedCErc20Delegator = await cErc20DelegatorContract.deploy(deployArgs, {...options})
      
            // Register new asset with Comptroller
            deployedCErc20Delegator.options.jsonInterface = JSON.parse( this.compoundContracts["contracts/CErc20Delegate.sol:CErc20Delegate"].abi );
      
            if (supportMarket) {
              if (collateralFactor)
                await comptroller
                    ._supportMarketAndSetCollateralFactor(
                            deployedCErc20Delegator.options.address,
                            collateralFactor,
                            {...options}
                    )
              else
                await comptroller._supportMarket(deployedCErc20Delegator.options.address, {...options})
            }
      
            // Return cToken proxy and implementation contract addresses
            return [deployedCErc20Delegator.options.address, implementationAddress];
        };

        this.identifyInterestRateModel = async function (interestRateModelAddress: string): Promise<interestRateModelType> {
            // Get interest rate model type from runtime bytecode hash and init class
            const interestRateModels: { [key:string]: any}  = {
              JumpRateModel: JumpRateModel,
              JumpRateModelV2: JumpRateModelV2,
              DAIInterestRateModelV2: DAIInterestRateModelV2,
              WhitePaperInterestRateModel: WhitePaperInterestRateModel,
            };

            
            
      
            const runtimeBytecodeHash = utils.keccak256( await this.provider.getCode(interestRateModelAddress) );
            let interestRateModel: interestRateModelType = null;
      
            outerLoop:
            for (const model of Object.keys(interestRateModels)) {
              if (interestRateModels[model].RUNTIME_BYTECODE_HASHES !== undefined) {
                for (const hash of interestRateModels[model].RUNTIME_BYTECODE_HASHES) {
                  if (runtimeBytecodeHash === hash) {
                    interestRateModel = new interestRateModels[model]();
                    break outerLoop;
                  }
                }
              } else if (runtimeBytecodeHash === interestRateModels[model].RUNTIME_BYTECODE_HASH) {
                interestRateModel = new interestRateModels[model]();
                break;
              }
            }
      
            return interestRateModel;
        };

        this.getInterestRateModel = async function (assetAddress: string) {
            // Get interest rate model address from asset address
            const assetContract = new Contract(
              JSON.parse(this.compoundContracts["contracts/CTokenInterfaces.sol:CTokenInterface"].abi),
              assetAddress,
              this.provider
            );
            const interestRateModelAddress: string = await assetContract.callStatic.interestRateModel()
      
            const interestRateModel = await this.identifyInterestRateModel( interestRateModelAddress);

            if (interestRateModel) {
                
                await interestRateModel.init(
                    interestRateModelAddress,
                    assetAddress,
                    this.provider
                ); 
                
            } else {

                return interestRateModel;
            }
        };

        this.checkForCErc20PriceFeed = async function (
            comptroller: Contract, 
            conf: {
                underlying: string // Address of the underlying ERC20 Token
            },
            options: any
        ) {
          await this.provider.send("hardhat_impersonateAccount", [accountToImpersonate])


            // Get price feed
            // 1. Get priceOracle's address used by the comprtroller. PriceOracle can have multiple implementations so:
                // 1.1 We try to figure out which implementation it is, by (practically) bruteforcing it.
                    //1.1.2 We first assume its a ChainlinkPriceOracle. 
                    //1.1.3 We then try with PrefferedOracle's primary oracle i.e ChainlinkPriceOracle
                    //1.1.4 We try with UniswapAnchoredView 
                    //1.1.5 We try with UniswapView
                    //1.1.6 We try with PrefferedOracle's secondary oracle i.e UniswapAnchoredView or UniswapView
                    //1.1.6 

            // 2. Check 

            // Get address of the priceOracle used by the comptroller
            const priceOracle: string = await comptroller.callStatic.oracle();
            
            // Check for a ChainlinkPriceOracle with a feed for the ERC20 Token
            let chainlinkPriceOracle: Contract
            let chainlinkPriceFeed: boolean | undefined = undefined // will be true if chainlink has a price feed for underlying Erc20 token
            
            chainlinkPriceOracle = new Contract(
              this.oracleContracts["ChainlinkPriceOracle"].abi,
              priceOracle,
              this.provider.getSigner(accountToImpersonate)
            );
      
            // If underlying Erc20 is WETH use chainlinkPriceFeed, otherwise check if Chainlink supports it.
            if (conf.underlying.toLowerCase() === Fuse.WETH_ADDRESS.toLowerCase()) {
                chainlinkPriceFeed = true;
            } else {
                try {
                    chainlinkPriceFeed = await chainlinkPriceOracle.hasPriceFeed(conf.underlying)
                } catch {}
            }
      
            if (chainlinkPriceFeed === undefined || !chainlinkPriceFeed) {

              const preferredPriceOracle = new Contract(
                this.oracleContracts["PreferredPriceOracle"].abi,
                priceOracle,
                this.provider.getSigner(accountToImpersonate)
              );
      
              try {
                // Get the underlying ChainlinkOracle address of the PreferredPriceOracle
                const chainlinkPriceOracleAddress = await preferredPriceOracle.chainlinkOracle()

                // Initiate ChainlinkOracle 
                chainlinkPriceOracle = new Contract(
                  this.oracleContracts["ChainlinkPriceOracle"].abi,
                  chainlinkPriceOracleAddress,
                  this.provider
                );
                
                // Check if chainlink has an available price feed for the Erc20Token
                chainlinkPriceFeed = await chainlinkPriceOracle.hasPriceFeed(conf.underlying)
              } catch {}
            }
      
            if (chainlinkPriceFeed === undefined || !chainlinkPriceFeed) {
              // Check if we can get a UniswapAnchoredView
              var isUniswapAnchoredView = false;
                
              let uniswapOrUniswapAnchoredViewContract: Contract
              try {
                uniswapOrUniswapAnchoredViewContract = new Contract(
                    JSON.parse(this.openOracleContracts["contracts/Uniswap/UniswapAnchoredView.sol:UniswapAnchoredView"].abi),
                    priceOracle,
                    this.provider
                );
                await uniswapOrUniswapAnchoredViewContract.IS_UNISWAP_ANCHORED_VIEW()
                isUniswapAnchoredView = true;
              } catch {
                try {
                    uniswapOrUniswapAnchoredViewContract = new Contract(
                    JSON.parse(this.openOracleContracts["contracts/Uniswap/UniswapView.sol:UniswapView"].abi),
                    priceOracle,
                    this.provider.getSigner(accountToImpersonate)
                  );
                  await uniswapOrUniswapAnchoredViewContract.IS_UNISWAP_VIEW();
                } catch {
                  // Check for PreferredPriceOracle's secondary oracle.
                  const preferredPriceOracle = new Contract(
                    this.oracleContracts["PreferredPriceOracle"].abi,
                    priceOracle,
                    this.provider
                  );
      
                  let uniswapOrUniswapAnchoredViewAddress

                  try {
                    uniswapOrUniswapAnchoredViewAddress = await preferredPriceOracle.secondaryOracle()
                  } catch {
                    throw Error ("Underlying token price for this asset is not available via this oracle.");
                  }
      
                  try {
                    uniswapOrUniswapAnchoredViewContract = new Contract(
                      JSON.parse(this.openOracleContracts["contracts/Uniswap/UniswapAnchoredView.sol:UniswapAnchoredView"].abi),
                      uniswapOrUniswapAnchoredViewAddress,
                      this.provider
                    );
                    await uniswapOrUniswapAnchoredViewContract.IS_UNISWAP_ANCHORED_VIEW()
                    isUniswapAnchoredView = true;
                  } catch {
                    try {
                      uniswapOrUniswapAnchoredViewContract = new Contract(
                        JSON.parse(this.openOracleContracts["contracts/Uniswap/UniswapView.sol:UniswapView"].abi),
                        uniswapOrUniswapAnchoredViewAddress,
                        this.provider
                      );
                      await uniswapOrUniswapAnchoredViewContract.methods.IS_UNISWAP_VIEW()
                    } catch {
                      throw Error ("Underlying token price not available via ChainlinkPriceOracle, and no UniswapAnchoredView or UniswapView was found.");
                    }
                  }
                }
              
      
              // Check if the token already exists
              try {
                await uniswapOrUniswapAnchoredViewContract.getTokenConfigByUnderlying(conf.underlying)
              } catch {
                // If not, add it!
                const underlyingToken = new Contract(
                  JSON.parse(this.compoundContracts["contracts/EIP20Interface.sol:EIP20Interface"].abi),
                  conf.underlying,
                  this.provider
                );

                const underlyingSymbol: string = await underlyingToken.symbol();
                const underlyingDecimals: number = await underlyingToken.decimals();
      
                const PriceSource = {
                  FIXED_ETH: 0,
                  FIXED_USD: 1,
                  REPORTER: 2,
                  TWAP: 3,
                };
      
                if (conf.underlying.toLowerCase() === Fuse.WETH_ADDRESS.toLowerCase()) {
                  // WETH
                  await uniswapOrUniswapAnchoredViewContract
                    .add([
                      {
                        underlying: conf.underlying,
                        symbolHash: utils.solidityKeccak256(["string"],[underlyingSymbol]),
                        baseUnit: BigNumber.from(10)
                          .pow(BigNumber.from(underlyingDecimals))
                          .toString(),
                        priceSource: PriceSource.FIXED_ETH,
                        fixedPrice: constants.WeiPerEther.toString(),
                        uniswapMarket: "0x0000000000000000000000000000000000000000",
                        isUniswapReversed: false,
                      },
                    ],{...options})
                } else if (
                  conf.underlying === "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
                ) {
                  // USDC
                  if (isUniswapAnchoredView) {
                    await uniswapOrUniswapAnchoredViewContract
                      .add([
                        {
                          underlying: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          symbolHash: utils.solidityKeccak256(["string"],["USDC"]),
                          baseUnit: BigNumber.from(1e6).toString(),
                          priceSource: PriceSource.FIXED_USD,
                          fixedPrice: 1e6,
                          uniswapMarket: "0x0000000000000000000000000000000000000000",
                          isUniswapReversed: false,
                        },
                      ],{...options})
                  } else {
                    await uniswapOrUniswapAnchoredViewContract
                      .add([
                        {
                          underlying: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                          symbolHash: utils.solidityKeccak256(["string"],["USDC"]),
                          baseUnit: BigNumber.from(1e6).toString(),
                          priceSource: PriceSource.TWAP,
                          fixedPrice: 0,
                          uniswapMarket: "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc",
                          isUniswapReversed: false,
                        },
                      ],{...options})
                    await uniswapOrUniswapAnchoredViewContract.postPrices(["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"],{...options})
                  }
                } else {
                  // Ask about fixed prices if UniswapAnchoredView or if UniswapView is not public; otherwise, prompt for Uniswap V2 pair
                  if (
                    isUniswapAnchoredView ||
                    !(await uniswapOrUniswapAnchoredViewContract.isPublic())
                  ) {
                    // Check for fixed ETH
                    const fixedEth = confirm( "Should the price of this token be fixed to 1 ETH?" );
      
                    if (fixedEth) {
                      await uniswapOrUniswapAnchoredViewContract
                        .add([
                          {
                            underlying: conf.underlying,
                            symbolHash: utils.solidityKeccak256(["string"],[underlyingSymbol]),
                            baseUnit: BigNumber.from(10)
                              .pow(underlyingDecimals === 18 ? constants.WeiPerEther : BigNumber.from(underlyingDecimals))
                              .toString(),
                            priceSource: PriceSource.FIXED_ETH,
                            fixedPrice: constants.WeiPerEther.toString(),
                            uniswapMarket:
                              "0x0000000000000000000000000000000000000000",
                            isUniswapReversed: false,
                          },
                        ],{...options})
                    } else {
                      // Check for fixed USD
                      let msg = "Should the price of this token be fixed to 1 USD?";
                      if (!isUniswapAnchoredView)
                        msg +=
                          " If so, please note that you will need to run postPrices on your UniswapView for USDC instead of " +
                          underlyingSymbol +
                          " (as technically, the " +
                          underlyingSymbol +
                          " price would be fixed to 1 USDC).";
                      const fixedUsd = confirm(msg);
      
                      if (fixedUsd) {
                        const tokenConfigs = [
                          {
                            underlying: conf.underlying,
                            symbolHash: utils.solidityKeccak256(["string"],[underlyingSymbol]),
                            baseUnit: BigNumber.from(10)
                              .pow(underlyingDecimals === 18 ? constants.WeiPerEther : BigNumber.from(underlyingDecimals))
                              .toString(),
                            priceSource: PriceSource.FIXED_USD,
                            fixedPrice: BigNumber.from(1e6).toString(),
                            uniswapMarket:
                              "0x0000000000000000000000000000000000000000",
                            isUniswapReversed: false,
                          },
                        ];
      
                        // UniswapView only: add USDC token config if not present so price oracle can convert from USD to ETH
                        if (!isUniswapAnchoredView) {
                          try {
                            await uniswapOrUniswapAnchoredViewContract
                              .getTokenConfigByUnderlying(
                                "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
                              )
                          } catch (error) {
                            tokenConfigs.push({
                              underlying:
                                "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                              symbolHash: utils.solidityKeccak256(["string"],["USDC"]),
                              baseUnit: BigNumber.from(1e6).toString(),
                              priceSource: PriceSource.TWAP,
                              fixedPrice: "0",
                              uniswapMarket:
                                "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc",
                              isUniswapReversed: false,
                            });
                          }
                        }
      
                        // Add token config(s)
                        await uniswapOrUniswapAnchoredViewContract
                          .add(tokenConfigs, {...options})
      
                        // UniswapView only: post USDC price
                        if (!isUniswapAnchoredView)
                          await uniswapOrUniswapAnchoredViewContract
                            .postPrices([
                              "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                            ],{...options})
                      } else await promptForUniswapV2Pair(this); // Prompt for Uniswap V2 pair
                    }
                  } else await promptForUniswapV2Pair(this);
                 } // Prompt for Uniswap V2 pair
      
                  async function promptForUniswapV2Pair(self: Fuse) {
                    // Predict correct Uniswap V2 pair
                    let isNotReversed = conf.underlying.toLowerCase() < Fuse.WETH_ADDRESS.toLowerCase();
                    const tokens = isNotReversed
                      ? [conf.underlying, Fuse.WETH_ADDRESS]
                      : [Fuse.WETH_ADDRESS, conf.underlying];

                    const salt = utils.solidityKeccak256(["string","string"], [conf.underlying, Fuse.WETH_ADDRESS])

                    let uniswapV2Pair = utils.getCreate2Address(
                      Fuse.UNISWAP_V2_FACTORY_ADDRESS,
                      salt,
                      Fuse.UNISWAP_V2_PAIR_INIT_CODE_HASH
                    );
      
                    // Double-check with user that pair is correct
                    const correctUniswapV2Pair = confirm(
                      "We have determined that the correct Uniswap V2 pair for " +
                        (isNotReversed
                          ? underlyingSymbol + "/ETH"
                          : "ETH/" + underlyingSymbol) +
                        " is " +
                        uniswapV2Pair +
                        ". Is this correct?"
                    );
      
                    if (!correctUniswapV2Pair) {
                      let uniswapV2Pair = prompt(
                        "Please enter the underlying token's ETH-based Uniswap V2 pair address:"
                      );
                      if (uniswapV2Pair && uniswapV2Pair.length === 0)
                        throw Error( isUniswapAnchoredView
                          ? "Reported prices must have a Uniswap V2 pair as an anchor!"
                          : "Non-fixed prices must have a Uniswap V2 pair from which to source prices!");
                      isNotReversed = confirm(
                        "Press OK if the Uniswap V2 pair is " +
                          underlyingSymbol +
                          "/ETH. If it is reversed (ETH/" +
                          underlyingSymbol +
                          "), press Cancel."
                      );
                    }
      
                    // Add asset to oracle
                    await uniswapOrUniswapAnchoredViewContract
                      .add([
                        {
                          underlying: conf.underlying,
                          symbolHash: utils.solidityKeccak256(["string"], [underlyingSymbol]),
                          baseUnit: BigNumber.from(10)
                            .pow(underlyingDecimals === 18 ? constants.WeiPerEther : BigNumber.from(underlyingDecimals))
                            .toString(),
                          priceSource: isUniswapAnchoredView
                            ? PriceSource.REPORTER
                            : PriceSource.TWAP,
                          fixedPrice: 0,
                          uniswapMarket: uniswapV2Pair,
                          isUniswapReversed: !isNotReversed,
                        },
                      ],{...options})
      
                    // Post first price
                    if (isUniswapAnchoredView) {
                      // Post reported price or (if price has never been reported) have user report and post price
                      const priceData = new Contract(
                        JSON.parse(self.openOracleContracts["contracts/OpenOraclePriceData.sol:OpenOraclePriceData"].abi),
                        await uniswapOrUniswapAnchoredViewContract.priceData(),
                        self.provider
                      );
                      var reporter = await uniswapOrUniswapAnchoredViewContract.methods.reporter()
                      if (
                        BigNumber.from( await priceData.getPrice(reporter, underlyingSymbol))
                          .gt(constants.Zero)
                      )
                        await uniswapOrUniswapAnchoredViewContract
                          .postPrices([], [], [underlyingSymbol],{...options})
                      else
                        prompt(
                          "It looks like prices have never been reported for " +
                            underlyingSymbol +
                            ". Please click OK once you have reported and posted prices for" +
                            underlyingSymbol +
                            "."
                        );
                    } else {
                      await uniswapOrUniswapAnchoredViewContract
                        .postPrices([conf.underlying],{...options})
                    }
                  }
                }
              }
            }
        };

        this.getPriceOracle = async function (oracleAddress: string) {
            // Get price oracle contract name from runtime bytecode hash
            const runtimeBytecodeHash = utils.keccak256( await this.provider.getCode(oracleAddress) );
            for (const model of Object.keys( Fuse.PRICE_ORACLE_RUNTIME_BYTECODE_HASHES )) {
              if ( runtimeBytecodeHash === Fuse.PRICE_ORACLE_RUNTIME_BYTECODE_HASHES[model] )
                return model;
            return null;
            }
          };
    }
}