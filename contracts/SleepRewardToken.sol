// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Verifier.sol";
import "./EepyToken.sol";

contract SleepRewardManager {

    Groth16Verifier public verifier;
    EepyToken public token;

    mapping(address => uint256) public lastClaimedEpoch;
    /// @notice User streak of consecutive valid daily claims.
    mapping(address => uint256) public streak;

    uint256 public constant BASE_REWARD_AMOUNT = 10; // Base reward: 10 Eepy
    uint256 public constant EPOCH_LENGTH = 1 days;

    /// @notice Emitted when a user successfully claims a reward.
    event RewardClaimed(
        address indexed user,
        uint256 epoch,
        uint256 streak,
        uint256 rewardAmount
    );

    constructor(address _verifier, address _token) {
        verifier = Groth16Verifier(_verifier);
        token = EepyToken(_token);
    }

    /**
     * @notice Calculate reward amount based on streak.
     * @param _streak The current streak value.
     * @return The reward amount (base reward * streak).
     */
    function calculateReward(uint256 _streak) public pure returns (uint256) {
        // Reward escalates with streak: base * streak
        // Day 1: 10 tokens, Day 2: 20 tokens, Day 3: 30 tokens, etc.
        return BASE_REWARD_AMOUNT * _streak;
    }

    /**
     * @notice Claim reward with proof of successful sleep.
     * @param _user The address to claim rewards for.
     * @param a Groth16 proof data (A point)
     * @param b Groth16 proof data (B point)
     * @param c Groth16 proof data (C point)
     * @param publicInput Should contain exactly one value: 1 (indicating successful sleep)
     */
    function claimReward(
        address _user,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[1] memory publicInput   // out == 1
    ) external {
        uint256 currentEpoch = block.timestamp / EPOCH_LENGTH;
        uint256 lastEpoch = lastClaimedEpoch[_user];

        require(currentEpoch > lastEpoch, "Already claimed this epoch");

        // require(publicInput[0] == 1, "Proof must indicate successful sleep");

        // TODO re add the verifyProof
        // require(verifier.verifyProof(a, b, c, publicInput), "Invalid ZK proof");

        // Update streak: increment if consecutive, reset if missed
        if (lastEpoch == 0) {
            // First time ever → streak = 1
            streak[_user] = 1;
        } else if (currentEpoch == lastEpoch + 1) {
            // Consecutive epoch → increment streak
            streak[_user] += 1;
        } else {
            // Missed one or more epochs → reset streak
            streak[_user] = 1;
        }

        // Calculate reward based on streak
        uint256 rewardAmount = calculateReward(streak[_user]);

        // Update last claimed epoch
        lastClaimedEpoch[_user] = currentEpoch;

        // Mint tokens
        token.mint(_user, rewardAmount);

        emit RewardClaimed(_user, currentEpoch, streak[_user], rewardAmount);
    }
}