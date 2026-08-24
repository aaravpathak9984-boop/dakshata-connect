import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { Megaphone, Send, Info, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "Notification" | "Achievement" | "Content";
  createdAt: any;
  authorName: string;
}

export function AnnouncementsFeed() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"Notification" | "Achievement" | "Content">("Notification");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.roles.includes("Admin");

  // Sync latest 5 announcements from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "announcements"), 
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Announcement[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({ id: docSnap.id, ...data } as Announcement);
        });
        setAnnouncements(items);
        setLoading(false);
      },
      (err) => {
        console.error("Error reading announcements:", err);
        setError("Could not load announcements feed.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setPublishing(true);
    setError(null);

    try {
      await addDoc(collection(db, "announcements"), {
        title: title.trim(),
        content: content.trim(),
        type,
        createdAt: serverTimestamp(),
        authorName: user?.fullName || "Administrator"
      });
      setTitle("");
      setContent("");
      setType("Notification");
    } catch (err) {
      console.error("Publish failed:", err);
      setError("Failed to publish announcement. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  // Format timestamp
  const formatTime = (timestampVal: any) => {
    if (!timestampVal) return "Just now";
    const date = timestampVal.toDate ? timestampVal.toDate() : new Date(timestampVal);
    return date.toLocaleDateString(undefined, { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const badgeColors = {
    Notification: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Achievement: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Content: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  };

  return (
    <Card className="border border-border bg-card shadow-soft overflow-hidden">
      <CardHeader className="border-b border-border bg-muted/20 px-6 py-4 flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-rose-500" />
        <div>
          <CardTitle className="text-base font-semibold">Live Bulletin & Announcements</CardTitle>
          <CardDescription className="text-xs">Broadcast updates and notices from portal coordinators.</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {isAdmin && (
          <form onSubmit={handlePublish} className="space-y-3 border-b border-border pb-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement Title..."
                required
                className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Notification">Notification</option>
                <option value="Achievement">Achievement</option>
                <option value="Content">Content</option>
              </select>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Publish a new announcement description to the feed..."
                  required
                  rows={2}
                  className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>
              <Button 
                type="submit" 
                size="sm"
                isLoading={publishing}
                disabled={publishing || !content.trim() || !title.trim()}
                className="mt-1 shrink-0"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Post
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-16 rounded-xl bg-muted/60" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Info className="mx-auto h-7 w-7 mb-2 text-neutral-400" />
            <p className="text-sm font-medium">No bulletins published yet</p>
            <p className="text-xs mt-0.5">Announcements will appear here once posted by Admins.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {announcements.map((item) => (
              <div 
                key={item.id} 
                className="flex flex-col gap-1.5 rounded-xl border border-border p-4 bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-foreground">{item.title || "Announcement"}</h4>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${badgeColors[item.type] || badgeColors.Notification}`}>
                    {item.type || "Notification"}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap mt-1">{item.content}</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1 border-t border-border/50 pt-2">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.authorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(item.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simple styling Card blocks
function Card({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardHeader({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`flex flex-row items-center gap-2 p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ children, className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 className={`text-base font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

function CardDescription({ children, className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={`text-xs text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  );
}

function CardContent({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={`p-4 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}
