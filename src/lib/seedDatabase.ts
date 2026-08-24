import { writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase";

export const seedDatabase = async () => {
  const batch = writeBatch(db);

  const nowString = new Date().toISOString();

  // ==================== A. USERS ====================

  // 1. Admin
  const adminRef = doc(db, "users", "admin_demo_01");
  batch.set(adminRef, {
    id: "admin_demo_01",
    uid: "admin_demo_01",
    firstName: "Super",
    lastName: "Admin",
    fullName: "Super Admin",
    email: "admin@dakshata.in",
    role: "Admin",
    roles: ["Admin"],
    isActive: true,
    isApproved: true,
    isLockedOut: false,
    createdAtUtc: nowString
  });

  // 2. Trainers
  const trainerVermaRef = doc(db, "users", "trainer_verma");
  batch.set(trainerVermaRef, {
    id: "trainer_verma",
    uid: "trainer_verma",
    firstName: "Rajesh",
    lastName: "Verma",
    fullName: "Dr. Rajesh Verma",
    email: "rajesh.verma@moes.gov.in",
    role: "Trainer",
    roles: ["Trainer"],
    isActive: true,
    isApproved: true,
    isLockedOut: false,
    experienceYears: 12,
    qualifications: ["Ph.D. in Meteorology", "M.Sc. in Atmospheric Sciences"],
    workExperience: [
      { role: "Senior Scientist", org: "IMD Pune", years: 8 },
      { role: "Training Lead", org: "MoES Training Division", years: 4 }
    ],
    skills: ["Python", "Doppler Radar", "Cyclone Modeling"],
    subjectsHandled: ["Tropical Cyclones & Severe Storms", "Doppler Weather Radar"],
    competencyScore: 95,
    createdAtUtc: nowString
  });

  const trainerReddyRef = doc(db, "users", "trainer_reddy");
  batch.set(trainerReddyRef, {
    id: "trainer_reddy",
    uid: "trainer_reddy",
    firstName: "Sunita",
    lastName: "Reddy",
    fullName: "Prof. Sunita Reddy",
    email: "sunita.reddy@moes.gov.in",
    role: "Trainer",
    roles: ["Trainer"],
    isActive: true,
    isApproved: true,
    isLockedOut: false,
    experienceYears: 8,
    qualifications: ["Ph.D. in Physical Oceanography"],
    workExperience: [
      { role: "Lead Forecaster", org: "INCOIS Hyderabad", years: 6 }
    ],
    skills: ["Data Assimilation", "Marine Forecasting"],
    subjectsHandled: ["Ocean Wave Modeling", "Coastal Disaster Management"],
    competencyScore: 89,
    createdAtUtc: nowString
  });

  const trainerPatelRef = doc(db, "users", "trainer_patel");
  batch.set(trainerPatelRef, {
    id: "trainer_patel",
    uid: "trainer_patel",
    firstName: "Amit",
    lastName: "Patel",
    fullName: "Dr. Amit Patel",
    email: "amit.patel@moes.gov.in",
    role: "Trainer",
    roles: ["Trainer"],
    isActive: true,
    isApproved: true,
    isLockedOut: false,
    experienceYears: 10,
    qualifications: ["Ph.D. in Remote Sensing", "M.Tech in Geoinformatics"],
    workExperience: [
      { role: "Research Scientist", org: "SAC Ahmedabad", years: 7 }
    ],
    skills: ["GIS Mapping", "Satellite Imagery"],
    subjectsHandled: ["Satellite Meteorology", "Geoinformatics Applications"],
    competencyScore: 92,
    createdAtUtc: nowString
  });

  // 3. Trainees
  const traineeSharmaRef = doc(db, "users", "trainee_sharma");
  batch.set(traineeSharmaRef, {
    id: "trainee_sharma",
    uid: "trainee_sharma",
    firstName: "Anjali",
    lastName: "Sharma",
    fullName: "Anjali Sharma",
    email: "anjali.sharma@met.gov.in",
    role: "Trainee",
    roles: ["Trainee"],
    isActive: true,
    isApproved: true,
    isLockedOut: false,
    qualifications: ["B.Tech in Earth Sciences"],
    workExperience: [
      { role: "Junior Analyst", org: "IMD New Delhi", years: 1 }
    ],
    interests: ["Cyclone Forecasting", "GIS Mapping"],
    skills: ["Python", "GIS Mapping"],
    certificates: [],
    createdAtUtc: nowString
  });

  const traineeGuptaRef = doc(db, "users", "trainee_gupta");
  batch.set(traineeGuptaRef, {
    id: "trainee_gupta",
    uid: "trainee_gupta",
    firstName: "Rohan",
    lastName: "Gupta",
    fullName: "Rohan Gupta",
    email: "rohan.gupta@met.gov.in",
    role: "Trainee",
    roles: ["Trainee"],
    isActive: true,
    isApproved: true,
    isLockedOut: false,
    qualifications: ["M.Sc. in Environmental Sciences"],
    workExperience: [],
    interests: ["Meteorology", "Data Analytics"],
    skills: ["Data Analysis"],
    certificates: [],
    createdAtUtc: nowString
  });

  const traineeMenonRef = doc(db, "users", "trainee_menon");
  batch.set(traineeMenonRef, {
    id: "trainee_menon",
    uid: "trainee_menon",
    firstName: "Kavita",
    lastName: "Menon",
    fullName: "Kavita Menon",
    email: "kavita.menon@met.gov.in",
    role: "Trainee",
    roles: ["Trainee"],
    isActive: true,
    isApproved: true,
    isLockedOut: false,
    qualifications: ["B.Sc. in Physics"],
    workExperience: [
      { role: "Met Assistant", org: "RMC Chennai", years: 2 }
    ],
    interests: ["Observational Meteorology", "Severe Storm Warnings"],
    skills: ["Observation Systems"],
    certificates: [],
    createdAtUtc: nowString
  });

  // ==================== B. COURSES ====================

  const courseCycloneRef = doc(db, "courses", "course_cyclone");
  batch.set(courseCycloneRef, {
    id: "course_cyclone",
    code: "MET-301",
    title: "Advanced Tropical Cyclone Tracking",
    description: "Multi-model meteorological ensemble prediction and Doppler radar tracking techniques.",
    category: "Meteorology",
    level: "Advanced",
    status: "Published",
    price: 0,
    lecturerId: "trainer_verma",
    lecturerName: "Dr. Rajesh Verma",
    requiredSkills: ["Doppler Radar"],
    activeEnrolments: 2,
    createdAtUtc: nowString
  });

  const courseDisasterRef = doc(db, "courses", "course_disaster");
  batch.set(courseDisasterRef, {
    id: "course_disaster",
    code: "OCN-204",
    title: "Coastal Disaster Management",
    description: "Operational techniques for tracking storm surges, tsunamis, and marine coastal forecasting.",
    category: "Oceanography",
    level: "Intermediate",
    status: "Published",
    price: 0,
    lecturerId: "trainer_reddy",
    lecturerName: "Prof. Sunita Reddy",
    requiredSkills: ["Marine Forecasting"],
    activeEnrolments: 1,
    createdAtUtc: nowString
  });

  const courseSatelliteRef = doc(db, "courses", "course_satellite");
  batch.set(courseSatelliteRef, {
    id: "course_satellite",
    code: "RS-102",
    title: "Satellite Remote Sensing Basics",
    description: "Foundational techniques in satellite imagery parsing, GIS coordination, and spectral signature mapping.",
    category: "Remote Sensing",
    level: "Beginner",
    status: "Published",
    price: 0,
    lecturerId: "trainer_patel",
    lecturerName: "Dr. Amit Patel",
    requiredSkills: ["GIS Mapping"],
    activeEnrolments: 1,
    createdAtUtc: nowString
  });

  // ==================== C. ENROLLMENTS ====================

  // Anjali Sharma in Advanced Tropical Cyclone Tracking
  const enroll1Ref = doc(db, "enrollments", "enroll_anjali_cyclone");
  batch.set(enroll1Ref, {
    id: "enroll_anjali_cyclone",
    studentId: "trainee_sharma",
    studentName: "Anjali Sharma",
    studentEmail: "anjali.sharma@met.gov.in",
    courseId: "course_cyclone",
    courseTitle: "Advanced Tropical Cyclone Tracking",
    courseCode: "MET-301",
    category: "Meteorology",
    level: "Advanced",
    coverImageUrl: null,
    status: "Active",
    progressPercent: 45,
    enrolledAtUtc: nowString,
    completedAtUtc: null
  });

  // Kavita Menon in Advanced Tropical Cyclone Tracking
  const enroll2Ref = doc(db, "enrollments", "enroll_kavita_cyclone");
  batch.set(enroll2Ref, {
    id: "enroll_kavita_cyclone",
    studentId: "trainee_menon",
    studentName: "Kavita Menon",
    studentEmail: "kavita.menon@met.gov.in",
    courseId: "course_cyclone",
    courseTitle: "Advanced Tropical Cyclone Tracking",
    courseCode: "MET-301",
    category: "Meteorology",
    level: "Advanced",
    coverImageUrl: null,
    status: "Active",
    progressPercent: 15,
    enrolledAtUtc: nowString,
    completedAtUtc: null
  });

  // Rohan Gupta in Coastal Disaster Management
  const enroll3Ref = doc(db, "enrollments", "enroll_rohan_disaster");
  batch.set(enroll3Ref, {
    id: "enroll_rohan_disaster",
    studentId: "trainee_gupta",
    studentName: "Rohan Gupta",
    studentEmail: "rohan.gupta@met.gov.in",
    courseId: "course_disaster",
    courseTitle: "Coastal Disaster Management",
    courseCode: "OCN-204",
    category: "Oceanography",
    level: "Intermediate",
    coverImageUrl: null,
    status: "Active",
    progressPercent: 75,
    enrolledAtUtc: nowString,
    completedAtUtc: null
  });

  // Anjali Sharma in Satellite Remote Sensing Basics
  const enroll4Ref = doc(db, "enrollments", "enroll_anjali_satellite");
  batch.set(enroll4Ref, {
    id: "enroll_anjali_satellite",
    studentId: "trainee_sharma",
    studentName: "Anjali Sharma",
    studentEmail: "anjali.sharma@met.gov.in",
    courseId: "course_satellite",
    courseTitle: "Satellite Remote Sensing Basics",
    courseCode: "RS-102",
    category: "Remote Sensing",
    level: "Beginner",
    coverImageUrl: null,
    status: "Active",
    progressPercent: 0,
    enrolledAtUtc: nowString,
    completedAtUtc: null
  });

  // ==================== D. ASSESSMENTS ====================

  const assessCycloneRef = doc(db, "assessments", "assess_cyclone");
  batch.set(assessCycloneRef, {
    id: "assess_cyclone",
    courseId: "course_cyclone",
    title: "Tropical Cyclone Assessment 1",
    deadline: "2026-10-15T23:59:59Z",
    questions: [
      {
        id: "q_cy_01",
        question: "What does WRF stand for in meteorological modeling?",
        options: [
          "Weather Research and Forecasting",
          "Wind Range Finder",
          "Wave Research Forecast",
          "Water Resource Flow"
        ],
        correctIndex: 0
      },
      {
        id: "q_cy_02",
        question: "Which satellite channel is best suited to identify deep convective cyclone eyewalls at night?",
        options: [
          "Thermal Infrared (IR)",
          "Visible (VIS)",
          "Water Vapor (WV)",
          "Near Infrared (NIR)"
        ],
        correctIndex: 0
      }
    ],
    createdAt: nowString,
    createdBy: "Dr. Rajesh Verma",
    createdById: "trainer_verma"
  });

  const assessDisasterRef = doc(db, "assessments", "assess_disaster");
  batch.set(assessDisasterRef, {
    id: "assess_disaster",
    courseId: "course_disaster",
    title: "Coastal Warning Evaluation",
    deadline: "2026-11-01T23:59:59Z",
    questions: [
      {
        id: "q_dis_01",
        question: "What instrument is primarily used to measure wave heights in real-time?",
        options: [
          "Wave Buoys",
          "Barometer",
          "Anemometer",
          "Thermometer"
        ],
        correctIndex: 0
      }
    ],
    createdAt: nowString,
    createdBy: "Prof. Sunita Reddy",
    createdById: "trainer_reddy"
  });

  // ==================== E. TRAINER LIBRARY MATERIALS ====================

  const material1Ref = doc(db, "trainer_library", "material_01");
  batch.set(material1Ref, {
    id: "material_01",
    title: "Doppler Radar Principles",
    fileUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    fileName: "Doppler_Radar_Principles.pdf",
    fileSize: 4500120,
    fileType: "application/pdf",
    uploadedBy: "Dr. Rajesh Verma",
    uploadedById: "trainer_verma",
    uploadedAt: nowString,
    storagePath: ""
  });

  const material2Ref = doc(db, "trainer_library", "material_02");
  batch.set(material2Ref, {
    id: "material_02",
    title: "Ocean Storm Surge Modeling Guidelines",
    fileUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    fileName: "Storm_Surge_Guidelines.pdf",
    fileSize: 3120150,
    fileType: "application/pdf",
    uploadedBy: "Prof. Sunita Reddy",
    uploadedById: "trainer_reddy",
    uploadedAt: nowString,
    storagePath: ""
  });

  const material3Ref = doc(db, "trainer_library", "material_03");
  batch.set(material3Ref, {
    id: "material_03",
    title: "Satellite Remote Sensing Introduction",
    fileUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    fileName: "Remote_Sensing_Intro.pdf",
    fileSize: 8401200,
    fileType: "application/pdf",
    uploadedBy: "Dr. Amit Patel",
    uploadedById: "trainer_patel",
    uploadedAt: nowString,
    storagePath: ""
  });

  // ==================== F. ANNOUNCEMENTS ====================

  const ann1Ref = doc(db, "announcements", "ann_01");
  batch.set(ann1Ref, {
    id: "ann_01",
    title: "Welcome to Dakshata Connect Batch 2026",
    content: "We are pleased to introduce the updated Capacity Building Portal. Verify your profile subjects.",
    type: "Notification",
    createdAt: nowString,
    authorName: "System Admin"
  });

  const ann2Ref = doc(db, "announcements", "ann_02");
  batch.set(ann2Ref, {
    id: "ann_02",
    title: "Cyclone Tracking Course Deadline Extended",
    content: "The Doppler Radar Assessment deadline has been extended to October 15th.",
    type: "Notification",
    createdAt: nowString,
    authorName: "System Admin"
  });

  const ann3Ref = doc(db, "announcements", "ann_03");
  batch.set(ann3Ref, {
    id: "ann_03",
    title: "Live Satellite Meteorology Seminar",
    content: "Dr. Amit Patel will host a live remote sensing GIS analysis session this Friday at 3:00 PM.",
    type: "Content",
    createdAt: nowString,
    authorName: "System Admin"
  });

  // Commit the atomic writeBatch
  await batch.commit();
};
