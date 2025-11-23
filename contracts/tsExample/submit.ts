// import { ethers } from "ethers";

// // TODO replace this with the real address
// const managerAddress = "0xREWARDMANAGER";

// export async function submitProof(proof, pub) {
//   const provider = new ethers.BrowserProvider(window.ethereum);
//   const signer = await provider.getSigner();

//   const contract = new ethers.Contract(managerAddress, abi, signer);

//   await contract.claimReward(
//     proof.pi_a,
//     proof.pi_b,
//     proof.pi_c,
//     pub
//   );
// }