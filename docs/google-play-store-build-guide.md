# 🚀 Google Play Store Build Guide: SCIS Connect Mobile

> **Target:** Google Play Console  
> **Package Name:** `com.scis.connect`  
> **Format:** Android App Bundle (`.aab`)  
> **Status:** Production Release Reference  
> **Conformity:** Strict adherence to [app/AGENTS.md](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/AGENTS.md)  

---

## 1. Google Play Store Requirements

To publish an app on Google Play Store, Google requires:
1. **Android App Bundle (`.aab`)**: Since August 2021, APKs (`.apk`) are no longer accepted for new app submissions. Google Play requires the `.aab` format.
2. **Production Release Keystore**: The bundle must be signed with a production upload key (not the `debug.keystore`).
3. **Unique Version Code**: Every upload must have an incremented `versionCode` (e.g. `1`, `2`, `3`...).
4. **Target SDK 34+**: Target Android 14+ (already configured in `build.gradle`).
5. **Privacy Policy & Permissions Declaration**: Specifically for `POST_NOTIFICATIONS`.

---

## 2. Method 1: EAS Cloud Build (Recommended & Automated)

Because your project is an Expo project with EAS configured in `eas.json`:

```json
"production": {
  "channel": "production",
  "autoIncrement": true
}
```

### Step 1: Run EAS Production Build
Execute the following command in your terminal:
```bash
npx eas-cli build --platform android --profile production
```

### Step 2: What EAS Does Automatically
1. **Keystore Management**: EAS prompts you to generate a new production Android Keystore (or you can let EAS manage it automatically). EAS securely stores the key.
2. **Version Code Auto-Increment**: `autoIncrement: true` automatically increments the build number on EAS servers.
3. **Generates `.aab`**: Bundles the code with ProGuard minification and outputs an optimized `.aab` file.
4. **Download**: Once finished, EAS provides a direct download link for the `.aab` file to upload to the Google Play Console.

---

## 3. Method 2: Local Android Studio Build (Free & Local)

If you prefer building locally via Android Studio without EAS Cloud queues:

### Step 1: Generate a Production Keystore
Run `keytool` in your terminal to create your release keystore:
```bash
keytool -genkeypair -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
*(Store this file safely and never commit it to public git).*

### Step 2: In Android Studio GUI
1. Open the `/Users/garvagrawal/Documents/Coding/MCA-CONNECT/android` folder in **Android Studio**.
2. Click **Build** > **Generate Signed Bundle / APK...**
3. Select **Android App Bundle** and click **Next**.
4. Choose the `my-upload-key.keystore` file, enter your password, alias, and key password.
5. Select build variant: **`release`**.
6. Click **Create**.
7. Your `.aab` will be generated at:
   `android/app/release/app-release.aab`

### Step 3: Via Terminal (Gradle CLI)
```bash
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew bundleRelease
```
Output:
`android/app/build/outputs/bundle/release/app-release.aab`

---

## 4. Google Play Console Upload Checklist

1. Log in to [Google Play Console](https://play.google.com/console).
2. Create app: **SCIS Connect** (Free, App).
3. Go to **Release > Production** (or **Internal testing**).
4. Click **Create new release**.
5. Upload the `.aab` file.
6. Enter release notes (e.g. *"Initial release of SCIS Connect Mobile student portal"*).
7. Submit for review!
