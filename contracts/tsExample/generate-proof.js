const { groth16 } = require('snarkjs');
const fs = require('fs');
const path = require('path');

// Correctly resolve the paths to the circuit files
const wasmPath = path.join(__dirname, '../build/gyro_lt_js/gyro_lt.wasm');
const zkeyPath = path.join(__dirname, '../build/gyro_lt_0001.zkey');
const vkeyPath = path.join(__dirname, '../build/verification_key.json');

// Function to generate a proof
async function generateProof(gyroCount, max, verifyLocally = true) {
    const input = {
        gyro_count: gyroCount.toString(),
        MAX: max.toString()
    };

    console.log('Reading .wasm and .zkey files...');
    const { proof, publicSignals } = await groth16.fullProve(input, wasmPath, zkeyPath);
    console.log('✓ Proof generated successfully!');
    console.log('Public signals (MAX):', publicSignals);

    // Optional: Verify locally to catch errors before sending to contract
    // This is NOT required - the contract will verify it on-chain anyway
    // But it's useful to catch errors early and save gas
    if (verifyLocally) {
        if (!fs.existsSync(vkeyPath)) {
            console.log('\n⚠️  Verification key not found, skipping local verification');
            console.log('   (The contract will still verify the proof on-chain)');
        } else {
            console.log('\nVerifying proof locally (optional - contract will verify on-chain)...');
            const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
            const isValid = await groth16.verify(vkey, publicSignals, proof);
            
            if (!isValid) {
                throw new Error('Proof verification failed locally! This proof will fail on-chain too.');
            }
            console.log('✓ Local verification passed! (Proof is valid)');
        }
    }

    return { proof, publicSignals };
}

// Main function to run the proof generation
async function main() {
    try {
        // Example input values
        const gyroCount = 5;
        const max = 10;

        console.log(`\nGenerating proof with:`);
        console.log(`  gyro_count: ${gyroCount} (private)`);
        console.log(`  MAX: ${max} (public)`);
        console.log(`  Condition: ${gyroCount} < ${max} = ${gyroCount < max}\n`);

        // Set to false to skip local verification (saves time if vkey is missing)
        const { proof, publicSignals } = await generateProof(gyroCount, max, true);

        // Format the proof for the server API
        // IMPORTANT: For Groth16, pi_b elements must be swapped for Solidity contracts
        // The server API expects: pi_a, pi_b (swapped), pi_c, pubSignals
        const serverProof = {
            pi_a: [proof.pi_a[0], proof.pi_a[1]],
            pi_b: [
                [proof.pi_b[0][1], proof.pi_b[0][0]], // Swap order for Solidity
                [proof.pi_b[1][1], proof.pi_b[1][0]]  // Swap order for Solidity
            ],
            pi_c: [proof.pi_c[0], proof.pi_c[1]],
            pubSignals: publicSignals  // Contains [MAX] value
        };

        console.log('\n=== Proof Format Check ===');
        console.log('pi_a length:', serverProof.pi_a.length, '(expected: 2)');
        console.log('pi_b shape:', serverProof.pi_b.length, 'x', serverProof.pi_b[0].length, '(expected: 2x2)');
        console.log('pi_c length:', serverProof.pi_c.length, '(expected: 2)');
        console.log('pubSignals:', serverProof.pubSignals, '(should be [MAX])');
        console.log('\n⚠️  IMPORTANT: pi_b elements are SWAPPED for Solidity contract compatibility');

        // Save the proof to a file (for server API)
        const proofFilePath = path.join(__dirname, 'proof.json');
        fs.writeFileSync(proofFilePath, JSON.stringify(serverProof, null, 2));
        console.log(`\n✓ Proof saved to ${proofFilePath}`);

        // Also save in tsExample directory if it exists (for TypeScript examples)
        const tsExampleDir = path.join(__dirname, 'tsExample');
        if (fs.existsSync(tsExampleDir)) {
            const tsProofPath = path.join(tsExampleDir, 'proof.json');
            fs.writeFileSync(tsProofPath, JSON.stringify(serverProof, null, 2));
            console.log(`✓ Proof also saved to ${tsProofPath}`);
        }

        // Display server API format
        console.log('\n=== Server API Format ===');
        console.log('Use this proof with your server API:');
        console.log(JSON.stringify(serverProof, null, 2));

        console.log('\n✓ Proof generation complete!');

    } catch (error) {
        console.error('Error during proof generation:', error);
        process.exit(1);
    }
}

// Run the main function
main();

