/**
 * SCIS Connect Mobile - Placement Studio & Placement Center Types
 * Strictly defines types matching existing backend models and API contracts.
 */

export interface PlacementFeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badge?: string;
  badgeColor?: string;
  route?: string;
}

export interface CodingChallenge {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  points: number;
  acceptanceRate: string;
  solved: boolean;
  tags: string[];
}

export interface TestResult {
  id: string;
  title: string;
  companyOrTopic: string;
  date: string;
  score: number;
  maxScore: number;
  percentile: number;
  status: "Completed" | "Upcoming" | "Active";
  duration: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  rollNo: string;
  points: number;
  solvedCount: number;
  batch: string;
  isCurrentUser?: boolean;
}

export interface PlacementDrive {
  id: string;
  companyName: string;
  role: string;
  location: string;
  packageRange: string;
  eligibility: string;
  deadline: string;
  status: "Open" | "Closing Soon" | "Shortlisted" | "Applied";
  openings: number;
  skills: string[];
}

export interface CertificateItem {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialId: string;
  grade: string;
  iconName: string;
}

// ─────────────────────────────────────────────────────────────
// Placement Center API Models
// ─────────────────────────────────────────────────────────────

export interface JobEligibility {
  minimumCgpa?: number;
  skills?: string[];
  eligibleBatches?: number[];
  eligibleDepartments?: string[];
  eligibleCourses?: string[];
  targetScope?: string;
  targetRollNumbers?: string[];
  targetUserIds?: string[];
  notes?: string;
}

export interface JobUserState {
  applied: boolean;
  applicationStatus: string | null;
  saved: boolean;
  collectionId: string | null;
  reminder: boolean;
  reminderAt: string | null;
}

export interface CompanyItem {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  careersUrl?: string;
  verified?: boolean;
  stats?: {
    totalJobs?: number;
  };
}

export interface PlacementJob {
  _id: string;
  title: string;
  company?: CompanyItem | string | null;
  companyName: string;
  companyLogo?: string;
  jobType: "job" | "internship" | string;
  employmentType?: "full_time" | "part_time" | "contract" | "internship" | string;
  mode?: "onsite" | "hybrid" | "remote" | string;
  location?: string;
  package?: number; // In LPA (₹)
  stipend?: number; // Monthly (₹)
  applicationDeadline?: string;
  description?: string;
  requirements?: string[] | string;
  responsibilities?: string[] | string;
  eligibility?: JobEligibility;
  status: "draft" | "published" | "scheduled" | "closed" | "expired" | "archived";
  derivedStatus?: "published" | "open" | "closing_soon" | "expired" | "closed" | string;
  verified?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  views?: number;
  applicationCount?: number;
  applyUrl?: string;
  postedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  userState?: JobUserState;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlacementDashboardStats {
  openJobs: number;
  internships: number;
  newThisWeek: number;
  applications: number;
  saved: number;
  reminders: number;
}

export interface JobApplication {
  _id: string;
  job: PlacementJob | string;
  user: string;
  currentStatus:
    | "submitted"
    | "under_review"
    | "shortlisted"
    | "interview_scheduled"
    | "rejected"
    | "selected"
    | string;
  resume?: string;
  coverLetter?: string;
  appliedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedOpportunity {
  _id: string;
  job: PlacementJob | string;
  collectionId?: string | null;
  createdAt?: string;
}

export interface JobReminder {
  _id: string;
  job: PlacementJob | string;
  remindAt: string;
  status: "scheduled" | "sent" | "cancelled";
  createdAt?: string;
}

export interface InterviewRound {
  roundName: string;
  roundType?: string;
  description?: string;
  questions?: string[];
}

export interface InterviewExperience {
  _id: string;
  company: string;
  role: string;
  jobType?: string;
  authorName?: string;
  authorRollNo?: string;
  batch?: string | number;
  verdict: "selected" | "rejected" | "pending";
  difficulty: "Easy" | "Medium" | "Hard";
  rounds?: InterviewRound[];
  overallExperience?: string;
  preparationTips?: string;
  upvotes?: number;
  hasUpvoted?: boolean;
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
}

export interface PlacementCollection {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  count?: number;
  createdAt?: string;
}

export interface PlacementQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  company?: string;
  jobType?: string;
  mode?: string;
  employmentType?: string;
  companyId?: string;
  verified?: boolean | string;
  isFeatured?: boolean | string;
  minPackage?: number;
  minStipend?: number;
  batch?: number;
  department?: string;
  course?: string;
  skill?: string;
  deadline?: "closing_soon" | "open" | "expired";
  timeframe?: "today" | "week" | "expired";
  sort?: "newest" | "oldest";
  status?: string;
}

export interface JobsListResponse {
  jobs: PlacementJob[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface DashboardResponse {
  stats: PlacementDashboardStats;
  latestJobs?: PlacementJob[];
  closingSoon?: PlacementJob[];
  featuredJobs?: PlacementJob[];
}
