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
  },
} as const;

export default API_CONFIG;
