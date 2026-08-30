/**
 * SCIS Connect Mobile - Authentication Types
 * Strictly typed interfaces matching the SCIS backend contracts.
 */

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export interface ProgramInfo {
  id?: string;
  _id?: string;
  name: string;
  code: string;
}

export interface SgpaItem {
  sem: number;
  sgpa: number;
  _id?: string;
  id?: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  link: string;
  _id?: string;
  id?: string;
}

export interface LeetCodeProfileItem {
  username: string;
  avatar?: string | null;
  ranking?: number | string | null;
  reputation?: number | string | null;
  totalSolved: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  date?: string;
  baselineSolved?: number;
}

export interface ResumeItem {
  id?: string;
  _id?: string;
  title: string;
  url: string;
  uploadedAt?: string;
  isPrimary?: boolean;
}

export interface ContactInfo {
  mobile?: string;
  alternateMobile?: string;
  whatsappNumber?: string;
  isWhatsappVisible?: boolean;
  isEmailVisible?: boolean;
  isMobileVisible?: boolean;
  id?: string;
  _id?: string;
}

export interface SchoolEducation {
  board?: string;
  schoolName?: string;
  passingYear?: number;
  percentage?: number | null;
  scoreType?: string;
  cgpa?: number | null;
}

export interface DegreeEducation {
  degree?: string;
  collegeName?: string;
  university?: string;
  passingYear?: number;
  cgpa?: number | null;
  scoreType?: string;
  percentage?: number | null;
  currentSemester?: number;
  expectedGraduationYear?: number | string;
  id?: string;
  _id?: string;
}

export interface EducationDetails {
  tenth?: SchoolEducation;
  twelfth?: SchoolEducation;
  graduation?: DegreeEducation;
  postGraduation?: DegreeEducation;
  id?: string;
  _id?: string;
}

export interface ProfessionalDetails {
  careerObjective?: string;
  currentSkills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  certifications?: string[];
  achievements?: string[];
  hackathons?: string[];
  id?: string;
  _id?: string;
}

export interface NotificationPreferencesConfig {
  emailEnabled?: boolean;
  challengeEmails?: boolean;
  reminderEmails?: boolean;
  followerEmails?: boolean;
  announcementEmails?: boolean;
  weeklyReports?: boolean;
  inAppNotifications?: boolean;
  id?: string;
  _id?: string;
}

export interface AuthUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  universityEmail?: string;
  personalEmail?: string;
  universityEmailVerified?: boolean;
  personalEmailVerified?: boolean;
  loginEmailType?: string;
  roll_no?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  batchYear?: number | string;
  program?: ProgramInfo | null;
  studentId?: string;
  course?: string;
  semester?: number;
  accountType?: string;
  recruiterApprovalStatus?: string;
  facultyApprovalStatus?: string | null;
  roomNumber?: string;
  communityStatus?: string;
  phone?: string;
  bio?: string;
  profileImage?: string;
  avatar?: string;
  avatarUrl?: string;
  github?: string;
  linkedin?: string;
  gfg?: string;
  codeforces?: string;
  codechef?: string;
  sgpa?: SgpaItem[];
  skills?: string[];
  projects?: ProjectItem[];
  leetcode_profiles?: LeetCodeProfileItem[];
  resumes?: ResumeItem[];
  resumeLink?: string;
  contact?: ContactInfo;
  education?: EducationDetails;
  professionalDetails?: ProfessionalDetails;
  notificationPreferences?: NotificationPreferencesConfig;
  profileVisibility?: string;
  placementStatus?: string;
  openToWork?: boolean;
  availability?: string[];
  location?: string;
  introVideo?: string;
  company?: string;
  currentPosition?: string;
  availableForReferral?: boolean;
  availableForMentorship?: boolean;
  community?: {
    _id?: string;
    id?: string;
    name?: string;
    code?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
}

export interface LoginResponseData {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenResponseData {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenErrorData {
  requiresVerification?: boolean;
  email?: string;
}

export interface EmailNotVerifiedErrorData {
  requiresVerification?: boolean;
  email?: string;
  message?: string;
  resendUrl?: string;
  helpUrl?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ForgotPasswordFormErrors {
  email?: string;
  general?: string;
}
