/**
 * SCIS Connect Mobile - Student Profile Types & Generic Fallback Data
 * Strictly typed interfaces matching the SCIS backend `/api/profile/*` contracts.
 */

import {
  AuthUser,
  ProjectItem,
  SgpaItem,
  SchoolEducation,
  DegreeEducation,
  LeetCodeProfileItem,
  ResumeItem,
  ContactInfo,
  EducationDetails,
  ProfessionalDetails,
} from "@/features/auth/types";

export type UserProfile = AuthUser;

export interface UserProfileResponse {
  user?: UserProfile;
  student?: UserProfile;
  profile?: UserProfile;
  data?: UserProfile;
}

export interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

/**
 * Payload for PATCH /api/profile/ (Core/General Profile Update)
 */
export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  openToWork?: boolean;
  placementStatus?: string;
  communityStatus?: string;
  roll_no?: string;
  batchYear?: number | string;
  location?: string;
  roomNumber?: string;
  profileVisibility?: string;
  introVideo?: string;
  availability?: string[];
  company?: string;
  currentPosition?: string;
  availableForReferral?: boolean;
  availableForMentorship?: boolean;
  resumeLink?: string;
  projects?: ProjectItem[];
  skills?: string[];
  [key: string]: unknown;
}

/**
 * Payload for PATCH /api/profile/contact
 */
export interface UpdateContactRequest {
  mobile?: string;
  alternateMobile?: string;
  whatsappNumber?: string;
  isWhatsappVisible?: boolean;
  isEmailVisible?: boolean;
  isMobileVisible?: boolean;
  personalEmail?: string;
  [key: string]: unknown;
}

/**
 * Payload for PATCH /api/profile/education
 */
export interface UpdateEducationRequest {
  tenth?: SchoolEducation;
  twelfth?: SchoolEducation;
  graduation?: DegreeEducation;
  postGraduation?: DegreeEducation;
  sgpa?: SgpaItem[];
  [key: string]: unknown;
}

/**
 * Payload for PATCH /api/profile/professional
 */
export interface UpdateProfessionalRequest {
  careerObjective?: string;
  currentSkills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  skills?: string[];
  certifications?: string[];
  achievements?: string[];
  hackathons?: string[];
  github?: string;
  linkedin?: string;
  gfg?: string;
  codeforces?: string;
  codechef?: string;
  projects?: ProjectItem[];
  leetcodeUsername?: string;
  [key: string]: unknown;
}

/**
 * Payload for POST /api/profile/password
 */
export interface ChangePasswordRequest {
  currentPassword?: string;
  oldPassword?: string;
  newPassword: string;
  confirmPassword?: string;
  password?: string;
}

/**
 * Response for GET /api/profile/completion
 */
export interface ProfileCompletionResponse {
  percentage?: number;
  completionPercentage?: number;
  completedSections?: string[];
  missingSections?: string[];
  missingFields?: string[];
  score?: number;
  [key: string]: unknown;
}

/**
 * Payload for PATCH /api/profile/resume/:resumeId/rename
 */
export interface RenameResumeRequest {
  title: string;
}

/**
 * Response for POST /api/profile/sync-leetcode
 */
export interface LeetCodeSyncResponse {
  success?: boolean;
  message?: string;
  profile?: LeetCodeProfileItem;
  user?: UserProfile;
  [key: string]: unknown;
}
