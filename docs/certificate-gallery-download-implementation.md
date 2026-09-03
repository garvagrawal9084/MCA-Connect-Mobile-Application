# 🏆 Documentation: Certificate Gallery Download & Preview Modal

## 📌 Overview
Implemented the official certificate preview modal and photo gallery export workflow in **Placement Studio -> My Certificates**. 

Students can:
1. View their earned certificates on redesigned cards matching **Image 1** (Trophy rank badge, eye preview button, challenge name, date & questions solved, serial badge, verification link, and download trigger).
2. Tap the **Eye icon** or **Download** on any certificate card to open the **Certificate Preview Modal** matching **Image 2** (official SCIS Connect & University of Hyderabad credential canvas with corner accents, serif recipient name, 3-metric statistics block, QR code, and verified badge).
3. Tap **Download Certificate as PNG** to capture the certificate view in high resolution and save it directly into the student's phone **Photo Gallery** (Camera Roll / Media Library) with runtime permission handling.

---

## 🛠️ Changes Implemented

### 1. Library Dependencies & Permissions (`package.json`, `app.json`)
- Installed Expo SDK 54 compatible packages:
  - `react-native-view-shot` (`4.0.3`): Enables off-screen / on-screen view snapshotting to high-resolution PNG image files.
  - `expo-media-library` (`~18.2.1`): Manages device gallery storage permissions and asset creation on Android and iOS.
- Configured Android permissions and plugin in `app.json`:
  ```json
  "permissions": [
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.VIBRATE",
    "android.permission.WAKE_LOCK",
    "android.permission.READ_MEDIA_IMAGES",
    "android.permission.WRITE_EXTERNAL_STORAGE"
  ],
  "plugins": [
    ...,
    [
      "expo-media-library",
      {
        "photosPermission": "Allow SCIS Connect to save your verified certificates to your photo gallery.",
        "savePhotosPermission": "Allow SCIS Connect to save your verified certificates to your photo gallery."
      }
    ]
  ]
  ```

---

### 2. UI Component Enhancement (`components/placement/PlacementDetailModal.tsx`)

#### A. Certificate Card in List (`renderCertificatesContent`)
Replicated the user's reference design (**Image 1**):
- **Header**: Trophy icon with `Rank #${cert.rank}` in `#8B0000` + circular Eye preview button (`Ionicons name="eye-outline"` in a soft red circle).
- **Body**: Challenge name (e.g., `MCA-CONNECT-SUMMER`), calendar icon with formatted date (`formatCertificateDate`), questions solved count (`cert.totalSolved solved`), and serial number in a light-red monospace pill.
- **Divider & Bottom Actions**:
  - **Verify**: Opens public verification URL (`${API_CONFIG.BASE_URL}/api/certificates/verify/${cert.serial}`) via `openExternalUrl`.
  - **Download**: Opens the Certificate Preview Modal and readies the export view.

#### B. Certificate Preview Modal
Replicated the official certificate canvas (**Image 2**):
- **Container**: Full-screen dark translucent backdrop (`bg-black/85`) with top-right circular close button.
- **Canvas (`collapsable={false}` with `certificateCaptureRef`)**:
  - Top crimson gradient line (`h-2 bg-[#8B0000]`).
  - L-shaped corner accent brackets (top-left, top-right, bottom-left, bottom-right).
  - Background soft salmon corner arcs.
  - **Header**: SCIS Connect crest badge with white ribbon icon, `University of Hyderabad` subtitle, and `SERIAL NO.` with monospace serial number.
  - **Title**: Centered diamond bullet `♦`, `CERTIFICATE OF COMPLETION`, and bold uppercase challenge name.
  - **Recipient**: `presented to`, student name in large bold serif typography (`#8B0000`), roll number and course batch (`25MCMC35 | MCA 2025-27`), and official dedication text.
  - **3-Column Stats Block**:
    - `RANK` (Crimson)
    - `QUESTIONS SOLVED` (Emerald Green)
    - `SCORE` (Crimson)
  - **Footer**: QR Code verification box with live server QR image, dark red `VERIFIED` badge with checkmark (`by SCIS Connect Team / University of Hyderabad`), issue date, and leaderboard link.

#### C. Gallery Download Engine (`handleDownloadCertificateToGallery`)
- Prompts runtime permissions via `MediaLibrary.requestPermissionsAsync()`.
- Captures the exact rendered canvas in full resolution using `captureRef(certificateCaptureRef.current, { format: "png", quality: 1.0, result: "tmpfile" })`.
- Saves the PNG asset into the device's Photo Gallery using `MediaLibrary.saveToLibraryAsync(uri)`.
- Provides haptic feedback and a confirmation alert: *"Certificate Saved! 🏆 Your official certificate has been saved directly to your Photo Gallery as a PNG."*

---

## 🔍 Verification & Type Safety
- Executed `npx tsc --noEmit`: **0 errors**.
- Verified Android & iOS permission handling with graceful fallback dialogs.
- Logging tracked under domain `CERTIFICATES_UI` in `utils/logger.ts`.
