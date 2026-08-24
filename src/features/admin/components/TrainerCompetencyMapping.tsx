import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCourses } from "@/features/courses/api/queries";
import { getRecommendedTrainers } from "@/lib/competency";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, ShieldAlert, UserPlus } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export function TrainerCompetencyMapping() {
  const queryClient = useQueryClient();
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const selectedCourse = courses?.find((c) => c.id === selectedCourseId);
  const requiredSkills = selectedCourse?.requiredSkills || [];

  // TanStack query matching over Firebase SDK promises
  const { data: recommendations = [], isLoading: loadingMatches } = useQuery({
    queryKey: ["competency-matches", selectedCourseId, requiredSkills],
    queryFn: () => getRecommendedTrainers(requiredSkills),
    enabled: selectedCourseId !== "" && requiredSkills.length > 0,
  });

  // Select first course on mount/load
  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Assign trainer mutation updating Firestore course document
  const assignTrainer = useMutation({
    mutationFn: async ({
      courseId,
      trainerId,
      trainerName,
    }: {
      courseId: string;
      trainerId: string;
      trainerName: string;
    }) => {
      const courseRef = doc(db, "courses", courseId);
      await updateDoc(courseRef, {
        lecturerId: trainerId,
        lecturerName: trainerName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  if (loadingCourses) {
    return <div className="h-48 rounded-2xl bg-card animate-pulse border border-border" />;
  }

  return (
    <Card className="p-6 border border-border bg-card shadow-sm rounded-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Competency Mapping (Weighted Skill Matrix)</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automatically matching and identifying suitable trainers for specific subjects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="course-select"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Select Course:
          </label>
          <select
            id="course-select"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Choose a course...</option>
            {courses?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        {selectedCourse ? (
          <div>
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className="text-sm font-medium text-foreground">Prerequisite Skills:</span>
              {requiredSkills.length > 0 ? (
                requiredSkills.map((s) => (
                  <Badge key={s} variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-[hsl(var(--warning))]" /> No prerequisite skills defined for
                  this course. Edit the course to specify skills.
                </span>
              )}
            </div>

            {requiredSkills.length > 0 && (
              <div className="space-y-4">
                {loadingMatches ? (
                  <div className="space-y-2 py-4">
                    <div className="h-10 bg-muted rounded animate-pulse" />
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border rounded-xl">
                    <p className="text-sm font-medium text-muted-foreground">
                      No approved trainers match the required skills.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {recommendations.map((match) => {
                      const isAssigned = selectedCourse.lecturerId === match.trainerId;
                      return (
                        <div
                          key={match.trainerId}
                          className={`p-4 rounded-xl border transition-all ${
                            isAssigned
                              ? "border-[hsl(var(--success))] bg-[hsl(var(--success))]/5"
                              : "border-border hover:border-primary/40 bg-muted/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-foreground flex items-center gap-2">
                                {match.fullName}
                                {isAssigned && (
                                  <Badge variant="success" className="h-5 px-1.5 py-0 text-[10px]">
                                    Assigned
                                  </Badge>
                                )}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{match.email}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-primary">{match.weightedScore}</span>
                              <span className="text-[10px] text-muted-foreground block uppercase font-medium">
                                Score
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Overlap Match</span>
                                <span className="font-semibold text-foreground">{match.matchPercentage}%</span>
                              </div>
                              <Progress value={match.matchPercentage} className="h-1.5" />
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground mr-1">Exp:</span>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < match.experienceLevel
                                        ? "text-[hsl(var(--warning))] fill-[hsl(var(--warning))]"
                                        : "text-muted-foreground/30"
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1 max-w-[60%] justify-end">
                                {match.skills.slice(0, 3).map((s) => (
                                  <span
                                    key={s}
                                    className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {!isAssigned && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs h-8"
                              onClick={() =>
                                assignTrainer.mutate({
                                  courseId: selectedCourse.id,
                                  trainerId: match.trainerId,
                                  trainerName: match.fullName,
                                })
                              }
                              isLoading={
                                assignTrainer.isPending &&
                                assignTrainer.variables?.trainerId === match.trainerId
                              }
                            >
                              <UserPlus className="h-3.5 w-3.5" /> Assign Trainer
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground italic text-sm">
            Select a course to check matches.
          </div>
        )}
      </div>
    </Card>
  );
}
