import { ChainID } from "../utils/networks";

export enum ContractVersion {
  "1.0.0",
  "1.0.1",
  "1.0.2",
  "1.0.3",
  "1.0.4",
  "1.0.5",
  "1.1.0",
  "1.1.1",
  "1.1.2",
  "1.1.3",
  "1.1.4",
  "1.1.5",
  "1.1.6",
  "1.2.0",
  "1.2.1",
  "1.2.2",
}
export interface Oracle {
  address: string;
  bytecodeHash: string;
  deployable: boolean;
  oldVersions: {
    // Todo - coerce this to be type ContractVersion
    [version: string]: Pick<Oracle, "address" | "bytecodeHash">;
  };
}
export interface Oracles {
  [oracleName: string]: Oracle;
}

export interface FuseAddresses {
  // Fundamentals   (every chain)
  FUSE_POOL_DIRECTORY_CONTRACT_ADDRESS: string;
  FUSE_SAFE_LIQUIDATOR_CONTRACT_ADDRESS: string;
  FUSE_FEE_DISTRIBUTOR_CONTRACT_ADDRESS: string;
  FUSE_POOL_LENS_CONTRACT_ADDRESS: string;
  FUSE_POOL_LENS_SECONDARY_CONTRACT_ADDRESS: string;

  // CEther and CERC20 (Compound Contract Impls.)
  COMPTROLLER_IMPLEMENTATION_CONTRACT_ADDRESS: string; // (every chain)
  CERC20_DELEGATE_CONTRACT_ADDRESS: string; // (every chain)

  CETHER_DELEGATE_CONTRACT_ADDRESS: string; // (ETH, Arbitrum, Optimism)

  // Oracles

  // Immutable MasterPrice Oracle implementation. Each Pool deploys a proxy to this contract
  // (every chain)
  MASTER_PRICE_ORACLE_IMPLEMENTATION_CONTRACT_ADDRESS: string;

  // Deploys the MPO Proxy in pool creation
  // (every chain)
  INITIALIZABLE_CLONES_CONTRACT_ADDRESS: string;

  PUBLIC_PRICE_ORACLE_CONTRACT_ADDRESSES: {
    [oracleName: string]: string;
  };

  PRICE_ORACLE_RUNTIME_BYTECODE_HASHES: {
    [oracleName: string]: string;
  };

  ORACLES: string[];
  oracles: Oracles;

  // // UNI-V2 Oracles
  UNISWAP_V2_FACTORY_ADDRESS: string;
  UNISWAP_V2_PAIR_INIT_CODE_HASH: string;

  UNISWAP_TWAP_PRICE_ORACLE_ROOT_CONTRACT_ADDRESS: string;
  UNISWAP_TWAP_PRICE_ORACLE_V2_ROOT_CONTRACT_ADDRESS: string;
  UNISWAP_TWAP_PRICE_ORACLE_V2_FACTORY_CONTRACT_ADDRESS: string; // TODO: Set correct mainnet address after deployment

  // // UNI-V3 Oracles
  UNISWAP_V3_FACTORY_ADDRESS: string;
  UNISWAP_V3_TWAP_PRICE_ORACLE_V2_FACTORY_CONTRACT_ADDRESS: string;

  // IRM
  PUBLIC_INTEREST_RATE_MODEL_CONTRACT_ADDRESSES: {
    [oracleName: string]: string;
  };

  // Tokens / ETC
  WETH_ADDRESS: string;
  REWARDS_DISTRIBUTOR_DELEGATE_CONTRACT_ADDRESS: string;

  // Legacy (Todo: Deprecate)
  OPEN_ORACLE_PRICE_DATA_CONTRACT_ADDRESS?: string;
  COINBASE_PRO_REPORTER_ADDRESS?: string;
  DAI_POT?: string;
  DAI_JUG?: string;
}

const addresses: {
  [chainId: number]: FuseAddresses;
} = {
  [ChainID.ETHEREUM]: {
    // Fundamentals
    FUSE_POOL_DIRECTORY_CONTRACT_ADDRESS:
      "0x835482FE0532f169024d5E9410199369aAD5C77E",
    FUSE_SAFE_LIQUIDATOR_CONTRACT_ADDRESS:
      "0xf0f3a1494ae00b5350535b7777abb2f499fc13d4",
    FUSE_FEE_DISTRIBUTOR_CONTRACT_ADDRESS:
      "0xa731585ab05fC9f83555cf9Bff8F58ee94e18F85",
    FUSE_POOL_LENS_CONTRACT_ADDRESS:
      "0x8dA38681826f4ABBe089643D2B3fE4C6e4730493",
    FUSE_POOL_LENS_SECONDARY_CONTRACT_ADDRESS:
      "0xc76190E04012f26A364228Cfc41690429C44165d",
    COMPTROLLER_IMPLEMENTATION_CONTRACT_ADDRESS:
      "0x94b2200d28932679def4a7d08596a229553a994e",

    // CEther and CERC20
    CERC20_DELEGATE_CONTRACT_ADDRESS:
      "0x67e70eeb9dd170f7b4a9ef620720c9069d5e706c", //
    CETHER_DELEGATE_CONTRACT_ADDRESS:
      "0x60884c8faad1b30b1c76100da92b76ed3af849ba",

    // Oracles
    OPEN_ORACLE_PRICE_DATA_CONTRACT_ADDRESS:
      "0xc629c26dced4277419cde234012f8160a0278a79",

    // Implementation for V3
    MASTER_PRICE_ORACLE_IMPLEMENTATION_CONTRACT_ADDRESS:
      "0xb3c8ee7309be658c186f986388c2377da436d8fb",

    // All Functional Public Oralce you can use
    PUBLIC_PRICE_ORACLE_CONTRACT_ADDRESSES: {
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
      YVaultV1PriceOracle: "0xb5e8e42639e20285c9e58a317c28d9a4d7cb7000", // v1.2.1; v1.0.0 = 0xb04be6165cf1879310e48f8900ad8c647b9b5c5d
      YVaultV2PriceOracle: "0xb669d0319fb9de553e5c206e6fbebd58512b668b",
      // AlphaHomoraV1PriceOracle: "", // TODO: Set correct mainnet address after deployment
      // AlphaHomoraV2PriceOracle: "", // TODO: Set correct mainnet address after deployment
      // SynthetixPriceOracle: "", // TODO: Set correct mainnet address after deployment
      // BalancerLpTokenPriceOracle: "", // TODO: Set correct mainnet address after deployment
      MasterPriceOracle: "0x1887118E49e0F4A78Bd71B792a49dE03504A764D", // original Rari MPO
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
      UniswapTwapPriceOracleV2_SushiSwap_ETH:
        "0xf411CD7c9bC70D37f194828ce71be00d9aEC9edF", // v1.1.3
      SushiBarPriceOracle: "0x290E0f31e96e13f9c0DB14fD328a3C2A94557245",
      BadgerPriceOracle: "0xd0C86943e594640c4598086a2359A0e70b80eF8D",
      HarvestPriceOracle: "0x6141d9353bb1fb8131d07d358c112b372aa92514", // v1.2.1; v1.1.4 = 0x8D364609cd2716172016838fF9FBC7fBcAC91792
      StakedSdtPriceOracle: "0x5447c825ee330015418c1a0d840c4a1b5a7176cc",
      TokemakPoolTAssetPriceOracle:
        "0xd806782b31EC52FcB7f2a009d7D045bB732431Fb",
      MStablePriceOracle: "0xeb988f5492C86584f8D8f1B8662188D5A9BfE357",
      GelatoGUniPriceOracle: "0xea3633b38c747cea231adb74b511dc2ed3992b43",
      StakedSpellPriceOracle: "0xb544f62045b96a60b398abb5a5c23bf04cb4ed9c",
      CurveTriCryptoLpTokenPriceOracle:
        "0xb2d16916d520d585ee49f08db1436b961b48fe60",
    },
    PRICE_ORACLE_RUNTIME_BYTECODE_HASHES: {
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
      UniswapLpTokenPriceOracle:
        "0xbcddb66e4e9c038b4ee1cf4caf1e8c8119225d72a8407fc32caa1988e4a7fe31",
      UniswapV3TwapPriceOracle_Uniswap_3000:
        "0xb300f7f64110b952340e896d33f133482de6715f1b8b7e0acbd2416e0e6593c1",
      UniswapV3TwapPriceOracle_Uniswap_10000:
        "0xef237fadaffff8a1b5daa4d448c7935cf0f71e2ee01a53856bb0d7884b0ad78c",
      UniswapV3TwapPriceOracleV2_Uniswap_500_USDC:
        "0xaaba60b3af593a8ecde61d8516ad0353db8cc2777018e0dde07f654c22a3171d",
      UniswapV3TwapPriceOracleV2_Uniswap_3000_USDC:
        "0x204541bdea985113b68dad86bf67fbbd52829f8984b6f17f6271bcec203161d1",
      UniswapV3TwapPriceOracleV2_Uniswap_10000_USDC:
        "0xc301f891f1f905e68d1c5df5202cf0eec2ee8abcf3a510d5bd00d46f7dea01b4",
      UniswapV3TwapPriceOracleV2:
        "0xc844372c8856a5f9569721d3aca38c7804bae2ae4e296605e683aa8d1601e538", // v1.2.0
      // fuse-contracts@v1.0.0
      YVaultV1PriceOracleV1:
        "0xd0dda181a4eb699a966b23edb883cff43377297439822b1b0f99b06af2002cc3",
      // fuse-contracts@v1.2.1
      YVaultV1PriceOracleV2:
        "0x78ac4b231a4ce3ac5259847cd1cb227bf45882d736722290bee6b6c99a722f22",
      YVaultV2PriceOracle:
        "0x177c22cc7d05280cea84a36782303d17246783be7b8c0b6f9731bb9002ffcc68",
      // fuse-contracts@v1.0.0
      MasterPriceOracleV1:
        "0xfa1349af05af40ffb5e66605a209dbbdc8355ba7dda76b2be10bafdf5ffd1dc6",
      // fuse-contracts@80c79b45bda4151e22358d22cc0bf1489f34900c (before final release of v1.2.0)
      MasterPriceOracleV2:
        "0xdfa5aa37efea3b16d143a12c4ae7006f3e29768b3e375b59842c7ecd3809f1d1",
      // fuse-contracts@v1.2.0
      MasterPriceOracleV3:
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
      UniswapTwapPriceOracleV2_SushiSwap_CRV:
        "0x9df749314d6494a785bb5ff7a5fab25adadb772e10d58b7f692028cc23e2cbb3",
      UniswapTwapPriceOracleV2_SushiSwap_USDC:
        "0x2219b54a3e2c36b8b1eca8d511392eacace73a3e1cb55c97dd495f5e47024ba6",
      UniswapTwapPriceOracleV2_Uniswap_FRAX:
        "0xc884332403a6234bbb5e860fa27bcf69389b7e372b20045af687d23426e654e3",
      UniswapTwapPriceOracleV2_SushiSwap_ETH:
        "0xea501eef0ca55dc6a8360a5a1274895d6dc245dd0ae8cffbff3a14c6624711f0",
      SushiBarPriceOracle:
        "0x3736e8b6c11fcd413c0b60c3291a3a2e2ebe496a2780f3c45790a123f5ee9705",
      BadgerPriceOracle:
        "0x310210400b2d3992dc8fb9ace5001b1b55d3a468fba18ae0bc82a375fd150638",
      // fuse-contracts@v1.1.4
      HarvestPriceOracleV1:
        "0x6e23380d1d640118cf80cf2bfa9ca7a89068659dfcb50abc0a7f8b9e5f9daab7",
      // fuse-contracts@v1.2.1
      HarvestPriceOracleV2:
        "0x5eff948725404a38311ebe4b3bafc312f63dd8ae611e3ddcdfebb9cfa231988c",
      StakedSdtPriceOracle:
        "0x1b489bd00e5cbe4998e985f147297c1a39bd9da659e78544c94c1f3415edf7b7",
      TokemakPoolTAssetPriceOracle:
        "0xc820466d7af2319646d25e2203187254a37cb9b9ae6c8a263d40fb5c01a54c51",
      MStablePriceOracle:
        "0x39fc7b2cdac3d401ea91becf897346b2156dbe261162de14082e856103456eb4",
      StakedSpellPriceOracle:
        "0x9fcea6d23c7e2e330e35e303a49f39e0c2c783e6b770ccc2de41fbbfbfc539e7",
      CurveTriCryptoLpTokenPriceOracle:
        "0x92014d914370d8c59082044786d9b056ea188a95891778c555209c210850d5ae",
    },

    // Deployable Oracles
    // (Note: In production, you can only deploy `MasterPriceOracle`, `UniswapTwapPriceOracleV2` `UniswapV3TwapPriceOracleV2`)
    ORACLES: [
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
    ],

    oracles: {
      ChainlinkPriceOracle: {
        address: "0xe102421A85D9C0e71C0Ef1870DaC658EB43E1493",
        bytecodeHash:
          "0x7a2a5633a99e8abb759f0b52e87875181704b8e29f6567d4a92f12c3f956d313",
        deployable: false,
        oldVersions: {
          "1.2.0": {
            address: "0xe102421A85D9C0e71C0Ef1870DaC658EB43E1493",
            bytecodeHash:
              "0x7a2a5633a99e8abb759f0b52e87875181704b8e29f6567d4a92f12c3f956d313",
            deployable: false,
          },
        },
      },
    },

    // // UNI-V2 Oracles
    UNISWAP_V2_FACTORY_ADDRESS: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    UNISWAP_V2_PAIR_INIT_CODE_HASH:
      "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f",

    UNISWAP_TWAP_PRICE_ORACLE_ROOT_CONTRACT_ADDRESS:
      "0xa170dba2cd1f68cdd7567cf70184d5492d2e8138",
    UNISWAP_TWAP_PRICE_ORACLE_V2_ROOT_CONTRACT_ADDRESS:
      "0xf1860b3714f0163838cf9ee3adc287507824ebdb",
    UNISWAP_TWAP_PRICE_ORACLE_V2_FACTORY_CONTRACT_ADDRESS: "", // TODO: Set correct mainnet address after deployment

    // // UNI-V3 Oracles
    UNISWAP_V3_FACTORY_ADDRESS: "0x1f98431c8ad98523631ae4a59f267346ea31f984",
    UNISWAP_V3_TWAP_PRICE_ORACLE_V2_FACTORY_CONTRACT_ADDRESS:
      "0x8Eed20f31E7d434648fF51114446b3CfFD1FF9F1", // TODO: Set correct mainnet address after deployment

    // IRM
    PUBLIC_INTEREST_RATE_MODEL_CONTRACT_ADDRESSES: {
      WhitePaperInterestRateModel_ETH:
        "0x14ee0270C80bEd60bDC117d4F218DeE0A4909F28",
      WhitePaperInterestRateModel_WBTC:
        "0x7ecAf96C79c2B263AFe4f486eC9a74F8e563E0a6",
      JumpRateModel_DAI: "0x640dce7c7c6349e254b20eccfa2bb902b354c317",
      JumpRateModel_UNI: "0xc35DB333EF7ce4F246DE9DE11Cc1929d6AA11672",
      JumpRateModel_Stables_Majors:
        "0xb579d2761470bba14018959d6dffcc681c09c04b",
      JumpRateModel_Gov_Seeds: "0xcdC0a449E011249482824efFcfA05c883d36CfC7",
      JumpRateModel_ALCX: "0x58c3e7119ec200c09b2b3a9f8ce3bd77b6b47012",
    },

    // Tokens / ETC
    COINBASE_PRO_REPORTER_ADDRESS: "0xfCEAdAFab14d46e20144F48824d0C09B1a03F2BC",

    DAI_POT: "0x197e90f9fad81970ba7976f33cbd77088e5d7cf7",
    DAI_JUG: "0x19c0976f590d67707e62397c87829d896dc0f1f1",

    WETH_ADDRESS: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    INITIALIZABLE_CLONES_CONTRACT_ADDRESS:
      "0x91ce5566dc3170898c5aee4ae4dd314654b47415",

    REWARDS_DISTRIBUTOR_DELEGATE_CONTRACT_ADDRESS:
      "0x220f93183a69d1598e8405310cb361cff504146f",
  },
  // Todo - update all these addresses
  [ChainID.ARBITRUM]: {
    // Fundamentals
    FUSE_POOL_DIRECTORY_CONTRACT_ADDRESS:
      "0xA2a1cb88D86A939A37770FE5E9530E8700DEe56b",
    FUSE_SAFE_LIQUIDATOR_CONTRACT_ADDRESS:
      "0x29535B9035500827FfF73206e17a3d16635A1B48",
    FUSE_FEE_DISTRIBUTOR_CONTRACT_ADDRESS:
      "0xB1205172AAdaAd4c67318EA77A34C1F1CaA784EE",
    FUSE_POOL_LENS_CONTRACT_ADDRESS:
      "0xe4D84b252308645098846312286E6c6D2846DbB0",
    FUSE_POOL_LENS_SECONDARY_CONTRACT_ADDRESS:
      "0xc76190E04012f26A364228Cfc41690429C44165d",
    COMPTROLLER_IMPLEMENTATION_CONTRACT_ADDRESS:
      "0x2f6d8Ff753886AE2b49E0c3bB6504867F2977078",

    // CEther and CERC20
    CETHER_DELEGATE_CONTRACT_ADDRESS: "",
    CERC20_DELEGATE_CONTRACT_ADDRESS:
      "0xCFA81742393B52c493b8d76E55FFE4992A5cfFd9",

    // Oracles
    OPEN_ORACLE_PRICE_DATA_CONTRACT_ADDRESS: "",
    MASTER_PRICE_ORACLE_IMPLEMENTATION_CONTRACT_ADDRESS: "",

    PUBLIC_PRICE_ORACLE_CONTRACT_ADDRESSES: {
      PreferredPriceOracle_V2_Quick_USDC:
        "0xCc5F01efd5647C77861Ce15C923731f9e27E3132",
      MasterPriceOracle_V2_BEEFY_LP:
        "0x606AF64e16bF85F587E9ac27Fa2e8461C5258321",
      MasterPriceOracle_V2_KLIMA: "0xd9b7b49a2e95c56c115ecf3d3f2546aaaa8f0a35",
    },

    PRICE_ORACLE_RUNTIME_BYTECODE_HASHES: {
      "PreferredPriceOracleV2 Quickswap USDC":
        "0xe6a7eb0795fc9c5e05048d191246ac01efaff82eac6c8c981ed0b475e89e77a9",
      "MasterPriceOracleV2 Beefy":
        "0x567982b74679a69cfb2ae6b114951562cc80d6790d0c2fdb9a4c1fb46733138d",
      "MasterPriceOracleV2 Klima":
        "0x17a4e51aa4284da1b2ced8254eac606175ceaf9b810a48c0a336fc0195c95a4a",
    },
    ORACLES: [
      "PreferredPriceOracle",
      "ChainlinkPriceOracleV2",
      "UniswapTwapPriceOracle_SushiSwap",
    ],

    // // UNI-V2 Oracles (Sushi for arbi)
    UNISWAP_V2_FACTORY_ADDRESS: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
    UNISWAP_V2_PAIR_INIT_CODE_HASH:
      "0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303",

    UNISWAP_TWAP_PRICE_ORACLE_ROOT_CONTRACT_ADDRESS: "",
    UNISWAP_TWAP_PRICE_ORACLE_V2_ROOT_CONTRACT_ADDRESS: "",
    UNISWAP_TWAP_PRICE_ORACLE_V2_FACTORY_CONTRACT_ADDRESS: "", // TODO: Set correct mainnet address after deployment

    // // UNI-V3 Oracles
    UNISWAP_V3_FACTORY_ADDRESS: "",
    UNISWAP_V3_TWAP_PRICE_ORACLE_V2_FACTORY_CONTRACT_ADDRESS: "",

    // IRM
    PUBLIC_INTEREST_RATE_MODEL_CONTRACT_ADDRESSES: {
      JumpRateModel_Cream_Stables_Majors:
        "0xa80F8CC22b4Ff9442B7F188D96E9B75d6cFd80F6",

      JumpRateModel_Cream_Major: "0x8dbf1250c805fc2ed29fc0d3aed31ec69a928ffe",

      JumpRateModel_Cream_Gov: "0x46c54c7D214117c79f2f6F368549776F00c0a6c4",
    },

    // Tokens / ETC
    COINBASE_PRO_REPORTER_ADDRESS: "0xfCEAdAFab14d46e20144F48824d0C09B1a03F2BC",
    DAI_POT: "",
    DAI_JUG: "",
    WETH_ADDRESS: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",

    INITIALIZABLE_CLONES_CONTRACT_ADDRESS: "",
    REWARDS_DISTRIBUTOR_DELEGATE_CONTRACT_ADDRESS: "",
  },
};

export default addresses;
