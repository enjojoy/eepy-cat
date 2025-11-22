
export interface SleepData {
  startTime: number;
  endTime: number;
  duration: number;
  movementData: { timestamp: number; movement: number }[];
}
