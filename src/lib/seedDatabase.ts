import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const seedDatabase = async (currentUser?: any) => {
  const nowString = new Date().toISOString();

  const setItem = async (collectionName: string, docId: string, data: any) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data, { merge: true });
    } catch (err) {
      console.warn(`Non-blocking warning: Failed to set document ${collectionName}/${docId}:`, err);
      if (collectionName === "users") {
        return; // Skip throwing for users collection to ensure other sections get seeded
      }
      throw err;
    }
  };

  try {
    // Ensure currently logged-in user has Admin role synced
    if (currentUser?.id) {
      await setItem("users", currentUser.id, {
        role: "Admin",
        roles: ["Admin"],
        isApproved: true,
        isActive: true
      });
    }
    // ==================== A. USERS ====================

    // 1. Admin
    await setItem("users", "admin_demo_01", {
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
    await setItem("users", "trainer_verma", {
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

    await setItem("users", "trainer_reddy", {
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

    await setItem("users", "trainer_patel", {
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
    await setItem("users", "trainee_sharma", {
      id: "trainee_sharma",
      uid: "trainee_sharma",
      firstName: "Priya",
      lastName: "Sharma",
      fullName: "Priya Sharma",
      email: "priya.sharma@imd.gov.in",
      role: "Trainee",
      roles: ["Trainee"],
      isActive: true,
      isApproved: true,
      isLockedOut: false,
      qualifications: ["B.Tech in Earth Sciences", "Advanced Meteorology Course"],
      workExperience: [
        { role: "Junior Forecaster", org: "IMD Pune", years: 2 }
      ],
      interests: ["Cyclone Forecasting", "GIS Mapping", "Radar Meteorology"],
      skills: ["Python", "GIS Mapping", "Doppler Radar"],
      certificates: [],
      createdAtUtc: nowString
    });

    await setItem("users", "trainee_gupta", {
      id: "trainee_gupta",
      uid: "trainee_gupta",
      firstName: "Anjali",
      lastName: "Gupta",
      fullName: "Anjali Gupta",
      email: "anjali.gupta@imd.gov.in",
      role: "Trainee",
      roles: ["Trainee"],
      isActive: true,
      isApproved: true,
      isLockedOut: false,
      qualifications: ["M.Sc. in Atmospheric Sciences"],
      workExperience: [
        { role: "Research Assistant", org: "IITM Pune", years: 1 }
      ],
      interests: ["Ocean Wave Modeling", "Coastal Disaster Management"],
      skills: ["Marine Forecasting", "Data Analysis"],
      certificates: [],
      createdAtUtc: nowString
    });

    // ==================== B. COURSES ====================

    await setItem("courses", "course_cyclone", {
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
      createdAtUtc: nowString,
      modules: [
        {
          id: "mod_cy_01",
          courseId: "course_cyclone",
          title: "Introduction to Tropical Cyclones",
          description: "Basic thermodynamics, core structure, and dynamics of cyclone genesis.",
          sortOrder: 1,
          lessons: [
            {
              id: "les_cy_11",
              moduleId: "mod_cy_01",
              title: "Eye and Eyewall Structure",
              type: "Text",
              contentUrl: null,
              textContent: "The eye of a tropical cyclone is a roughly circular area of comparatively light winds and fair weather found at the center of a severe tropical cyclone. It is surrounded by the eyewall, a ring of towering thunderstorms where the most severe weather and highest winds occur.",
              durationMinutes: 15,
              sortOrder: 1,
              isPreview: true
            },
            {
              id: "les_cy_12",
              moduleId: "mod_cy_01",
              title: "Cyclone Thermodynamic Cycles",
              type: "Pdf",
              contentUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
              textContent: null,
              durationMinutes: 20,
              sortOrder: 2,
              isPreview: false
            }
          ]
        },
        {
          id: "mod_cy_02",
          courseId: "course_cyclone",
          title: "Radar and Satellite Tracking Techniques",
          description: "Doppler radar arrays, infrared sweeps, and satellite data assimilation.",
          sortOrder: 2,
          lessons: [
            {
              id: "les_cy_21",
              moduleId: "mod_cy_02",
              title: "Doppler Velocity Interpretation",
              type: "Video",
              contentUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
              textContent: null,
              durationMinutes: 30,
              sortOrder: 1,
              isPreview: false
            }
          ]
        }
      ]
    });

    await setItem("courses", "course_disaster", {
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
      createdAtUtc: nowString,
      modules: [
        {
          id: "mod_di_01",
          courseId: "course_disaster",
          title: "Coastal Vulnerability and Storm Surges",
          description: "Physics of storm surge formation, coastal bathymetry, and inundation modeling.",
          sortOrder: 1,
          lessons: [
            {
              id: "les_di_11",
              moduleId: "mod_di_01",
              title: "Bathymetry Effects on Wave Runup",
              type: "Text",
              contentUrl: null,
              textContent: "Shallow coastal bathymetry significantly amplifies incoming waves and surge height due to frictional shoaling. Understanding the local depth profile is critical for accurate surge prediction models.",
              durationMinutes: 15,
              sortOrder: 1,
              isPreview: true
            }
          ]
        }
      ]
    });

    await setItem("courses", "course_satellite", {
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
      createdAtUtc: nowString,
      modules: [
        {
          id: "mod_sa_01",
          courseId: "course_satellite",
          title: "Principles of Remote Sensing",
          description: "Electromagnetic spectrum, sensors, and satellite orbits.",
          sortOrder: 1,
          lessons: [
            {
              id: "les_sa_11",
              moduleId: "mod_sa_01",
              title: "Electromagnetic Spectrum Basics",
              type: "Text",
              contentUrl: null,
              textContent: "Remote sensing instruments measure reflected or emitted electromagnetic radiation. The bands of interest typically include visible, near-infrared, thermal, and microwave sweeps.",
              durationMinutes: 10,
              sortOrder: 1,
              isPreview: true
            }
          ]
        }
      ]
    });

    // ==================== C. ENROLLMENTS ====================

    await setItem("enrollments", "enroll_priya_cyclone", {
      id: "enroll_priya_cyclone",
      studentId: "trainee_sharma",
      studentName: "Priya Sharma",
      studentEmail: "priya.sharma@imd.gov.in",
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

    await setItem("enrollments", "enroll_anjali_disaster", {
      id: "enroll_anjali_disaster",
      studentId: "trainee_gupta",
      studentName: "Anjali Gupta",
      studentEmail: "anjali.gupta@imd.gov.in",
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

    // ==================== D. ASSESSMENTS ====================

    await setItem("assessments", "assess_cyclone", {
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

    await setItem("assessments", "assess_disaster", {
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

    await setItem("trainer_library", "material_01", {
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

    await setItem("trainer_library", "material_02", {
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

    await setItem("trainer_library", "material_03", {
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

    await setItem("announcements", "ann_01", {
      id: "ann_01",
      title: "Welcome to Dakshata Connect Batch 2026",
      content: "We are pleased to introduce the updated Capacity Building Portal. Verify your profile subjects.",
      type: "Notification",
      createdAt: nowString,
      authorName: "System Admin"
    });

    await setItem("announcements", "ann_02", {
      id: "ann_02",
      title: "Cyclone Tracking Course Deadline Extended",
      content: "The Doppler Radar Assessment deadline has been extended to October 15th.",
      type: "Notification",
      createdAt: nowString,
      authorName: "System Admin"
    });

    await setItem("announcements", "ann_03", {
      id: "ann_03",
      title: "Live Satellite Meteorology Seminar",
      content: "Dr. Amit Patel will host a live remote sensing GIS analysis session this Friday at 3:00 PM.",
      type: "Content",
      createdAt: nowString,
      authorName: "System Admin"
    });

    // ==================== G. SUPPORT TICKETS ====================
    await setItem("support_tickets", "ticket_01", {
      id: "ticket_01",
      submittedById: "trainee_sharma",
      submittedByName: "Priya Sharma",
      submittedByEmail: "priya.sharma@imd.gov.in",
      subject: "Access issues with Doppler radar slide deck",
      category: "Technical",
      priority: "High",
      status: "Open",
      createdAtUtc: nowString,
      lastActivityAtUtc: nowString,
      messageCount: 1,
      assignedToId: null,
      assignedToName: null,
      resolvedAtUtc: null,
      closedAtUtc: null
    });

    await setDoc(doc(db, "support_tickets", "ticket_01", "replies", "reply_01"), {
      authorId: "trainee_sharma",
      authorName: "Priya Sharma",
      body: "I am getting a permission error when trying to view Doppler Radar Principles.pdf.",
      createdAtUtc: nowString,
      isInternalNote: false
    }, { merge: true });

    await setItem("support_tickets", "ticket_02", {
      id: "ticket_02",
      submittedById: "trainee_gupta",
      submittedByName: "Anjali Gupta",
      submittedByEmail: "anjali.gupta@imd.gov.in",
      subject: "MCQ Quiz submission score discrepancy",
      category: "Course",
      priority: "Normal",
      status: "InProgress",
      createdAtUtc: nowString,
      lastActivityAtUtc: nowString,
      messageCount: 1,
      assignedToId: "trainer_verma",
      assignedToName: "Dr. Rajesh Verma",
      resolvedAtUtc: null,
      closedAtUtc: null
    });

    await setDoc(doc(db, "support_tickets", "ticket_02", "replies", "reply_02"), {
      authorId: "trainee_gupta",
      authorName: "Anjali Gupta",
      body: "My score shows 50% but I got all eyewall answers correct. Please verify.",
      createdAtUtc: nowString,
      isInternalNote: false
    }, { merge: true });

  } catch (error) {
    console.error("Seeding operation failed:", error);
    throw error;
  }
};
