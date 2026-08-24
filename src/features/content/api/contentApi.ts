import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { CourseContent, CourseModule, Lesson, LessonPayload, ModulePayload } from "./types";

const generateId = () => {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const contentApi = {
  async get(courseId: string): Promise<CourseContent> {
    const courseRef = doc(db, "courses", courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) {
      throw new Error("Course not found");
    }
    const data = snap.data();
    return {
      courseId: snap.id,
      courseTitle: data.title || "",
      courseCode: data.code || "",
      courseStatus: data.status || "Draft",
      lecturerId: data.lecturerId || "",
      modules: data.modules || [],
    };
  },

  async createModule(courseId: string, payload: ModulePayload): Promise<CourseModule> {
    const courseRef = doc(db, "courses", courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) throw new Error("Course not found");

    const data = snap.data();
    const modules: CourseModule[] = data.modules || [];

    const newModule: CourseModule = {
      id: generateId(),
      courseId,
      title: payload.title,
      description: payload.description || null,
      sortOrder: modules.length + 1,
      lessons: [],
    };

    modules.push(newModule);
    await updateDoc(courseRef, { modules });
    return newModule;
  },

  async updateModule(courseId: string, moduleId: string, payload: ModulePayload): Promise<CourseModule> {
    const courseRef = doc(db, "courses", courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) throw new Error("Course not found");

    const data = snap.data();
    const modules: CourseModule[] = data.modules || [];
    const index = modules.findIndex((m) => m.id === moduleId);
    if (index === -1) throw new Error("Module not found");

    modules[index] = {
      ...modules[index],
      title: payload.title,
      description: payload.description || null,
    };

    await updateDoc(courseRef, { modules });
    return modules[index];
  },

  async removeModule(courseId: string, moduleId: string): Promise<void> {
    const courseRef = doc(db, "courses", courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) throw new Error("Course not found");

    const data = snap.data();
    const modules: CourseModule[] = data.modules || [];
    const filtered = modules.filter((m) => m.id !== moduleId);

    await updateDoc(courseRef, { modules: filtered });
  },

  async reorderModules(courseId: string, ids: string[]): Promise<void> {
    const courseRef = doc(db, "courses", courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) throw new Error("Course not found");

    const data = snap.data();
    const modules: CourseModule[] = data.modules || [];

    const ordered = ids
      .map((id) => modules.find((m) => m.id === id))
      .filter((m): m is CourseModule => !!m)
      .map((m, idx) => ({ ...m, sortOrder: idx + 1 }));

    await updateDoc(courseRef, { modules: ordered });
  },

  async createLesson(courseId: string, moduleId: string, payload: LessonPayload): Promise<Lesson> {
    const courseRef = doc(db, "courses", courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) throw new Error("Course not found");

    const data = snap.data();
    const modules: CourseModule[] = data.modules || [];
    const modIdx = modules.findIndex((m) => m.id === moduleId);
    if (modIdx === -1) throw new Error("Module not found");

    const newLesson: Lesson = {
      id: generateId(),
      moduleId,
      title: payload.title,
      type: payload.type,
      contentUrl: payload.contentUrl || null,
      textContent: payload.textContent || null,
      durationMinutes: payload.durationMinutes || null,
      sortOrder: (modules[modIdx].lessons || []).length + 1,
      isPreview: payload.isPreview,
    };

    modules[modIdx].lessons = [...(modules[modIdx].lessons || []), newLesson];
    await updateDoc(courseRef, { modules });
    return newLesson;
  },

  async updateLesson(courseId: string, lessonId: string, payload: LessonPayload): Promise<Lesson> {
    const courseRef = doc(db, "courses", courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) throw new Error("Course not found");

    const data = snap.data();
    const modules: CourseModule[] = data.modules || [];

    let updatedLesson: Lesson | null = null;

    for (let i = 0; i < modules.length; i++) {
      const lessons = modules[i].lessons || [];
      const lesIdx = lessons.findIndex((l) => l.id === lessonId);
      if (lesIdx !== -1) {
        updatedLesson = {
          ...lessons[lesIdx],
          title: payload.title,
          type: payload.type,
          contentUrl: payload.contentUrl || null,
          textContent: payload.textContent || null,
          durationMinutes: payload.durationMinutes || null,
          isPreview: payload.isPreview,
        };
        lessons[lesIdx] = updatedLesson;
        modules[i].lessons = lessons;
        break;
      }
    }

    if (!updatedLesson) throw new Error("Lesson not found");

    await updateDoc(courseRef, { modules });
    return updatedLesson;
  },

  async removeLesson(courseId: string, lessonId: string): Promise<void> {
    const courseRef = doc(db, "courses", courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) throw new Error("Course not found");

    const data = snap.data();
    const modules: CourseModule[] = data.modules || [];

    for (let i = 0; i < modules.length; i++) {
      const lessons = modules[i].lessons || [];
      const lesIdx = lessons.findIndex((l) => l.id === lessonId);
      if (lesIdx !== -1) {
        modules[i].lessons = lessons.filter((l) => l.id !== lessonId);
        break;
      }
    }

    await updateDoc(courseRef, { modules });
  },

  async reorderLessons(courseId: string, moduleId: string, ids: string[]): Promise<void> {
    const courseRef = doc(db, "courses", courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) throw new Error("Course not found");

    const data = snap.data();
    const modules: CourseModule[] = data.modules || [];
    const modIdx = modules.findIndex((m) => m.id === moduleId);
    if (modIdx === -1) throw new Error("Module not found");

    const lessons = modules[modIdx].lessons || [];
    const ordered = ids
      .map((id) => lessons.find((l) => l.id === id))
      .filter((l): l is Lesson => !!l)
      .map((l, idx) => ({ ...l, sortOrder: idx + 1 }));

    modules[modIdx].lessons = ordered;
    await updateDoc(courseRef, { modules });
  },
};
