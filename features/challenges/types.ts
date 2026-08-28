/**
 * SCIS Connect Mobile - Challenges & Certificates Types
 * Adheres strictly to the backend schemas in challengeController.js and certificateRoutes.js
 */

export interface LeetCodeProfile {
  username: string;
  baselineSolved?: number;
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  ranking?: number;
  lastSyncedAt?: string;
}

export interface ChallengeUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  roll_no?: string;
  role?: string;
  isActive?: boolean;
  leetcode_profiles?: LeetCodeProfile[];
}

export interface ChallengeCreator {
  _id: string;
  id?: string;
  name: string;
  email: string;
}

export interface Challenge {
  _id: string;
  id?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  createdBy?: ChallengeCreator | string;
  users?: (ChallengeUser | string)[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MyChallengeItem {
  challenge: Challenge;
  joinedAt?: string;
  previousSolved: number;
  currentSolved: number;
  gainedSolved: number;
  score: number;
  rank?: number;
  lastSyncAt?: string;
}

export interface SolvedQuestion {
  title: string;
  titleSlug?: string;
  difficulty?: "Easy" | "Medium" | "Hard" | string;
  timestamp?: string | number;
  url?: string;
}

export interface ChallengeDailySolve {
  _id: string;
  challenge: string;
  user: ChallengeUser;
  leetcodeUsername: string;
  date: string;
  dailySolveCount: number;
  solvedQuestions: SolvedQuestion[];
  syncedBy?: string;
  syncedAt?: string;
}

export interface ChallengeDetailResponse {
  challenge: Challenge;
  solves: ChallengeDailySolve[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  roll_no?: string;
  challengeId?: string;
  previous: number;
  current: number;
  increase: number;
  score: number;
}

export interface DailyMaxRecord {
  user: ChallengeUser;
  leetcodeUsername: string;
  date: string;
  dailySolveCount: number;
  questions?: SolvedQuestion[];
}

export interface Certificate {
  _id: string;
  id?: string;
  serial: string;
  challenge: string | Challenge;
  user: string | ChallengeUser;
  challengeName?: string;
  studentName?: string;
  rollNo?: string;
  rank?: number;
  totalSolved?: number;
  score?: number;
  issueDate: string;
  certificateUrl?: string;
  verificationUrl?: string;
  status?: "issued" | "revoked" | "pending";
}

export interface SyncSolvesResultItem {
  user: ChallengeUser;
  leetcodeUsername: string | null;
  skipped: boolean;
  reason?: string;
  dailySolveCount?: number;
  solvedQuestions?: SolvedQuestion[];
}

export interface SyncSolvesResponse {
  date: string;
  results: SyncSolvesResultItem[];
}
