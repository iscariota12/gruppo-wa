export interface Member {
  id: string;
  displayName: string;
  color: string;
  initials: string;
  total: number;
}

export interface RankingEntry {
  rank: number;
  memberId: string;
  total: number;
  percentage: number;
}

export interface TimelinePoint {
  date: string;
  memberId: string;
  cumulative: number;
}

export interface DailyCount {
  date: string;
  memberId: string;
  count: number;
}

export interface StreakHighlight {
  memberId: string;
  days: number;
  from: string | null;
  to: string | null;
}

export interface ComebackHighlight {
  memberId: string;
  rankAtMidpoint: number;
  finalRank: number;
  positionsGained: number;
  overtakeStory?: OvertakeStory;
}

export interface EarlyRecoveryHighlight {
  memberId: string;
  rankAtEarly: number;
  rankAtMidpoint: number;
  finalRank: number;
  positionsGainedFromEarly: number;
  earlyPhaseEnd: string;
  overtakeStory?: OvertakeStory;
}

export interface OvertakeEvent {
  date: string;
  passerId: string;
  passedId: string;
  passerTotal: number;
  passedTotal: number;
}

export interface OvertakeStory {
  keyOvertakes: OvertakeEvent[];
  chart: {
    from: string;
    to: string;
    memberIds: string[];
    points: TimelinePoint[];
  };
}

export interface ReportData {
  meta: {
    periodStart: string;
    periodEnd: string;
    totalVisits: number;
    totalDays: number;
    dailyAverage: number;
    generatedAt: string;
  };
  members: Member[];
  ranking: RankingEntry[];
  timeline: TimelinePoint[];
  dailyCounts: DailyCount[];
  highlights: {
    singleDayRecord: { memberId: string; date: string; count: number };
    longestVisitStreak: StreakHighlight;
    longestDryStreak: StreakHighlight;
    bestComeback: ComebackHighlight;
    earlyRecovery: EarlyRecoveryHighlight | null;
  };
  extras: {
    busiestDay: { date: string; count: number };
    preferredTimeSlot: {
      global: string;
      globalCounts: Record<string, number>;
      byMember: Record<string, string>;
    };
    weekendWarrior: {
      memberId: string;
      weekendCount: number;
      weekdayCount: number;
      weekendPercentage: number;
    };
    firstOfDay: { memberId: string; count: number };
    nightOwl: { memberId: string; count: number };
    midpointVsFinal: Array<{
      memberId: string;
      rankAtMidpoint: number;
      finalRank: number;
      change: number;
    }>;
  };
}

export type MemberMap = Record<string, Member>;
