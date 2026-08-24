import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Shield } from "lucide-react";

export function DevRoleSwitcher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);

  if (!user) return null;

  const currentRole = user.roles && user.roles[0] ? user.roles[0] : ((user as any).role || "Trainee");

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
        isActive: true
      });

      // Force a slight timeout to let Firestore listener propagate
      setTimeout(() => {
        setSwitching(false);
        if (newRole === "Admin") {
          navigate("/admin");
        } else if (newRole === "Trainer") {
          navigate("/admin/courses");
        } else {
          navigate("/dashboard");
        }
      }, 500);

    } catch (err) {
      console.error("Failed to switch role:", err);
      setSwitching(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-neutral-900 border border-neutral-800 text-white rounded-xl p-3 shadow-2xl flex items-center gap-2.5 backdrop-blur-md">
      <div className="bg-rose-500/10 p-2 rounded-lg text-rose-500">
        <Shield className="h-4 w-4" />
      </div>
      <div>
        <div className="text-[10px] uppercase font-bold tracking-wider text-rose-400">Dev Role Switcher</div>
        <select
          value={currentRole}
          onChange={handleRoleChange}
          disabled={switching}
          className="mt-1 bg-neutral-950 border border-neutral-800 rounded-md px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-rose-500 cursor-pointer"
        >
          <option value="Trainee">Trainee (Student)</option>
          <option value="Trainer">Trainer (Lecturer)</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      {switching && (
        <div className="h-3 w-3 rounded-full border border-t-transparent border-rose-500 animate-spin" />
      )}
    </div>
  );
}
