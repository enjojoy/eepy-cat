// import { ethers } from "ethers";

// const SleepVerifier = await ethers.deployContract("SleepVerifier");
// await SleepVerifier.waitForDeployment();

// const Token = await ethers.deployContract("SleepRewardToken");
// await Token.waitForDeployment();

// const Manager = await ethers.deployContract(
//   "SleepRewardManager",
//   [SleepVerifier.target, Token.target]
// );

// await Manager.waitForDeployment();

// // allow minting
// await Token.transferOwnership(Manager.target);