import { groth16 } from 'snarkjs';
import fs from 'fs';
import path from 'path';

// Correctly resolve the paths to the circuit files
const wasmPath = path.join(__dirname, '../../circuits/gyro_lt.wasm');
const zkeyPath = path.join(__dirname, '../../circuits/gyro_lt_0001.zkey');

// Function to generate a proof
async function generateProof(gyroCount: number, max: number) {
    const input = {
        gyro_count: gyroCount.toString(),
        MAX: max.toString()
    };

    console.log('Reading .wasm and .zkey files...');
    const { proof, publicSignals } = await groth16.fullProve(input, wasmPath, zkeyPath);
    console.log('Proof generated successfully!');

    return { proof, publicSignals };
}

// Main function to run the proof generation
async function main() {
    try {
        // Example input values
        const gyroCount = 5;
        const max = 10;

        const { proof, publicSignals } = await generateProof(gyroCount, max);

        // Format the proof for the server claim request
        const formattedProof = {
            pi_a: [proof.pi_a[0], proof.pi_a[1]],
            pi_b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
            pi_c: [proof.pi_c[0], proof.pi_c[1]],
            pubSignals: publicSignals
        };

        console.log('\nGenerated and Formatted Proof:');
        console.log(JSON.stringify(formattedProof, null, 2));

        // You can now use this formattedProof object to send a POST request to your server's /claim endpoint

    } catch (error) {
        console.error('Error during proof generation:', error);
    }
}

// Run the main function
main();
