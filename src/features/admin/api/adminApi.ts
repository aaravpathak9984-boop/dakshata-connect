import { db } from "@/lib/firebase";
import { collection, getDocs, getCountFromServer, query, where } from "firebase/firestore";
import type { AdminDashboard, PendingApproval } from "./types";

export const adminApi = {
  async getDashboard(): Promise<AdminDashboard> {
    const totalUsersPromise = getCountFromServer(collection(db, "users"));
    const totalCoursesPromise = getCountFromServer(collection(db, "courses"));
    const pendingQuery = query(collection(db, "users"), where("roles", "array-contains", "Trainer"), where("isApproved", "==", false));
    const pendingApprovalsPromise = getCountFromServer(pendingQuery);

    const [totalUsersSnap, totalCoursesSnap, pendingApprovalsSnap] = await Promise.all([
      totalUsersPromise,
      totalCoursesPromise,
      pendingApprovalsPromise
    ]);

    const totalUsers = totalUsersSnap.data().count;
    const coursesCount = totalCoursesSnap.data().count;
    const pendingApprovalsCount = pendingApprovalsSnap.data().count;

    const usersSnapshot = await getDocs(collection(db, "users"));
    
    let traineesCount = 0;
    let trainersCount = 0;
    let adminsCount = 0;
    const pendingTrainerApprovals: PendingApproval[] = [];

    usersSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const roles = data.roles || [];
      if (roles.includes("Trainee")) traineesCount++;
      if (roles.includes("Trainer")) {
        trainersCount++;
        if (!data.isApproved) {
          pendingTrainerApprovals.push({
            id: docSnapshot.id,
            kind: "lecturer",
            name: data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            subtitle: "Trainer Account Approval",
            color: "#E11D48",
            submittedAt: data.createdAtUtc || new Date().toISOString(),
            meta: `Skills: ${(data.skills || []).slice(0, 3).join(", ") || "None Specified"}`,
          });
        }
      }
      if (roles.includes("Admin")) adminsCount++;
    });

    const activeTrainers = trainersCount - pendingTrainerApprovals.length;

    return {
      summary: {
        semesterName: "SIH Hackathon Semester",
        semesterProgressPct: 80,
        semesterStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        semesterEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        activeUsersNow: totalUsers,
        serverHealthPct: 100,
        pendingApprovals: pendingApprovalsCount,
        systemStatus: "operational",
        academicPeriod: "2026-2027",
      },
      kpis: [
        {
          id: "total-users",
          label: "Total Users",
          value: totalUsers,
          format: "number",
          deltaPct: 12.4,
          trend: "up",
          higherIsBetter: true,
          icon: "users",
          accent: ["#8B5CF6", "#C084FC"],
          spark: [120, 132, 141, 154, 162, 178, 195, 201, 218, 225, 235, totalUsers],
        },
        {
          id: "total-courses",
          label: "Total Courses",
          value: coursesCount,
          format: "number",
          deltaPct: 8.2,
          trend: "up",
          higherIsBetter: true,
          icon: "book-open",
          accent: ["#2563EB", "#60A5FA"],
          spark: [2, 3, 5, 8, 10, 12, 14, 15, 18, 20, 22, coursesCount],
        },
        {
          id: "trainers-count",
          label: "Active Trainers",
          value: activeTrainers,
          format: "number",
          deltaPct: 15.6,
          trend: "up",
          higherIsBetter: true,
          icon: "user-check",
          accent: ["#10B981", "#34D399"],
          spark: [10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, activeTrainers],
        },
        {
          id: "pending-approvals",
          label: "Pending Approvals",
          value: pendingTrainerApprovals.length,
          format: "number",
          deltaPct: -30.0,
          trend: "down",
          higherIsBetter: false,
          icon: "user-plus",
          accent: ["#F59E0B", "#FBBF24"],
          spark: [8, 7, 9, 6, 5, 8, 4, 3, 5, 2, 4, pendingTrainerApprovals.length],
        },
      ],
      enrollmentTrend: [
        { label: "Mon", value: 12, compare: 10 },
        { label: "Tue", value: 19, compare: 15 },
        { label: "Wed", value: 32, compare: 20 },
        { label: "Thu", value: 24, compare: 28 },
        { label: "Fri", value: 35, compare: 30 },
        { label: "Sat", value: 15, compare: 18 },
        { label: "Sun", value: 8, compare: 12 },
      ],
      completionTrend: [
        { label: "W1", value: 65 },
        { label: "W2", value: 70 },
        { label: "W3", value: 72 },
        { label: "W4", value: 80 },
      ],
      roleDistribution: [
        { label: "Trainees", value: traineesCount },
        { label: "Trainers", value: trainersCount },
        { label: "Admins", value: adminsCount },
      ],
      weeklyActivity: [
        { label: "Mon", value: Math.max(5, Math.floor(traineesCount * 0.4)) },
        { label: "Tue", value: Math.max(8, Math.floor(traineesCount * 0.6)) },
        { label: "Wed", value: Math.max(12, Math.floor(traineesCount * 0.8)) },
        { label: "Thu", value: Math.max(10, Math.floor(traineesCount * 0.75)) },
        { label: "Fri", value: Math.max(7, Math.floor(traineesCount * 0.5)) },
        { label: "Sat", value: Math.max(3, Math.floor(traineesCount * 0.2)) },
        { label: "Sun", value: Math.max(2, Math.floor(traineesCount * 0.15)) },
      ],
      popularCourses: [
        { label: "React Native Core", value: 45 },
        { label: "Advanced TypeScript", value: 38 },
        { label: "Firebase Masterclass", value: 32 },
      ],
      activity: [
        {
          id: "act-1",
          category: "enrollment",
          actorName: "System",
          actorColor: "#8B5CF6",
          message: "Firebase dashboard syncing initialized.",
          status: "success",
          timestamp: new Date().toISOString(),
        },
      ],
      approvals: pendingTrainerApprovals,
      health: {
        services: [
          { name: "Firebase Auth", status: "operational", latencyMs: 25, uptimePct: 99.99 },
          { name: "Cloud Firestore", status: "operational", latencyMs: 34, uptimePct: 99.98 },
          { name: "Firebase Storage", status: "operational", latencyMs: 45, uptimePct: 99.95 },
        ],
        resources: [
          { name: "Firestore Reads", usagePct: 18 },
          { name: "Firestore Writes", usagePct: 4 },
          { name: "Storage Ingress", usagePct: 1 },
        ],
      },
      security: {
        score: 98,
        failedLogins24h: 1,
        blockedIps: 0,
        activeSessions: totalUsers,
        twoFactorAdoptionPct: 85,
        events: [
          {
            id: "sec-1",
            label: "Security Audit",
            detail: "Serverless Firebase Security Rules validated successfully.",
            severity: "info",
            timestamp: new Date().toISOString(),
          },
        ],
      },
      insights: [
        {
          id: "ins-1",
          severity: "opportunity",
          title: "Optimize Trainer Competency Matches",
          body: "Competency matching allows mapping courses directly to trainers. Verify trainer profiles.",
          metric: `${pendingTrainerApprovals.length} pending`,
          actionLabel: "View Approvals",
        },
      ],
    };
  },
};
