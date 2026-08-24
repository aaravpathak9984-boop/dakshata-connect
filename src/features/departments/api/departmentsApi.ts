import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import type { Department, DepartmentInput } from "./types";

export const departmentsApi = {
  async list(): Promise<Department[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "departments"));
      const depts: Department[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        depts.push({
          id: docSnap.id,
          name: data.name || "",
          code: data.code || "",
          description: data.description || null,
          headId: data.headId || null,
          headName: data.headName || null,
          courseCount: data.courseCount || 0,
          isActive: data.isActive !== false,
          createdAtUtc: data.createdAtUtc || new Date().toISOString(),
        });
      });

      // Bootstrap default departments for the Hackathon if none exist in DB
      if (depts.length === 0) {
        return [
          {
            id: "dept-cse",
            name: "Computer Science & Engineering",
            code: "CSE",
            description: "Department of CSE",
            headId: null,
            headName: null,
            courseCount: 0,
            isActive: true,
            createdAtUtc: new Date().toISOString(),
          },
          {
            id: "dept-ece",
            name: "Electronics & Communication",
            code: "ECE",
            description: "Department of ECE",
            headId: null,
            headName: null,
            courseCount: 0,
            isActive: true,
            createdAtUtc: new Date().toISOString(),
          },
        ];
      }
      return depts;
    } catch {
      return [
        {
          id: "dept-cse",
          name: "Computer Science & Engineering",
          code: "CSE",
          description: "Department of CSE",
          headId: null,
          headName: null,
          courseCount: 0,
          isActive: true,
          createdAtUtc: new Date().toISOString(),
        },
      ];
    }
  },

  async create(input: DepartmentInput): Promise<Department> {
    const deptRef = doc(collection(db, "departments"));
    
    let headName: string | null = null;
    if (input.headId) {
      try {
        const userSnap = await getDoc(doc(db, "users", input.headId));
        if (userSnap.exists()) {
          headName = userSnap.data().fullName || null;
        }
      } catch (e) {
        console.warn("Could not fetch department head name:", e);
      }
    }

    const deptData = {
      name: input.name,
      code: input.code,
      description: input.description || null,
      headId: input.headId || null,
      headName: headName,
      courseCount: 0,
      isActive: input.isActive !== false,
      createdAtUtc: new Date().toISOString(),
    };

    await setDoc(deptRef, deptData);

    return {
      id: deptRef.id,
      ...deptData,
    };
  },

  async update(id: string, input: DepartmentInput): Promise<Department> {
    const deptRef = doc(db, "departments", id);
    
    let headName: string | null = null;
    if (input.headId) {
      try {
        const userSnap = await getDoc(doc(db, "users", input.headId));
        if (userSnap.exists()) {
          headName = userSnap.data().fullName || null;
        }
      } catch (e) {
        console.warn("Could not fetch department head name:", e);
      }
    }

    const updateData = {
      name: input.name,
      code: input.code,
      description: input.description || null,
      headId: input.headId || null,
      headName: headName,
      isActive: input.isActive !== false,
    };

    await updateDoc(deptRef, updateData);

    const updatedSnap = await getDoc(deptRef);
    const data = updatedSnap.data()!;
    return {
      id,
      name: data.name || "",
      code: data.code || "",
      description: data.description || null,
      headId: data.headId || null,
      headName: data.headName || null,
      courseCount: data.courseCount || 0,
      isActive: data.isActive !== false,
      createdAtUtc: data.createdAtUtc || new Date().toISOString(),
    };
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "departments", id));
  },
};
