import {
  BookOpen,
  LayoutDashboard,
  Library,
  Megaphone,
  MessageSquare,
  Network,
  Users,
  FileQuestion,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  roles?: string[]; // Allowed roles (if undefined, visible to everyone)
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/admin" }
    ],
  },
  {
    heading: "People & Roles",
    items: [
      { label: "User Management", icon: Users, href: "/admin/users", roles: ["Admin"] },
      { label: "Competency Mapping", icon: Network, href: "/admin/competency", roles: ["Admin"] },
    ],
  },
  {
    heading: "Learning Hub",
    items: [
      { label: "Course Catalog", icon: BookOpen, href: "/admin/courses" },
      { label: "Trainee Progress", icon: Users, href: "/admin/progress", roles: ["Admin", "Trainer"] },
      { label: "Trainer Library", icon: Library, href: "/admin/content" },
      { label: "MCQ Assessments", icon: FileQuestion, href: "/admin/assessments" },
    ],
  },
  {
    heading: "Communications",
    items: [
      { label: "Announcements", icon: Megaphone, href: "/admin/announcements" },
      { label: "Feedback", icon: MessageSquare, href: "/admin/feedback" },
    ],
  },
];
