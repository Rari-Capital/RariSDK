/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  UniswapLpTokenPriceOracle,
  UniswapLpTokenPriceOracleInterface,
} from "../UniswapLpTokenPriceOracle";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "underlying",
        type: "address",
      },
    ],
    name: "price",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract CToken",
        name: "cToken",
        type: "address",
      },
    ],
    name: "getUnderlyingPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50610885806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063aea910781461003b578063fc57d4df14610073575b600080fd5b6100616004803603602081101561005157600080fd5b50356001600160a01b0316610099565b60408051918252519081900360200190f35b6100616004803603602081101561008957600080fd5b50356001600160a01b03166100ac565b60006100a4826101b5565b90505b919050565b600080826001600160a01b0316636f307dc36040518163ffffffff1660e01b815260040160206040518083038186803b1580156100e857600080fd5b505afa1580156100fc573d6000803e3d6000fd5b505050506040513d602081101561011257600080fd5b50516040805163313ce56760e01b815290519192506101ae916001600160a01b0384169163313ce567916004808301926020929190829003018186803b15801561015b57600080fd5b505afa15801561016f573d6000803e3d6000fd5b505050506040513d602081101561018557600080fd5b505160ff16600a0a6101a8670de0b6b3a76400006101a2856101b5565b906105a2565b90610604565b9392505050565b6000808290506000816001600160a01b03166318160ddd6040518163ffffffff1660e01b815260040160206040518083038186803b1580156101f657600080fd5b505afa15801561020a573d6000803e3d6000fd5b505050506040513d602081101561022057600080fd5b5051905080610234576000925050506100a7565b600080836001600160a01b0316630902f1ac6040518163ffffffff1660e01b815260040160606040518083038186803b15801561027057600080fd5b505afa158015610284573d6000803e3d6000fd5b505050506040513d606081101561029a57600080fd5b50805160209182015160408051630dfe168160e01b815290516dffffffffffffffffffffffffffff93841696509290911693506000926001600160a01b03881692630dfe1681926004808201939291829003018186803b1580156102fd57600080fd5b505afa158015610311573d6000803e3d6000fd5b505050506040513d602081101561032757600080fd5b50516040805163d21220a760e01b815290519192506000916001600160a01b0388169163d21220a7916004808301926020929190829003018186803b15801561036f57600080fd5b505afa158015610383573d6000803e3d6000fd5b505050506040513d602081101561039957600080fd5b5051905060006001600160a01b03831673c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2146104bf576104ba836001600160a01b031663313ce5676040518163ffffffff1660e01b815260040160206040518083038186803b1580156103ff57600080fd5b505afa158015610413573d6000803e3d6000fd5b505050506040513d602081101561042957600080fd5b5051604080516315d5220f60e31b81526001600160a01b0387166004820152905160ff909216600a0a916101a891670de0b6b3a764000091339163aea91078916024808301926020929190829003018186803b15801561048857600080fd5b505afa15801561049c573d6000803e3d6000fd5b505050506040513d60208110156104b257600080fd5b5051906105a2565b6104c9565b670de0b6b3a76400005b905060006001600160a01b03831673c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2146105325761052d836001600160a01b031663313ce5676040518163ffffffff1660e01b815260040160206040518083038186803b1580156103ff57600080fd5b61053c565b670de0b6b3a76400005b9050600061055e886101a8600160701b6101a26105598c8c6105a2565b610646565b9050610593600160381b6101a861057485610646565b6101a2600160381b6101a86105888a610646565b6101a28960026105a2565b9b9a5050505050505050505050565b6000826105b1575060006105fe565b828202828482816105be57fe5b04146105fb5760405162461bcd60e51b815260040180806020018281038252602181526020018061082f6021913960400191505060405180910390fd5b90505b92915050565b60006105fb83836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f00000000000081525061078c565b600081610655575060006100a7565b816001600160801b821061066e5760809190911c9060401b5b6801000000000000000082106106895760409190911c9060201b5b64010000000082106106a05760209190911c9060101b5b6201000082106106b55760109190911c9060081b5b61010082106106c95760089190911c9060041b5b601082106106dc5760049190911c9060021b5b600882106106e85760011b5b60018185816106f357fe5b048201901c9050600181858161070557fe5b048201901c9050600181858161071757fe5b048201901c9050600181858161072957fe5b048201901c9050600181858161073b57fe5b048201901c9050600181858161074d57fe5b048201901c9050600181858161075f57fe5b048201901c9050600081858161077157fe5b0490508082106107815780610783565b815b95945050505050565b600081836108185760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b838110156107dd5781810151838201526020016107c5565b50505050905090810190601f16801561080a5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b50600083858161082457fe5b049594505050505056fe536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f77a2646970667358221220793de2f5f64062a0c3b010b7218b59c560f765a1a53aff7846ccb5094b5d384464736f6c634300060c0033";

type UniswapLpTokenPriceOracleConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: UniswapLpTokenPriceOracleConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class UniswapLpTokenPriceOracle__factory extends ContractFactory {
  constructor(...args: UniswapLpTokenPriceOracleConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<UniswapLpTokenPriceOracle> {
    return super.deploy(overrides || {}) as Promise<UniswapLpTokenPriceOracle>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): UniswapLpTokenPriceOracle {
    return super.attach(address) as UniswapLpTokenPriceOracle;
  }
  connect(signer: Signer): UniswapLpTokenPriceOracle__factory {
    return super.connect(signer) as UniswapLpTokenPriceOracle__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): UniswapLpTokenPriceOracleInterface {
    return new utils.Interface(_abi) as UniswapLpTokenPriceOracleInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): UniswapLpTokenPriceOracle {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as UniswapLpTokenPriceOracle;
  }
}
