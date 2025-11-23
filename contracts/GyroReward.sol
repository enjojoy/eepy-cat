// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Verifier.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GyroRewardStreak
 * @notice Users periodically claim rewards using a ZK proof that their
 * gyro_count < REQUIRED_MAX. Each successful claim increases a streak
 * and a total score. Missing a day resets the streak.
 */
contract GyroRewardStreak is Ownable {

    Groth16Verifier public immutable verifier;

    /// @notice The required MAX value enforced inside the proof.
    uint256 public REQUIRED_MAX = 10;

    /// @notice Minimum time between claims.
    uint256 public CLAIM_PERIOD = 1 days;

    /// @notice User streak of consecutive valid daily claims.
    mapping(address => uint256) public streak;

    /// @notice Total accumulated points for each user.
    mapping(address => uint256) public score;

    /// @notice Last timestamp each user successfully claimed.
    mapping(address => uint256) public lastClaimedTimestamp;

    /// @notice Emitted when a user successfully claims a reward.
    event RewardClaimed(
        address indexed user,
        uint256 timestamp,
        uint256 newStreak,
        uint256 newScore
    );

    constructor(address _verifier, address _owner) Ownable(_owner) {
        verifier = Groth16Verifier(_verifier);
    }

    /**
     * @notice Set the required MAX value enforced inside the proof.
     * @param _newMax The new REQUIRED_MAX value.
     */
    function setRequiredMax(uint256 _newMax) external onlyOwner {
        require(_newMax > 0, "GyroReward: REQUIRED_MAX must be greater than 0");
        REQUIRED_MAX = _newMax;
    }

    /**
     * @notice Set the minimum time between claims.
     * @param _newPeriod The new CLAIM_PERIOD value in seconds.
     */
    function setClaimPeriod(uint256 _newPeriod) external onlyOwner {
        require(_newPeriod > 0, "GyroReward: CLAIM_PERIOD must be greater than 0");
        CLAIM_PERIOD = _newPeriod;
    }

    /**
     * @notice Claim reward with proof that gyro_count < REQUIRED_MAX.
     * Increases streak if claiming on time, resets if late.
     * @param _user The address to claim rewards for
     * @param _pA Groth16 proof data (A point)
     * @param _pB Groth16 proof data (B point)
     * @param _pC Groth16 proof data (C point)
     * @param _pubSignals Should contain exactly one value: REQUIRED_MAX
     */
    function claimReward(
        address _user,
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[1] calldata _pubSignals
    ) public {
        uint256 lastTime = lastClaimedTimestamp[_user];
        uint256 nowTime = block.timestamp;

        // 1. Enforce cooldown (can't claim too early)
        require(
            nowTime >= lastTime + CLAIM_PERIOD,
            "GyroReward: Claiming too soon"
        );

        // 2. Ensure the proof uses the correct MAX value
        require(
            _pubSignals[0] == REQUIRED_MAX,
            "GyroReward: Wrong MAX value"
        );

        // 3. Verify the zkSNARK proof
        bool success = verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        require(success, "GyroReward: Invalid proof");

        // 4. Update streak
        if (lastTime == 0) {
            // First time ever → streak = 1
            streak[_user] = 1;
        } else if (nowTime < lastTime + 2 * CLAIM_PERIOD) {
            // Less than 48h since last claim → continue streak
            streak[_user] += 1;
        } else {
            // Missed a day → reset streak
            streak[_user] = 1;
        }

        // 5. Score increases by streak amount (streak-based scoring)
        // Example:
        // Day 1 → +1
        // Day 2 → +2
        // Day 3 → +3
        score[_user] += streak[_user];

        // 6. Update last claim timestamp
        lastClaimedTimestamp[_user] = nowTime;

        emit RewardClaimed(
            _user,
            nowTime,
            streak[_user],
            score[_user]
        );
    }
}