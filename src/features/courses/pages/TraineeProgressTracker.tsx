import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  TrendingUp 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface EnrollmentRow {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  progressPercent: number;
  status: string;
  enrolledAtUtc: string;
}

interface AssessmentItem {
  id: string;
  courseId: string;
  title: string;
}

interface SubGrade {
  assessmentId: string;
  userId: string;
  score: number;
}

export function TraineeProgressTracker() {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [grades, setGrades] = useState<SubGrade[]>([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch all enrollments
        const enrollSnap = await getDocs(collection(db, "enrollments"));
        const enrollList: EnrollmentRow[] = [];
        enrollSnap.forEach((docItem) => {
          const d = docItem.data();
          enrollList.push({
            id: docItem.id,
            studentId: d.studentId || "",
            studentName: d.studentName || "Trainee",
            studentEmail: d.studentEmail || "",
            courseId: d.courseId || "",
            courseTitle: d.courseTitle || "",
            courseCode: d.courseCode || "",
            progressPercent: d.progressPercent || 0,
            status: d.status || "Active",
            enrolledAtUtc: d.enrolledAtUtc || new Date().toISOString()
          });
        });
        setEnrollments(enrollList);

        // 2. Fetch all assessments to match course mapping
        const assSnap = await getDocs(collection(db, "assessments"));
        const assList: AssessmentItem[] = [];
        const gradesList: SubGrade[] = [];

        for (const assDoc of assSnap.docs) {
          const ad = assDoc.data();
          assList.push({
            id: assDoc.id,
            courseId: ad.courseId || "",
            title: ad.title || "Quiz"
          });

          // Fetch submissions for this assessment
          try {
            const subSnap = await getDocs(collection(db, `assessments/${assDoc.id}/submissions`));
            subSnap.forEach((subDoc) => {
              const sd = subDoc.data();
              gradesList.push({
                assessmentId: assDoc.id,
                userId: sd.userId || "",
                score: sd.score || 0
              });
            });
          } catch (subErr) {
            console.warn("Could not fetch submissions for assessment:", assDoc.id, subErr);
          }
        }
        setAssessments(assList);
        setGrades(gradesList);

      } catch (err) {
        console.error("Failed to load trainee progress records:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter logic
  const filteredEnrollments = enrollments.filter((row) => {
    const matchesSearch = 
      row.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.courseCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = courseFilter === "all" || row.courseId === courseFilter;
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;

    return matchesSearch && matchesCourse && matchesStatus;
  });

  // Extract unique courses for filtering options
  const uniqueCourses = Array.from(
    new Map(enrollments.map((item) => [item.courseId, item])).values()
  );

  // Aggregation Metrics
  const totalTraineesCount = new Set(enrollments.map((e) => e.studentId)).size;
  const completedProgramsCount = enrollments.filter((e) => e.status === "Completed").length;
  const averageOverallProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, item) => sum + item.progressPercent, 0) / enrollments.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-rose-500" />
            Trainee Progress Tracker
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Monitor and aggregate course completion rates and assessment performance across all programs.
          </p>
        </div>
      </header>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex items-center gap-4">
          <div className="rounded-lg bg-rose-500/10 p-3 text-rose-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs text-neutral-400 font-medium uppercase tracking-wider">Total Trainees</span>
            <span className="text-2xl font-bold text-white">{totalTraineesCount}</span>
          </div>
        </div>
        
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex items-center gap-4">
          <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-500">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs text-neutral-400 font-medium uppercase tracking-wider">Completions</span>
            <span className="text-2xl font-bold text-white">{completedProgramsCount}</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex items-center gap-4">
          <div className="rounded-lg bg-amber-500/10 p-3 text-amber-500">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs text-neutral-400 font-medium uppercase tracking-wider">Average Progress</span>
            <span className="text-2xl font-bold text-white">{averageOverallProgress}%</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-neutral-900/30 p-4 rounded-xl border border-neutral-800">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student or course title..."
            className="pl-9 bg-neutral-950 border-neutral-800 text-white placeholder-neutral-500 focus-visible:ring-rose-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Course filter select */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-rose-500"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.courseCode} - {c.courseTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Progress Data Table */}
      <div className="overflow-x-auto border border-neutral-800 rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-neutral-900 text-neutral-400 font-semibold border-b border-neutral-800">
            <tr>
              <th className="p-4">Trainee Account</th>
              <th className="p-4">Program Details</th>
              <th className="p-4">Status</th>
              <th className="p-4">Completion Progress</th>
              <th className="p-4 text-right">Assessment Grades</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 bg-neutral-900/10">
            {filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-400">
                  No trainee participation records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredEnrollments.map((student) => {
                // Find all quizzes for this course
                const courseQuizzes = assessments.filter((a) => a.courseId === student.courseId);
                const quizIds = new Set(courseQuizzes.map((q) => q.id));
                
                // Find user scores for these quizzes
                const userGrades = grades.filter(
                  (g) => g.userId === student.studentId && quizIds.has(g.assessmentId)
                );

                return (
                  <tr key={student.id} className="hover:bg-neutral-900/40">
                    <td className="p-4">
                      <div className="font-semibold text-white">{student.studentName}</div>
                      <div className="text-xs text-neutral-400">{student.studentEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-neutral-200">{student.courseTitle}</div>
                      <div className="text-xs text-neutral-400">Code: {student.courseCode}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        student.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="p-4 w-60">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-neutral-400 font-medium">
                          <span>Progress</span>
                          <span>{student.progressPercent}%</span>
                        </div>
                        <Progress value={student.progressPercent} label={student.studentName} />
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {courseQuizzes.length === 0 ? (
                        <span className="text-xs text-neutral-500">No assessments</span>
                      ) : userGrades.length === 0 ? (
                        <span className="text-xs text-neutral-400">No attempts yet</span>
                      ) : (
                        <div className="flex flex-col gap-1 items-end">
                          {userGrades.map((grade, idx) => {
                            const qTitle = courseQuizzes.find((q) => q.id === grade.assessmentId)?.title || "Quiz";
                            return (
                              <span key={idx} className="inline-block bg-rose-500/10 text-rose-400 text-xs px-2 py-0.5 rounded border border-rose-500/20 font-mono">
                                {qTitle}: {grade.score}%
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
