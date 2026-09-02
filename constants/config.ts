/**
 * SCIS Connect Mobile - Application & API Configuration
 */

export const API_CONFIG = {
  BASE_URL: "https://mca-connect-backend-production.up.railway.app",
  TIMEOUT_MS: 15000,
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      REFRESH: "/api/auth/refresh",
      FORGOT_PASSWORD: "/api/auth/forgot-password",
      RESET_PASSWORD: "/api/auth/reset-password",
      VERIFY_OTP: "/api/auth/verify-otp",
      ME: "/api/auth/me",
    },
    HOME: {
      DASHBOARD: "/api/dashboard",
    },
    PLACEMENT: {
      LIST: "/api/placements",
    },
    PLACEMENT_CENTER: {
      BASE: "/api/placement",
      DASHBOARD: "/api/placement/dashboard",
      STUDENT_ANALYTICS: "/api/placement/analytics/student",
      JOBS: "/api/placement/jobs",
      APPLICATIONS: "/api/placement/applications/me",
      BOOKMARKS: "/api/placement/bookmarks",
      COLLECTIONS: "/api/placement/collections",
      REMINDERS: "/api/placement/reminders",
      EXPERIENCES: "/api/placement/experiences",
      COMPANIES: "/api/placement/companies",
    },
    NOTIFICATIONS: {
      LIST: "/api/notifications",
      REGISTER_DEVICE: "/api/notifications/register-device",
      UNREGISTER_DEVICE: "/api/notifications/unregister-device",
      PUSH_TOKEN: "/api/notifications/push-token",
      PUSH_EVENTS: "/api/notifications/push-events",
      DELETE: (id: string) => `/api/notifications/${id}`,
      BY_ID: (id: string) => `/api/notifications/${id}`,
    },
    PROFILE: {
      ME: "/api/auth/me",
    },
    ALUMNI: {
      SEARCH: "/api/people/search",
      COMPANIES: "/api/people/companies",
      MENTORS: "/api/mentorship/mentors",
      MENTORSHIP_REQUEST: "/api/mentorship",
      MY_REQUESTS: "/api/mentorship/mine",
      POSTS: "/api/posts",
      FORUMS: "/api/forums",
      COMMUNITY_STATS: "/api/community/stats",
      COMMUNITY_SETTINGS: "/api/community-settings",
      FOLLOW: "/api/follow",
    },
    RESULTS: {
      BASE: "/api/assessments/results",
      MY_RESULTS: "/api/assessments/results/my",
      MY_RESULT: "/api/assessments/results/my-result",
      MY_ALL_RESULTS: "/api/assessments/results/my-all-results",
      COMPUTE: "/api/assessments/results/compute",
      PUBLISH: "/api/assessments/results",
      ANALYSIS: "/api/assessments/results/analysis",
      ATTEMPT_ANSWERS: "/api/assessments/results/attempt",
      SPEED_ANALYSIS: "/api/assessments/results/speed-analysis",
      IMPROVEMENT: "/api/assessments/results/improvement",
      SUGGESTIONS: "/api/assessments/results/suggestions",
      AI_RECOMMENDATION: "/api/assessments/results/ai-recommendation",
      COMPARE: "/api/assessments/results/compare",
      GLOBAL_LEADERBOARD: "/api/assessments/results/leaderboard/global",
      FILTERED_LEADERBOARD: "/api/assessments/results/leaderboard/filtered",
      REPORT_PDF: "/api/assessments/results/report/pdf",
      REPORT_CSV: "/api/assessments/results/report/csv",
      REPORT_EXCEL: "/api/assessments/results/report/excel",
    },
    CHALLENGES: {
      BASE: "/api/challenges",
      MY: "/api/challenges/my",
      GLOBAL_LEADERBOARD: "/api/challenges/leaderboard",
      BY_ID: (id: string) => `/api/challenges/${id}`,
      LEADERBOARD: (id: string) => `/api/challenges/${id}/leaderboard`,
      DAILY_MAX: (id: string, batch?: string) =>
        `/api/challenges/${id}/daily-max${batch ? `?batch=${encodeURIComponent(batch)}` : ""}`,
      JOIN: (id: string) => `/api/challenges/${id}/join`,
      LEAVE: (id: string) => `/api/challenges/${id}/leave`,
    },
    CERTIFICATES: {
      MY: "/api/certificates/my",
      BY_CHALLENGE: (challengeId: string) => `/api/certificates/challenge/${challengeId}`,
      VERIFY: (serial: string) => `/api/certificates/verify/${serial}`,
    },
  },
} as const;

export default API_CONFIG;
