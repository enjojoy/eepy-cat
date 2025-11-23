pragma circom 2.1.4;

include "circomlib/circuits/comparators.circom";

template LessThanCheck() {
    signal input gyro_count;   // private
    signal input MAX;          // public input via main component

    component isLess = LessThan(32);
    isLess.in[0] <== gyro_count;
    isLess.in[1] <== MAX;

    isLess.out === 1;
}

// Instantiate the main component and declare MAX as a public input
component main { public [MAX] } = LessThanCheck();