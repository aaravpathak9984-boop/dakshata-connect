import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type {
  AuthenticationResponse,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  UserSummary,
} from "@/types/auth";

const googleProvider = new GoogleAuthProvider();

export const authApi = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      payload.email,
      payload.password
    );
    const firebaseUser = userCredential.user;

    // 2. Set profile displayName
    const fullName = `${payload.firstName} ${payload.lastName}`;
    await updateProfile(firebaseUser, { displayName: fullName });

    // 3. Save profile in Firestore users collection
    const uid = firebaseUser.uid;
    const isApproved = payload.role !== "Trainer"; // Trainees and Admins auto-approved; Trainers require admin approval

    const userDocData = {
      id: uid,
      firstName: payload.firstName,
      lastName: payload.lastName,
      fullName: fullName,
      email: payload.email,
      avatarUrl: null,
      emailConfirmed: true,
      isActive: isApproved,
      isApproved: isApproved,
      isLockedOut: false,
      createdAtUtc: new Date().toISOString(),
      lastLoginAtUtc: new Date().toISOString(),
      roles: [payload.role],
      role: payload.role,
      enrollmentCount: 0,
      coursesOwned: 0,
      skills: [],
      qualifications: [],
      experienceYears: 0,
    };

    await setDoc(doc(db, "users", uid), userDocData);

    // 4. Force sign out immediately since registration displays success screen
    await signOut(auth);

    return {
      userId: uid,
      email: payload.email,
      requiresEmailVerification: false,
    };
  },

  async login(payload: LoginPayload): Promise<AuthenticationResponse> {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      payload.email,
      payload.password
    );
    const firebaseUser = userCredential.user;

    // Fetch Firestore user doc
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error("User profile not found in database.");
    }

    const userData = userDoc.data();

    // Check approval status for Trainers
    if (userData.roles.includes("Trainer") && !userData.isApproved) {
      await signOut(auth);
      throw new Error("Your trainer account is pending approval by an administrator.");
    }

    // Check if user is active
    if (!userData.isActive) {
      await signOut(auth);
      throw new Error("This account is inactive. Please contact an administrator.");
    }

    // Update last login timestamp
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      { lastLoginAtUtc: new Date().toISOString() },
      { merge: true }
    );

    const userSummary: UserSummary = {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      fullName: userData.fullName || `${userData.firstName} ${userData.lastName}`,
      roles: userData.roles || [userData.role || "Trainee"],
      role: userData.role || (userData.roles && userData.roles[0]) || "Trainee",
    };

    return {
      accessToken: "firebase-token-placeholder",
      refreshToken: "firebase-refresh-token-placeholder",
      accessTokenExpiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
      tokenType: "Bearer",
      user: userSummary,
    };
  },

  async signInWithGoogle(defaultRole: "Trainee" | "Trainer" | "Admin" = "Trainee"): Promise<AuthenticationResponse> {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let userData;

    if (!userSnap.exists()) {
      const isTrainer = defaultRole === "Trainer";
      const nameParts = user.displayName?.split(" ") || ["User"];
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");
      const fullName = user.displayName || "User";

      userData = {
        id: user.uid,
        firstName,
        lastName,
        fullName,
        email: user.email ?? "",
        avatarUrl: user.photoURL || null,
        emailConfirmed: true,
        isActive: !isTrainer,
        isApproved: !isTrainer,
        isLockedOut: false,
        createdAtUtc: new Date().toISOString(),
        lastLoginAtUtc: new Date().toISOString(),
        roles: [defaultRole],
        role: defaultRole,
        enrollmentCount: 0,
        coursesOwned: 0,
        skills: [],
        qualifications: [],
        experienceYears: 0,
      };

      await setDoc(userRef, userData);
    } else {
      const existingData = userSnap.data();
      
      userData = {
        id: user.uid,
        firstName: existingData.firstName || user.displayName?.split(" ")[0] || "User",
        lastName: existingData.lastName || user.displayName?.split(" ").slice(1).join(" ") || "",
        fullName: existingData.fullName || user.displayName || "User",
        email: existingData.email || user.email || "",
        role: existingData.role || existingData.roles?.[0] || defaultRole,
        roles: existingData.roles || [existingData.role || defaultRole],
        isActive: existingData.isActive !== false,
        isApproved: existingData.isApproved !== false,
      };
    }

    if (!userData.isActive || !userData.isApproved) {
      await signOut(auth);
      if (userData.role === "Trainer" || userData.roles.includes("Trainer")) {
        throw new Error("Your Trainer account is pending approval by an administrator.");
      }
      throw new Error("Your account has been deactivated. Please contact an administrator.");
    }

    // Update last login timestamp
    await setDoc(
      doc(db, "users", user.uid),
      { lastLoginAtUtc: new Date().toISOString() },
      { merge: true }
    );

    return {
      accessToken: "firebase-google-token",
      refreshToken: "firebase-google-refresh",
      accessTokenExpiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
      tokenType: "Bearer",
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        roles: userData.roles,
        role: userData.role || (userData.roles && userData.roles[0]) || "Trainee",
      },
    };
  },

  async refresh(): Promise<AuthenticationResponse | null> {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        unsubscribe();
        if (!firebaseUser) {
          resolve(null);
          return;
        }
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (!userDoc.exists()) {
            resolve(null);
            return;
          }
          const userData = userDoc.data();

          if (userData.roles.includes("Trainer") && !userData.isApproved) {
            resolve(null);
            return;
          }
          if (!userData.isActive) {
            resolve(null);
            return;
          }

          const userSummary: UserSummary = {
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            fullName: userData.fullName || `${userData.firstName} ${userData.lastName}`,
            roles: userData.roles || [userData.role || "Trainee"],
            role: userData.role || (userData.roles && userData.roles[0]) || "Trainee",
          };

          resolve({
            accessToken: "firebase-token-placeholder",
            refreshToken: "firebase-refresh-token-placeholder",
            accessTokenExpiresAtUtc: new Date(Date.now() + 3600000).toISOString(),
            tokenType: "Bearer",
            user: userSummary,
          });
        } catch {
          resolve(null);
        }
      });
    });
  },

  async me(): Promise<UserSummary> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not authenticated.");

    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (!userDoc.exists()) throw new Error("User profile not found in database.");

    const userData = userDoc.data();
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      fullName: userData.fullName || `${userData.firstName} ${userData.lastName}`,
      roles: userData.roles || [userData.role || "Trainee"],
      role: userData.role || (userData.roles && userData.roles[0]) || "Trainee",
    };
  },

  async verifyEmail(_userId: string, _token: string): Promise<void> {
    // No-op for serverless Firebase setup
    return Promise.resolve();
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },
};
