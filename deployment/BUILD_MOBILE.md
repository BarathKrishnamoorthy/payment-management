# Mobile Build & Distribution Guide (Android & iOS)

This guide provides step-by-step procedures to compile, sign, and distribute the **RB Payment Management Mobile Application** for Android (APK) and iOS (IPA / TestFlight).

---

## Prerequisites
- Node.js 18+ & npm
- Expo CLI (`npm install -g expo-cli eas-cli`)
- For local Android build: Java JDK 17, Android Studio, Android SDK with `ANDROID_HOME` configured.
- For local iOS build: macOS, Xcode 15+, CocoaPods.

---

## 1. Android APK Build

### Method A: Cloud Build via EAS (Recommended - Zero Setup)
1. Navigate to the `mobile` directory:
   ```bash
   cd mobile
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Trigger the standalone Android APK build:
   ```bash
   eas build -p android --profile preview
   ```
4. EAS will compile and provide a direct URL to download the installable `.apk` file for testing on physical Android devices.

### Method B: Local Offline Build (Gradle)
1. Prebuild the native Android project:
   ```bash
   npx expo prebuild --platform android
   ```
2. Build the release APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
3. Locate your generated APK at:
   `android/app/build/outputs/apk/release/app-release.apk`

---

## 2. iOS Build (IPA / TestFlight / App Store)

### Method A: TestFlight / App Store via EAS CLI
1. Configure credentials with Apple Developer Program:
   ```bash
   eas build -p ios --profile production
   ```
2. Automatically submit to TestFlight:
   ```bash
   eas submit -p ios
   ```

### Method B: Local Xcode Archive
1. Prebuild the native iOS project:
   ```bash
   npx expo prebuild --platform ios
   ```
2. Install CocoaPods dependencies:
   ```bash
   cd ios && pod install
   ```
3. Open `RBPaymentManagement.xcworkspace` in Xcode.
4. Set Signing & Capabilities with your Apple Team.
5. Select `Product > Archive` to generate the `.ipa` package.

---

## 3. Push Notifications Setup
The application is preconfigured with `expo-notifications`.
1. **Android (FCM)**:
   - Create project in Google Firebase Console.
   - Download `google-services.json` and place in `mobile/`.
   - Add FCM Server Key in Expo Project Settings.
2. **iOS (APNs)**:
   - In Apple Developer portal, create an APNs Key (.p8).
   - Upload the `.p8` key in Expo Dashboard under Credentials > iOS Push Notifications.

