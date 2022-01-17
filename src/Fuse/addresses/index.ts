import { ChainID } from "../../utils/networks";
import MAINNET_ADDRESSES from "./mainnet";
import ARBITRUM_ADDRESSES from "./arbitrum";
import ARBITRUM_RINKEBY_ADDRESSES from "./arbitrumRinkeby";

export enum CompoundContractVersion {
  "1.0.0",
  "1.0.1",
  "1.0.2",
  "1.1.0",
}

export enum FuseContractVersion {
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
    // Todo - coerce this to be type FuseContractVersion
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

  // new oracles stuff
  oracles: Oracles;
  DEPLOYABLE_ORACLES: (keyof Oracles)[];

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
  [ChainID.ETHEREUM]: MAINNET_ADDRESSES,
  // Todo - update all these addresses
  [ChainID.ARBITRUM]: ARBITRUM_ADDRESSES,
  [ChainID.ARBITRUM_TESTNET]: ARBITRUM_RINKEBY_ADDRESSES,
};

export default addresses;
