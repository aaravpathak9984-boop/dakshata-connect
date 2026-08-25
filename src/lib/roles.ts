import type { UserSummary } from "@/types/auth";

export function isAdmin(user: UserSummary | null): boolean {
  if (!user) return false;
  return user.roles?.includes("Admin") || user.role === "Admin";
}

export function isLecturer(user: UserSummary | null): boolean {
  if (!user) return false;
  return user.roles?.includes("Trainer") || user.role === "Trainer";
}

/** Who may open the admin area (admins land on the dashboard, lecturers on courses). */
export function canAccessAdminArea(user: UserSummary | null): boolean {
  return isAdmin(user) || isLecturer(user);
}

/** Who may create courses and delete their own (admins may delete any). */
export function canManageCourses(user: UserSummary | null): boolean {
  return isAdmin(user) || isLecturer(user);
}
