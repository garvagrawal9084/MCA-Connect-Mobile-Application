/**
 * SCIS Connect Mobile - Student Profile Types & Generic Fallback Data
 * Strictly typed interfaces matching the SCIS backend `/api/auth/me` contract.
 */

import { AuthUser } from "@/features/auth/types";

export type UserProfile = AuthUser;

export interface UserProfileResponse {
  user: UserProfile;
}

export interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

/**
 * Generic random dummy profile used purely for layout previews or offline fallbacks.
 * Contains no personal or real user data.
 */
export const DUMMY_PROFILE_DATA: UserProfile = {
  id: "demo-user-001",
  _id: "demo-user-001",
  name: "Alex Doe",
  email: "alex.doe@uohyd.ac.in",
  universityEmail: "alex.doe@uohyd.ac.in",
  personalEmail: "alex.doe@example.com",
  universityEmailVerified: true,
  personalEmailVerified: true,
  loginEmailType: "university",
  roll_no: "25MCMC00",
  role: "user",
  isActive: true,
  isEmailVerified: true,
  batchYear: 2025,
  program: null,
  accountType: "Student",
  recruiterApprovalStatus: "Pending",
  facultyApprovalStatus: null,
  roomNumber: "",
  communityStatus: "Current Student",
  phone: "",
  bio: "Computer Science student passionate about software engineering, distributed systems, and modern full-stack development.",
  profileImage: "",
  avatar: "",
  avatarUrl: "",
  github: "https://github.com",
  linkedin: "https://linkedin.com",
  gfg: "",
  codeforces: "",
  codechef: "",
  sgpa: [
    {
      sem: 1,
      sgpa: 8.0,
      _id: "demo-sgpa-1",
    },
    {
      sem: 2,
      sgpa: 8.5,
      _id: "demo-sgpa-2",
    },
  ],
  skills: [
    "C++",
    "Python",
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
  ],
  projects: [
    {
      title: "Sample Web App",
      description: "A full-stack collaborative application built with modern technologies.",
      link: "https://github.com",
      _id: "demo-proj-1",
    },
  ],
  leetcode_profiles: [
    {
      username: "demo_user",
      avatar: null,
      ranking: null,
      reputation: null,
      totalSolved: 150,
      easySolved: 50,
      mediumSolved: 80,
      hardSolved: 20,
      date: new Date().toISOString(),
      baselineSolved: 100,
    },
  ],
  resumes: [],
  resumeLink: "",
  contact: {
    mobile: "",
    alternateMobile: "",
    whatsappNumber: "",
    isWhatsappVisible: false,
    _id: "demo-contact-1",
    isEmailVisible: false,
    isMobileVisible: false,
    id: "demo-contact-1",
  },
  education: {
    _id: "demo-edu-1",
    tenth: {
      board: "CBSE",
      schoolName: "Example High School",
      passingYear: 2020,
      percentage: 85,
      scoreType: "Percentage",
      cgpa: null,
    },
    twelfth: {
      board: "CBSE",
      schoolName: "Example Senior Secondary",
      passingYear: 2022,
      percentage: 85,
      scoreType: "Percentage",
      cgpa: null,
    },
    graduation: {
      degree: "BCA",
      collegeName: "Example College",
      university: "Example University",
      passingYear: 2025,
      cgpa: 8.5,
      scoreType: "CGPA",
      percentage: null,
    },
    postGraduation: {
      degree: "MCA",
      collegeName: "SCIS",
      university: "University Of Hyderabad",
      currentSemester: 3,
      expectedGraduationYear: 2027,
      cgpa: 8.2,
      scoreType: "CGPA",
      percentage: null,
    },
    id: "demo-edu-1",
  },
  professionalDetails: {
    careerObjective: "",
    currentSkills: [],
    technicalSkills: [],
    softSkills: [],
    certifications: [],
    achievements: [],
    hackathons: [],
    _id: "demo-prof-1",
    id: "demo-prof-1",
  },
  notificationPreferences: {
    emailEnabled: true,
    challengeEmails: true,
    reminderEmails: true,
    followerEmails: true,
    announcementEmails: true,
    weeklyReports: true,
    inAppNotifications: true,
    _id: "demo-pref-1",
    id: "demo-pref-1",
  },
  profileVisibility: "PUBLIC",
  placementStatus: "SEEKING",
  openToWork: true,
  availability: ["INTERNSHIP", "FULL_TIME"],
  location: "Hyderabad",
  introVideo: "",
  company: "",
  currentPosition: "",
  availableForReferral: false,
  availableForMentorship: false,
  createdAt: new Date().toISOString(),
  createdBy: null,
};
