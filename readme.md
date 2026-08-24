# Dakshata Connect — MoES Capacity Portal

> *Ministry of Earth Sciences (MoES) Capacity Building Portal: direct React 19 client integration with a serverless Firebase backend, custom role-based access control, announcements bulletins, trainer library file storage, and dynamic trainer competency mapping.*

---

## Overview

**Dakshata Connect** is a serverless, enterprise-grade Capacity Building Portal tailored for the **Smart India Hackathon (SIH)**. Built with **React 19** (TypeScript, Vite, Tailwind CSS, shadcn/ui) and powered exclusively by **Firebase** (Firestore, Authentication, Storage) for real-time synchronization, secure multi-role permissions, and cloud resource storage.

---

## Key Feature Modules & SIH Requirement Coverage

| Feature Module | Trainee | Trainer | Admin | Backend Integration | Status |
| --- | --- | --- | --- | --- | --- |
| **Auth & Profile Gating** | ✅ | ✅ | ✅ | Firebase Auth + Custom Firestore user role synchronization | ✅ Done |
| **Competency Mapping** | — | ✅ | ✅ | Weighted Skill Matrix matching course requirements against trainer profiles | ✅ Done |
| **Course Catalog & Enrollment** | ✅ | ✅ | 👁️ | Firestore catalog searching and enrollment progress tracking | ✅ Done |
| **MCQ Assessments Hub** | ✅ | ✅ | 👁️ | Timed quizzes, dynamic MCQ builder, and auto-graded trainee submissions | ✅ Done |
| **Trainer Library** | ✅ | ✅ | 👁️ | Firebase Storage (lecture notes, presentations, PDFs, study materials) | ✅ Done |
| **Admin Dashboards & Approval** | — | — | ✅ | User approval queues, platform usage charts (Recharts) | ✅ Done |
| **Announcements Bulletin** | ✅ | ✅ | ✅ | Global notification broadcasts, categorized updates | ✅ Done |

---

## System Architecture

```
[ React 19 Frontend ] (Vite + TypeScript + Tailwind CSS)
       │
       ├──▶ Firebase Authentication   (Google Sign-In, Role-based routing)
       ├──▶ Cloud Firestore           (Real-time databases, subcollection feedbacks)
       └──▶ Firebase Storage          (Lecture Notes, PDFs, Study Materials)
```

---

## Tech Stack

* **Frontend:** React 19 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Recharts · Lucide Icons
* **Backend Services:** Firebase Auth · Cloud Firestore Database · Firebase Cloud Storage

---

## Getting Started

### Setup Instructions

#### 1. Clone & Install Dependencies

```bash
git clone https://github.com/aaravpathak9984-boop/dakshata-connect.git
cd dakshata-connect
npm install
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

## Firestore Database Collections

* **`users/{userId}`**: Stores profile metadata, user roles (`Trainee` | `Trainer` | `Admin`), approval state, qualifications, meteorological skills, and experience tags.
* **`courses/{courseId}`**: Capacity training course details, category tags, enrolled trainee counters, and assigned trainer references.
* **`enrollments/{enrollmentId}`**: Trainee enrollment sheets, progress tracking metric counters, and status values (`Active` | `Completed` | `Dropped`).
* **`assessments/{assessmentId}`**: Subject MCQ questionnaires, option arrays, correct answers index maps, and submission deadlines.
* **`trainer_library/{fileId}`**: Download urls and file descriptors for study guides and presentations stored in Firebase Storage.
* **`announcements/{announcementId}`**: Broadcast alerts (Notification, Achievement, Content) managed by coordinators.

---

## Design System

| Token | Color Value | Accent |
| --- | --- | --- |
| **Primary Theme** | `#E11D48` (Crimson Red) | Consumed as HSL variables in Tailwind |
| **Secondary Accent**| `#F3F4F6` | Sleek light/dark transitions |
| **Status Signals** | `#10B981` (Success) · `#EF4444` (Danger) · `#F59E0B` (Warning) | Optimized for alerts and progress checks |

---

## License

MIT / Hackathon Project — Built for Smart India Hackathon (SIH).
