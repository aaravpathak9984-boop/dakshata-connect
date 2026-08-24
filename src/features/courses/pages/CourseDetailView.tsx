import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  BookOpen, 
  Star, 
  FileText, 
  Download, 
  Check, 
  Users, 
  Search
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  setDoc, 
  query, 
  where, 
  updateDoc, 
  addDoc 
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

interface TrainerMaterial {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
}

interface FeedbackItem {
  id: string;
  rating: number;
  review: string;
  studentName: string;
  submittedAt: string;
}

interface EnrollmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  progressPercent: number;
  status: string;
  enrolledAtUtc: string;
}

interface AssessmentRecord {
  id: string;
  title: string;
  questionsCount: number;
}

interface QuizSubmission {
  assessmentId: string;
  userId: string;
  userName: string;
  score: number;
  submittedAt: string;
}

export function CourseDetailView() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Trainee Specific States
  const [enrollment, setEnrollment] = useState<any>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [materials, setMaterials] = useState<TrainerMaterial[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  
  // Feedback submission Form
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Trainer/Admin Specific States
  const [roster, setRoster] = useState<EnrollmentRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [rosterSearch, setRosterSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "roster">("overview");

  const isTrainerOrAdmin = user?.roles.some(
    (role) => role === "Trainer" || role === "Admin"
  );

  useEffect(() => {
    if (!courseId || !user) return;
    
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch course details
        const courseSnap = await getDoc(doc(db, "courses", courseId));
        if (!courseSnap.exists()) {
          setError("Requested Capacity Building Course does not exist in the MoES directory.");
          setLoading(false);
          return;
        }
        const courseData: any = { id: courseSnap.id, ...courseSnap.data() };
        setCourse(courseData);

        // 2. Trainee details OR Trainer metrics fetches
        if (!isTrainerOrAdmin) {
          // Trainee View - check their individual enrollment
          const enrollQuery = query(
            collection(db, "enrollments"),
            where("studentId", "==", user.id),
            where("courseId", "==", courseId)
          );
          const enrollSnap = await getDocs(enrollQuery);
          if (!enrollSnap.empty) {
            const docItem = enrollSnap.docs[0];
            setEnrollment({ id: docItem.id, ...docItem.data() });
          }

          // Fetch materials matching course category
          try {
            const materialsSnap = await getDocs(collection(db, "trainer_library"));
            const courseCategory = courseData.category || "";
            const materialsList: TrainerMaterial[] = [];
            materialsSnap.forEach((docItem) => {
              const d = docItem.data();
              if (
                !courseCategory ||
                (d.fileType && d.fileType.toLowerCase().includes("pdf")) ||
                (d.title && d.title.toLowerCase().includes(courseCategory.toLowerCase()))
              ) {
                materialsList.push({ id: docItem.id, ...d } as TrainerMaterial);
              }
            });
            setMaterials(materialsList);
          } catch (matErr) {
            console.warn("Could not load course files:", matErr);
          }

          // Fetch reviews
          try {
            const feedbackSnap = await getDocs(collection(db, "courses", courseId, "feedback"));
            const feedbackList: FeedbackItem[] = [];
            feedbackSnap.forEach((docItem) => {
              feedbackList.push({ id: docItem.id, ...docItem.data() } as FeedbackItem);
            });
            setFeedbacks(feedbackList);
          } catch (feedErr) {
            console.warn("Could not load feedback list:", feedErr);
          }
        } else {
          // Trainer/Admin View - fetch all enrollments for this course
          const enrollQuery = query(
            collection(db, "enrollments"),
            where("courseId", "==", courseId)
          );
          const enrollSnap = await getDocs(enrollQuery);
          const enrolledList: EnrollmentRecord[] = [];
          enrollSnap.forEach((docItem) => {
            const data = docItem.data();
            enrolledList.push({
              id: docItem.id,
              studentId: data.studentId || "",
              studentName: data.studentName || "Trainee",
              studentEmail: data.studentEmail || "",
              progressPercent: data.progressPercent || 0,
              status: data.status || "Active",
              enrolledAtUtc: data.enrolledAtUtc || new Date().toISOString()
            });
          });
          setRoster(enrolledList);

          // Fetch quizzes associated with this course
          const quizQuery = query(
            collection(db, "assessments"),
            where("courseId", "==", courseId)
          );
          const quizSnap = await getDocs(quizQuery);
          const quizList: AssessmentRecord[] = [];
          const allSubmissions: QuizSubmission[] = [];

          for (const d of quizSnap.docs) {
            const quizData = d.data();
            quizList.push({
              id: d.id,
              title: quizData.title || "Quiz",
              questionsCount: quizData.questions ? quizData.questions.length : 0
            });

            // Fetch submissions for this quiz
            try {
              const subSnap = await getDocs(collection(db, "assessments", d.id, "submissions"));
              subSnap.forEach((subDoc) => {
                const s = subDoc.data();
                allSubmissions.push({
                  assessmentId: d.id,
                  userId: s.userId || "",
                  userName: s.userName || "Trainee",
                  score: s.score || 0,
                  submittedAt: s.submittedAt || new Date().toISOString()
                });
              });
            } catch (subErr) {
              console.warn("Could not fetch submissions for quiz " + d.id, subErr);
            }
          }
          setAssessments(quizList);
          setSubmissions(allSubmissions);
        }

      } catch (err) {
        console.error("Failed to load course detail data:", err);
        setError("Failed to query course information from Firestore.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, user]);

  // Handle Enrollment
  const handleEnroll = async () => {
    if (!courseId || !user || enrolling) return;
    setEnrolling(true);
    try {
      const studentName = user.fullName || "Trainee";
      const studentEmail = user.email || "";

      const newEnrollData = {
        studentId: user.id,
        studentName,
        studentEmail,
        courseId,
        courseTitle: course.title || "",
        courseCode: course.code || "",
        category: course.category || "General",
        level: course.level || "Beginner",
        coverImageUrl: course.coverImageUrl || null,
        status: "Active" as const,
        progressPercent: 0,
        enrolledAtUtc: new Date().toISOString(),
        completedAtUtc: null
      };

      const docRef = await addDoc(collection(db, "enrollments"), newEnrollData);
      setEnrollment({ id: docRef.id, ...newEnrollData });

      // Increment active enrolments count
      const updatedCount = (course.activeEnrolments || 0) + 1;
      await updateDoc(doc(db, "courses", courseId), {
        activeEnrolments: updatedCount
      });

      setCourse((prev: any) => ({
        ...prev,
        activeEnrolments: updatedCount
      }));

    } catch (err) {
      console.error("Enrollment failed:", err);
      alert("Failed to enroll in course. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  // Mark Completed
  const handleMarkCompleted = async () => {
    if (!enrollment || updatingProgress) return;
    setUpdatingProgress(true);
    try {
      const enrollRef = doc(db, "enrollments", enrollment.id);
      await updateDoc(enrollRef, {
        progressPercent: 100,
        status: "Completed",
        completedAtUtc: new Date().toISOString()
      });
      setEnrollment((prev: any) => ({
        ...prev,
        progressPercent: 100,
        status: "Completed",
        completedAtUtc: new Date().toISOString()
      }));
    } catch (err) {
      console.error("Failed to complete program:", err);
    } finally {
      setUpdatingProgress(false);
    }
  };

  // Submit Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !user || submittingFeedback) return;
    setSubmittingFeedback(true);

    try {
      const feedbackRef = doc(db, "courses", courseId, "feedback", user.id);
      const newFeedback = {
        rating,
        review: reviewText.trim(),
        studentName: user.fullName,
        submittedAt: new Date().toISOString()
      };

      await setDoc(feedbackRef, newFeedback);

      setFeedbacks((prev) => [
        { id: user.id, ...newFeedback },
        ...prev.filter((f) => f.id !== user.id)
      ]);

      setShowFeedbackModal(false);
      setReviewText("");
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("Failed to submit review.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 KB";
    return (bytes / 1024).toFixed(1) + " KB";
  };

  // Filter roster list
  const filteredRoster = roster.filter(
    (student) =>
      student.studentName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      student.studentEmail.toLowerCase().includes(rosterSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Alert variant="error">{error || "Requested course could not be located."}</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">{course.category}</span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">{course.title}</h1>
            <p className="text-xs text-neutral-400">Code: {course.code} · Level: {course.level}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isTrainerOrAdmin ? (
            <div className="flex bg-neutral-900 rounded-lg p-0.5 border border-neutral-800">
              <button 
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === "overview" ? "bg-rose-600 text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                Course Info
              </button>
              <button 
                onClick={() => setActiveTab("roster")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === "roster" ? "bg-rose-600 text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                Roster & Progress ({roster.length})
              </button>
            </div>
          ) : (
            <div>
              {enrollment ? (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    <Check className="h-3 w-3" />
                    Enrolled ({enrollment.status})
                  </span>
                  {enrollment.status !== "Completed" && (
                    <Button variant="outline" size="sm" onClick={handleMarkCompleted} isLoading={updatingProgress} className="border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800">
                      Mark as Completed
                    </Button>
                  )}
                </div>
              ) : (
                <Button onClick={handleEnroll} isLoading={enrolling} className="bg-rose-600 hover:bg-rose-700 text-white">
                  Enroll in Course
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Course Info column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-rose-500" />
                Course Overview
              </h2>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {course.description || "No description provided for this meteorological/atmospheric course."}
              </p>
              
              <div className="pt-4 border-t border-neutral-800 grid grid-cols-2 gap-4 text-xs text-neutral-400">
                <div>
                  <span className="block font-semibold text-neutral-200">Instructor / Lecturer</span>
                  {course.lecturerName || "Subject Expert"}
                </div>
                <div>
                  <span className="block font-semibold text-neutral-200">Total Enrolled Trainees</span>
                  {course.activeEnrolments || 0}
                </div>
              </div>
            </div>

            {/* Trainee Content Views */}
            {!isTrainerOrAdmin && (
              <>
                {/* Required Skills tags */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-3">
                  <h2 className="text-sm font-bold text-neutral-200">Required Meteorologist Competencies</h2>
                  <div className="flex flex-wrap gap-2">
                    {course.requiredSkills && course.requiredSkills.length > 0 ? (
                      course.requiredSkills.map((skill: string, index: number) => (
                        <span key={index} className="bg-neutral-800 text-neutral-200 px-2.5 py-1 rounded-md text-xs border border-neutral-700">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <>
                        <span className="bg-neutral-850 text-neutral-200 px-2.5 py-1 rounded-md text-xs border border-neutral-800">Weather Forecasting</span>
                        <span className="bg-neutral-850 text-neutral-200 px-2.5 py-1 rounded-md text-xs border border-neutral-800">Satellite Meteorology</span>
                        <span className="bg-neutral-850 text-neutral-200 px-2.5 py-1 rounded-md text-xs border border-neutral-800">Oceanographic Data</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Course Library Materials */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-rose-500" />
                    Lecture Slides & Resources
                  </h2>
                  
                  {materials.length === 0 ? (
                    <p className="text-sm text-neutral-400">No attachments or training resources uploaded for this category yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {materials.map((file) => (
                        <div key={file.id} className="flex justify-between items-center p-3 rounded-lg border border-neutral-800 bg-neutral-900 text-sm">
                          <div className="min-w-0">
                            <span className="font-medium text-neutral-200 block truncate">{file.title}</span>
                            <span className="text-[10px] text-neutral-400 block">
                              {file.fileName} ({formatBytes(file.fileSize)})
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" className="text-rose-500 hover:bg-neutral-800" onClick={() => window.open(file.fileUrl, "_blank")}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar: Feedback / Reviews section */}
          <div className="space-y-6">
            {!isTrainerOrAdmin && enrollment && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-200">Leave Your Feedback</h3>
                <p className="text-xs text-neutral-400">Evaluate course quality to help improve training modules.</p>
                <Button size="sm" className="w-full bg-rose-600 hover:bg-rose-700" onClick={() => setShowFeedbackModal(true)}>
                  Submit Course Review
                </Button>
              </div>
            )}

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200">Trainee Reviews</h3>
              {feedbacks.length === 0 ? (
                <p className="text-xs text-neutral-400">No reviews submitted for this program yet.</p>
              ) : (
                <div className="space-y-3">
                  {feedbacks.map((f) => (
                    <div key={f.id} className="border border-neutral-800 rounded-lg p-3 bg-neutral-900/30 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-200">{f.studentName}</span>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} className={`h-3 w-3 ${idx < f.rating ? "fill-current" : "text-neutral-600"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-neutral-300 italic">“{f.review || "No comments."}”</p>
                      <span className="block text-[9px] text-neutral-500 text-right">
                        {new Date(f.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Roster View for Trainers and Admins */
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-rose-500" />
              Enrolled Students & Progress
            </h2>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              <Input 
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search trainees by name or email..."
                className="pl-9 bg-neutral-950 border-neutral-800 text-white placeholder-neutral-500 focus-visible:ring-rose-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-neutral-800 rounded-lg">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-neutral-900 text-neutral-400 font-semibold border-b border-neutral-800">
                <tr>
                  <th className="p-4">Trainee Account</th>
                  <th className="p-4">Enrollment Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Completion Progress</th>
                  <th className="p-4 text-right">Quiz Assessment Grades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 bg-neutral-900/10">
                {filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-neutral-400">
                      No trainees found matching the query parameters.
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((student) => {
                    // Match subscores for this user
                    const studentSubs = submissions.filter((s) => s.userId === student.studentId);
                    
                    return (
                      <tr key={student.id} className="hover:bg-neutral-900/40">
                        <td className="p-4">
                          <div className="font-medium text-white">{student.studentName}</div>
                          <div className="text-xs text-neutral-400">{student.studentEmail}</div>
                        </td>
                        <td className="p-4 text-xs text-neutral-400">
                          {new Date(student.enrolledAtUtc).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
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
                          {assessments.length === 0 ? (
                            <span className="text-xs text-neutral-500">No quizzes configured</span>
                          ) : studentSubs.length === 0 ? (
                            <span className="text-xs text-neutral-400">Not attempted yet</span>
                          ) : (
                            <div className="flex flex-col gap-1 items-end">
                              {studentSubs.map((sub, idx) => {
                                const quizName = assessments.find((a) => a.id === sub.assessmentId)?.title || "Quiz";
                                return (
                                  <span key={idx} className="inline-block bg-rose-500/10 text-rose-400 text-xs px-2 py-0.5 rounded border border-rose-500/20 font-mono">
                                    {quizName}: {sub.score}%
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
      )}

      {/* CourseFeedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Leave Course Feedback</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Evaluate the course materials and subject mapping quality.</p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-neutral-200">Rating</Label>
                <div className="flex gap-1 items-center">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const starVal = idx + 1;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRating(starVal)}
                        className="text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star className={`h-8 w-8 ${starVal <= rating ? "fill-current" : "text-neutral-600"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="review" className="text-neutral-200">Comments</Label>
                <textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details on course quality and research insights..."
                  className="flex min-h-[80px] w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white shadow-sm transition-colors placeholder:text-neutral-650 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowFeedbackModal(false)} className="border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800">
                  Cancel
                </Button>
                <Button type="submit" isLoading={submittingFeedback} className="bg-rose-600 hover:bg-rose-700 text-white">
                  Submit Feedback
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
