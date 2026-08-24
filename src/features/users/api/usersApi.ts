import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import type { AdminUser, PagedResult, UserFilters } from "./types";

export const usersApi = {
  async list(filters: UserFilters): Promise<PagedResult<AdminUser>> {
    const querySnapshot = await getDocs(collection(db, "users"));
    let users: AdminUser[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      users.push({
        id: docSnapshot.id,
        fullName: data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        avatarUrl: data.avatarUrl || null,
        emailConfirmed: data.emailConfirmed !== false,
        isActive: data.isActive !== false,
        isLockedOut: data.isLockedOut || false,
        isApproved: data.isApproved !== false,
        createdAtUtc: data.createdAtUtc || new Date().toISOString(),
        lastLoginAtUtc: data.lastLoginAtUtc || null,
        roles: data.roles || [],
        enrollmentCount: data.enrollmentCount || 0,
        coursesOwned: data.coursesOwned || 0,
      });
    });

    // Apply filters in-memory for hackathon velocity and flexibility
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      );
    }

    if (filters.role) {
      users = users.filter((u) => u.roles.includes(filters.role!));
    }

    if (filters.isActive !== undefined) {
      users = users.filter((u) => u.isActive === filters.isActive);
    }

    if (filters.emailConfirmed !== undefined) {
      users = users.filter((u) => u.emailConfirmed === filters.emailConfirmed);
    }

    // Sort by createdAtUtc descending (newest first)
    users.sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime());

    // Paginate results
    const totalCount = users.length;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 15;
    const totalPages = Math.ceil(totalCount / pageSize);
    const items = users.slice((page - 1) * pageSize, page * pageSize);

    return {
      items,
      page,
      pageSize,
      totalCount,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };
  },

  async setStatus(userId: string, isActive: boolean): Promise<AdminUser> {
    const userRef = doc(db, "users", userId);
    
    // In our approvals flow, activating a trainer automatically approves them
    const updates: any = { isActive };
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data.roles?.includes("Trainer") && isActive) {
        updates.isApproved = true;
      }
    }

    await updateDoc(userRef, updates);

    const updatedDoc = await getDoc(userRef);
    const data = updatedDoc.data()!;
    return {
      id: userId,
      fullName: data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      avatarUrl: data.avatarUrl || null,
      emailConfirmed: data.emailConfirmed !== false,
      isActive: data.isActive !== false,
      isLockedOut: data.isLockedOut || false,
      isApproved: data.isApproved !== false,
      createdAtUtc: data.createdAtUtc || new Date().toISOString(),
      lastLoginAtUtc: data.lastLoginAtUtc || null,
      roles: data.roles || [],
      enrollmentCount: data.enrollmentCount || 0,
      coursesOwned: data.coursesOwned || 0,
    };
  },

  async setRoles(userId: string, roles: string[]): Promise<AdminUser> {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { roles });

    const updatedDoc = await getDoc(userRef);
    const data = updatedDoc.data()!;
    return {
      id: userId,
      fullName: data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      avatarUrl: data.avatarUrl || null,
      emailConfirmed: data.emailConfirmed !== false,
      isActive: data.isActive !== false,
      isLockedOut: data.isLockedOut || false,
      isApproved: data.isApproved !== false,
      createdAtUtc: data.createdAtUtc || new Date().toISOString(),
      lastLoginAtUtc: data.lastLoginAtUtc || null,
      roles: data.roles || [],
      enrollmentCount: data.enrollmentCount || 0,
      coursesOwned: data.coursesOwned || 0,
    };
  },

  async verifyEmail(userId: string): Promise<AdminUser> {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { emailConfirmed: true });

    const updatedDoc = await getDoc(userRef);
    const data = updatedDoc.data()!;
    return {
      id: userId,
      fullName: data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      avatarUrl: data.avatarUrl || null,
      emailConfirmed: true,
      isActive: data.isActive !== false,
      isLockedOut: data.isLockedOut || false,
      isApproved: data.isApproved !== false,
      createdAtUtc: data.createdAtUtc || new Date().toISOString(),
      lastLoginAtUtc: data.lastLoginAtUtc || null,
      roles: data.roles || [],
      enrollmentCount: data.enrollmentCount || 0,
      coursesOwned: data.coursesOwned || 0,
    };
  },

  async roles(): Promise<string[]> {
    return ["Trainee", "Trainer", "Admin"];
  },
};
