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
const dotenv_1 = __importDefault(require("dotenv"));
const ethers_1 = require("ethers");
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const { PRIVATE_KEY, SEED_PHRASE, RPC_URL, CONTRACT_ADDRESS } = process.env;
if (!PRIVATE_KEY && !SEED_PHRASE) {
    throw new Error('Missing PRIVATE_KEY or SEED_PHRASE in environment.');
}
if (!RPC_URL) {
    throw new Error('Missing RPC_URL in environment.');
}
if (!CONTRACT_ADDRESS) {
    throw new Error('Missing CONTRACT_ADDRESS in environment.');
}
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
const provider = new ethers_1.ethers.JsonRpcProvider(RPC_URL);
let wallet;
if (PRIVATE_KEY) {
    wallet = new ethers_1.ethers.Wallet(PRIVATE_KEY, provider);
}
else {
    // SEED_PHRASE is checked for existence above
    const hdNode = ethers_1.ethers.HDNodeWallet.fromPhrase(SEED_PHRASE);
    wallet = new ethers_1.ethers.Wallet(hdNode.privateKey, provider);
}
console.log('Wallet address:', wallet.address);
// Load contract ABI
console.log("path.join(__dirname, '/SleepRewardManager.json')", path_1.default.join(__dirname, '/SleepRewardManager.json'));
const contractABIPath = path_1.default.join(__dirname, '/SleepRewardManager.json');
const contractArtifact = JSON.parse(fs_1.default.readFileSync(contractABIPath, 'utf8'));
const contractABI = contractArtifact.abi;
// Create contract instance
const contract = new ethers_1.ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
console.log('Contract address:', CONTRACT_ADDRESS);
console.log('Contract connected successfully');
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.post('/claim', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { proof, claimAddress } = req.body;
    // Validate claim address
    if (!ethers_1.ethers.isAddress(claimAddress)) {
        return res.status(400).json({ status: 'error', message: 'Invalid claim address' });
    }
    // Validate proof structure
    if (!proof || typeof proof !== 'object') {
        return res.status(400).json({
            status: 'error',
            message: 'Proof is required and must be an object'
        });
    }
    if (!proof.pi_a || !Array.isArray(proof.pi_a) || proof.pi_a.length !== 2) {
        return res.status(400).json({
            status: 'error',
            message: 'proof.pi_a must be an array with exactly 2 elements'
        });
    }
    if (!proof.pi_b || !Array.isArray(proof.pi_b) || proof.pi_b.length !== 2) {
        return res.status(400).json({
            status: 'error',
            message: 'proof.pi_b must be an array with exactly 2 elements'
        });
    }
    if (!proof.pi_b[0] || !Array.isArray(proof.pi_b[0]) || proof.pi_b[0].length !== 2) {
        return res.status(400).json({
            status: 'error',
            message: 'proof.pi_b[0] must be an array with exactly 2 elements'
        });
    }
    if (!proof.pi_b[1] || !Array.isArray(proof.pi_b[1]) || proof.pi_b[1].length !== 2) {
        return res.status(400).json({
            status: 'error',
            message: 'proof.pi_b[1] must be an array with exactly 2 elements'
        });
    }
    if (!proof.pi_c || !Array.isArray(proof.pi_c) || proof.pi_c.length !== 2) {
        return res.status(400).json({
            status: 'error',
            message: 'proof.pi_c must be an array with exactly 2 elements'
        });
    }
    if (!proof.pubSignals || !Array.isArray(proof.pubSignals) || proof.pubSignals.length !== 1) {
        return res.status(400).json({
            status: 'error',
            message: 'proof.pubSignals must be an array with exactly 1 element'
        });
    }
    console.log('Received claim request:');
    console.log('Claim Address:', claimAddress);
    console.log('Proof structure validated:');
    console.log('  pi_a length:', proof.pi_a.length);
    console.log('  pi_b shape:', proof.pi_b.length, 'x', proof.pi_b[0].length);
    console.log('  pi_c length:', proof.pi_c.length);
    console.log('  pubSignals length:', proof.pubSignals.length);
    // Format proof for contract call (ethers.js handles BigInt conversion)
    const formattedProof = {
        pi_a: proof.pi_a,
        pi_b: proof.pi_b,
        pi_c: proof.pi_c,
        pubSignals: proof.pubSignals
    };
    console.log('\n=== Calling Contract Directly with ethers.js ===');
    console.log('  Method: claimReward');
    console.log('  Contract:', CONTRACT_ADDRESS);
    console.log('  User:', claimAddress);
    console.log('  Proof format validated');
    try {
        // Estimate gas first to catch errors early
        console.log('\nEstimating gas...');
        const gasEstimate = yield contract.claimReward.estimateGas(claimAddress, formattedProof.pi_a, formattedProof.pi_b, formattedProof.pi_c, formattedProof.pubSignals);
        console.log('  Gas estimate:', gasEstimate.toString());
        // Call the contract
        console.log('\nSending transaction...');
        const tx = yield contract.claimReward(claimAddress, formattedProof.pi_a, formattedProof.pi_b, formattedProof.pi_c, formattedProof.pubSignals);
        console.log('  Transaction hash:', tx.hash);
        console.log('  Waiting for confirmation...');
        // Wait for transaction confirmation
        const receipt = yield tx.wait();
        console.log('\n=== Transaction Confirmed ===');
        console.log('  Block number:', receipt.blockNumber);
        console.log('  Gas used:', receipt.gasUsed.toString());
        console.log('  Status:', receipt.status === 1 ? 'Success' : 'Failed');
        // Check for RewardClaimed event
        const events = receipt.logs.filter((log) => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed && parsed.name === 'RewardClaimed';
            }
            catch (_a) {
                return false;
            }
        });
        if (events.length > 0) {
            console.log('  ✓ RewardClaimed event emitted!');
            const event = contract.interface.parseLog(events[0]);
        }
        res.json({
            status: 'success',
            message: 'Claim processed successfully',
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        });
    }
    catch (error) {
        console.error('\n=== Transaction Error ===');
        console.error('Error:', error.message);
        // Parse revert reason if available
        if (error.reason) {
            console.error('Revert reason:', error.reason);
        }
        if (error.data) {
            console.error('Error data:', error.data);
        }
        // Check for specific error types
        let errorMessage = 'Transaction failed';
        let statusCode = 500;
        if (error.message.includes('execution reverted')) {
            errorMessage = error.reason || 'Contract execution reverted';
            statusCode = 400;
            if (errorMessage.includes('Invalid ZK proof')) {
                console.error('\n⚠️  Proof verification failed!');
                console.error('This could mean:');
                console.error('  1. The proof is invalid or expired');
                console.error('  2. The proof was generated with different circuit files');
                console.error('  3. The publicSignals don\'t match the proof');
            }
            else if (errorMessage.includes('Already claimed this epoch')) {
                console.error('\n⚠️  User has already claimed for this epoch');
            }
        }
        else if (error.message.includes('insufficient funds')) {
            errorMessage = 'Insufficient funds for transaction';
            statusCode = 400;
        }
        else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
            errorMessage = 'Transaction would fail (likely contract revert)';
            statusCode = 400;
        }
        res.status(statusCode).json({
            status: 'error',
            message: errorMessage,
            error: error.message,
            reason: error.reason || undefined
        });
    }
}));
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
