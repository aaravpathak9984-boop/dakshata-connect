# Dakshata Connect — MoES Capacity Portal

> *Ministry of Earth Sciences (MoES) Capacity Building Portal: A secure, serverless learning management system built with React 19, Firebase v9+, and Tailwind CSS. Features custom role-based access control (RBAC), real-time announcements, course tracking, and trainer competency mapping.*

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

---

## Overview

**Dakshata Connect** is an enterprise-grade Capacity Building Portal tailored for the **Smart India Hackathon (SIH)**. 
The application underwent a complete architectural migration from legacy mock REST APIs (Axios) to a direct, secure, and real-time **Firebase Modular SDK (v9+)** integration. 

This portal facilitates seamless meteorological and oceanographic training through a strict Role-Based Access Control (RBAC) system, ensuring secure course management, resource sharing, and progress tracking.

---

## Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
* **State Management & Data Fetching:** TanStack Query (React Query)
* **Backend Services:** Firebase Authentication, Cloud Firestore (Real-time DB)
* **Routing:** React Router v7 (with protected route guards based on Firestore profiles)
* **Charts/Visuals:** Recharts, Lucide Icons, Framer Motion

---

## Role-Based Access Control (RBAC)

The application enforces a strict security model through `firestore.rules` and React Router guards. Identity permissions are driven by the `roles` array in the user's Firestore document, preventing client-side spoofing.

| Feature Module | Trainee | Trainer | Admin |
| :--- | :---: | :---: | :---: |
| **Auth & Profile Updates** | ✅ | ✅ | ✅ |
| **Course Catalog & Enrollment** | ✅ | ✅ | 👁️ Read-only |
| **Wall / Trainer Library** | ✅ | ✅ Upload | 👁️ Read-only |
| **MCQ Assessments & Quizzes** | ✅ Take | ✅ Build | 👁️ Read-only |
| **Competency Mapping** | ❌ | ✅ | ✅ Manage |
| **User Directory & Approvals** | ❌ | ❌ | ✅ Manage |
| **Announcements Bulletin** | ✅ Read | ✅ Read | ✅ Publish |

---

## System Architecture

```text
[ React 19 Frontend ] (Vite + TypeScript + Tailwind CSS)
       │
       ├──▶ Firebase Authentication   (Email/Password, Google Sign-In)
       │
       ├──▶ Cloud Firestore           (Real-time databases, RBAC rules)
       │     ├── users/ (Strict profile gating & roles)
       │     ├── courses/ (Deeply linked modules, quizzes, assignments)
       │     └── trainer_library/ (Relational file mapping)
       │
       └──▶ TanStack Query            (Caching, Optimistic UI Updates)
```

---

## Local Development Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/aaravpathak9984-boop/dakshata-connect.git
cd dakshata-connect
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory and add your Firebase project keys:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Deploy Security Rules

To ensure the RBAC system works correctly, deploy the Firestore rules provided in the repository:

```bash
npm install -g firebase-tools
firebase login
firebase use --add your_project_id
firebase deploy --only firestore:rules
```
*(Alternatively, copy the contents of `firestore.rules` directly into your Firebase Console).*

### 4. Seed Mock Data & Demo Users

The repository includes a script to populate your Firebase Auth and Firestore with initial Admin, Trainer, and Trainee accounts.

1. **Temporarily bypass Firestore rules** in your Firebase Console (`allow read, write: if true;`).
2. Run the seed script from the root directory:
   ```bash
   node seedUsers.js
   ```
3. **Restore the secure `firestore.rules`** in your console.
4. You can now log in using the mock accounts (e.g., `admin@dakshata.in` / `password123`).

### 5. Run the Development Server

```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Firestore Database Collections

* **`users/{userId}`**: Stores profile metadata, identity roles (`roles: ["Admin", "Trainer", "Trainee"]`), approval state, qualifications, and meteorological skills.
* **`courses/{courseId}`**: Capacity training course details, category tags, enrolled trainee counters, and assigned trainer references.
* **`enrollments/{enrollmentId}`**: Relational mapping between trainees and courses, tracking progress percentages and status (`Active` | `Completed`).
* **`assessments/{assessmentId}`**: Subject MCQ questionnaires, option arrays, correct answers index maps, and submission deadlines.
* **`trainer_library/{fileId}`**: Uploaded study materials, securely mapped to specific `courseId`s for filtered contextual rendering.
* **`announcements/{announcementId}`**: Broadcast alerts managed by system administrators.

---

## Deployment

The application is fully optimized for edge deployment via **Vercel**.

1. Connect your GitHub repository to Vercel.
2. Ensure the **Framework Preset** is set to `Vite`.
3. Add all variables from your `.env` file into the Vercel Environment Variables settings.
4. Click **Deploy**.

*(Any changes pushed to the `main` branch will automatically trigger a production build).*

---

## License

MIT / Hackathon Project — Built for Smart India Hackathon (SIH).
