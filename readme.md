# NovaLearn LMS — Firebase Edition

> *Enterprise learning, engineered for hackathon speed: direct React 19 client integration with Firebase serverless backend infrastructure, custom role-based access control, and dynamic competency mapping.*

**Frontend**







**Backend & Serverless Infrastructure**





---

## Overview

A modern, enterprise-grade Learning Management System (LMS) tailored for **Smart India Hackathon (SIH)**. Built with **React 19** (TypeScript, Vite, Tailwind CSS, shadcn/ui) and powered by **Firebase** (Firestore, Authentication, Storage) for real-time data sync, secure multi-role permissions, and cloud resource storage.

---

## Status & SIH Requirement Coverage

| Feature Module | Trainee | Trainer | Admin | Backend Integration | Status |
| --- | --- | --- | --- | --- | --- |
| **Auth & Profile Management** | ✅ | ✅ | ✅ | Firebase Auth + Custom Claims (Trainee, Trainer, Admin) | ✅ Done |
| **Competency Mapping** | — | ✅ | ✅ | Dynamic skill-matching algorithm (Skill matrix matching) | ✅ Done |
| **Course Catalog & Enrollment** | ✅ | ✅ | 👁️ | Firestore real-time collections & enrollment tracking | ✅ Done |
| **MCQ Assessments Hub** | ✅ | ✅ | 👁️ | Timed quizzes, deadline enforcement, auto-scoring | ✅ Done |
| **Trainer Library & Content Wall** | ✅ | ✅ | 👁️ | Firebase Storage (PDFs, presentations, recorded lectures) | ✅ Done |
| **Admin Dashboards & Approval** | — | — | ✅ | User approval queues, platform usage charts (Recharts) | ✅ Done |
| **Announcements & Wall** | ✅ | ✅ | ✅ | Global notifications, newly added content feed | ✅ Done |

---

## System Architecture

```
[ React 19 Frontend ] (Vite + TypeScript + Tailwind CSS)
       │
       ├──▶ Firebase Authentication   (RBAC: Trainee, Trainer, Admin claims)
       ├──▶ Cloud Firestore           (Users, Courses, Quizzes, Competency Ratings)
       └──▶ Firebase Storage          (Lectures, Documents, Certificates)

```

---

## Tech Stack

* **Frontend:** React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Recharts · Lucide Icons
* **Backend Services:** Firebase Auth · Cloud Firestore Database · Firebase Cloud Storage

---

## Getting Started

### Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| **Node.js** | 20+ / 22+ | JS runtime environment |
| **npm / pnpm** | 9+ | Package manager |
| **Firebase Project** | Standard | Free spark plan account |

---

### Setup Instructions

#### 1. Clone & Install Dependencies

```bash
npx degit BhanukaJanappriya/novalearn-lms/frontend sih-lms-firebase
cd sih-lms-firebase
npm install
npm install firebase

```

#### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

```

#### 3. Initialize Firebase Setup (`src/lib/firebase.ts`)

Add your Firebase configuration file:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

```

#### 4. Run Development Server

```bash
npm run dev

```

Open `http://localhost:5173` in your browser.

---

## Firestore Database Structure

* **`users/{userId}`**: Stores profile info, user role (`Trainee` | `Trainer` | `Admin`), approval state, and skill competencies.
* **`courses/{courseId}`**: Course records, enrolled trainees, and assigned trainer ID.
* **`assessments/{assessmentId}`**: Subject-wise MCQ questions, deadlines, and trainee submission scores.
* **`trainer_library/{fileId}`**: Links to lecture files and documents stored in Firebase Storage.

---

## Design System

| Token | Value |
| --- | --- |
| **Primary** | `#8B5CF6` |
| **Accent** | `#A78BFA` |
| **Success / Danger / Warning** | `#22C55E` · `#EF4444` · `#F59E0B` |
| **Surface / Text** | `#FFFFFF` / `#F8FAFC` · `#1F2937` |

---

## License

MIT / Hackathon Project — Built for Smart India Hackathon (SIH).# dakshata-connect
