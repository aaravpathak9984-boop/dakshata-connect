import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Star, FileText, Download, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection, setDoc, query, where, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { LearnerHeader } from "@/layouts/LearnerHeader";

interface FeedbackItem {
  id: string;
  rating: number;
  review: string;
  studentName: string;
  submittedAt: string;
}

interface TrainerMaterial {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
}

export function CourseDetailsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [materials, setMaterials] = useState<TrainerMaterial[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feedback Form State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!courseId || !user) return;
    const fetchCourseData = async () => {
      try {
        // 1. Fetch course details
        const courseSnap = await getDoc(doc(db, "courses", courseId));
        if (!courseSnap.exists()) {
          setError("Course not found.");
          setLoading(false);
          return;
        }
        setCourse({ id: courseSnap.id, ...courseSnap.data() });

        // 2. Fetch user enrollment details if exists
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

        // 3. Fetch trainer materials matching this course category
        const materialsSnap = await getDocs(collection(db, "trainer_library"));
        const courseCategory = courseSnap.data().category || "";
        const materialsList: TrainerMaterial[] = [];
        materialsSnap.forEach((docItem) => {
          const d = docItem.data();
          // Filter materials that match course category or title keywords
          if (
            !courseCategory ||
            (d.fileType && d.fileType.toLowerCase().includes("pdf")) ||
            (d.title && d.title.toLowerCase().includes(courseCategory.toLowerCase()))
          ) {
            materialsList.push({ id: docItem.id, ...d } as TrainerMaterial);
          }
        });
        setMaterials(materialsList);

        // 4. Fetch feedbacks
        const feedbackSnap = await getDocs(collection(db, "courses", courseId, "feedback"));
        const feedbackList: FeedbackItem[] = [];
        feedbackSnap.forEach((docItem) => {
          feedbackList.push({ id: docItem.id, ...docItem.data() } as FeedbackItem);
        });
        setFeedbacks(feedbackList);

      } catch (err) {
        console.error("Failed to load course details:", err);
        setError("Failed to load course configurations.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user]);

  // Update Progress / Mark Completed Action
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
      console.error("Failed to update progress:", err);
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

      // Invalidate local feedbacks list
      setFeedbacks((prev) => [
        { id: user.id, ...newFeedback },
        ...prev.filter((f) => f.id !== user.id)
      ]);

      setShowFeedbackModal(false);
      setReviewText("");
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("Failed to submit review. Try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Format File Size helper
  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 KB";
    return (bytes / 1024).toFixed(1) + " KB";
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <LearnerHeader />
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen">
        <LearnerHeader />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <Alert variant="error">{error || "Could not load the requested course."}</Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <LearnerHeader />

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <Link to="/my-courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to my courses
        </Link>

        {/* Course Header card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">{course.category}</span>
              <h1 className="text-2xl font-bold tracking-tight mt-1">{course.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Code: {course.code} · Level: {course.level}</p>
            </div>
            {enrollment && (
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                  {enrollment.status}
                </span>
                {enrollment.progressPercent === 100 ? (
                  <p className="text-xs text-muted-foreground mt-1">Completed successfully</p>
                ) : (
                  <Button variant="outline" size="sm" className="mt-2" onClick={handleMarkCompleted} isLoading={updatingProgress}>
                    Mark as Completed
                  </Button>
                )}
              </div>
            )}
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed border-t border-border/50 pt-3">
            {course.description || "No description provided for this Capacity Building Course."}
          </p>

          <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <div>
              <span className="block font-medium text-foreground">Lecturer / Instructor</span>
              {course.lecturerName || "Subject Expert"}
            </div>
            <div>
              <span className="block font-medium text-foreground">Active Enrolments</span>
              {course.activeEnrolments || 0} Met Trainees
            </div>
          </div>
        </div>

        {/* Progress percent card */}
        {enrollment && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Program Progress</span>
              <span className="font-bold text-rose-500">{enrollment.progressPercent}%</span>
            </div>
            <Progress value={enrollment.progressPercent} label={course.title} />
          </div>
        )}

        {/* Course Materials section */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-rose-500" />
            Learning Materials & Lecture Notes
          </h2>
          
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No attachments or materials uploaded for this course category yet.</p>
          ) : (
            <div className="space-y-2">
              {materials.map((file) => (
                <div key={file.id} className="flex justify-between items-center p-3 rounded-xl border border-border bg-muted/10 text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-foreground block truncate">{file.title}</span>
                      <span className="text-[11px] text-muted-foreground block truncate">
                        {file.fileName} ({formatBytes(file.fileSize)}) · Uploaded by {file.uploadedBy}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50 shrink-0" onClick={() => window.open(file.fileUrl, "_blank")}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Feedback reviews and leave reviews */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-rose-500" />
              Trainee Reviews & Feedback
            </h2>
            {enrollment && (
              <Button size="sm" onClick={() => setShowFeedbackModal(true)}>
                Leave Review
              </Button>
            )}
          </div>

          {feedbacks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No reviews submitted for this program yet.</p>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <div key={f.id} className="border border-border/60 rounded-xl p-3 bg-muted/5 text-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{f.studentName}</span>
                    <div className="flex items-center text-amber-500 gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`h-3.5 w-3.5 ${idx < f.rating ? "fill-current" : "text-neutral-300"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-foreground/80 text-xs italic">“{f.review || "No comments written."}”</p>
                  <span className="block text-[10px] text-muted-foreground text-right">
                    {new Date(f.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* CourseFeedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg space-y-4">
            <div>
              <h3 className="text-lg font-bold">Leave Course Feedback</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Evaluate the course materials and subject mapping.</p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Rating</Label>
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
                        <Star className={`h-8 w-8 ${starVal <= rating ? "fill-current" : "text-neutral-300"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="review">Your Comments</Label>
                <textarea
                  id="review"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us what you learned or how to improve the training materials..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowFeedbackModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submittingFeedback}>
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
