import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { 
  collection, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  addDoc,
  where
} from "firebase/firestore";
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  Trash2, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowLeft,
  GraduationCap
} from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface Assessment {
  id: string;
  title: string;
  deadline: string;
  questions: Question[];
  createdAt: string;
  createdBy: string;
  createdById: string;
}

interface Submission {
  id: string;
  assessmentId: string;
  userId: string;
  userName: string;
  score: number; // percentage
  answers: number[];
  submittedAt: string;
}

interface AssessmentsPageProps {
  only?: "assignments" | "quizzes";
}

export function AssessmentsPage({ only }: AssessmentsPageProps) {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({}); // keyed by assessmentId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View control
  const [viewState, setViewState] = useState<"list" | "builder" | "attempt">("list");
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);

  const isTrainerOrAdmin = user?.roles.some(
    (role) => role === "Trainer" || role === "Admin"
  );

  // Sync assessments from Firestore
  useEffect(() => {
    const q = query(collection(db, "assessments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Assessment[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as Assessment);
        });
        setAssessments(items);
        setLoading(false);
      },
      (err) => {
        console.error("Error reading assessments:", err);
        setError("Failed to load assessments.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Sync trainee submissions
  useEffect(() => {
    if (!user) return;
    const fetchSubmissions = async () => {
      try {
        const userSubmissions: Record<string, Submission> = {};
        for (const ass of assessments) {
          const subSnap = await getDocs(collection(db, `assessments/${ass.id}/submissions`));
          subSnap.forEach((docSnap) => {
            const data = docSnap.data() as Submission;
            if (data.userId === user.id) {
              userSubmissions[ass.id] = { ...data, id: docSnap.id };
            }
          });
        }
        setSubmissions(userSubmissions);
      } catch (err) {
        console.warn("Could not sync user submissions:", err);
      }
    };

    if (assessments.length > 0) {
      fetchSubmissions();
    }
  }, [assessments, user, viewState]);

  // Delete Assessment
  const handleDeleteAssessment = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this assessment?")) return;
    try {
      await deleteDoc(doc(db, "assessments", id));
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete assessment.");
    }
  };

  // Filter if 'only' is applied
  const displayedAssessments = only
    ? assessments.filter(() => only === "quizzes")
    : assessments;

  return (
    <PageTransition>
      <div className="space-y-6">
        {viewState === "list" && (
          <>
            <header className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">MCQ Assessments</h1>
                <p className="mt-1 text-muted-foreground">
                  View and attempt courses assessments, or view grading reports for completed quizzes.
                </p>
              </div>

              {isTrainerOrAdmin && (
                <Button size="sm" onClick={() => setViewState("builder")}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Quiz
                </Button>
              )}
            </header>

            {error && <Alert variant="error">{error}</Alert>}

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : displayedAssessments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-16 text-center bg-card">
                <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-medium">No assessments found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isTrainerOrAdmin ? "Get started by building a new MCQ quiz." : "Assessments assigned by trainers will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedAssessments.map((ass) => {
                  const submission = submissions[ass.id];
                  const hasDeadlinePassed = new Date(ass.deadline) < new Date();
                  
                  return (
                    <div 
                      key={ass.id} 
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base text-foreground">{ass.title}</h3>
                          {submission ? (
                            <span className="rounded-full bg-success/10 text-success text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Attempted: {submission.score}%
                            </span>
                          ) : hasDeadlinePassed ? (
                            <span className="rounded-full bg-destructive/10 text-destructive text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Closed
                            </span>
                          ) : (
                            <span className="rounded-full bg-warning/10 text-warning text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Open
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            {ass.questions.length} Questions
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Due: {new Date(ass.deadline).toLocaleDateString(undefined, { 
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isTrainerOrAdmin && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteAssessment(ass.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        {submission ? (
                          <Button variant="outline" size="sm" disabled>
                            Submitted
                          </Button>
                        ) : hasDeadlinePassed ? (
                          <Button variant="outline" size="sm" disabled>
                            Expired
                          </Button>
                        ) : (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => {
                              setActiveAssessment(ass);
                              setViewState("attempt");
                            }}
                          >
                            Start Quiz
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {viewState === "builder" && (
          <AssessmentBuilder onBack={() => setViewState("list")} />
        )}

        {viewState === "attempt" && activeAssessment && (
          <AssessmentAttempt 
            assessment={activeAssessment} 
            onBack={() => {
              setViewState("list");
              setActiveAssessment(null);
            }} 
          />
        )}
      </div>
    </PageTransition>
  );
}

/* ==================== ASSESSMENT BUILDER (TRAINER VIEW) ==================== */
function AssessmentBuilder({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Associated Course State
  const [courseId, setCourseId] = useState("");
  const [trainerCourses, setTrainerCourses] = useState<any[]>([]);

  // Question editing form states
  const [qText, setQText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  // Load Trainer courses
  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      try {
        const q = query(
          collection(db, "courses"),
          where("lecturerId", "==", user.id)
        );
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        setTrainerCourses(list);
        if (list.length > 0) {
          setCourseId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load trainer courses:", err);
      }
    };
    fetchCourses();
  }, [user]);

  const addQuestion = () => {
    if (!qText.trim() || options.some(opt => !opt.trim())) {
      setError("Please fill out the question text and all 4 options.");
      return;
    }
    setError(null);
    const newQ: Question = {
      id: Date.now().toString(),
      question: qText.trim(),
      options: [...options],
      correctIndex
    };

    setQuestions([...questions, newQ]);

    // Reset question form
    setQText("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSaveAssessment = async () => {
    if (!title.trim() || !deadline) {
      setError("Please specify a title and a deadline.");
      return;
    }
    if (questions.length === 0) {
      setError("Please add at least one question.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, "assessments"), {
        title: title.trim(),
        courseId,
        deadline: new Date(deadline).toISOString(),
        questions,
        createdAt: new Date().toISOString(),
        createdBy: user?.fullName || "Trainer",
        createdById: user?.id || ""
      });
      onBack();
    } catch (err) {
      console.error("Save assessment failed:", err);
      setError("Could not save assessment to database.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-border bg-card p-6 shadow-soft space-y-6">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold">Build MCQ Quiz</h2>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Quiz Title</label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g. Tropical Cyclone Dynamics - Quiz 1"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Associated Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-rose-500"
          >
            {trainerCourses.length === 0 ? (
              <option value="">No courses owned</option>
            ) : (
              trainerCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code})
                </option>
              ))
            )}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Submission Deadline</label>
          <Input 
            type="datetime-local" 
            value={deadline} 
            onChange={(e) => setDeadline(e.target.value)} 
          />
        </div>
      </div>

      {/* Dynamic Question Constructor */}
      <div className="border border-border rounded-xl p-4 bg-muted/40 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Add Questions</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Question Text</label>
            <Input 
              value={qText} 
              onChange={(e) => setQText(e.target.value)}
              placeholder="e.g. Which layer of the atmosphere contains the ozone layer?"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((opt, i) => (
              <div key={i} className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Option {i + 1}</span>
                  <input 
                    type="radio" 
                    name="correct-option" 
                    checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)}
                    className="h-3.5 w-3.5 text-primary focus:ring-primary"
                  />
                </label>
                <Input 
                  value={opt}
                  onChange={(e) => {
                    const nextOpts = [...options];
                    nextOpts[i] = e.target.value;
                    setOptions(nextOpts);
                  }}
                  placeholder={`Option ${i + 1}`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-muted-foreground">
              Select the radio button next to the correct answer.
            </span>
            <Button type="button" size="sm" onClick={addQuestion}>
              Add Question
            </Button>
          </div>
        </div>
      </div>

      {/* Added Questions List */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold border-b border-border pb-1">Questions List ({questions.length})</h3>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-lg border border-border p-3.5 bg-card flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Q{idx + 1}: {q.question}</p>
                  <ul className="grid gap-1 grid-cols-2 text-xs text-muted-foreground pl-2 mt-1.5">
                    {q.options.map((opt, oIdx) => (
                      <li key={oIdx} className={oIdx === q.correctIndex ? "text-success font-semibold" : ""}>
                        • {opt} {oIdx === q.correctIndex && "✔"}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeQuestion(q.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={onBack}>Cancel</Button>
        <Button 
          variant="default" 
          onClick={handleSaveAssessment} 
          isLoading={submitting}
          disabled={questions.length === 0}
        >
          Publish Quiz
        </Button>
      </div>
    </Card>
  );
}

/* ==================== ASSESSMENT ATTEMPT (TRAINEE VIEW) ==================== */
function AssessmentAttempt({ assessment, onBack }: { assessment: Assessment; onBack: () => void }) {
  const { user } = useAuth();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectOption = (qIdx: number, oIdx: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [qIdx]: oIdx
    });
  };

  const handleSubmitQuiz = async () => {
    // Verify all questions are answered
    if (Object.keys(selectedAnswers).length < assessment.questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Calculate score
    let correctCount = 0;
    assessment.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const scorePercent = Math.round((correctCount / assessment.questions.length) * 100);

    const answersArray = assessment.questions.map((_, idx) => selectedAnswers[idx]);

    try {
      await addDoc(collection(db, `assessments/${assessment.id}/submissions`), {
        assessmentId: assessment.id,
        userId: user?.id || "",
        userName: user?.fullName || "Trainee",
        score: scorePercent,
        answers: answersArray,
        submittedAt: new Date().toISOString()
      });
      onBack();
    } catch (err) {
      console.error("Submission failed:", err);
      setError("Could not submit quiz. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-border bg-card p-6 shadow-soft space-y-6">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Quiz: {assessment.title}
          </h2>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="space-y-6">
        {assessment.questions.map((q, qIdx) => (
          <div key={q.id} className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
            <h3 className="font-semibold text-sm">
              Question {qIdx + 1}: <span className="text-foreground">{q.question}</span>
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelectOption(qIdx, oIdx)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all ${
                    selectedAnswers[qIdx] === oIdx
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                      : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    selectedAnswers[qIdx] === oIdx
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}>
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={onBack}>Cancel Attempt</Button>
        <Button 
          variant="default" 
          onClick={handleSubmitQuiz} 
          isLoading={submitting}
        >
          Submit Answers
        </Button>
      </div>
    </Card>
  );
}

// Simple Card container simulator
function Card({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`} {...props}>
      {children}
    </div>
  );
}
