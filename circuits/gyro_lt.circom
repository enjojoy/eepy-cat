pragma circom 2.1.4;

/**
 * @title Gyro Less Than Circuit
 * @notice ZK circuit that proves gyro_count < MAX without revealing gyro_count
 * @dev Used in GyroReward contract to verify users meet the gyro threshold
 */

include "circomlib/circuits/comparators.circom";

template LessThanCheck() {
    // Private input: the actual gyro count (not revealed in proof)
    signal input gyro_count;
    
    // Public input: the maximum allowed value (revealed in proof)
    signal input MAX;

    // Use 32-bit comparison (supports values up to 2^32 - 1)
    component isLess = LessThan(32);
    isLess.in[0] <== gyro_count;
    isLess.in[1] <== MAX;

    // Enforce that gyro_count < MAX (isLess.out must be 1)
    isLess.out === 1;
}

// Main component: MAX is public (visible on-chain), gyro_count is private (hidden)
component main { public [MAX] } = LessThanCheck();