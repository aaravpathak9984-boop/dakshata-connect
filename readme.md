# 🌐 Dakshata Connect
**Smart Education & Digital Capacity Building Learning Management Portal**

[![React](https://img.shields.io/badge/React-19-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v9-FFCA28.svg?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5.svg?style=for-the-badge&logo=cloudinary)](https://cloudinary.com/)

> **Smart India Hackathon 2026**
> - **Problem Statement ID:** SIH26075 (Ministry of Earth Sciences / IMD)
> - **Theme:** Smart Education
> - **Team:** The Unknowns (HIET/SIH/2026/010)

---

## 📑 Executive Summary

The Ministry of Earth Sciences (MoES) and the India Meteorological Department (IMD) operate across a vast geographical network, encompassing 14+ Regional Meteorological Centres and over 450 field observatories. Coordinating specialized, scientific training and technical capacity building across such a distributed workforce manually is logistically complex, prone to delays, and difficult to audit.

**Dakshata Connect** is a centralized, serverless Learning Management Portal designed explicitly to solve this challenge. By leveraging a real-time NoSQL cloud database and a role-based React 19 frontend, the platform algorithmically matches qualified subject matter experts with required training modules, automates the delivery of technical resources, and tracks field-staff progression dynamically. The result is a highly scalable, secure, and zero-maintenance architecture that accelerates digital capacity building across the entire meteorological organization.

---

## 🧩 Core Modules & Role Features

The platform is strictly segregated into three distinct operational domains using advanced Role-Based Access Control (RBAC):

### 🎓 Trainee Portal (Field Staff & Observers)
- **Professional Profiles:** Dynamic profile management highlighting current postings, skill sets, and training history.
- **Course Enrollment & Discovery:** A streamlined catalog of available training modules filtered by meteorological category and skill level.
- **Automated Progression Tracking:** Progress is mathematically calculated and updated in real-time based on a `completedLessons` array, updating immediately as trainees complete modular content.
- **Interactive MCQ Assessments:** Immediate knowledge validation through dynamically rendered quizzes with instant grading.

### 👨‍🏫 Trainer Hub (Subject Matter Experts)
- **Course Library (Cloudinary Integration):** A secure vault for uploading heavy meteorological datasets, PDF manuals, and instructional videos via Cloudinary's Unsigned REST API, bypassing standard server constraints.
- **MCQ Assessment Builder:** Intuitive interface for instructors to author, organize, and publish multi-step assessments.
- **Real-Time Progress Monitoring:** Direct access to trainee rosters, allowing trainers to monitor completion rates, assignment submissions, and assessment scores algorithmically.

### 🛡️ Admin Control Center (MoES Leadership)
- **Automated Approval Workflows:** Centralized control over user onboarding, specifically restricting Trainer and Admin elevation to authorized personnel.
- **Dashboard Analytics:** High-level metrics tracking organizational learning velocity, active enrollments, and pending support requests.
- **Global Announcements:** A direct communication feed for broadcasting critical operational updates or new mandatory training requirements.
- **Competency Mapping Engine:** An algorithmic matching system that evaluates a Trainer's `skills` array against a course's `requiredSkills` array to automatically recommend the most qualified experts for specific curriculum development.

---

## 🗄️ Data Architecture & Schema

Dakshata Connect utilizes a 100% Serverless architecture powered by **Firebase Cloud Firestore (NoSQL)**. The database is highly denormalized for optimized read performance across the distributed network.

| Collection | Primary Purpose | Key Fields / Subcollections |
| :--- | :--- | :--- |
| `users` | Role and identity management | `role`, `roles[]`, `isApproved`, `skills[]` |
| `courses` | Curriculum metadata and catalog | `category`, `level`, `requiredSkills[]` |
| `assessments` | MCQ quizzes linked to courses | `courseId`, `questions[]` <br/> ↳ sub: `submissions` |
| `enrollments` | Trainee progress mapping | `progressPercent`, `completedLessons[]`, `status` |
| `trainer_library` | Metadata for Cloudinary files | `fileUrl`, `fileType`, `uploadedBy` |
| `support_tickets`| Internal issue tracking | `status`, `assignedToId` <br/> ↳ sub: `replies` |

---

## 🔒 Security & RBAC

Security is paramount for government infrastructure. Instead of relying on a vulnerable middleware server, Dakshata Connect implements security at the database layer using **Firestore v2 Security Rules**. 

- **Serverless Bouncer:** Firestore rules act as a strict gatekeeper, reading the authenticated user's `users/{uid}` document to determine their `role` before allowing any read/write operations.
- **Mutation Guards:** Trainees cannot mutate course schemas, access the admin dashboards, or modify their own roles. Only Admins can elevate a user's permissions.
- **Data Encapsulation:** Trainees can only read assignments and assessments relevant to their specific `enrollments`. 

---

## ⚙️ Local Setup & Environment Variables

The project requires zero backend compilation. To run the React 19 / Vite frontend locally, configure the `.env` file at the root of the directory:

```env
# Firebase v9 Modular SDK Configuration
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"

# Cloudinary Unsigned Upload Configuration (Media Storage)
VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
VITE_CLOUDINARY_UPLOAD_PRESET="your_unsigned_preset"
```

**Installation & Execution:**
1. Clone the repository.
2. Run `npm install` to fetch dependencies.
3. Run `npm run dev` to start the Vite development server.
