import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Clock, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CourseImage } from "@/components/ui/course-image";

import { Progress } from "@/components/ui/progress";
import { coverGradient, levelVariant } from "@/features/enrollments/lib/courseVisuals";
import { staggerItem } from "@/lib/motion";
import type { StudentCourse } from "../api/types";
import { formatDuration } from "../lib/learning";

interface ContinueLearningCardProps {
  course: StudentCourse;
}

/**
 * A course still in progress, displaying automatic progress percentage.
 */
export function ContinueLearningCard({ course }: ContinueLearningCardProps) {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;
    navigate(`/courses/${course.courseId}`);
  };

  return (
    <motion.div
      layout
      variants={staggerItem}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="flex flex-col overflow-hidden rounded-[18px] border border-border bg-card shadow-soft"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <CourseImage
        code={course.code}
        category={course.category}
        coverImageUrl={course.coverImageUrl}
        gradient={coverGradient(course.code)}
        width={560}
        height={240}
        className="h-28"
      >
        <span className="absolute left-3 top-3 rounded-md bg-black/40 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
          {course.code}
        </span>
        <span className="absolute right-3 top-3">
          <Badge variant={levelVariant[course.level]}>{course.level}</Badge>
        </span>
      </CourseImage>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">{course.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{course.lecturerName}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            {course.moduleCount} module{course.moduleCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatDuration(course.totalMinutes)}
          </span>
        </div>

        {course.firstLessonTitle ? (
          <p className="mt-3 truncate text-xs text-muted-foreground">
            Starts with <span className="text-foreground">{course.firstLessonTitle}</span>
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">No lessons published yet.</p>
        )}

        <div className="mt-auto pt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold tabular-nums">{course.progressPercent}%</span>
          </div>
          <Progress value={course.progressPercent} label={course.title} />
        </div>
      </div>
    </motion.div>
  );
}
