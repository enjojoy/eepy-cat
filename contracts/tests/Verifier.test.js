/**
 * Hardhat test for Verifier contract
 * Run with: npx hardhat test
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

describe("Groth16Verifier", function () {
  let verifier;
  let wasmPath, zkeyPath, vkeyPath;

  before(async function () {
    // Load circuit files
    wasmPath = path.join(__dirname, "../build/gyro_lt_js/gyro_lt.wasm");
    zkeyPath = path.join(__dirname, "../build/gyro_lt_0001.zkey");
    vkeyPath = path.join(__dirname, "../build/verification_key.json");

    // Check files exist
    if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath) || !fs.existsSync(vkeyPath)) {
      throw new Error("Circuit files not found. Please compile the circuit first.");
    }

    // Deploy Verifier contract
    const Verifier = await ethers.getContractFactory("Groth16Verifier");
    verifier = await Verifier.deploy();
    await verifier.waitForDeployment?.() || await verifier.deployed?.();
    const verifierAddress = verifier.address || await verifier.getAddress?.();
    console.log("Verifier deployed to:", verifierAddress);
  });

  it("Should verify a valid proof", async function () {
    // Test inputs
    const gyroCount = 5;
    const maxValue = 10;

    console.log(`\nTesting with:`);
    console.log(`  gyro_count: ${gyroCount} (private)`);
    console.log(`  MAX: ${maxValue} (public)`);
    console.log(`  Condition: ${gyroCount} < ${maxValue} = ${gyroCount < maxValue}`);

    // Prepare input
    const input = {
      gyro_count: gyroCount.toString(),
      MAX: maxValue.toString()
    };

    // Generate proof
    console.log("\nGenerating proof...");
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    // Verify locally first
    console.log("Verifying proof locally...");
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf8"));
    const localVerification = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    expect(localVerification).to.be.true;
    console.log("✓ Local verification passed");

    // Format proof for contract
    const formattedProof = {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [
        [proof.pi_b[0][1], proof.pi_b[0][0]], // Note: snarkjs uses reversed order
        [proof.pi_b[1][1], proof.pi_b[1][0]]
      ],
      c: [proof.pi_c[0], proof.pi_c[1]]
    };

    // Verify on-chain
    console.log("Verifying proof on-chain...");
    const result = await verifier.verifyProof(
      formattedProof.a,
      formattedProof.b,
      formattedProof.c,
      publicSignals
    );

    expect(result).to.be.true;
    console.log("✓ On-chain verification passed");
  });

  it("Should reject an invalid proof", async function () {
    const maxValue = 10; // Required MAX value
    // Create an invalid proof (wrong values)
    const invalidProof = {
      a: [
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002"
      ],
      b: [
        [
          "0x0000000000000000000000000000000000000000000000000000000000000003",
          "0x0000000000000000000000000000000000000000000000000000000000000004"
        ],
        [
          "0x0000000000000000000000000000000000000000000000000000000000000005",
          "0x0000000000000000000000000000000000000000000000000000000000000006"
        ]
      ],
      c: [
        "0x0000000000000000000000000000000000000000000000000000000000000007",
        "0x0000000000000000000000000000000000000000000000000000000000000008"
      ]
    };

    const result = await verifier.verifyProof(
      invalidProof.a,
      invalidProof.b,
      invalidProof.c,
      [maxValue.toString()] // public signals
    );

    expect(result).to.be.false;
    console.log("✓ Invalid proof correctly rejected");
  });

  it("Should verify multiple valid proofs", async function () {
    const testCases = [
      { gyroCount: 1, maxValue: 10 },
      { gyroCount: 5, maxValue: 10 },
      { gyroCount: 9, maxValue: 10 },
      { gyroCount: 3, maxValue: 5 }
    ];

    for (const testCase of testCases) {
      const { gyroCount, maxValue } = testCase;
      
      if (gyroCount >= maxValue) {
        continue; // Skip invalid cases
      }

      const input = {
        gyro_count: gyroCount.toString(),
        MAX: maxValue.toString()
      };

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmPath,
        zkeyPath
      );

      const formattedProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
          [proof.pi_b[0][1], proof.pi_b[0][0]],
          [proof.pi_b[1][1], proof.pi_b[1][0]]
        ],
        c: [proof.pi_c[0], proof.pi_c[1]]
      };

      const result = await verifier.verifyProof(
        formattedProof.a,
        formattedProof.b,
        formattedProof.c,
        publicSignals
      );

      expect(result).to.be.true;
      console.log(`✓ Proof verified for gyro_count=${gyroCount}, MAX=${maxValue}`);
    }
  });
});

