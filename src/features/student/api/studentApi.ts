import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { StudentDashboard, StudentCourse, CategoryProgress, RecommendedCourse } from "./types";

export const studentApi = {
  async dashboard(): Promise<StudentDashboard> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      return {
        summary: {
          activeCourses: 0,
          completedCourses: 0,
          averageProgressPercent: 0,
          lessonsAvailable: 0,
          learningMinutes: 0,
          coursesNearlyDone: 0,
        },
        continueLearning: [],
        completed: [],
        categoryProgress: [],
        enrollmentActivity: [],
        recommended: [],
      };
    }

    try {
      // 1. Fetch user's enrollments from Firestore
      const enrollQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", currentUid)
      );
      const enrollSnapshot = await getDocs(enrollQuery);
      
      // Fetch all courses in advance to map details
      const coursesSnapshot = await getDocs(collection(db, "courses"));
      const coursesMap = new Map<string, any>();
      coursesSnapshot.forEach((docSnap) => {
        coursesMap.set(docSnap.id, docSnap.data());
      });

      const enrolledCourses: StudentCourse[] = [];
      const completedCourses: StudentCourse[] = [];
      const enrolledCourseIds = new Set<string>();

      enrollSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const courseId = data.courseId || "";
        enrolledCourseIds.add(courseId);

        // Retrieve real modules/lessons details
        const courseDocData = coursesMap.get(courseId);
        const modules = courseDocData?.modules || [];
        const moduleCount = modules.length;
        const lessonCount = modules.reduce((sum: number, mod: any) => sum + (mod.lessons ? mod.lessons.length : 0), 0);
        const totalMinutes = modules.reduce((sum: number, mod: any) => sum + (mod.lessons ? mod.lessons.reduce((lsum: number, les: any) => lsum + (les.durationMinutes || 0), 0) : 0), 0);
        const firstLessonTitle = modules[0] && modules[0].lessons && modules[0].lessons[0] ? modules[0].lessons[0].title : null;

        const courseItem: StudentCourse = {
          enrollmentId: docSnap.id,
          courseId: courseId,
          title: data.courseTitle || "Atmospheric Course",
          code: data.courseCode || "MET-101",
          category: data.category || "General",
          level: data.level || "Beginner",
          coverImageUrl: data.coverImageUrl || null,
          lecturerName: data.lecturerName || "Instructor",
          status: data.status || "Active",
          progressPercent: data.progressPercent || 0,
          moduleCount: moduleCount || 1, 
          lessonCount: lessonCount || 5,  
          totalMinutes: totalMinutes || 120, 
          firstLessonTitle: firstLessonTitle || (modules[0] ? modules[0].title : "Course Introduction"),
          enrolledAtUtc: data.enrolledAtUtc || new Date().toISOString(),
          completedAtUtc: data.status === "Completed" ? (data.completedAtUtc || new Date().toISOString()) : null,
        };

        if (data.status === "Completed") {
          completedCourses.push(courseItem);
        } else {
          enrolledCourses.push(courseItem);
        }
      });

      // 2. Calculate recommendations
      const recommended: RecommendedCourse[] = [];

      coursesSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Recommend courses that the user is not currently enrolled in
        if (!enrolledCourseIds.has(docSnap.id) && data.status === "Published") {
          const modules = data.modules || [];
          const lessonCount = modules.reduce((sum: number, mod: any) => sum + (mod.lessons ? mod.lessons.length : 0), 0);

          recommended.push({
            courseId: docSnap.id,
            title: data.title || "",
            code: data.code || "",
            category: data.category || "General",
            level: data.level || "Beginner",
            price: data.price || 0,
            coverImageUrl: data.coverImageUrl || null,
            lecturerName: data.lecturerName || "Subject Expert",
            enrolledCount: data.activeEnrolments || 0,
            lessonCount: lessonCount || 5,
          });
        }
      });

      // 3. Compute Summary Statistics
      const allEnrollments = [...enrolledCourses, ...completedCourses];
      const activeCoursesCount = enrolledCourses.length;
      const completedCoursesCount = completedCourses.length;
      
      const totalProgress = allEnrollments.reduce((sum, item) => sum + item.progressPercent, 0);
      const averageProgress = allEnrollments.length > 0 
        ? Math.round(totalProgress / allEnrollments.length) 
        : 0;

      const coursesNearlyDoneCount = enrolledCourses.filter(
        (item) => item.progressPercent > 80 && item.status !== "Completed"
      ).length;

      // 4. Group Category Progress
      const categoryMap = new Map<string, { totalProg: number; count: number }>();
      allEnrollments.forEach((item) => {
        const current = categoryMap.get(item.category) || { totalProg: 0, count: 0 };
        categoryMap.set(item.category, {
          totalProg: current.totalProg + item.progressPercent,
          count: current.count + 1,
        });
      });

      const categoryProgress: CategoryProgress[] = Array.from(categoryMap.entries()).map(
        ([label, data]) => ({
          label,
          courseCount: data.count,
          averageProgressPercent: Math.round(data.totalProg / data.count),
        })
      );

      // 5. Hardcode a simple mock enrollment activity graph data
      const enrollmentActivity = [
        { label: "Jan", value: 1 },
        { label: "Feb", value: 2 },
        { label: "Mar", value: 3 },
        { label: "Apr", value: 4 },
        { label: "May", value: allEnrollments.length },
      ];

      return {
        summary: {
          activeCourses: activeCoursesCount,
          completedCourses: completedCoursesCount,
          averageProgressPercent: averageProgress,
          lessonsAvailable: allEnrollments.length * 12,
          learningMinutes: totalProgress * 15,
          coursesNearlyDone: coursesNearlyDoneCount,
        },
        continueLearning: enrolledCourses,
        completed: completedCourses,
        categoryProgress,
        enrollmentActivity,
        recommended: recommended.slice(0, 3), // return max 3 recommendations
      };
    } catch (err) {
      console.error("Failed to build student dashboard details from Firestore:", err);
      // Fallback safe return
      return {
        summary: {
          activeCourses: 0,
          completedCourses: 0,
          averageProgressPercent: 0,
          lessonsAvailable: 0,
          learningMinutes: 0,
          coursesNearlyDone: 0,
        },
        continueLearning: [],
        completed: [],
        categoryProgress: [],
        enrollmentActivity: [],
        recommended: [],
      };
    }
  },
};
