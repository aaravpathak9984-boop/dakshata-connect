import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const seedMockData = async () => {
  // 1. Mock Trainee Profile
  await setDoc(doc(db, "users", "trainee_demo_01"), {
    id: "trainee_demo_01",
    uid: "trainee_demo_01",
    firstName: "Priya",
    lastName: "Sharma",
    fullName: "Priya Sharma",
    email: "priya.sharma@imd.gov.in",
    role: "Trainee",
    roles: ["Trainee"],
    isActive: true,
    isApproved: true,
    isLockedOut: false,
    qualifications: ["B.Tech in Atmospheric Sciences", "Diploma in Remote Sensing"],
    workExperience: [
      { role: "Junior Meteorological Assistant", org: "Regional Met Centre, Chennai", years: 2 }
    ],
    interests: ["Numerical Weather Prediction", "Satellite Meteorology", "Climate Modeling"],
    skills: ["Python", "Doppler Radar Analysis", "GIS Mapping", "Data Assimilation"],
    certificates: [
      { title: "Advanced Doppler Weather Radar Certification", issuer: "IMD Pune", year: 2025 }
    ],
    createdAtUtc: new Date().toISOString()
  });

  // 2. Mock Trainer Profile (Subject Expert)
  await setDoc(doc(db, "users", "trainer_demo_01"), {
    id: "trainer_demo_01",
    uid: "trainer_demo_01",
    firstName: "Rajesh K.",
    lastName: "Verma",
    fullName: "Dr. Rajesh K. Verma",
    email: "rajesh.verma@moes.gov.in",
    role: "Trainer",
    roles: ["Trainer"],
    isActive: true,
    isApproved: true,
    isLockedOut: false,
    experienceYears: 12,
    qualifications: ["Ph.D. in Physical Oceanography", "M.Sc. in Meteorology"],
    workExperience: [
      { role: "Senior Scientist", org: "Indian National Centre for Ocean Information Services", years: 8 },
      { role: "Lead Training Officer", org: "IMD Training Division", years: 4 }
    ],
    skills: ["Ocean-Atmosphere Coupling", "Cyclone Track Modeling", "Python", "WRF Modeling"],
    subjectsHandled: ["Tropical Cyclones & Severe Storms", "Operational Ocean Forecasting"],
    competencyScore: 94,
    createdAtUtc: new Date().toISOString()
  });

  // 3. Mock Course with Competency Mapping Requirements
  await setDoc(doc(db, "courses", "course_met_101"), {
    id: "course_met_101",
    title: "Advanced Tropical Cyclone Tracking & Early Warning Systems",
    description: "Operational methodologies for multi-model ensemble cyclone prediction and Doppler radar assimilation.",
    departmentId: "dept-cse",
    departmentName: "Computer Science & Engineering",
    category: "Meteorology",
    level: "Advanced",
    status: "Published",
    price: 0,
    lecturerId: "trainer_demo_01",
    lecturerName: "Dr. Rajesh K. Verma",
    requiredSkills: ["Cyclone Track Modeling", "Doppler Radar Analysis", "WRF Modeling"],
    activeEnrolments: 28,
    createdAtUtc: new Date().toISOString()
  });

  // 4. Mock Subject-wise Assessment
  await setDoc(doc(db, "assessments", "quiz_met_101"), {
    id: "quiz_met_101",
    courseId: "course_met_101",
    title: "Module 1 Assessment: Severe Storm Dynamics",
    deadline: "2026-09-15T23:59:59Z",
    questions: [
      {
        id: "q1",
        question: "Which quadrant of a Northern Hemisphere tropical cyclone typically experiences the highest storm surge?",
        options: ["Right-Front Quadrant", "Left-Front Quadrant", "Left-Rear Quadrant", "Eye Center"],
        correctIndex: 0
      },
      {
        id: "q2",
        question: "What parameter is primarily measured by dual-polarization Doppler radar to identify hydrometeor types?",
        options: ["Differential Reflectivity (ZDR)", "Radial Velocity", "Spectral Width", "Beam Attenuation"],
        correctIndex: 0
      }
    ],
    createdAt: new Date().toISOString()
  });

  // 5. Mock Announcement
  await setDoc(doc(db, "announcements", "ann_01"), {
    id: "ann_01",
    title: "Upcoming Coastal Workshop",
    content: "All regional meteorologists enrolled in Track 2 must complete the Doppler Radar Assessment before the Friday deadline.",
    publishedBy: "Admin Office",
    authorName: "Admin Office",
    timestamp: new Date().toISOString()
  });
};
