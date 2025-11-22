export interface UserData {
  streak: number;
  lastSleepDate: string | null;
  tokens: number;
  lastClaimDate: string | null;
  testingMode?: boolean;
}
