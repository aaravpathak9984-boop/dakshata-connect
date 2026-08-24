import { auth, db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import type { Course, CreateCoursePayload } from "./types";

export const coursesApi = {
  async list(): Promise<Course[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "courses"));
      const courses: Course[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        courses.push({
          id: docSnap.id,
          title: data.title || "",
          code: data.code || "",
          description: data.description || null,
          category: data.category || "",
          level: data.level || "Beginner",
          status: data.status || "Draft",
          price: data.price || 0,
          coverImageUrl: data.coverImageUrl || null,
          departmentId: data.departmentId || null,
          departmentName: data.departmentName || null,
          lecturerId: data.lecturerId || "",
          lecturerName: data.lecturerName || "Unknown Trainer",
          createdAtUtc: data.createdAtUtc || new Date().toISOString(),
        });
      });

      // Sort by createdAtUtc descending
      courses.sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime());
      return courses;
    } catch (err) {
      console.warn("Non-blocking warning: Failed to list courses:", err);
      return [];
    }
  },

  async create(payload: CreateCoursePayload): Promise<Course> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("You must be logged in to create a course.");

    // Fetch trainer's profile to retrieve full name
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    const trainerName = userSnap.exists()
      ? userSnap.data().fullName
      : (currentUser.displayName || "Unknown Trainer");

    // Retrieve department name if departmentId is provided
    let departmentName: string | null = null;
    if (payload.departmentId) {
      try {
        const deptSnap = await getDoc(doc(db, "departments", payload.departmentId));
        if (deptSnap.exists()) {
          departmentName = deptSnap.data().name || null;
        }
      } catch (error) {
        console.warn("Could not fetch department name:", error);
      }
    }

    const courseRef = doc(collection(db, "courses"));
    const courseData = {
      title: payload.title,
      code: payload.code,
      description: payload.description || null,
      category: payload.category,
      level: payload.level,
      status: payload.status,
      price: payload.price,
      coverImageUrl: payload.coverImageUrl || null,
      departmentId: payload.departmentId || null,
      departmentName: departmentName,
      lecturerId: currentUser.uid,
      lecturerName: trainerName,
      createdAtUtc: new Date().toISOString(),
      requiredSkills: [], // Competency Matrix placeholder
    };

    await setDoc(courseRef, courseData);

    return {
      id: courseRef.id,
      ...courseData,
    };
  },

  async update(id: string, payload: CreateCoursePayload): Promise<Course> {
    const courseRef = doc(db, "courses", id);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) throw new Error("Course not found.");

    let departmentName: string | null = null;
    if (payload.departmentId) {
      try {
        const deptSnap = await getDoc(doc(db, "departments", payload.departmentId));
        if (deptSnap.exists()) {
          departmentName = deptSnap.data().name || null;
        }
      } catch (error) {
        console.warn("Could not fetch department name:", error);
      }
    }

    const updateData: Record<string, any> = {
      title: payload.title,
      code: payload.code,
      description: payload.description || null,
      category: payload.category,
      level: payload.level,
      status: payload.status,
      price: payload.price,
      coverImageUrl: payload.coverImageUrl || null,
      departmentId: payload.departmentId || null,
      departmentName: departmentName,
    };

    await updateDoc(courseRef, updateData);

    const fullSnap = await getDoc(courseRef);
    const data = fullSnap.data()!;
    return {
      id,
      title: data.title || "",
      code: data.code || "",
      description: data.description || null,
      category: data.category || "",
      level: data.level || "Beginner",
      status: data.status || "Draft",
      price: data.price || 0,
      coverImageUrl: data.coverImageUrl || null,
      departmentId: data.departmentId || null,
      departmentName: data.departmentName || null,
      lecturerId: data.lecturerId || "",
      lecturerName: data.lecturerName || "Unknown Trainer",
      createdAtUtc: data.createdAtUtc || new Date().toISOString(),
    };
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "courses", id));
  },
};
