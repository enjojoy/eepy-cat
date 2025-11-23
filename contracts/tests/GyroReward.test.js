// test/GyroReward.test.js
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
        const [owner] = await ethers.getSigners();
        const GyroReward = await ethers.getContractFactory("GyroRewardStreak");
        const verifierAddress = verifier.address || await verifier.getAddress?.();
        const ownerAddress = owner.address || await owner.getAddress?.();
        gyroReward = await GyroReward.deploy(verifierAddress, ownerAddress);
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
        const tx = await gyroReward.claimReward(ownerAddress, proofData.a, proofData.b, proofData.c, proofData.pubSignals);
        await expect(tx)
            .to.emit(gyroReward, "RewardClaimed")
            .withArgs(
                ownerAddress,
                (value) => value.gt(0), // timestamp should be > 0
                (value) => value.eq(1), // streak should be 1 for first claim
                (value) => value.eq(1)  // score should be 1 for first claim
            );

        const lastClaim = await gyroReward.lastClaimedTimestamp(owner.address);
        expect(lastClaim).to.be.gt(0);
    });

    it("Should allow a user to claim multiple times after waiting period", async function () {
        const [, addr1] = await ethers.getSigners(); // Use a different address to avoid conflicts
        const addr1Address = addr1.address || await addr1.getAddress?.();
        const proofData1 = await generateValidProof(5, REQUIRED_MAX);
        const proofData2 = await generateValidProof(6, REQUIRED_MAX);
        
        // First claim
        await expect(gyroReward.connect(addr1).claimReward(addr1Address, proofData1.a, proofData1.b, proofData1.c, proofData1.pubSignals))
            .to.emit(gyroReward, "RewardClaimed");
        
        // Advance time by CLAIM_PERIOD (1 day) to allow second claim
        const claimPeriod = await gyroReward.CLAIM_PERIOD();
        await ethers.provider.send("evm_increaseTime", [Number(claimPeriod)]);
        await ethers.provider.send("evm_mine", []);
        
        // Should be able to claim again after waiting period
        await expect(gyroReward.connect(addr1).claimReward(addr1Address, proofData2.a, proofData2.b, proofData2.c, proofData2.pubSignals))
            .to.emit(gyroReward, "RewardClaimed");
    });

    it("Should FAIL if the proof uses the wrong MAX value", async function () {
        const [, , addr2] = await ethers.getSigners(); // Use addr2 to avoid conflicts
        const addr2Address = addr2.address || await addr2.getAddress?.();
        const WRONG_MAX = 20;
        const proofData = await generateValidProof(5, WRONG_MAX);
        
        await expect(gyroReward.connect(addr2).claimReward(addr2Address, proofData.a, proofData.b, proofData.c, proofData.pubSignals))
            .to.be.revertedWith("GyroReward: Wrong MAX value");
    });
    
    it("Should FAIL if a valid proof's components are tampered with", async function () {
        const [, , , addr3] = await ethers.getSigners();
        const addr3Address = addr3.address || await addr3.getAddress?.();
        const proofData = await generateValidProof(5, REQUIRED_MAX);

        // Tamper with the proof's 'a' component
        proofData.a[0] = "0x0000000000000000000000000000000000000000000000000000000000000001";

        await expect(gyroReward.connect(addr3).claimReward(addr3Address, proofData.a, proofData.b, proofData.c, proofData.pubSignals))
            .to.be.revertedWith("GyroReward: Invalid proof");
    });

    it("Should allow claiming rewards on behalf of another address", async function () {
        const [, , , , claimer, beneficiary] = await ethers.getSigners(); // Use fresh addresses
        const claimerAddress = claimer.address || await claimer.getAddress?.();
        const beneficiaryAddress = beneficiary.address || await beneficiary.getAddress?.();
        const proofData = await generateValidProof(5, REQUIRED_MAX);

        // Verify claimer has no streak/score before
        const claimerStreakBefore = await gyroReward.streak(claimerAddress);
        const claimerScoreBefore = await gyroReward.score(claimerAddress);
        expect(claimerStreakBefore).to.eq(0);
        expect(claimerScoreBefore).to.eq(0);

        // Claimer claims reward for beneficiary
        const tx = await gyroReward.connect(claimer).claimReward(beneficiaryAddress, proofData.a, proofData.b, proofData.c, proofData.pubSignals);
        await expect(tx)
            .to.emit(gyroReward, "RewardClaimed")
            .withArgs(
                beneficiaryAddress, // Reward goes to beneficiary, not claimer
                (value) => value.gt(0),
                (value) => value.eq(1),
                (value) => value.eq(1)
            );

        // Verify beneficiary's streak and score were updated
        const streak = await gyroReward.streak(beneficiaryAddress);
        const score = await gyroReward.score(beneficiaryAddress);
        expect(streak).to.eq(1);
        expect(score).to.eq(1);

        // Verify claimer's streak and score were NOT updated
        const claimerStreak = await gyroReward.streak(claimerAddress);
        const claimerScore = await gyroReward.score(claimerAddress);
        expect(claimerStreak).to.eq(0);
        expect(claimerScore).to.eq(0);
    });
});
