# Eepy Cat 🐈💤

**Sleep Soundly. Earn Privately.**

Eepy Cat is a privacy-first "Proof of Sleep" mobile application. Unlike traditional sleep trackers that harvest biometric data, Eepy Cat runs entirely on-device. It uses **Zero-Knowledge Proofs (ZK-SNARKs)** to verify you've met your sleep goals without ever revealing your raw movement data to a server or blockchain. 

The dashboard related to economic incentives can be found at: https://studio--studio-1679253439-69e11.us-central1.hosted.app/

## 🏗 Architecture

This is a **React Native (Expo)** application that interacts with:
1.  **Local Sensors:** Uses `expo-sensors` to track gyroscope data.
2.  **ZK Circuits:** Uses `circom` and `snarkjs` (running in a shimmed React Native environment) to generate proofs client-side.
3.  **Blockchain Relay:** Sends proofs to a backend relay (in the `/server` directory) which submits them to the **SleepRewardManager** contract via **Curvegrid MultiBaas**.

## 🚀 Get Started

### Prerequisites

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Backend Setup:**
    Ensure the backend server and smart contracts are running/deployed.
    *   Contracts: See `/contracts`
    *   Server: See `/server`

### Running the App

To run the app on a physical device or emulator, use the following command:

```bash
npm run start -- --tunnel
```


This will generate a QR code that you can scan with the Expo Go app on your iOS or Android device.
🤖 Android (Project IDX Specifics)

Android previews are defined as a workspace.onStart hook and started as a vscode task when the workspace is opened/started.

Note: If you can't find the task, either:

    Rebuild the environment (using command palette: IDX: Rebuild Environment), or

    Run npm run android -- --tunnel manually to run android and see the output in your terminal. The device should pick up this new command and switch to start displaying the output from it.

In the output of this command/task, you'll find options to open the app in:

    Android emulator

    Expo Go, a limited sandbox for trying out app development with Expo

🌐 Web

Web previews will be started and managed automatically. Use the toolbar to manually refresh.
📂 Project Structure

    app/: The main React Native frontend (using Expo Router).

        app/(tabs)/: Main screens (Home, Recordings).

        app/context/: RecordingContext manages sensor logic and ZK state.

    circuits/: Contains the compiled .wasm and .zkey files needed for client-side proof generation.

    components/: UI components (Star, WalletModal, etc.).

    contracts/: Solidity smart contracts (SleepRewardToken, Verifier).

    server/: Express.js middleware acting as a relay to Curvegrid MultiBaas.

🧪 Testing ZK Proofs

To ensure the ZK circuits are functioning correctly before running them on mobile:
code Bash

    
cd contracts
npx hardhat test

  

📚 Learn more

    Expo documentation: Learn fundamentals.

    Circom & SnarkJS: Documentation for the ZK stack used.

    Curvegrid MultiBaas: Middleware documentation.