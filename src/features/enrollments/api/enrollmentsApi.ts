import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import type { CatalogCourse, CatalogFilters, Enrollment, PagedResult, EnrollmentStatus } from "./types";

export const enrollmentsApi = {
  async catalog(filters: CatalogFilters): Promise<PagedResult<CatalogCourse>> {
    const currentUid = auth.currentUser?.uid;
    
    // 1. Fetch user's enrollments to determine isEnrolled status
    const enrolledCourseIds = new Set<string>();
    if (currentUid) {
      const enrollQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", currentUid)
      );
      const enrollSnap = await getDocs(enrollQuery);
      enrollSnap.forEach((d) => {
        enrolledCourseIds.add(d.data().courseId);
      });
    }

    // 2. Fetch all courses
    const coursesSnap = await getDocs(collection(db, "courses"));
    let items: CatalogCourse[] = [];

    coursesSnap.forEach((d) => {
      const data = d.data();
      // Only include Published courses in the catalog
      if (data.status === "Published") {
        items.push({
          id: d.id,
          title: data.title || "",
          code: data.code || "",
          description: data.description || null,
          category: data.category || "General",
          level: data.level || "Beginner",
          price: data.price || 0,
          coverImageUrl: data.coverImageUrl || null,
          lecturerId: data.lecturerId || "",
          lecturerName: data.lecturerName || "Subject Expert",
          enrolledCount: data.activeEnrolments || 0,
          isEnrolled: enrolledCourseIds.has(d.id),
          createdAtUtc: data.createdAtUtc || new Date().toISOString(),
        });
      }
    });

    // 3. Apply Filters in-memory
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.code.toLowerCase().includes(searchLower) ||
          (c.description && c.description.toLowerCase().includes(searchLower))
      );
    }

    if (filters.category) {
      items = items.filter((c) => c.category === filters.category);
    }

    if (filters.level) {
      items = items.filter((c) => c.level === filters.level);
    }

    // 4. Sort and Paginate
    items.sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime());

    const totalCount = items.length;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 12;
    const totalPages = Math.ceil(totalCount / pageSize);
    const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      items: paginatedItems,
      page,
      pageSize,
      totalCount,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };
  },

  async enroll(courseId: string): Promise<Enrollment> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) throw new Error("Not authenticated.");

    // Fetch course details
    const courseDoc = await getDoc(doc(db, "courses", courseId));
    if (!courseDoc.exists()) throw new Error("Course not found.");
    const courseData = courseDoc.data();

    // Create Enrollment Record
    const userDoc = await getDoc(doc(db, "users", currentUid));
    const userData = userDoc.data();
    const studentName = userData?.fullName || auth.currentUser?.displayName || "Trainee";
    const studentEmail = userData?.email || auth.currentUser?.email || "";

    const newEnrollData = {
      studentId: currentUid,
      studentName,
      studentEmail,
      courseId,
      courseTitle: courseData.title || "",
      courseCode: courseData.code || "",
      category: courseData.category || "General",
      level: courseData.level || "Beginner",
      coverImageUrl: courseData.coverImageUrl || null,
      status: "Active" as const,
      progressPercent: 0,
      enrolledAtUtc: new Date().toISOString(),
      completedAtUtc: null
    };

    const docRef = await addDoc(collection(db, "enrollments"), newEnrollData);

    // Increment active enrolments
    const newEnrolmentsCount = (courseData.activeEnrolments || 0) + 1;
    await updateDoc(doc(db, "courses", courseId), {
      activeEnrolments: newEnrolmentsCount
    });

    return {
      id: docRef.id,
      ...newEnrollData,
      courseCategory: courseData.category || "General",
      courseLevel: courseData.level || "Beginner",
      courseCoverImageUrl: courseData.coverImageUrl || null
    };
  },

  async mine(): Promise<Enrollment[]> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return [];

    const q = query(
      collection(db, "enrollments"),
      where("studentId", "==", currentUid)
    );
    const snap = await getDocs(q);
    const items: Enrollment[] = [];

    snap.forEach((d) => {
      const data = d.data();
      items.push({
        id: d.id,
        studentId: data.studentId || "",
        studentName: data.studentName || "",
        studentEmail: data.studentEmail || "",
        courseId: data.courseId || "",
        courseTitle: data.courseTitle || "",
        courseCode: data.courseCode || "",
        courseCategory: data.category || "General",
        courseLevel: data.level || "Beginner",
        courseCoverImageUrl: data.coverImageUrl || null,
        status: (data.status || "Active") as EnrollmentStatus,
        progressPercent: data.progressPercent || 0,
        enrolledAtUtc: data.enrolledAtUtc || new Date().toISOString(),
        completedAtUtc: data.completedAtUtc || null
      });
    });

    return items;
  },

  async updateProgress(enrollmentId: string, progressPercent: number): Promise<Enrollment> {
    const enrollRef = doc(db, "enrollments", enrollmentId);
    const enrollSnap = await getDoc(enrollRef);
    if (!enrollSnap.exists()) throw new Error("Enrollment not found.");
    
    const data = enrollSnap.data();
    const isCompleted = progressPercent >= 100;
    
    const updates: any = {
      progressPercent,
      status: isCompleted ? "Completed" : data.status,
      completedAtUtc: isCompleted ? new Date().toISOString() : data.completedAtUtc
    };

    await updateDoc(enrollRef, updates);

    return {
      id: enrollmentId,
      studentId: data.studentId || "",
      studentName: data.studentName || "",
      studentEmail: data.studentEmail || "",
      courseId: data.courseId || "",
      courseTitle: data.courseTitle || "",
      courseCode: data.courseCode || "",
      courseCategory: data.category || "General",
      courseLevel: data.level || "Beginner",
      courseCoverImageUrl: data.coverImageUrl || null,
      status: updates.status as EnrollmentStatus,
      progressPercent: progressPercent,
      enrolledAtUtc: data.enrolledAtUtc || new Date().toISOString(),
      completedAtUtc: updates.completedAtUtc
    };
  },

  async unenroll(enrollmentId: string): Promise<void> {
    const enrollRef = doc(db, "enrollments", enrollmentId);
    const enrollSnap = await getDoc(enrollRef);
    if (!enrollSnap.exists()) return;
    
    const data = enrollSnap.data();
    const courseId = data.courseId;

    // Delete enrollment document
    await deleteDoc(enrollRef);

    // Decrement course active enrolments count
    if (courseId) {
      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);
      if (courseSnap.exists()) {
        const courseData = courseSnap.data();
        const newEnrolmentsCount = Math.max(0, (courseData.activeEnrolments || 0) - 1);
        await updateDoc(courseRef, { activeEnrolments: newEnrolmentsCount });
      }
    }
  },

  async roster(courseId: string): Promise<Enrollment[]> {
    const q = query(
      collection(db, "enrollments"),
      where("courseId", "==", courseId)
    );
    const snap = await getDocs(q);
    const items: Enrollment[] = [];

    snap.forEach((d) => {
      const data = d.data();
      items.push({
        id: d.id,
        studentId: data.studentId || "",
        studentName: data.studentName || "",
        studentEmail: data.studentEmail || "",
        courseId: data.courseId || "",
        courseTitle: data.courseTitle || "",
        courseCode: data.courseCode || "",
        courseCategory: data.category || "General",
        courseLevel: data.level || "Beginner",
        courseCoverImageUrl: data.coverImageUrl || null,
        status: (data.status || "Active") as EnrollmentStatus,
        progressPercent: data.progressPercent || 0,
        enrolledAtUtc: data.enrolledAtUtc || new Date().toISOString(),
        completedAtUtc: data.completedAtUtc || null
      });
    });

    return items;
  },
};
