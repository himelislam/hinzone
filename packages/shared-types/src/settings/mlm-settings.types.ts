// One commission percentage per deposit-package amount, per level
// (docs/20-settings-system.md #15) - e.g. level 1 pays 5% on the 3000 package,
// 7% on the 6000 package, etc. Admins can add/remove levels and packages freely.
export interface MlmCommissionRate {
  packageAmount: number;
  commissionPercentage: number;
}

export interface MlmCommissionLevel {
  level: number;
  rates: MlmCommissionRate[];
}

// Different ranks qualify on different combinations of these requirements (e.g.
// direct-referral-count only, or left/right team balance, or total team size) -
// docs/20-settings-system.md #16's examples mix all three, so every requirement
// field is optional and a rank only sets the ones it actually checks.
export interface MlmRank {
  name: string;
  directReferralsRequirement?: number;
  leftTeamRequirement?: number;
  rightTeamRequirement?: number;
  totalTeamRequirement?: number;
  rewardPercentage: number;
}

export interface MlmSettings {
  maximumDirectReferrals: number;
  commissionLevels: MlmCommissionLevel[];
  ranks: MlmRank[];
}
