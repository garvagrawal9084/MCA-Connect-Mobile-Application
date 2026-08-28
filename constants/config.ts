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
    },
    PROFILE: {
      ME: "/api/profile/me",
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
      MY_RESULTS: "/api/results/my",
      MY_RESULT: "/api/results/my-result",
      MY_ALL_RESULTS: "/api/results/my-all-results",
      ANALYSIS: "/api/results/analysis",
      ATTEMPT_ANSWERS: "/api/results/attempt",
      SPEED_ANALYSIS: "/api/results/speed-analysis",
      IMPROVEMENT: "/api/results/improvement",
      SUGGESTIONS: "/api/results/suggestions",
      AI_RECOMMENDATION: "/api/results/ai-recommendation",
      COMPARE: "/api/results/compare",
      GLOBAL_LEADERBOARD: "/api/results/leaderboard/global",
      FILTERED_LEADERBOARD: "/api/results/leaderboard/filtered",
      REPORT_PDF: "/api/results/report/pdf",
      REPORT_CSV: "/api/results/report/csv",
      REPORT_EXCEL: "/api/results/report/excel",
    },
  },
} as const;

export default API_CONFIG;
