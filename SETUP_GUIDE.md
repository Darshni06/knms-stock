# KNMS Stock Tracker — Complete Setup Guide
## Firebase + Deployment (Step by Step)

---

## PART 1 — Create a Firebase Project

### Step 1: Go to Firebase Console
1. Open **https://console.firebase.google.com/**
2. Sign in with your Google account

### Step 2: Create New Project
1. Click **"Add project"** (big + card)
2. **Project name**: `knms-stock`  
   → Firebase auto-generates an ID like `knms-stock-abc12` — note it down
3. **Google Analytics**: disable it (not needed) → click **"Create project"**
4. Wait ~20 seconds → click **"Continue"**

---

## PART 2 — Enable Authentication

### Step 3: Enable Email/Password Login
1. In the left sidebar → click **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Under **"Sign-in method"** tab → click **"Email/Password"**
4. Toggle **"Enable"** → click **"Save"**

### Step 4: Create the Admin Account
1. Still in Authentication → click **"Users"** tab
2. Click **"Add user"**
3. Enter:
   - **Email**: `admin@knms.edu` (or any email you want)
   - **Password**: choose a strong password
4. Click **"Add user"** — copy the **User UID** shown (you'll need it)

---

## PART 3 — Set Up Firestore Database

### Step 5: Create Firestore
1. Left sidebar → **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"** → click **"Next"**
4. Select location: **`asia-south1`** (Mumbai — closest to India) → click **"Enable"**
5. Wait ~30 seconds for provisioning

### Step 6: Write Firestore Security Rules
1. In Firestore → click **"Rules"** tab
2. **Replace** everything with this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{uid} {
      allow read: if request.auth != null && (
        request.auth.uid == uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Categories (read: any auth; write: admin only)
    match /categories/{catId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      // Items under categories
      match /items/{itemId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

        // Class status — teachers can only write their own class
        match /classStatus/{classId} {
          allow read: if request.auth != null;
          allow write: if request.auth != null && (
            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.className == classId
          );
        }
      }
    }
  }
}
```

3. Click **"Publish"**

### Step 7: Create the Admin User Document
1. In Firestore → click **"+ Start collection"**
2. Collection ID: `users` → click **"Next"**
3. Document ID: **paste the Admin UID** you copied in Step 4
4. Add these fields:
   | Field | Type | Value |
   |-------|------|-------|
   | name | string | Admin |
   | email | string | admin@knms.edu |
   | role | string | admin |
5. Click **"Save"**

---

## PART 4 — Get Firebase Config Keys

### Step 8: Register a Web App
1. Back on the Firebase project home (click the Firebase logo top-left)
2. Click **"</>"** (Web) icon to add a web app
3. App nickname: `knms-stock-web`
4. **DO NOT** check "Firebase Hosting" (we use Vercel)
5. Click **"Register app"**
6. You'll see a config block like:
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "knms-stock-abc12.firebaseapp.com",
  projectId: "knms-stock-abc12",
  storageBucket: "knms-stock-abc12.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```
7. **Copy these 6 values** — you'll paste them into `.env`

---

## PART 5 — Local Setup

### Step 9: Set Up the Project Locally
```bash
# 1. Extract the project zip
cd knms-stock

# 2. Install dependencies
npm install

# 3. Create your .env file (copy from .env.example)
cp .env.example .env
```

### Step 10: Fill in the .env File
Open `.env` and paste your Firebase values:
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=knms-stock-abc12.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=knms-stock-abc12
VITE_FIREBASE_STORAGE_BUCKET=knms-stock-abc12.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Step 11: Run the App
```bash
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## PART 6 — Seed the Database

### Step 12: Add All 150+ Materials to Firestore
1. Open the app in browser: **http://localhost:5173**
2. Login as Admin (email + password from Step 4)
3. Open browser **DevTools** → **Console** tab (press F12)
4. Type this command and press Enter:
```js
seedDatabase()
```
5. Wait ~10-15 seconds → you'll see: **"✅ Seed complete!"**
6. Refresh the page — all 9 categories and 150+ items are now in Firestore!

> ⚠️ **Run seedDatabase() ONLY ONCE.** Running it again will create duplicate categories.

---

## PART 7 — Deploy to Vercel

### Step 13: Push to GitHub
```bash
# In the knms-stock folder:
git init
git add .
git commit -m "Initial commit — knms-stock"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/knms-stock.git
git push -u origin main
```

### Step 14: Deploy on Vercel
1. Go to **https://vercel.com** → sign in with GitHub
2. Click **"Add New Project"** → import your `knms-stock` repo
3. Framework preset: **Vite** (auto-detected)
4. Click **"Environment Variables"** → add all 6 variables from your `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Click **"Deploy"**
6. Wait ~1 minute → your app is live at `https://knms-stock.vercel.app` (or similar URL)

### Step 15: Add Authorized Domain in Firebase
After getting your Vercel URL:
1. Firebase Console → **Authentication** → **Settings** tab
2. Under **"Authorized domains"** → click **"Add domain"**
3. Add your Vercel URL: e.g. `knms-stock.vercel.app`
4. Click **"Add"**

---

## PART 8 — Add Teachers

### Step 16: Create Teacher Accounts (from the App)
1. Login as Admin
2. Go to **"Teachers"** in the sidebar
3. Click **"+ Add Teacher"**
4. Fill in:
   - Name: `Anitha Sundar`
   - Email: `anitha@knms.edu`
   - Password: (give them a temporary password)
   - Class: `PP-3`
5. Click **"Create Teacher"**

The teacher can now login with those credentials and will only see their class (PP-3).

---

## QUICK REFERENCE

| What | Where |
|------|-------|
| Admin Login | `admin@knms.edu` / your password |
| Firestore Console | https://console.firebase.google.com/project/YOUR_PROJECT/firestore |
| Auth Console | https://console.firebase.google.com/project/YOUR_PROJECT/authentication |
| Live App | https://knms-stock.vercel.app |
| Seed Command | `seedDatabase()` in browser console (run ONCE) |

---

## TROUBLESHOOTING

**"Permission denied" error in console**
→ Firestore Rules are not saved. Go to Firestore → Rules → Publish.

**Login works but shows blank page**
→ The users document is missing. Check Step 7 — make sure the document ID matches the Auth UID exactly.

**seedDatabase() is not defined**
→ Make sure you're logged in first, then open console and try again.

**Teachers can see all classes**
→ Check that `className` field is set on their user document in Firestore.

**Vercel deploy fails**
→ Make sure all 6 `VITE_` environment variables are added in Vercel project settings.
