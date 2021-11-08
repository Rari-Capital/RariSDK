// Ethers
import { BigNumber, Contract, utils, ContractFactory, constants, ethers} from "ethers";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";

// Axios
import axios from 'axios';

// ABIs
import fusePoolDirectoryAbi from './abi/FusepoolDirectory.json';
import fusePoolLensAbi from './abi/FusePoolLens.json';
import fuseSafeLiquidatorAbi from './abi/FuseSafeLiquidator.json';
import fuseFeeDistributorAbi from './abi/FuseFeeDistributor.json';
import fusePoolLensSecondaryAbi from './abi/FusePoolLensSecondary.json';

// Contracts
import Compound from './contracts/compound-protocol.min.json';
import openOracle from './contracts/open-oracle.min.json';
import Oracle from './contracts/oracles.min.json';

// InterestRate Models
import JumpRateModel from "./irm/JumpRateModel";
import JumpRateModelV2 from "./irm/JumpRateModelV2";
import DAIInterestRateModelV2 from "./irm/DAIInterestRateModelV2";
import WhitePaperInterestRateModel from "./irm/WhitePaperInterestRateModel";

import uniswapV3PoolAbiSlim from "./abi/UniswapV3Pool.slim.json";
import initializableClonesAbi from "./abi/InitializableClones.json";
import { Interface } from "@ethersproject/abi";

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
                undefined

                
type cERC20Conf = {
  delegateContractName?: any,
    underlying: string // underlying ERC20
    comptroller: string // Address of the comptroller
    interestRateModel: string // Address of the IRM
    initialExchangeRateMantissa: BigNumber // Initial exchange rate scaled by 1e18
    name: string // ERC20 name of this token
    symbol: string // ERC20 Symbol
    decimals: number // decimal precision
    admin: string // Address of the admin
}

type OracleConf = {
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
    defaultOracle?: any;
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
    constants: typeof constants
    contracts: {
        [key: string]: Contract
    }
    compoundContracts: MinifiedContracts
    openOracleContracts: MinifiedContracts
    oracleContracts: MinifiedContracts
    getEthUsdPriceBN
    identifyPriceOracle
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
    deployRewardsDistributor
    checkCardinality
    primeUniswapV3Oracle
    identifyInterestRateModelName

    static FUSE_POOL_DIRECTORY_CONTRACT_ADDRESS =
      "0x835482FE0532f169024d5E9410199369aAD5C77E";
    static FUSE_SAFE_LIQUIDATOR_CONTRACT_ADDRESS =
      "0xf0f3a1494ae00b5350535b7777abb2f499fc13d4";
    static FUSE_FEE_DISTRIBUTOR_CONTRACT_ADDRESS =
      "0xa731585ab05fC9f83555cf9Bff8F58ee94e18F85";
    static FUSE_POOL_LENS_CONTRACT_ADDRESS =
      "0x6Dc585Ad66A10214Ef0502492B0CC02F0e836eec";
    static FUSE_POOL_LENS_SECONDARY_CONTRACT_ADDRESS =
      "0xc76190E04012f26A364228Cfc41690429C44165d";

    static COMPTROLLER_IMPLEMENTATION_CONTRACT_ADDRESS =
      "0xe16db319d9da7ce40b666dd2e365a4b8b3c18217"; // v1.0.0: 0x94b2200d28932679def4a7d08596a229553a994e; v1.0.1 (with _unsupportMarket): 0x8A78A9D35c9C61F9E0Ff526C5d88eC28354543fE
    static CERC20_DELEGATE_CONTRACT_ADDRESS =
      "0x67db14e73c2dce786b5bbbfa4d010deab4bbfcf9"; // v1.0.0: 0x67e70eeb9dd170f7b4a9ef620720c9069d5e706c; v1.0.2 (for V2 yVaults): 0x2b3dd0ae288c13a730f6c422e2262a9d3da79ed1
    static CETHER_DELEGATE_CONTRACT_ADDRESS =
      "0xd77e28a1b9a9cfe1fc2eee70e391c05d25853cbf"; // v1.0.0: 0x60884c8faad1b30b1c76100da92b76ed3af849ba
    static REWARDS_DISTRIBUTOR_DELEGATE_CONTRACT_ADDRESS =
      "0x220f93183a69d1598e8405310cb361cff504146f";
    
    static MASTER_PRICE_ORACLE_IMPLEMENTATION_CONTRACT_ADDRESS =
      "0xb3c8ee7309be658c186f986388c2377da436d8fb";
    static INITIALIZABLE_CLONES_CONTRACT_ADDRESS =
      "0x91ce5566dc3170898c5aee4ae4dd314654b47415";

    static OPEN_ORACLE_PRICE_DATA_CONTRACT_ADDRESS =
      "0xc629c26dced4277419cde234012f8160a0278a79"; // UniswapAnchoredView NOT IN USE
    static COINBASE_PRO_REPORTER_ADDRESS =
      "0xfCEAdAFab14d46e20144F48824d0C09B1a03F2BC"; // UniswapAnchoredView NOT IN USE

    static PUBLIC_PRICE_ORACLE_CONTRACT_ADDRESSES = {
      ChainlinkPriceOracle: "0xe102421A85D9C0e71C0Ef1870DaC658EB43E1493",
      ChainlinkPriceOracleV2: "0xb0602af43Ca042550ca9DA3c33bA3aC375d20Df4",
      ChainlinkPriceOracleV3: "0x058c345D3240001088b6280e008F9e78b3B2112d",
      // PreferredPriceOracle: "", // TODO: Set correct mainnet address after deployment
      // UniswapAnchoredView: "", // NOT IN USE
      // UniswapView: "", // NOT IN USE
      // Keep3rPriceOracle_Uniswap: "0xb90de476d438b37a4a143bf729a9b2237e544af6", // NO LONGER IN USE
      // Keep3rPriceOracle_SushiSwap: "0x08d415f90ccfb971dfbfdd6266f9a7cb1c166fc0", // NO LONGER IN USE
      // Keep3rV2PriceOracle_Uniswap: "0xd6a8cac634e59c00a3d4163f839d068458e39869", // NO LONGER IN USE
      UniswapTwapPriceOracle_Uniswap:
        "0xCd8f1c72Ff98bFE3B307869dDf66f5124D57D3a9",
      UniswapTwapPriceOracle_SushiSwap:
        "0xfD4B4552c26CeBC54cD80B1BDABEE2AC3E7eB324",
      UniswapLpTokenPriceOracle: "0x50f42c004bd9b0e5acc65c33da133fbfbe86c7c0",
      UniswapV3TwapPriceOracle_Uniswap_3000:
        "0x80829b8A344741E28ae70374Be02Ec9d4b51CD89",
      UniswapV3TwapPriceOracle_Uniswap_10000:
        "0xF8731EB567c4C7693cF497849247668c91C9Ed36",
      UniswapV3TwapPriceOracleV2_Uniswap_500_USDC:
        "0x29490a6F5B4A999601378547Fe681d04d877D29b",
      UniswapV3TwapPriceOracleV2_Uniswap_3000_USDC:
        "0xf3a36BB3B627A5C8c36BA0714Fe035A401E86B78",
      UniswapV3TwapPriceOracleV2_Uniswap_10000_USDC:
        "0x3288a2d5f11FcBefbf77754e073cAD2C10325dE2",
      // RecursivePriceOracle: "", // TODO: Set correct mainnet address after deployment
      YVaultV1PriceOracle: "0xb04be6165cf1879310e48f8900ad8c647b9b5c5d", // NOT CURRENTLY IN USE
      YVaultV2PriceOracle: "0xb669d0319fb9de553e5c206e6fbebd58512b668b",
      // AlphaHomoraV1PriceOracle: "", // TODO: Set correct mainnet address after deployment
      // AlphaHomoraV2PriceOracle: "", // TODO: Set correct mainnet address after deployment
      // SynthetixPriceOracle: "", // TODO: Set correct mainnet address after deployment
      // BalancerLpTokenPriceOracle: "", // TODO: Set correct mainnet address after deployment
      MasterPriceOracle: "0x1887118E49e0F4A78Bd71B792a49dE03504A764D",
      CurveLpTokenPriceOracle: "0x43c534203339bbf15f62b8dde91e7d14195e7a60",
      CurveLiquidityGaugeV2PriceOracle:
        "0xd9eefdb09d75ca848433079ea72ef609a1c1ea21",
      FixedEthPriceOracle: "0xffc9ec4adbf75a537e4d233720f06f0df01fb7f5",
      FixedEurPriceOracle: "0x817158553F4391B0d53d242fC332f2eF82463e2a",
      WSTEthPriceOracle: "0xb11de4c003c80dc36a810254b433d727ac71c517",
      FixedTokenPriceOracle_OHM: "0x71FE48562B816D03Ce9e2bbD5aB28674A8807CC5",
      UniswapTwapPriceOracleV2_SushiSwap_DAI:
        "0x72fd4c801f5845ab672a12bce1b05bdba1fd851a", // v1.1.2
      UniswapTwapPriceOracleV2_SushiSwap_CRV:
        "0x552163f2a63f82bb47b686ffc665ddb3ceaca0ea", // v1.1.3
      UniswapTwapPriceOracleV2_SushiSwap_USDC:
        "0x9ee412a83a52f033d23a0b7e2e030382b3e53208", // v1.1.3
      UniswapTwapPriceOracleV2_Uniswap_FRAX:
        "0x6127e381756796fb978bc872556bf790f14cde98", // v1.1.3
      SushiBarPriceOracle: "0x290E0f31e96e13f9c0DB14fD328a3C2A94557245",
      BadgerPriceOracle: "0xd0C86943e594640c4598086a2359A0e70b80eF8D",
      HarvestPriceOracle: "0x8D364609cd2716172016838fF9FBC7fBcAC91792",
      StakedSdtPriceOracle: "0x5447c825ee330015418c1a0d840c4a1b5a7176cc",
      TokemakPoolTAssetPriceOracle: "0xd806782b31EC52FcB7f2a009d7D045bB732431Fb",
      MStablePriceOracle: "0xeb988f5492C86584f8D8f1B8662188D5A9BfE357",
    };

    static UNISWAP_TWAP_PRICE_ORACLE_ROOT_CONTRACT_ADDRESS =
      "0xa170dba2cd1f68cdd7567cf70184d5492d2e8138";
    static UNISWAP_TWAP_PRICE_ORACLE_V2_ROOT_CONTRACT_ADDRESS =
      "0xf1860b3714f0163838cf9ee3adc287507824ebdb";
    static UNISWAP_TWAP_PRICE_ORACLE_V2_FACTORY_CONTRACT_ADDRESS = ""; // TODO: Set correct mainnet address after deployment
    static UNISWAP_V3_TWAP_PRICE_ORACLE_V2_FACTORY_CONTRACT_ADDRESS =
      "0x8Eed20f31E7d434648fF51114446b3CfFD1FF9F1"; // TODO: Set correct mainnet address after deployment

    static DAI_POT = "0x197e90f9fad81970ba7976f33cbd77088e5d7cf7"; // DAIInterestRateModelV2 NOT IN USE
    static DAI_JUG = "0x19c0976f590d67707e62397c87829d896dc0f1f1"; // DAIInterestRateModelV2 NOT IN USE

    static UNISWAP_V2_FACTORY_ADDRESS =
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    static UNISWAP_V2_PAIR_INIT_CODE_HASH =
      "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";
    static SUSHISWAP_FACTORY_ADDRESS =
      "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac";
    static UNISWAP_V3_FACTORY_ADDRESS =
      "0x1f98431c8ad98523631ae4a59f267346ea31f984";
    static WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

    static PRICE_ORACLE_RUNTIME_BYTECODE_HASHES = {
      ChainlinkPriceOracle:
        "0x7a2a5633a99e8abb759f0b52e87875181704b8e29f6567d4a92f12c3f956d313",
      ChainlinkPriceOracleV2:
        "0x8d2bcaa1429031ae2b19a4516e5fdc68fb9346f158efb642fcf9590c09de2175",
      ChainlinkPriceOracleV3:
        "0x4b3bef9f57e381dc6b6e32bff270ce8a72d8aae541cb7c686b09555de3526d39",
      UniswapTwapPriceOracle_Uniswap:
        "0xa2537dcbd2b55b1a690db3b83fa1042f86b21ec3e1557f918bc3930b6bbb9244",
      UniswapTwapPriceOracle_SushiSwap:
        "0x9b11abfe7bfc1dcef0b1bc513959f1172cfe2cb595c5131b9cabc3b6448d89ac",
      UniswapV3TwapPriceOracle_Uniswap_3000:
        "0xb300f7f64110b952340e896d33f133482de6715f1b8b7e0acbd2416e0e6593c1",
      UniswapV3TwapPriceOracleV2_Uniswap_10000_USDC:
        "0xc301f891f1f905e68d1c5df5202cf0eec2ee8abcf3a510d5bd00d46f7dea01b4",
      UniswapV3TwapPriceOracleV2:
        "0xc844372c8856a5f9569721d3aca38c7804bae2ae4e296605e683aa8d1601e538", // v1.2.0
      YVaultV1PriceOracle:
        "0xd0dda181a4eb699a966b23edb883cff43377297439822b1b0f99b06af2002cc3",
      YVaultV2PriceOracle:
        "0x177c22cc7d05280cea84a36782303d17246783be7b8c0b6f9731bb9002ffcc68",
      MasterPriceOracleV1: // fuse-contracts@v1.0.0
        "0xfa1349af05af40ffb5e66605a209dbbdc8355ba7dda76b2be10bafdf5ffd1dc6",
      MasterPriceOracleV2: // fuse-contracts@v1.2.0
        "0xdfa5aa37efea3b16d143a12c4ae7006f3e29768b3e375b59842c7ecd3809f1d1",
      MasterPriceOracleV3: // fuse-contracts@v1.2.1
        "0xe4199a03b164ca492d19d655b85fdf8cc14cf2da6ddedd236712552b7676b03d",
      CurveLpTokenPriceOracle:
        "0x6742ae836b1f7df0cfd9b858c89d89da3ee814c28c5ee9709a371bcf9dfd2145",
      CurveLiquidityGaugeV2PriceOracle:
        "0xfcf0d93de474152898668c4ebd963e0237bfc46c3d5f0ce51b7045b60c831734",
      FixedEthPriceOracle:
        "0xcb669c93632a1c991adced5f4d97202aa219fab3d5d86ebd28f4f62ad7aa6cb3",
      FixedEurPriceOracle:
        "0x678dbe9f2399a44e89edc934dc17f6d4ee7004d9cbcee83c0fa0ef43de924b84",
      WSTEthPriceOracle:
        "0x11daa8dfb8957304aa7d926ce6876c523c7567b4052962e65e7d6a324ddcb4cc",
      FixedTokenPriceOracle_OHM:
        "0x136d369f53594c2f10e3ff3f14eaaf0bada4a63964f3cfeda3923e3531e407dc",
      UniswapTwapPriceOracleV2_SushiSwap_DAI:
        "0xb4d279232ab52a2fcaee6dc47db486a733c24a499ade9d7de1b0d417d4730817",
      SushiBarPriceOracle:
        "0x3736e8b6c11fcd413c0b60c3291a3a2e2ebe496a2780f3c45790a123f5ee9705",
    };

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
      "SushiBarPriceOracle",
    ];

    static PUBLIC_INTEREST_RATE_MODEL_CONTRACT_ADDRESSES = {
      JumpRateModel_Compound_Stables:
        "0x640dce7c7c6349e254b20eccfa2bb902b354c317",
      JumpRateModel_Compound_UNI: "0xc35DB333EF7ce4F246DE9DE11Cc1929d6AA11672",
      JumpRateModel_Cream_Stables_Majors:
        "0xb579d2761470bba14018959d6dffcc681c09c04b",
      JumpRateModel_Cream_Gov_Seeds: "0xcdC0a449E011249482824efFcfA05c883d36CfC7",

      WhitePaperInterestRateModel_Compound_ETH:
        "0x14ee0270C80bEd60bDC117d4F218DeE0A4909F28",
      WhitePaperInterestRateModel_Compound_WBTC:
        "0x7ecAf96C79c2B263AFe4f486eC9a74F8e563E0a6",

      JumpRateModel_Fei_FEI: "0x8f47be5692180079931e2f983db6996647aba0a5",
      JumpRateModel_Fei_TRIBE: "0x075538650a9c69ac8019507a7dd1bd879b12c1d7",
      JumpRateModel_Fei_ETH: "0xbab47e4b692195bf064923178a90ef999a15f819",
      JumpRateModel_Fei_DAI: "0xede47399e2aa8f076d40dc52896331cba8bd40f7",
      JumpRateModel_Olympus_Majors: "0xe1d35fae219e4d74fe11cb4246990784a4fe6680",

      Custom_JumpRateModel: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      Custom_JumpRateModel1: "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
    };

    static COMPTROLLER_ERROR_CODES = [
      "NO_ERROR",
      "UNAUTHORIZED",
      "COMPTROLLER_MISMATCH",
      "INSUFFICIENT_SHORTFALL",
      "INSUFFICIENT_LIQUIDITY",
      "INVALID_CLOSE_FACTOR",
      "INVALID_COLLATERAL_FACTOR",
      "INVALID_LIQUIDATION_INCENTIVE",
      "MARKET_NOT_ENTERED", // no longer possible
      "MARKET_NOT_LISTED",
      "MARKET_ALREADY_LISTED",
      "MATH_ERROR",
      "NONZERO_BORROW_BALANCE",
      "PRICE_ERROR",
      "REJECTION",
      "SNAPSHOT_ERROR",
      "TOO_MANY_ASSETS",
      "TOO_MUCH_REPAY",
      "SUPPLIER_NOT_WHITELISTED",
      "BORROW_BELOW_MIN",
      "SUPPLY_ABOVE_MAX",
      "NONZERO_TOTAL_SUPPLY",
    ];

    static CTOKEN_ERROR_CODES = [
      "NO_ERROR",
      "UNAUTHORIZED",
      "BAD_INPUT",
      "COMPTROLLER_REJECTION",
      "COMPTROLLER_CALCULATION_ERROR",
      "INTEREST_RATE_MODEL_ERROR",
      "INVALID_ACCOUNT_PAIR",
      "INVALID_CLOSE_AMOUNT_REQUESTED",
      "INVALID_COLLATERAL_FACTOR",
      "MATH_ERROR",
      "MARKET_NOT_FRESH",
      "MARKET_NOT_LISTED",
      "TOKEN_INSUFFICIENT_ALLOWANCE",
      "TOKEN_INSUFFICIENT_BALANCE",
      "TOKEN_INSUFFICIENT_CASH",
      "TOKEN_TRANSFER_IN_FAILED",
      "TOKEN_TRANSFER_OUT_FAILED",
      "UTILIZATION_ABOVE_MAX",
    ];

    constructor(web3Provider: JsonRpcProvider | Web3Provider) {
        this.provider = web3Provider
        this.constants = constants
        this.compoundContracts = Compound.contracts;
        this.openOracleContracts = openOracle.contracts;
        this.oracleContracts = Oracle.contracts;
        this.contracts = {
            FusePoolDirectory: new Contract(Fuse.FUSE_POOL_DIRECTORY_CONTRACT_ADDRESS, fusePoolDirectoryAbi, this.provider),
            FusePoolLens: new Contract(Fuse.FUSE_POOL_LENS_CONTRACT_ADDRESS, fusePoolLensAbi, this.provider),
            FusePoolLensSecondary: new Contract(Fuse.FUSE_POOL_LENS_SECONDARY_CONTRACT_ADDRESS, fusePoolLensSecondaryAbi, this.provider),
            FuseSafeLiquidator: new Contract(Fuse.FUSE_SAFE_LIQUIDATOR_CONTRACT_ADDRESS, fuseSafeLiquidatorAbi, this.provider),
            FuseFeeDistributor: new Contract(Fuse.FUSE_FEE_DISTRIBUTOR_CONTRACT_ADDRESS, fuseFeeDistributorAbi, this.provider)
        }

        this.getEthUsdPriceBN = async function () {
            // Returns a USD price. Which means its a floating point of at least 2 decimal numbers.
            const UsdPrice: number = (await axios.get("https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=ethereum")).data.ethereum.usd

            // Now we turn it into a big number
            const usdPriceBN = utils.parseUnits(UsdPrice.toString(), 18)
            
            // To parse this back into USD usdPriceBN.div(constants.WeiPerEther).toString()
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
            closeFactor: BigNumber,
            maxAssets: number,
            liquidationIncentive: BigNumber,
            priceOracle: string, // Contract address
            priceOracleConf: any,
            options: any, // We might need to add sender as argument. Getting address from options will colide with the override arguments in ethers contract method calls. It doesnt take address.
            whitelist: string[] // An array of whitelisted addresses
          ) {

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
                        const comptrollerContract = new ContractFactory( JSON.parse(this.compoundContracts["contracts/Comptroller.sol:Comptroller"].abi), this.contracts["contracts/Comptroller.sol:Comptroller"].bin, this.provider.getSigner());
                        const deployedComptroller = await comptrollerContract.deploy({...options})
                        implementationAddress = deployedComptroller.options.address;
                    }

                    //3. Register new pool with FusePoolDirectory
                    let receipt
                    try {

                        const contract  = this.contracts.FusePoolDirectory.connect(this.provider.getSigner()) 
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
                    const saltsHash = utils.solidityKeccak256(["address", "string", "uint"], [options.from, poolName, receipt.deployTransaction.blockNumber])
                    const byteCodeHash = utils.keccak256("0x" + this.contracts["contracts/Unitroller.sol:Unitroller"].bin)

                    let poolAddress = utils.getCreate2Address(
                        Fuse.FUSE_POOL_DIRECTORY_CONTRACT_ADDRESS,
                        saltsHash,
                        byteCodeHash
                    );

                    let unitroller = new Contract(
                      poolAddress,
                      JSON.parse(this.contracts["contracts/Unitroller.sol:Unitroller"].abi),
                        this.provider
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
                            JSON.parse(this.compoundContracts["contracts/Comptroller.sol:Comptroller"].abi),
                            this.provider
                        );

                        // Already enforced so now we just need to add the addresses
                        await comptroller._setWhitelistStatuses(whitelist, Array(whitelist.length).fill(true))
                    }

                    return [poolAddress, implementationAddress, priceOracle];
        };

        this.deployPriceOracle = async function (
            model: string, // TODO: find a way to use this.ORACLES 
            conf: OracleConf, // This conf depends on which comptroller model we're deploying
            options: any
        )  {

                let deployArgs: any[] = [];

                let priceOracleContract: any;
                let deployedPriceOracle: any;
                let oracleFactoryContract: any | Contract;

                if (!model) model = "ChainlinkPriceOracle";
                if (!conf) conf = {};

                switch (model) {
                    case "ChainlinkPriceOracle":
                        deployArgs = [
                                        conf.maxSecondsBeforePriceIsStale
                                                ? conf.maxSecondsBeforePriceIsStale
                                                : 0,
                                    ]
                        priceOracleContract = new ContractFactory(
                          this.oracleContracts["ChainlinkPriceOracle"].abi, 
                          this.oracleContracts["ChainlinkPriceOracle"].bin, 
                          this.provider.getSigner() 
                        );
                        deployedPriceOracle = await priceOracleContract.deploy(
                          deployArgs, {...options}
                        );
                        break;
                    case "UniswapLpTokenPriceOracle":
                        deployArgs = [conf.useRootOracle ? true : false];
                        priceOracleContract = new ContractFactory(
                          this.oracleContracts["UniswapLpTokenPriceOracle"].abi, 
                          this.oracleContracts["UniswapLpTokenPriceOracle"].bin, 
                          this.provider.getSigner()
                        )
                        deployedPriceOracle = priceOracleContract.deploy(deployArgs, {...options}) 
                        break;
                    case "UniswapTwapPriceOracle": // Uniswap V2 TWAPs
                        // Input Validation
                        if (!conf.uniswapV2Factory)
                            conf.uniswapV2Factory = Fuse.UNISWAP_V2_FACTORY_ADDRESS;
                        
                        
                        deployArgs = [
                              Fuse.UNISWAP_TWAP_PRICE_ORACLE_ROOT_CONTRACT_ADDRESS,
                              conf.uniswapV2Factory,
                            ]; // Default to official Uniswap V2 factory

                        // Deploy Oracle
                        priceOracleContract = new ContractFactory(
                          this.oracleContracts["UniswapTwapPriceOracle"].abi, 
                          this.oracleContracts["UniswapTwapPriceOracle"].bin, 
                          this.provider.getSigner()
                        )
                        deployedPriceOracle = await priceOracleContract.deploy(
                          deployArgs, 
                          {options}
                        )
                        break;
                    case "UniswapTwapPriceOracleV2": // Uniswap V2 TWAPs
                        // Input validation
                        if (!conf.uniswapV2Factory)
                          conf.uniswapV2Factory = Fuse.UNISWAP_V2_FACTORY_ADDRESS;

                        // Check for existing oracle
                        oracleFactoryContract = new Contract(
                          Fuse.UNISWAP_TWAP_PRICE_ORACLE_V2_FACTORY_CONTRACT_ADDRESS,
                          this.oracleContracts.UniswapTwapPriceOracleV2Factory.abi,
                          this.provider.getSigner()
                        );
                        deployedPriceOracle = await oracleFactoryContract
                          .oracles(Fuse.UNISWAP_V2_FACTORY_ADDRESS, conf.baseToken)

                        // Deploy if oracle does not exist
                        if (deployedPriceOracle === "0x0000000000000000000000000000000000000000") {
                          await oracleFactoryContract
                            .deploy(Fuse.UNISWAP_V2_FACTORY_ADDRESS, conf.baseToken)
                          deployedPriceOracle = await oracleFactoryContract
                            .oracles(Fuse.UNISWAP_V2_FACTORY_ADDRESS, conf.baseToken)
                        }
                        break;                  
                    case "ChainlinkPriceOracleV2":
                        priceOracleContract = new ContractFactory(
                          this.oracleContracts["ChainlinkPriceOracleV2"].abi, 
                          this.oracleContracts["ChainlinkPriceOracleV2"].bin, 
                          this.provider.getSigner() 
                        );
                        deployArgs = [
                                    conf.admin 
                                        ? conf.admin 
                                        : options.from,
                                    conf.canAdminOverwrite 
                                        ? true 
                                        : false,
                                    ];
                        deployedPriceOracle = await priceOracleContract.deploy(
                          deployArgs, {...options}
                        )
                        break;
                    case "UniswapV3TwapPriceOracle":
                      // Input validation
                        if (!conf.uniswapV3Factory)
                        conf.uniswapV3Factory = Fuse.UNISWAP_V3_FACTORY_ADDRESS;
                        if ([500, 3000, 10000].indexOf(parseInt(conf.feeTier)) < 0) 
                          throw Error (
                            "Invalid fee tier passed to UniswapV3TwapPriceOracle deployment."
                          );

                        // Deploy oracle

                        deployArgs = [conf.uniswapV3Factory, conf.feeTier]; // Default to official Uniswap V3 factory

                        priceOracleContract = new ContractFactory( 
                          this.oracleContracts["UniswapV3TwapPriceOracle"].abi, 
                          this.oracleContracts["UniswapV3TwapPriceOracle"].bin, 
                          this.provider.getSigner()
                        );

                        deployedPriceOracle = await priceOracleContract.deploy(
                          deployArgs, {...options}
                        )
                        break;
                    case "UniswapV3TwapPriceOracleV2":
                        // Input validation
                        if (!conf.uniswapV3Factory)
                          conf.uniswapV3Factory = Fuse.UNISWAP_V3_FACTORY_ADDRESS;
                        if ([500, 3000, 10000].indexOf(parseInt(conf.feeTier)) < 0) 
                          throw Error (
                            "Invalid fee tier passed to UniswapV3TwapPriceOracleV2 deployment."
                          );
                        // Check for existing oracle
                        oracleFactoryContract = new Contract(
                          Fuse.UNISWAP_V3_TWAP_PRICE_ORACLE_V2_FACTORY_CONTRACT_ADDRESS,
                          this.oracleContracts.UniswapV3TwapPriceOracleV2Factory.abi,
                          this.provider.getSigner()
                        );

                        deployedPriceOracle = await oracleFactoryContract.methods
                          .oracles(conf.uniswapV3Factory, conf.feeTier, conf.baseToken)
                          .call();

                        // Deploy if oracle does not exist
                        if (deployedPriceOracle == "0x0000000000000000000000000000000000000000") {
                          await oracleFactoryContract
                            .deploy(conf.uniswapV3Factory, conf.feeTier, conf.baseToken)
                          deployedPriceOracle = await oracleFactoryContract
                            .oracles(conf.uniswapV3Factory, conf.feeTier, conf.baseToken)
                        }

                        break;
                    case "FixedTokenPriceOracle":
                        priceOracleContract = new ContractFactory(
                          this.oracleContracts["FixedTokenPriceOracle"].abi, 
                          this.oracleContracts["FixedTokenPriceOracle"].bin, 
                          this.provider.getSigner()
                        );
                        deployArgs = [ conf.baseToken];
                        deployedPriceOracle = await priceOracleContract.deploy(
                          deployArgs, {...options}
                        );
                        break;
                    case "MasterPriceOracle":
                      var initializableClones = new Contract(
                        Fuse.INITIALIZABLE_CLONES_CONTRACT_ADDRESS,
                        initializableClonesAbi,
                        this.provider.getSigner()
                      );
                      var masterPriceOracle = new Interface(
                        Oracle["MasterPriceOracle"].abi
                      );
                      deployArgs = [
                        conf.underlyings ? conf.underlyings : [],
                        conf.oracles ? conf.oracles : [],
                        conf.defaultOracle ? conf.defaultOracle : "0x0000000000000000000000000000000000000000",
                        conf.admin ? conf.admin : options.from,
                        conf.canAdminOverwrite ? true : false,
                      ];
                      var initializerData = masterPriceOracle.encodeDeploy(deployArgs)
                      var receipt = await initializableClones.clone(Fuse.MASTER_PRICE_ORACLE_IMPLEMENTATION_CONTRACT_ADDRESS, initializerData)
                      deployedPriceOracle = new Contract(
                        Oracle["MasterPriceOracle"].abi,
                        receipt.events["Deployed"].returnValues.instance
                      );
                      break;
                    case "SimplePriceOracle":
                        priceOracleContract = new ContractFactory(
                            JSON.parse( this.contracts["contracts/SimplePriceOracle.sol:SimplePriceOracle"].abi ),
                            this.contracts["contracts/SimplePriceOracle.sol:SimplePriceOracle"].bin,
                            this.provider.getSigner()
                        );
                        deployedPriceOracle = await priceOracleContract.deploy({...options})
                        break;
                    default:
                        priceOracleContract = new ContractFactory(this.oracleContracts[model].abi, this.oracleContracts[model].bin, this.provider.getSigner() );
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

            let deployedComptroller
            // 1. Deploy comptroller if necessary
            if (!implementationAddress) {
              const comptrollerContract = new Contract( 
                  JSON.parse(
                      this.compoundContracts["contracts/Comptroller.sol:Comptroller"].abi),
                      this.compoundContracts["contracts/Comptroller.sol:Comptroller"].bin,
                      this.provider.getSigner()
              );
              deployedComptroller = await comptrollerContract.deploy(...options);
              implementationAddress = deployedComptroller.options.address;
            }
      
            // 2. Get Unitroller to set the comptroller implementation address for the pool
            const unitrollerContract = new ContractFactory(
              JSON.parse(this.compoundContracts["contracts/Unitroller.sol:Unitroller"].abi),
              this.compoundContracts["contracts/Unitroller.sol:Unitroller"].bin,
              this.provider.getSigner()
            );

            const deployedUnitroller = await unitrollerContract.deploy({...options})
            await deployedUnitroller
              ._setPendingImplementation(deployedComptroller.options.address, {...options})

            // Comptroller becomes unitroller. 
            await deployedComptroller
              ._become(deployedUnitroller.address, {...options}) 
      
            deployedComptroller.address = deployedUnitroller.address;

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

            // Deploy new interest rate model via SDK if requested
            if (
              [
                "WhitePaperInterestRateModel",
                "JumpRateModel",
                "JumpRateModelV2",
                "ReactiveJumpRateModelV2",
                "DAIInterestRateModelV2"
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
              var [assetAddress, implementationAddress, receipt] = await this.deployCToken(
                conf,
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
      
            return [
              assetAddress, 
              implementationAddress, 
              conf.interestRateModel,
              receipt
          ];
        };

        this.deployInterestRateModel = async function (
            model: string, 
            conf: interestRateModelConf, 
            options: any
        ) {

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
              this.provider.getSigner()
            );
            
            const deployedInterestRateModel = await interestRateModelContract.deploy(deployArgs, {...options})
            return deployedInterestRateModel.options.address;
        };

        this.deployCToken = async function (
              conf: any,
              collateralFactor: any, 
              reserveFactor: number,
              adminFee: number,
              options: any,
              bypassPriceFeedCheck: boolean
            ) {

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
            // Deploy CEtherDelegate implementation contract if necessary
            if (!implementationAddress) {
              const cEtherDelegateFactory = new ContractFactory(
                JSON.parse(
                  this.compoundContracts["contracts/CEtherDelegate.sol:CEtherDelegate"].abi
                ),
                  this.compoundContracts["contracts/CEtherDelegate.sol:CEtherDelegate"].bin,
                  this.provider.getSigner()
                )
              
              const cEtherDelegateDeployed = await cEtherDelegateFactory
                .deploy();
              implementationAddress = cEtherDelegateDeployed.address;
            }

            // Deploy CEtherDelegator proxy contract
            let deployArgs = [
              conf.comptroller,
              conf.interestRateModel,
              conf.name,
              conf.symbol,
              implementationAddress,
              "0x00",
              reserveFactor ? reserveFactor.toString() : 0,
              adminFee ? adminFee.toString() : 0,
            ];

            const abiCoder = new utils.AbiCoder
            var constructorData = abiCoder.encode(
              [
                "address",
                "address",
                "string",
                "string",
                "address",
                "bytes",
                "uint256",
                "uint256",
              ],
              deployArgs
            );
            var comptroller = new Contract(
              conf.comptroller,
              JSON.parse(this.compoundContracts["contracts/Comptroller.sol:Comptroller"].abi),
              this.provider.getSigner()
            );
            var errorCode = await comptroller
              ._deployMarket(
                "0x0000000000000000000000000000000000000000",
                constructorData,
                collateralFactor
              )
          if (errorCode != constants.Zero)
            throw (
              "Failed to deploy market with error code: " +
              Fuse.COMPTROLLER_ERROR_CODES[errorCode]
            );
          const receipt = await comptroller
            ._deployMarket(
              "0x0000000000000000000000000000000000000000",
              constructorData,
              collateralFactor
            )

          const saltsHash = utils.solidityKeccak256(
            ["address", "address", "uint"],
            [
              conf.comptroller,
              "0x0000000000000000000000000000000000000000",
              receipt.blockNumber
            ]
          )

          const byteCodeHash = utils.keccak256(
            "0x" + this.compoundContracts["contracts/CEtherDelegator.sol:CEtherDelegator"].bin
          )

          const cEtherDelegatorAddress = utils.getCreate2Address(
            Fuse.FUSE_FEE_DISTRIBUTOR_CONTRACT_ADDRESS,
            saltsHash,
            byteCodeHash
          );

          // Return cToken proxy and implementation contract addresses
          return [cEtherDelegatorAddress, implementationAddress, receipt];
              };

        this.deployCErc20 = async function (
              conf: cERC20Conf,
              collateralFactor: number,
              reserveFactor: number,
              adminFee: number,
              options: any,
              bypassPriceFeedCheck: boolean,
              implementationAddress?: string // cERC20Delegate implementation
            ) {
              // Get Comptroller
        var comptroller = new Contract(
          conf.comptroller,
          JSON.parse(this.compoundContracts["contracts/Comptroller.sol:Comptroller"].abi)
        );

        // Check for price feed assuming !bypassPriceFeedCheck
        if (!bypassPriceFeedCheck)
          await this.checkForCErc20PriceFeed(comptroller, conf);

        // Deploy CErc20Delegate implementation contract if necessary
        if (!implementationAddress) {
          if (!conf.delegateContractName)
            conf.delegateContractName = "CErc20Delegate";
          const cErc20Delegate = new ContractFactory(
            JSON.parse(
              this.compoundContracts[
                "contracts/" +
                  conf.delegateContractName +
                  ".sol:" +
                  conf.delegateContractName
              ].abi
            ),
              this.compoundContracts[
                "contracts/" +
                  conf.delegateContractName +
                  ".sol:" +
                  conf.delegateContractName
              ].bin,
              this.provider.getSigner()
            
          );
          const cErc20DelegateDeployed = await cErc20Delegate.deploy()
          implementationAddress = cErc20DelegateDeployed.address;
        }

        let deployArgs = [
          conf.underlying,
          conf.comptroller,
          conf.interestRateModel,
          conf.name,
          conf.symbol,
          implementationAddress,
          "0x00",
          reserveFactor ? reserveFactor.toString() : 0,
          adminFee ? adminFee.toString() : 0,
        ];

        const abiCoder = new utils.AbiCoder
        const constructorData = abiCoder.encode(
          [
            "address",
            "address",
            "address",
            "string",
            "string",
            "address",
            "bytes",
            "uint256",
            "uint256",
          ],
          deployArgs
        );
        const errorCode = await comptroller
          ._deployMarket(false, constructorData, collateralFactor)
        if (errorCode != constants.Zero)
          throw (
            "Failed to deploy market with error code: " +
            Fuse.COMPTROLLER_ERROR_CODES[errorCode]
          );

        const receipt = await comptroller
          ._deployMarket(false, constructorData, collateralFactor)
        
        const saltsHash = utils.solidityKeccak256(["address", "address", "uint"], [conf.comptroller, conf.underlying, receipt.blockNumber])
        const byteCodeHash = utils.keccak256("0x" + this.compoundContracts["contracts/Unitroller.sol:Unitroller"])
        
        const cErc20DelegatorAddress = utils.getCreate2Address(
          Fuse.FUSE_FEE_DISTRIBUTOR_CONTRACT_ADDRESS,
          saltsHash,
          byteCodeHash
        );

        // Return cToken proxy and implementation contract addresses
        return [cErc20DelegatorAddress, implementationAddress, receipt];
          };
        
        this.identifyPriceOracle = async function (priceOracleAddress: string) {
          // Get PriceOracle type from runtime bytecode hash
          const runtimeBytecodeHash = utils.keccak256(
            await this.provider.getCode(priceOracleAddress)
          )
    
          for (const oracleContractName of Object.keys(
            Fuse.PRICE_ORACLE_RUNTIME_BYTECODE_HASHES
          )) {
            const valueOrArr =
              Fuse.PRICE_ORACLE_RUNTIME_BYTECODE_HASHES[oracleContractName];
    
            if (Array.isArray(valueOrArr)) {
              for (const potentialHash of valueOrArr)
              if (runtimeBytecodeHash == potentialHash) return oracleContractName;
            } else {
              if (runtimeBytecodeHash == valueOrArr) return oracleContractName;
            }
          }
    
          return null;
        };

        this.identifyInterestRateModel = async function (interestRateModelAddress: string): Promise<any> {
            // Get interest rate model type from runtime bytecode hash and init class
            const interestRateModels: { [key:string]: any}  = {
              "JumpRateModel": JumpRateModel,
              "JumpRateModelV2": JumpRateModelV2,
              "DAIInterestRateModelV2": DAIInterestRateModelV2,
              "WhitePaperInterestRateModel": WhitePaperInterestRateModel,
            };
            const runtimeBytecodeHash = utils.keccak256( await this.provider.getCode(interestRateModelAddress) );
            // Find ONE interes ratemodel and return thath
            // compare runtimeByrecodeHash with
            // 

            let irm
            outerLoop:

            for (const model of Object.keys(interestRateModels)) {
              if ( interestRateModels[model].RUNTIME_BYTECODE_HASHES !== undefined) {
                for (const hash of interestRateModels[model].RUNTIME_BYTECODE_HASHES) {
                  if (runtimeBytecodeHash === hash) {
                    irm = new interestRateModels[model]()
                    console.log(irm)
                    break outerLoop;
                  }
                }
              } else if (runtimeBytecodeHash === interestRateModels[model].RUNTIME_BYTECODE_HASH) {
                irm = new interestRateModels[model]();
                break;
              }
            }

            console.log(irm, "WHY")
            return irm
        };

        this.getInterestRateModel = async function (assetAddress: string): Promise<any | undefined> {
            // Get interest rate model address from asset address
            const assetContract = new Contract(
              assetAddress,
              JSON.parse(this.compoundContracts["contracts/CTokenInterfaces.sol:CTokenInterface"].abi),
              this.provider
            );
            const interestRateModelAddress: string = await assetContract.callStatic.interestRateModel()
      
            const interestRateModel = await this.identifyInterestRateModel(interestRateModelAddress);
                
            await interestRateModel.init(
                    interestRateModelAddress,
                    assetAddress,
                    this.provider
                ); 
            return interestRateModel
        };

        this.checkForCErc20PriceFeed = async function (
            comptroller: Contract, 
            conf: {
                underlying: string // Address of the underlying ERC20 Token
            },
            options: any
        ) {


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
              priceOracle,
              this.oracleContracts["ChainlinkPriceOracle"].abi,
              this.provider
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
                priceOracle,
                this.oracleContracts["PreferredPriceOracle"].abi,
                this.provider
              );
      
              try {
                // Get the underlying ChainlinkOracle address of the PreferredPriceOracle
                const chainlinkPriceOracleAddress = await preferredPriceOracle.chainlinkOracle()

                // Initiate ChainlinkOracle 
                chainlinkPriceOracle = new Contract(
                  chainlinkPriceOracleAddress,
                  this.oracleContracts["ChainlinkPriceOracle"].abi,
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
                  priceOracle,
                  JSON.parse(this.openOracleContracts["contracts/Uniswap/UniswapAnchoredView.sol:UniswapAnchoredView"].abi),
                    this.provider
                );
                await uniswapOrUniswapAnchoredViewContract.IS_UNISWAP_ANCHORED_VIEW()
                isUniswapAnchoredView = true;
              } catch {
                try {
                    uniswapOrUniswapAnchoredViewContract = new Contract(
                      priceOracle,
                      JSON.parse(this.openOracleContracts["contracts/Uniswap/UniswapView.sol:UniswapView"].abi),
                    this.provider
                  );
                  await uniswapOrUniswapAnchoredViewContract.IS_UNISWAP_VIEW();
                } catch {
                  // Check for PreferredPriceOracle's secondary oracle.
                  const preferredPriceOracle = new Contract(
                    priceOracle,
                    this.oracleContracts["PreferredPriceOracle"].abi,
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
                      uniswapOrUniswapAnchoredViewAddress,
                      JSON.parse(this.openOracleContracts["contracts/Uniswap/UniswapAnchoredView.sol:UniswapAnchoredView"].abi),
                      this.provider
                    );
                    await uniswapOrUniswapAnchoredViewContract.IS_UNISWAP_ANCHORED_VIEW()
                    isUniswapAnchoredView = true;
                  } catch {
                    try {
                      uniswapOrUniswapAnchoredViewContract = new Contract(
                        uniswapOrUniswapAnchoredViewAddress,
                        JSON.parse(this.openOracleContracts["contracts/Uniswap/UniswapView.sol:UniswapView"].abi),
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
                  conf.underlying,
                  JSON.parse(this.compoundContracts["contracts/EIP20Interface.sol:EIP20Interface"].abi),
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
                        await uniswapOrUniswapAnchoredViewContract.priceData(),
                        JSON.parse(self.openOracleContracts["contracts/OpenOraclePriceData.sol:OpenOraclePriceData"].abi),
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
        
        this.deployRewardsDistributor = async function (rewardToken, options) {
          const distributor = new ContractFactory(
            JSON.parse(
              this.compoundContracts[
                "contracts/RewardsDistributorDelegator.sol:RewardsDistributorDelegator"
              ].abi
            ),
            this.compoundContracts[
              "contracts/RewardsDistributorDelegator.sol:RewardsDistributorDelegator"
            ].bin,
            this.provider.getSigner()

          );
          console.log({ options, rewardToken });
    
          const deployedDistributor = await distributor
            .deploy({
              arguments: [
                options.from,
                rewardToken,
                Fuse.REWARDS_DISTRIBUTOR_DELEGATE_CONTRACT_ADDRESS,
              ],
            })
          // const rdAddress = distributor.options.address;
          return deployedDistributor;
        };
      
        this.checkCardinality = async function (uniswapV3Pool: string) {
          var uniswapV3PoolContract = new Contract(
            uniswapV3Pool,
            uniswapV3PoolAbiSlim
          );
          const shouldPrime =
            (await uniswapV3PoolContract.methods.slot0().call())
              .observationCardinalityNext < 64;
          return shouldPrime;
        };
      
        this.primeUniswapV3Oracle = async function (uniswapV3Pool, options) {
          var uniswapV3PoolContract = new Contract(
            uniswapV3Pool,
            uniswapV3PoolAbiSlim
          );
          await uniswapV3PoolContract.methods
            .increaseObservationCardinalityNext(64)
            .send(options);
        };
      
        this.identifyInterestRateModelName = (irmAddress) => {
          let name = "";
    
          Object.entries(
            Fuse.PUBLIC_INTEREST_RATE_MODEL_CONTRACT_ADDRESSES
          ).forEach(([key, value]) => {
            if (value === irmAddress) {
              name = key;
            }
          });
          return name;
        };
    }
}