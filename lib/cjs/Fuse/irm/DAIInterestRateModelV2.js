"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = require("../utils/web3");
const JumpRateModel_js_1 = __importDefault(require("./JumpRateModel.js"));
const compound_protocol_min_json_1 = __importDefault(require("../contracts/compound-protocol.min.json"));
class DAIInterestRateModelV2 extends JumpRateModel_js_1.default {
    init(interestRateModelAddress, assetAddress, provider) {
        const _super = Object.create(null, {
            init: { get: () => super.init }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.init.call(this, interestRateModelAddress, assetAddress, provider);
            const interestRateContract = (0, web3_1.createContract)(interestRateModelAddress, compound_protocol_min_json_1.default.contracts['contracts/DAIInterestRateModelV2.sol:DAIInterestRateModelV2'].abi, provider);
            this.dsrPerBlock = (0, web3_1.toBN)(yield interestRateContract.callStatic.dsrPerBlock());
            const cTokenContract = (0, web3_1.createContract)(assetAddress, compound_protocol_min_json_1.default.contracts['contracts/CTokenInterfaces.sol:CTokenInterface'].abi, provider);
            this.cash = (0, web3_1.toBN)(yield cTokenContract.callStatic.getCash());
            this.borrows = (0, web3_1.toBN)(yield cTokenContract.callStatic.totalBorrowsCurrent());
            this.reserves = (0, web3_1.toBN)(yield cTokenContract.callStatic.totalReserves());
        });
    }
    _init(interestRateModelAddress, reserveFactorMantissa, adminFeeMantissa, fuseFeeMantissa, provider) {
        const _super = Object.create(null, {
            _init: { get: () => super._init }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super._init.call(this, interestRateModelAddress, reserveFactorMantissa, adminFeeMantissa, fuseFeeMantissa, provider);
            const interestRateContract = (0, web3_1.createContract)(interestRateModelAddress, compound_protocol_min_json_1.default.contracts["contracts/DAIInterestRateModelV2.sol:DAIInterestRateModelV2"].abi, provider);
            this.dsrPerBlock = (0, web3_1.toBN)(yield interestRateContract.callStatic.dsrPerBlock());
            this.cash = (0, web3_1.toBN)(0);
            this.borrows = (0, web3_1.toBN)(0);
            this.reserves = (0, web3_1.toBN)(0);
        });
    }
    __init(baseRatePerBlock, multiplierPerBlock, jumpMultiplierPerBlock, kink, reserveFactorMantissa, adminFeeMantissa, fuseFeeMantissa) {
        const _super = Object.create(null, {
            __init: { get: () => super.__init }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.__init.call(this, baseRatePerBlock, multiplierPerBlock, jumpMultiplierPerBlock, kink, reserveFactorMantissa, adminFeeMantissa, fuseFeeMantissa);
            this.dsrPerBlock = (0, web3_1.toBN)(0); // TODO: Make this work if DSR ever goes positive again
            this.cash = (0, web3_1.toBN)(0);
            this.borrows = (0, web3_1.toBN)(0);
            this.reserves = (0, web3_1.toBN)(0);
        });
    }
    getSupplyRate(utilizationRate) {
        if (!this.initialized || !this.cash || !this.borrows || !this.reserves || !this.dsrPerBlock)
            throw new Error("Interest rate model class not initialized.");
        // const protocolRate = super.getSupplyRate(utilizationRate, this.reserveFactorMantissa); //todo - do we need this
        const protocolRate = super.getSupplyRate(utilizationRate);
        const underlying = this.cash.add(this.borrows).sub(this.reserves);
        if (underlying.isZero()) {
            return protocolRate;
        }
        else {
            const cashRate = this.cash.mul(this.dsrPerBlock).div(underlying);
            return cashRate.add(protocolRate);
        }
    }
}
exports.default = DAIInterestRateModelV2;
DAIInterestRateModelV2.RUNTIME_BYTECODE_HASH = "0x4b4c4f6386fd72d3f041a03e9eee3945189457fcf4299e99098d360a9f619539";
