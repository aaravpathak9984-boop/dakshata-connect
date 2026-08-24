import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  setDoc, 
  updateDoc, 
  where,
  increment
} from "firebase/firestore";
import type { Assignment, AssignmentInput, Gradebook, GradebookCell, GradebookColumn, GradebookRow, GradebookSummary, Submission, CellStatus } from "./types";

export const assessmentsApi = {
  async listAssignments(courseId: string): Promise<Assignment[]> {
    try {
      const q = query(collection(db, "assignments"), where("courseId", "==", courseId));
      const snap = await getDocs(q);
      const assignments: Assignment[] = [];

      const currentUserId = auth.currentUser?.uid;

      for (const d of snap.docs) {
        const data = d.data();
        let mySubmission: Submission | null = null;

        if (currentUserId) {
          const subQ = query(
            collection(db, `assignments/${d.id}/submissions`),
            where("studentId", "==", currentUserId)
          );
          const subSnap = await getDocs(subQ);
          if (!subSnap.empty) {
            const subDoc = subSnap.docs[0];
            const subData = subDoc.data();
            mySubmission = {
              id: subDoc.id,
              assignmentId: d.id,
              assignmentTitle: data.title || "",
              maxPoints: data.maxPoints || 100,
              studentId: subData.studentId || "",
              studentName: subData.studentName || "",
              studentEmail: subData.studentEmail || "",
              content: subData.content || "",
              attachmentUrl: subData.attachmentUrl || null,
              submittedAtUtc: subData.submittedAtUtc || "",
              isLate: subData.isLate || false,
              status: subData.status || "Submitted",
              pointsAwarded: subData.pointsAwarded !== undefined ? subData.pointsAwarded : null,
              feedback: subData.feedback || null,
              gradedAtUtc: subData.gradedAtUtc || null,
            };
          }
        }

        const dueAt = data.dueAtUtc;
        const isOpen = !dueAt || new Date() < new Date(dueAt) || data.allowLateSubmissions;

        assignments.push({
          id: d.id,
          courseId: data.courseId || "",
          title: data.title || "",
          instructions: data.instructions || null,
          dueAtUtc: dueAt || null,
          maxPoints: data.maxPoints || 0,
          allowLateSubmissions: data.allowLateSubmissions || false,
          status: data.status || "Draft",
          isOpen,
          submissionCount: data.submissionCount || 0,
          gradedCount: data.gradedCount || 0,
          mySubmission,
        });
      }

      return assignments;
    } catch (err) {
      console.warn("Failed to list assignments:", err);
      return [];
    }
  },

  async createAssignment(courseId: string, input: AssignmentInput): Promise<Assignment> {
    const docRef = doc(collection(db, "assignments"));
    const data = {
      courseId,
      title: input.title,
      instructions: input.instructions || null,
      dueAtUtc: input.dueAtUtc || null,
      maxPoints: input.maxPoints || 0,
      allowLateSubmissions: input.allowLateSubmissions || false,
      status: input.status || "Draft",
      submissionCount: 0,
      gradedCount: 0,
      createdAtUtc: new Date().toISOString(),
    };
    await setDoc(docRef, data);
    return {
      id: docRef.id,
      ...data,
      isOpen: true,
      mySubmission: null,
    };
  },

  async updateAssignment(assignmentId: string, input: AssignmentInput): Promise<Assignment> {
    const docRef = doc(db, "assignments", assignmentId);
    const data = {
      title: input.title,
      instructions: input.instructions || null,
      dueAtUtc: input.dueAtUtc || null,
      maxPoints: input.maxPoints || 0,
      allowLateSubmissions: input.allowLateSubmissions || false,
      status: input.status || "Draft",
    };
    await updateDoc(docRef, data);

    const snap = await getDoc(docRef);
    const currentData = snap.data()!;
    return {
      id: assignmentId,
      courseId: currentData.courseId || "",
      title: currentData.title || "",
      instructions: currentData.instructions || null,
      dueAtUtc: currentData.dueAtUtc || null,
      maxPoints: currentData.maxPoints || 0,
      allowLateSubmissions: currentData.allowLateSubmissions || false,
      status: currentData.status || "Draft",
      isOpen: !currentData.dueAtUtc || new Date() < new Date(currentData.dueAtUtc) || currentData.allowLateSubmissions,
      submissionCount: currentData.submissionCount || 0,
      gradedCount: currentData.gradedCount || 0,
      mySubmission: null,
    };
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    await deleteDoc(doc(db, "assignments", assignmentId));
  },

  async submit(assignmentId: string, content: string, attachmentUrl: string | null): Promise<Submission> {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) throw new Error("Not authenticated");

    const userDoc = await getDoc(doc(db, "users", currentUserId));
    const userData = userDoc.exists() ? userDoc.data() : {};

    const assDoc = await getDoc(doc(db, "assignments", assignmentId));
    const assData = assDoc.exists() ? assDoc.data() : {};

    const subRef = doc(collection(db, `assignments/${assignmentId}/submissions`));
    const isLate = assData.dueAtUtc ? new Date() > new Date(assData.dueAtUtc) : false;

    const subData = {
      assignmentId,
      assignmentTitle: assData.title || "",
      maxPoints: assData.maxPoints || 100,
      studentId: currentUserId,
      studentName: userData.fullName || "Trainee",
      studentEmail: userData.email || "",
      content,
      attachmentUrl,
      submittedAtUtc: new Date().toISOString(),
      isLate,
      status: "Submitted" as const,
      pointsAwarded: null,
      feedback: null,
      gradedAtUtc: null,
    };

    await setDoc(subRef, subData);

    await updateDoc(doc(db, "assignments", assignmentId), {
      submissionCount: increment(1),
    });

    return {
      id: subRef.id,
      ...subData,
    };
  },

  async listSubmissions(assignmentId: string): Promise<Submission[]> {
    try {
      const snap = await getDocs(collection(db, `assignments/${assignmentId}/submissions`));
      const submissions: Submission[] = [];
      snap.forEach((d) => {
        const data = d.data();
        submissions.push({
          id: d.id,
          assignmentId: data.assignmentId || "",
          assignmentTitle: data.assignmentTitle || "",
          maxPoints: data.maxPoints || 0,
          studentId: data.studentId || "",
          studentName: data.studentName || "",
          studentEmail: data.studentEmail || "",
          content: data.content || "",
          attachmentUrl: data.attachmentUrl || null,
          submittedAtUtc: data.submittedAtUtc || "",
          isLate: data.isLate || false,
          status: data.status || "Submitted",
          pointsAwarded: data.pointsAwarded !== undefined ? data.pointsAwarded : null,
          feedback: data.feedback || null,
          gradedAtUtc: data.gradedAtUtc || null,
        });
      });
      return submissions;
    } catch (err) {
      console.warn("Failed to list submissions:", err);
      return [];
    }
  },

  async grade(assignmentId: string, submissionId: string, pointsAwarded: number, feedback: string | null): Promise<Submission> {
    const subRef = doc(db, `assignments/${assignmentId}/submissions`, submissionId);
    const snap = await getDoc(subRef);
    if (!snap.exists()) throw new Error("Submission not found");

    const previousData = snap.data();
    const wasAlreadyGraded = previousData.status === "Graded";

    await updateDoc(subRef, {
      status: "Graded",
      pointsAwarded,
      feedback,
      gradedAtUtc: new Date().toISOString(),
    });

    if (!wasAlreadyGraded) {
      await updateDoc(doc(db, "assignments", assignmentId), {
        gradedCount: increment(1),
      });
    }

    const updatedSnap = await getDoc(subRef);
    const data = updatedSnap.data()!;
    return {
      id: submissionId,
      assignmentId: data.assignmentId || "",
      assignmentTitle: data.assignmentTitle || "",
      maxPoints: data.maxPoints || 0,
      studentId: data.studentId || "",
      studentName: data.studentName || "",
      studentEmail: data.studentEmail || "",
      content: data.content || "",
      attachmentUrl: data.attachmentUrl || null,
      submittedAtUtc: data.submittedAtUtc || "",
      isLate: data.isLate || false,
      status: data.status || "Graded",
      pointsAwarded: data.pointsAwarded,
      feedback: data.feedback,
      gradedAtUtc: data.gradedAtUtc,
    };
  },

  async gradebook(courseId: string): Promise<Gradebook> {
    const courseRef = doc(db, "courses", courseId);
    const courseSnap = await getDoc(courseRef);
    const courseTitle = courseSnap.exists() ? courseSnap.data().title : "Course";
    const courseCode = courseSnap.exists() ? courseSnap.data().code : "";

    const assQuery = query(collection(db, "assignments"), where("courseId", "==", courseId));
    const assSnap = await getDocs(assQuery);
    const assignments: GradebookColumn[] = [];
    let totalPointsAvailable = 0;

    const assList: any[] = [];
    assSnap.forEach((d) => {
      const data = d.data();
      assList.push({ id: d.id, ...data });
      totalPointsAvailable += data.maxPoints || 0;
    });

    const enrollQuery = query(collection(db, "enrollments"), where("courseId", "==", courseId));
    const enrollSnap = await getDocs(enrollQuery);
    const rows: GradebookRow[] = [];

    let awaitingMarking = 0;

    const submissionsMap = new Map<string, any[]>();
    for (const ass of assList) {
      const subSnap = await getDocs(collection(db, `assignments/${ass.id}/submissions`));
      const subs: any[] = [];
      let totalPoints = 0;
      let gradedCount = 0;

      subSnap.forEach((d) => {
        const subData = d.data();
        subs.push({ id: d.id, ...subData });
        if (subData.status === "Graded") {
          totalPoints += subData.pointsAwarded || 0;
          gradedCount++;
        } else {
          awaitingMarking++;
        }
      });

      submissionsMap.set(ass.id, subs);

      assignments.push({
        assignmentId: ass.id,
        title: ass.title,
        maxPoints: ass.maxPoints,
        dueAtUtc: ass.dueAtUtc,
        submittedCount: subs.length,
        gradedCount,
        averagePoints: gradedCount > 0 ? Number((totalPoints / gradedCount).toFixed(1)) : null,
      });
    }

    enrollSnap.forEach((d) => {
      const enroll = d.data();
      const cells: GradebookCell[] = [];
      let studentPointsAwarded = 0;
      let studentPointsGraded = 0;
      let missingCount = 0;

      assList.forEach((ass) => {
        const subs = submissionsMap.get(ass.id) || [];
        const studentSub = subs.find((s) => s.studentId === enroll.studentId);

        if (studentSub) {
          cells.push({
            assignmentId: ass.id,
            submissionId: studentSub.id,
            status: studentSub.status as CellStatus,
            pointsAwarded: studentSub.pointsAwarded,
            isLate: studentSub.isLate || false,
          });
          if (studentSub.status === "Graded") {
            studentPointsAwarded += studentSub.pointsAwarded || 0;
            studentPointsGraded += ass.maxPoints || 0;
          }
        } else {
          cells.push({
            assignmentId: ass.id,
            submissionId: null,
            status: "Missing" as CellStatus,
            pointsAwarded: null,
            isLate: false,
          });
          missingCount++;
        }
      });

      rows.push({
        studentId: enroll.studentId,
        studentName: enroll.studentName || "Trainee",
        studentEmail: enroll.studentEmail || "",
        cells,
        pointsAwarded: studentPointsAwarded,
        pointsGraded: studentPointsGraded,
        percentageOfGraded: studentPointsGraded > 0 ? Math.round((studentPointsAwarded / studentPointsGraded) * 100) : null,
        missingCount,
      });
    });

    const summary: GradebookSummary = {
      studentCount: rows.length,
      assignmentCount: assignments.length,
      awaitingMarking,
      cohortAveragePercentage: rows.length > 0 && rows.some(r => r.percentageOfGraded !== null)
        ? Math.round(rows.reduce((sum, r) => sum + (r.percentageOfGraded || 0), 0) / rows.filter(r => r.percentageOfGraded !== null).length)
        : null,
    };

    return {
      courseId,
      courseTitle,
      courseCode,
      totalPointsAvailable,
      assignments,
      rows,
      summary,
    };
  },
};
