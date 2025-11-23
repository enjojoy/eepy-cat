const { expect } = require("chai");
const { ethers } = require("hardhat");
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

describe("GyroReward Contract", function () {
    let verifier, gyroReward;
    let wasmPath, zkeyPath;
    const REQUIRED_MAX = 10; // Must match the constant in GyroReward.sol

    before(async function () {
        // Deploy the Verifier contract
        const Verifier = await ethers.getContractFactory("Groth16Verifier");
        verifier = await Verifier.deploy();
        await verifier.waitForDeployment?.() || await verifier.deployed?.();

        // Deploy the GyroReward contract
        const GyroReward = await ethers.getContractFactory("GyroReward");
        const verifierAddress = verifier.address || await verifier.getAddress?.();
        gyroReward = await GyroReward.deploy(verifierAddress);
        await gyroReward.waitForDeployment?.() || await gyroReward.deployed?.();

        // Load circuit files
        wasmPath = path.join(__dirname, "../build/gyro_lt_js/gyro_lt.wasm");
        zkeyPath = path.join(__dirname, "../build/gyro_lt_0001.zkey");
    });

    async function generateValidProof(gyroCount, max) {
        const input = {
            gyro_count: gyroCount.toString(),
            MAX: max.toString()
        };
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
        
        // Format proof for Solidity
        return {
            a: [proof.pi_a[0], proof.pi_a[1]],
            b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
            c: [proof.pi_c[0], proof.pi_c[1]],
            pubSignals: publicSignals
        };
    }

    it("Should allow a user to claim a reward with a valid proof", async function () {
        const [owner] = await ethers.getSigners();
        const proofData = await generateValidProof(5, REQUIRED_MAX);

        const ownerAddress = owner.address || await owner.getAddress?.();
        const tx = await gyroReward.claimReward(proofData.a, proofData.b, proofData.c, proofData.pubSignals);
        await expect(tx)
            .to.emit(gyroReward, "RewardClaimed")
            .withArgs(ownerAddress, (value) => value.gt(0)); // timestamp should be > 0

        const lastClaim = await gyroReward.lastClaimedTimestamp(owner.address);
        expect(lastClaim).to.be.gt(0);
    });

    it("Should allow a user to claim multiple times (no waiting period)", async function () {
        // Since waiting period is removed, users can claim multiple times
        const proofData1 = await generateValidProof(5, REQUIRED_MAX);
        const proofData2 = await generateValidProof(6, REQUIRED_MAX);
        
        await expect(gyroReward.claimReward(proofData1.a, proofData1.b, proofData1.c, proofData1.pubSignals))
            .to.emit(gyroReward, "RewardClaimed");
        
        // Should be able to claim again immediately
        await expect(gyroReward.claimReward(proofData2.a, proofData2.b, proofData2.c, proofData2.pubSignals))
            .to.emit(gyroReward, "RewardClaimed");
    });

    it("Should FAIL if the proof uses the wrong MAX value", async function () {
        const [, addr1] = await ethers.getSigners();
        const WRONG_MAX = 20;
        const proofData = await generateValidProof(5, WRONG_MAX);
        
        await expect(gyroReward.connect(addr1).claimReward(proofData.a, proofData.b, proofData.c, proofData.pubSignals))
            .to.be.revertedWith("GyroReward: The proof must use the required MAX value.");
    });
    
    it("Should FAIL if a valid proof's components are tampered with", async function () {
        const [, , , addr3] = await ethers.getSigners();
        const proofData = await generateValidProof(5, REQUIRED_MAX);

        // Tamper with the proof's 'a' component
        proofData.a[0] = "0x0000000000000000000000000000000000000000000000000000000000000001";

        await expect(gyroReward.connect(addr3).claimReward(proofData.a, proofData.b, proofData.c, proofData.pubSignals))
            .to.be.revertedWith("GyroReward: The provided proof is invalid.");
    });
});
