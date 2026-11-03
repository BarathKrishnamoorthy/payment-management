# RB Payment Management System

A secure, full-stack financial tracking and loan management ecosystem built with a **Clean White and Purple Theme**, supporting both **Web (React.js)** and **Mobile (React Native Android & iOS)** with a unified **Node.js + Express.js + MongoDB** backend.

---

## 🌟 Technologies
- **Web Application**: React.js 19 (Vite, Tailwind CSS, Recharts, Lucide Icons, Canvas-Confetti)
- **Mobile Application**: React Native (Expo SDK 52, Cross-Platform Android & iOS)
- **Backend**: Node.js + Express.js (REST API, Helmet, Rate-Limit, Multer, Node-Cron)
- **Database**: MongoDB (Mongoose ODM with automatic **In-Memory fallback** for zero-config startup)
- **Design Theme**: Clean White and Purple (`#7C3AED` royal purple, `#FAF5FF` lavender canvas, `#FFFFFF` crisp cards)

---

## 🚀 Live Demo & Quick Start

Both services are preconfigured and running locally:

| Service | URL | Notes |
|---|---|---|
| **Web Application** | `http://localhost:3000` | Full React.js web portal |
| **Backend API** | `http://localhost:5000` | REST API with health check at `/api/health` |

### Demo Credentials:
- **Phone Number**: `9876543210`
- **Fixed Demo OTP**: `123456`
*(Or test any 10-digit number to experience the first-time onboarding flow!)*

---

## 📂 Project Architecture

```
account/
├── backend/                  # Node.js + Express.js API
│   ├── src/
│   │   ├── config/          # MongoDB connection + in-memory auto-fallback
│   │   ├── controllers/     # Auth, Onboarding, Profile, Txn, Recurring, Dashboard, Reports, Notif
│   │   ├── middleware/      # JWT Protect, Multer File Upload, Error Handling
│   │   ├── models/          # User, Transaction, RecurringPayment, Notification
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Notification scheduler & due date checker
│   │   ├── utils/           # Statement parser (CSV/Excel), Seed helper, JWT generator
│   │   └── server.js        # Express app entry & daily cron scheduler (9 AM)
│   ├── uploads/             # Digital receipts, invoices, statements
│   └── package.json
│
├── frontend/                 # React.js Web Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # Navbar (Purple/White), NotificationDrawer
│   │   │   ├── walkthrough/ # ModuleTour (Spotlight, arrows, tooltips, Next/Prev/Skip/Finish)
│   │   │   └── guidance/    # ModuleGuidanceModal ("How to Use" user manual in every module)
│   │   ├── context/         # AuthContext (state, tokens, tutorial flags)
│   │   ├── pages/           # AuthPage, OnboardingPage, DashboardPage, TransactionsPage, RecurringPage, ReportsPage, ProfilePage
│   │   ├── services/        # API client
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
├── mobile/                   # React Native (Android & iOS)
│   ├── src/
│   │   ├── components/      # MobileTour (Interactive Walkthrough), MobileGuidanceModal ("How to Use")
│   │   ├── services/        # Mobile API client
│   │   └── theme/           # Purple & White color palette
│   ├── App.tsx              # Tab navigation, Auth, Onboarding, Modules, Settle Actions
│   ├── app.json             # Android APK & iOS build configurations
│   ├── eas.json             # EAS cloud build profiles
│   └── package.json
│
└── deployment/               # Production Delivery
    ├── docker-compose.yml   # Multi-container orchestration (Mongo, Backend, Frontend Nginx)
    ├── Dockerfile.backend   # Multi-stage Node.js container
    ├── Dockerfile.frontend  # Node builder + Nginx web server
    ├── nginx.conf           # Reverse proxy with SSL & caching
    └── BUILD_MOBILE.md      # Android APK & iOS IPA compilation guide
```

---

## 🎯 Completed Requirements Coverage

### 1. Login & Authentication
- Mobile number input with OTP generation and verification.
- Secure JWT bearer session tokens valid for 30 days.
- Dev/Demo auto-fill and SMS integration hooks.

### 2. Income & Expense Management
- Credit (Income) and Debit (Expenses) double-entry ledger.
- Fields: `Type`, `Date`, `Amount (₹)`, `Reason (Optional)`, `File Attachment (Optional)`, `Reference Number (Optional)`.
- Full CRUD: Create, View modal with receipt viewer, Edit, and Delete records.
- **Import Bank Statements**: High-performance parser supporting CSV, XLSX, and XLS formats with dynamic column auto-mapping and sample CSV template generator.

### 3. Recurring Payment Management
- 6 Standardized categories: **EMI**, **Bank Loan**, **Subscription**, **Gold Loan**, **Home Loan**, **Car Loan**.
- Recurrence intervals: **Daily**, **Monthly**, **Quarterly**, **Yearly**.
- Fields: `Payment Type`, `Due Date`, `Recurrence Type`, `Amount`, `Reason (Optional)`.
- **1-Click "Mark as Paid" Action**:
  - Automatically records a Debit transaction in Income & Expense.
  - Automatically computes and sets the next scheduled due date based on the recurrence formula.
  - Logs payment entry into payment history.

### 4. Dashboard & Reports
- **Dashboard**:
  - Total Income, Total Expenses, Net Balance, This Month Savings.
  - Urgent due-today banner with instant "Mark Paid Now" action.
  - 6-Month Income vs Expense interactive area chart (Recharts).
  - Expense Category distribution donut chart.
  - Upcoming recurring schedule list & Recent transactions table.
- **Reports**:
  - Comparative analytics by custom date ranges or timeframes (All time, Month, Quarter, Year).
  - Net savings and savings rate % calculator.
  - Category expenditure bar charts.
  - 1-Click **Export to CSV** and **Print Report** options.

### 5. Mobile & Web Notifications
- Daily 9:00 AM automated cron scheduler inspecting all recurring loans due on the day.
- In-app notification center with unread badge counter, alert sounds, and direct link to settle dues.
- Ready for Expo / FCM push notifications.

### 6. Security
- OTP-based authentication with expiration controls.
- Helmet security headers and Cross-Origin Resource Sharing.
- Brute-force rate limiting (1000 requests / 15 mins).
- Strict Multer file upload whitelist (PDF, PNG, JPG, WEBP, CSV, XLSX, XLS) capped at 10MB.

### 7. Deployment & Delivery
- Pre-built production distribution (`frontend/dist`).
- Docker Compose configuration for Mongo, API, and Frontend.
- Nginx reverse-proxy template.
- Android APK build guide via EAS and Gradle (`deployment/BUILD_MOBILE.md`).
- iOS TestFlight / App Store configuration (`app.json`, `eas.json`).

### 8. Customer Onboarding & First-Time Login
- Brand-new customers (unrecognized mobile numbers) are automatically routed to the Onboarding Screen upon OTP verification:
  - Name (Required)
  - Phone Number (Auto-filled from login, locked)
  - Account Number (Optional)
  - Bank Name (Optional)
- Returning customers automatically bypass onboarding directly to the Dashboard.

### 9. Customer Profile
- Dedicated Profile section displaying:
  - Name, Phone Number, Bank Account Number, Bank Name, Avatar.
- "Edit Profile" modal to update details at any time.
- Security and session logout options.

### 10. Module Instructions & User Guidance ("How to Use")
- Prominent **"How to Use"** guide button in the header of EVERY module.
- Opens a comprehensive visual manual containing:
  - Feature highlights.
  - Step-by-step instructions for Adding, Editing, Deleting, and Viewing records.
  - Complete glossary of field definitions.

### 11. First-Time Module Walkthrough (Interactive Tutorial)
- Automatically displays an interactive visual tour when a customer visits a module for the first time!
- **High-contrast spotlight cutout** highlighting target buttons and cards.
- **Directional purple arrows** pointing to key elements:
  - Dashboard: Highlights Balance card, Due Today banner, Charts, and Quick Actions.
  - Income & Expenses: Highlights "+ Add Transaction" button, "Import Statement", and Type filters.
  - Recurring Payments: Highlights "+ Add Recurring Payment", Categories, and "Mark as Paid" action.
  - Reports: Highlights Date filters, Charts, and Export CSV.
- Navigation buttons: **Next**, **Previous**, **Skip**, and **Finish**.
- Marks tutorial completed in user profile.
- Persistent **"Replay Tour"** button in navbar allows users to restart the interactive walkthrough at any time.

---

## 🛠️ Running the Project Locally

### 1. Backend Server
```bash
cd backend
npm install
npm run seed     # Seeds demo user, recurring loans, and sample transactions
npm run dev      # Runs API on http://localhost:5000
```

### 2. React.js Web Application
```bash
cd frontend
npm install
npm run dev      # Runs Web App on http://localhost:3000
npm run build    # Compiles production build to dist/
```

### 3. React Native Mobile App
```bash
cd mobile
npm install
npm start        # Launches Expo Metro bundler
```
To run on Android Emulator or iOS Simulator:
```bash
npm run android
npm run ios
```
To build Android APK:
```bash
npm run build:android
```

