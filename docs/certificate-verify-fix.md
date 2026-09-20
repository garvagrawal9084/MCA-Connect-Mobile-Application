# 🪪 Documentation: Certificate Verification Fix in Placement Studio

## 📌 Overview
Fixed the "Verify" action link and QR code target under **Placement -> Placement Studio -> My Certificates**. 

Prior to this fix, clicking "Verify" or scanning the QR code on a student's certificate directed users to the Railway backend API endpoint (`https://mca-connect-backend-production.up.railway.app/api/certificates/verify/:serial`), resulting in raw REST JSON responses in the external browser. 

This update directs students and external scanners to the official SCIS Connect web verification platform (`https://scisconnect.up.railway.app/certificate/verify/:serial`), integrated seamlessly within an in-app browser with SCIS theme branding.

---

## 🛠️ Changes Implemented

### 1. Centralized Application Configuration (`constants/config.ts`)
- Configured `API_CONFIG.WEB_URL`:
  ```typescript
  export const API_CONFIG = {
    BASE_URL: "https://mca-connect-backend-production.up.railway.app",
    WEB_URL: "https://scisconnect.up.railway.app",
    ...
  ```
- Added a centralized `VERIFY_WEB` URL builder under `API_CONFIG.ENDPOINTS.CERTIFICATES`:
  ```typescript
  CERTIFICATES: {
    MY: "/api/certificates/my",
    BY_CHALLENGE: (challengeId: string) => `/api/certificates/challenge/${challengeId}`,
    VERIFY: (serial: string) => `/api/certificates/verify/${serial}`,
    VERIFY_WEB: (serial: string) =>
      `https://scisconnect.up.railway.app/certificate/verify/${encodeURIComponent(serial)}`,
  }
  ```

---

### 2. UI Component Enhancement (`components/placement/PlacementDetailModal.tsx`)

#### A. Certificate Card Action Streamlining (`renderCertificatesContent`)
- **Direct Download Action**:
  - Streamlined the certificate card footer to feature a clean, right-aligned "Download" action button.
  - Removed the redundant "Verify" button from the card list since students can directly tap "Download" to open the high-fidelity Certificate Preview Modal (which includes the recipient details, stats, verified badge, and scan-to-verify QR code).
  - Tapping "Download" allows immediate inspection on the preview canvas and high-resolution PNG export directly into the device's photo gallery.

#### B. Certificate Preview Modal & PNG Export Canvas
- **QR Code Verification URL**:
  - Updated the QR generator image API source from the backend API endpoint to the public web verification endpoint:
    ```typescript
    https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
      API_CONFIG.ENDPOINTS.CERTIFICATES.VERIFY_WEB(
        (selectedCertificateForPreview.serial || "").trim()
      )
    )}
    ```
- **Direct Tap-to-Verify on QR Code**:
  - Wrapped the QR code box in a touchable handler so students viewing their certificate preview on a mobile device can tap the QR box to verify the credential online without needing a second device camera.

---

## 🔍 Verification & Testing
- **TypeScript**: `npx tsc --noEmit` passed with 0 errors.
- **ESLint**: `npm run lint` passed with 0 errors.
- **Web Verification Endpoint**: Verified `https://scisconnect.up.railway.app/certificate/verify/:serial` responds with HTTP 200 and loads the React verification view.
- **QR Code Target**: Verified QR code encodes the canonical web URL.
- **Diagnostic Logging**: Documented in `logs/errors.log` under `[CERTIFICATE_VERIFICATION_URL_FIX]`.
