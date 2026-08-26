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
  },
} as const;

export default API_CONFIG;
