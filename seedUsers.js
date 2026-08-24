import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0tc74o7tAqQazfJf3Z2wwLvT8bOUHjQE",
  authDomain: "dakshata-connect.firebaseapp.com",
  projectId: "dakshata-connect",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usersToCreate = [
  {
    email: "admin@dakshata.in",
    password: "password123",
    data: {
      firstName: "Super",
      lastName: "Admin",
      fullName: "Super Admin",
      role: "Admin",
      roles: ["Admin"],
      isActive: true,
      isApproved: true,
      isLockedOut: false,
    }
  },
  {
    email: "rajesh.verma@moes.gov.in",
    password: "password123",
    data: {
      firstName: "Rajesh",
      lastName: "Verma",
      fullName: "Dr. Rajesh Verma",
      role: "Trainer",
      roles: ["Trainer"],
      isActive: true,
      isApproved: true,
      isLockedOut: false,
      experienceYears: 12,
      qualifications: ["Ph.D. in Meteorology", "M.Sc. in Atmospheric Sciences"],
      skills: ["Python", "Doppler Radar", "Cyclone Modeling"],
      subjectsHandled: ["Tropical Cyclones & Severe Storms", "Doppler Weather Radar"],
    }
  },
  {
    email: "priya.sharma@imd.gov.in",
    password: "password123",
    data: {
      firstName: "Priya",
      lastName: "Sharma",
      fullName: "Priya Sharma",
      role: "Trainee",
      roles: ["Trainee"],
      isActive: true,
      isApproved: true,
      isLockedOut: false,
      qualifications: ["B.Tech in Earth Sciences", "Advanced Meteorology Course"],
      interests: ["Cyclone Forecasting", "GIS Mapping", "Radar Meteorology"],
      skills: ["Python", "GIS Mapping", "Doppler Radar"],
    }
  }
];

async function seed() {
  for (const u of usersToCreate) {
    let userCredential;
    try {
      console.log(`Creating ${u.email}...`);
      userCredential = await createUserWithEmailAndPassword(auth, u.email, u.password);
      console.log(`Created ${u.email} with UID: ${userCredential.user.uid}`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`${u.email} already exists, signing in to get UID...`);
        userCredential = await signInWithEmailAndPassword(auth, u.email, u.password);
      } else {
        console.error(`Error with ${u.email}:`, err);
        continue;
      }
    }

    const uid = userCredential.user.uid;
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, {
      ...u.data,
      id: uid,
      email: u.email,
      createdAtUtc: new Date().toISOString()
    }, { merge: true });
    
    console.log(`Successfully seeded Firestore for ${u.email}`);
  }
  console.log("Done seeding users!");
  process.exit(0);
}

seed();
