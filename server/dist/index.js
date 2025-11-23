"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const express_1 = __importDefault(require("express"));
const MultiBaas = __importStar(require("@curvegrid/multibaas-sdk"));
const axios_1 = require("axios");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
const config = new MultiBaas.Configuration({
    basePath: "https://cpjgetohcbbjhc2vqmong7u73q.multibaas.com/api/v0",
    accessToken: process.env.MULTIBASS_API_KEY,
});
const contractsApi = new MultiBaas.ContractsApi(config);
app.post('/claim', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { proof } = req.body;
    console.log('Received claim request:');
    console.log('Proof:', proof);
    const deployedAddressOrAlias = "groth16verifier1";
    const contractLabel = "groth16verifier";
    const contractMethod = "verifyProof";
    const payload = {
        args: [
            proof.pi_a,
            proof.pi_b,
            proof.pi_c,
            proof.pubSignals
        ],
    };
    try {
        const resp = yield contractsApi.callContractFunction(deployedAddressOrAlias, contractLabel, contractMethod, payload);
        console.log("Function call result:\n", resp.data.result);
        res.json({ status: 'success', message: 'Claim received and verified', data: resp.data.result });
    }
    catch (e) {
        if ((0, axios_1.isAxiosError)(e)) {
            console.log(`MultiBaas error with status '${(_a = e.response) === null || _a === void 0 ? void 0 : _a.data.status}' and message: ${(_b = e.response) === null || _b === void 0 ? void 0 : _b.data.message}`);
            res.status(500).json({ status: 'error', message: 'MultiBaas Error' });
        }
        else {
            console.log("An unexpected error occurred:", e);
            res.status(500).json({ status: 'error', message: 'An unexpected error occurred' });
        }
    }
}));
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
