export interface AlumniProfileImage {
  url: string;
  publicId: string;
}

export interface EducationDetail {
  board?: string;
  schoolName?: string;
  degree?: string;
  collegeName?: string;
  university?: string;
  passingYear?: number;
  scoreType?: string;
  percentage?: number;
  cgpa?: number;
  currentSemester?: number;
  expectedGraduationYear?: number;
}

export interface ResumeItem {
  _id?: string;
  title?: string;
  url: string;
  publicId?: string;
  uploadedAt?: string;
  isPrimary?: boolean;
}

export interface LeetcodeProfile {
  username: string;
  avatar?: string;
  ranking?: number;
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
}

export interface ProjectItem {
  _id?: string;
  title: string;
  description?: string;
  link?: string;
}

export interface SgpaItem {
  sem: number;
  sgpa: number;
}

export interface ContactInfo {
  mobile?: string;
  alternateMobile?: string;
  whatsappNumber?: string;
  isWhatsappVisible?: boolean;
  isMobileVisible?: boolean;
  isEmailVisible?: boolean;
}

export interface ProfessionalDetails {
  careerObjective?: string;
  currentSkills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  certifications?: string[];
  achievements?: string[];
  hackathons?: string[];
}

export interface AlumniUser {
  _id: string;
  name: string;
  email: string;
  roll_no?: string;
  profileImage?: AlumniProfileImage;
  bio?: string;
  linkedin?: string;
  github?: string;
  gfg?: string;
  codeforces?: string;
  codechef?: string;
  company?: string;
  currentPosition?: string;
  location?: string;
  skills?: string[];
  batchYear?: number | string;
  program?: { _id: string; name: string; code: string } | null;
  communityStatus?: string;
  openToWork?: boolean;
  availableForReferral?: boolean;
  availableForMentorship?: boolean;
  accountType?: string;
  followers?: string[];
  following?: string[];
  placementStatus?: string;
  resumeLink?: string;
  resumes?: ResumeItem[];
  education?: {
    tenth?: EducationDetail;
    twelfth?: EducationDetail;
    graduation?: EducationDetail;
    postGraduation?: EducationDetail;
  };
  professionalDetails?: ProfessionalDetails;
  leetcode_profiles?: LeetcodeProfile[];
  projects?: ProjectItem[];
  sgpa?: SgpaItem[];
  contact?: ContactInfo;
  personalEmail?: string;
  universityEmail?: string;
  roomNumber?: string;
  introVideo?: string;
  availability?: string[];
}

export interface AlumniSearchFilters {
  q?: string;
  batch?: string;
  company?: string;
  skills?: string[];
  accountType?: string;
  stream?: string;
  openToWork?: boolean;
  availableForReferral?: boolean;
  availableForMentorship?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PeopleSearchResponse {
  people: AlumniUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CompanyGroup {
  company: string;
  count: number;
  members: {
    _id: string;
    name: string;
    roll_no?: string;
    currentPosition?: string;
    profileImage?: AlumniProfileImage;
  }[];
}

export interface CompaniesResponse {
  companies: CompanyGroup[];
}

export interface Mentor {
  _id: string;
  name: string;
  email: string;
  roll_no?: string;
  profileImage?: AlumniProfileImage;
  bio?: string;
  skills?: string[];
  company?: string;
  currentPosition?: string;
  location?: string;
  batchYear?: number | string;
  program?: { _id: string; name: string; code: string } | null;
  communityStatus?: string;
  availableForMentorship?: boolean;
}

export interface MentorshipRequest {
  _id: string;
  fromUser: AlumniUser;
  toUser: AlumniUser;
  areas: string[];
  message: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipRequestPayload {
  toUserId: string;
  areas: string[];
  message: string;
}

export interface CommunityPost {
  _id: string;
  author: {
    _id: string;
    name: string;
    roll_no?: string;
    profileImage?: AlumniProfileImage;
    company?: string;
    currentPosition?: string;
    accountType?: string;
  };
  content: string;
  type: "post" | "job" | "story" | "question" | "referral";
  tags?: string[];
  company?: string;
  position?: string;
  location?: string;
  link?: string;
  likes?: string[];
  comments?: {
    _id: string;
    author: {
      _id: string;
      name: string;
      profileImage?: AlumniProfileImage;
    };
    text: string;
    createdAt: string;
  }[];
  views?: number;
  pinned?: boolean;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityStats {
  studentsRegistered: number;
  seniorsRegistered: number;
  alumniRegistered: number;
  recruitersRegistered: number;
  totalRegistered: number;
  resumesUploaded: number;
  totalLeetCodeSolved: number;
  followersConnections: number;
}

export interface ForumTopic {
  _id: string;
  author: {
    _id: string;
    name: string;
    roll_no?: string;
    profileImage?: AlumniProfileImage;
  };
  title: string;
  content: string;
  tags?: string[];
  replies?: {
    _id: string;
    author: {
      _id: string;
      name: string;
      profileImage?: AlumniProfileImage;
    };
    text: string;
    createdAt: string;
  }[];
  likes?: string[];
  views?: number;
  pinned?: boolean;
  closed?: boolean;
  likeCount?: number;
  replyCount?: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AlumniTab = "directory" | "mentors" | "community" | "companies";
