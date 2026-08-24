import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Shield } from "lucide-react";
import { isAdmin } from "@/lib/roles";

/**
 * Dev-only role switcher — renders ONLY for Admin users so hackathon
 * judges can flip between Admin / Trainer / Trainee views without
 * logging out.  The role is persisted to Firestore, and the real-time
 * onSnapshot in AuthProvider picks it up automatically.
 */
export function DevRoleSwitcher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  // Only render for Admin users (judges demoing the app)
  if (!user || !isAdmin(user)) return null;

  const currentRole = user.roles[0] || "Trainee";

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    if (newRole === currentRole || switching) return;
    setSwitching(true);

    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        role: newRole,
        roles: [newRole],
        isApproved: true,
        isActive: true,
      });

      // onSnapshot listener in AuthProvider will update context automatically.
      // Small delay to let it propagate before navigating.
      setTimeout(() => {
        setSwitching(false);
        if (newRole === "Admin") navigate("/admin");
        else if (newRole === "Trainer") navigate("/admin/courses");
        else navigate("/dashboard");
      }, 600);
    } catch (err) {
      console.error("Failed to switch role:", err);
      setSwitching(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-900/95 p-3 shadow-2xl backdrop-blur-md">
      <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
        <Shield className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
          Demo Role Switch
        </div>
        <select
          value={currentRole}
          onChange={handleRoleChange}
          disabled={switching}
          className="mt-1 cursor-pointer rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-200 focus:border-rose-500 focus:outline-none"
        >
          <option value="Trainee">Trainee (Student)</option>
          <option value="Trainer">Trainer (Lecturer)</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      {switching && (
        <div className="h-3 w-3 animate-spin rounded-full border border-rose-500 border-t-transparent" />
      )}
    </div>
  );
}
