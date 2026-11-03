# Complete Guide: Free Hosting & Live Android APK Generation

This guide provides the exact steps to deploy the **RB Payment Management** system live on **100% free hosting tiers** (Backend, Database, and Frontend) and build the **standalone Android APK** to install directly on physical Android phones.

---

## Architecture Overview

| Component | Free Platform | Free Tier Specifications |
|---|---|---|
| **Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | **M0 Sandbox**: Free forever, 512 MB storage, shared RAM, automated backups. |
| **Backend API** | [Render.com](https://render.com) | **Free Web Service**: 750 free hours/month, automatic HTTPS SSL, Git auto-deploy. |
| **Frontend Web** | [Vercel](https://vercel.com) / Render | **Hobby Tier**: Unlimited free bandwidth, global Edge CDN, instant previews. |
| **Mobile App (APK)** | [Expo EAS](https://expo.dev) | **Free Tier**: 30 free cloud Android APK builds/month, zero local Android Studio required. |

---

## Step 1: Create Free Cloud Database (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Build a Database** and select the **M0 Free (Shared)** tier.
3. Choose the region closest to you (e.g. `aws / Mumbai (ap-south-1)`).
4. Under **Security Quickstart**:
   - Create a database user (e.g., Username: `rbuser`, Password: `<YourSecurePassword>`).
   - Under **Where would you like to connect from?**, select **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Connect** > **Drivers** (Node.js) and copy the connection string:
   ```env
   mongodb+srv://rbuser:<YourSecurePassword>@cluster0.xxxxx.mongodb.net/rb_payment_db?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy Backend to Render (100% Free)

1. Push this project to your GitHub repository (or GitLab):
   ```bash
   git add .
   git commit -m "deploy: initial live release"
   git remote add origin https://github.com/<your-username>/rb-payment-management.git
   git push -u origin master
   ```
2. Go to [Render.com](https://dashboard.render.com/) and click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `rb-payment-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: `Free`
5. Click **Advanced** > **Add Environment Variable**:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string from Step 1>`
   - `JWT_SECRET`: `rb_live_secret_key_2026_super_secure`
   - `FRONTEND_URL`: `*`
6. Click **Create Web Service**.
7. Once deployed, Render will provide your live HTTPS backend URL, e.g.:
   `https://rb-payment-backend.onrender.com`

---

## Step 3: Deploy Frontend to Vercel (100% Free)

1. Go to [Vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **Add New...** > **Project** and select your repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: `https://rb-payment-backend.onrender.com/api` (Replace with your actual Render URL from Step 2)
5. Click **Deploy**.
6. Within 1 minute, your web application will be live at `https://rb-payment-xxxx.vercel.app` with full SSL!

---

## Step 4: Build Standalone Android APK for Mobile

You do not need to install Android Studio or Java locally. Expo's Application Services (EAS) will compile your production `.apk` in the cloud for free.

### 4.1 Update Backend URL in Mobile App
Open [mobile/src/config/api.ts](file:///C:/Users/BARATH/Desktop/account/mobile/src/config/api.ts#L10) and set `DEFAULT_LIVE_API_URL` to your live backend:
```typescript
export const DEFAULT_LIVE_API_URL = 'https://rb-payment-backend.onrender.com/api';
```
*(Note: You can also change the API URL directly inside the mobile app on the login screen by tapping "⚙️ Server Config" without rebuilding!)*

### 4.2 Run EAS Cloud Build
Open PowerShell in the `mobile` folder:
```bash
cd C:\Users\BARATH\Desktop\account\mobile

# 1. Sign in to your free Expo account (create one at expo.dev if needed)
npx eas-cli login

# 2. Configure the project (press Enter to accept default project ID)
npx eas-cli project:init

# 3. Trigger the standalone Android APK build
npx eas-cli build -p android --profile preview
```

### 4.3 Download & Install on Physical Mobile Phone
1. EAS will build the `.apk` on Expo cloud servers (takes ~3 to 5 minutes).
2. When finished, the terminal outputs:
   - **Direct APK download link** (e.g. `https://expo.dev/artifacts/eas/.../app-release.apk`)
   - **Terminal QR Code**
3. Scan the QR code or open the link on your Android smartphone.
4. Download the `.apk` and tap **Install**.
5. The application will open directly with your live White and Purple fintech interface!

---

## Step 5: Instant Live Mobile Testing via Expo Go (Zero-Wait)

If you want to run the app on your physical mobile phone immediately without waiting for an APK build:

1. Install **Expo Go** from the Google Play Store (Android) or App Store (iOS) on your phone.
2. In your terminal:
   ```bash
   cd C:\Users\BARATH\Desktop\account\mobile
   npx expo start --tunnel
   ```
3. Scan the QR code shown in the terminal with:
   - **Android**: Expo Go app camera scanner.
   - **iOS**: Default iPhone camera app.
4. The mobile app loads immediately with live hot-reloading!

