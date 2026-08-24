import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ClipboardList, Layers, ListChecks, Pencil, Trash2, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CourseImage } from "@/components/ui/course-image";
import { staggerItem } from "@/lib/motion";
import type { Course, CourseLevel, CourseStatus } from "../api/types";

const levelVariant: Record<CourseLevel, "success" | "warning" | "destructive"> = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "destructive",
};

const statusVariant: Record<CourseStatus, "success" | "neutral"> = {
  Published: "success",
  Draft: "neutral",
};

/** Deterministic brand-ish gradient from the course code, for the cover strip. */
function coverGradient(seed: string): string {
  const palettes = [
    ["#8B5CF6", "#A78BFA"],
    ["#2a78d6", "#5598e7"],
    ["#1baf7a", "#3fd39c"],
    ["#eda100", "#f5c451"],
    ["#4a3aa7", "#7a6ad4"],
    ["#e34948", "#f07a79"],
  ];
  const hash = [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const [from, to] = palettes[hash % palettes.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

interface CourseCardProps {
  course: Course;
  /** Whether the current user may edit/delete this course. */
  canManage: boolean;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
}

export function CourseCard({ course, canManage, onEdit, onDelete }: CourseCardProps) {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("button")) return;
    navigate(`/courses/${course.id}`);
  };

  return (
    <motion.div
      layout
      variants={staggerItem}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
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
        width={640}
        height={280}
        className="h-32"
      >
        <span className="absolute left-3 top-3 rounded-md bg-black/40 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
          {course.code}
        </span>
        <span className="absolute right-3 top-3">
          <Badge variant={statusVariant[course.status]}>{course.status}</Badge>
        </span>
        <BookOpen className="absolute bottom-3 right-3 h-5 w-5 text-white/90" />
      </CourseImage>

      <div className="relative z-[2] flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="neutral">{course.category}</Badge>
          <Badge variant={levelVariant[course.level]}>{course.level}</Badge>
        </div>
        <h3 className="text-base font-semibold leading-snug">{course.title}</h3>
        {course.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
        )}

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          {course.lecturerName}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-neutral-800 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">
              {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
            </span>
          </div>
          {canManage && (
            <div className="flex flex-wrap items-center gap-1.5 bg-neutral-900/40 p-2 rounded-lg border border-neutral-800">
              {/* Content and roster are visible to the same people who may manage the course. */}
              <Link
                to={`/courses/${course.id}?tab=content`}
                className="inline-flex items-center gap-1 rounded-md bg-neutral-850 px-2 py-1 text-[11px] font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <Layers className="h-3 w-3" />
                Content
              </Link>
              <Link
                to={`/courses/${course.id}?tab=work`}
                className="inline-flex items-center gap-1 rounded-md bg-neutral-850 px-2 py-1 text-[11px] font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <ClipboardList className="h-3 w-3" />
                Work
              </Link>
              <Link
                to={`/courses/${course.id}?tab=quizzes`}
                className="inline-flex items-center gap-1 rounded-md bg-neutral-850 px-2 py-1 text-[11px] font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <ListChecks className="h-3 w-3" />
                Quizzes
              </Link>
              <Link
                to={`/courses/${course.id}?tab=students`}
                className="inline-flex items-center gap-1 rounded-md bg-neutral-850 px-2 py-1 text-[11px] font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <Users className="h-3 w-3" />
                Students
              </Link>
              <button
                type="button"
                onClick={() => onEdit(course)}
                className="inline-flex items-center gap-1 rounded-md bg-neutral-850 px-2 py-1 text-[11px] font-medium text-neutral-350 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(course)}
                className="inline-flex items-center gap-1 rounded-md bg-rose-950/20 px-2 py-1 text-[11px] font-medium text-rose-400 transition-colors hover:bg-rose-900/30"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
