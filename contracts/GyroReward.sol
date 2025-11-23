// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Verifier.sol";

/**
 * @title GyroReward
 * @notice This contract allows users to periodically claim a reward by providing a
 * zk-SNARK proof that their gyro_count was below a certain threshold.
 * It acts as a wrapper for the raw Groth16Verifier.
 */
contract GyroReward {
    Groth16Verifier public immutable verifier;

    /// @notice The required MAX value that must be used in the proof. This is a public input to the circuit.
    uint256 public constant REQUIRED_MAX = 10;
    
    /// @notice The time period a user must wait before claiming again.
    uint256 public constant CLAIM_PERIOD = 1 days;

    /// @notice A mapping to track the last time an address claimed a reward.
    mapping(address => uint256) public lastClaimedTimestamp;

    /// @notice Emitted when a user successfully claims a reward.
    event RewardClaimed(address indexed claimant, uint256 timestamp);

    /**
     * @param _verifierAddress The address of the deployed Groth16Verifier contract.
     */
    constructor(address _verifierAddress) {
        verifier = Groth16Verifier(_verifierAddress);
    }

    /**
     * @notice Allows a user to claim their reward by submitting a valid proof.
     * @param _pA The A point of the proof.
     * @param _pB The B point of the proof.
     * @param _pC The C point of the proof.
     * @param _pubSignals The public signals used in the proof. Must contain REQUIRED_MAX.
     */
    function claimReward(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[1] calldata _pubSignals
    ) public {
        // require(block.timestamp >= lastClaimedTimestamp[msg.sender] + CLAIM_PERIOD, "GyroReward: You cannot claim again so soon.");
        require(_pubSignals[0] == REQUIRED_MAX, "GyroReward: The proof must use the required MAX value.");

        bool success = verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(success, "GyroReward: The provided proof is invalid.");

        lastClaimedTimestamp[msg.sender] = block.timestamp;
        emit RewardClaimed(msg.sender, block.timestamp);
        
        // Future logic can be added here, like minting an NFT or sending tokens.
    }
}

