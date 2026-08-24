import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import type { UserSummary } from "@/types/auth";
import { AuthContext, type AuthContextValue } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const setSession = useCallback((nextUser: UserSummary) => setUser(nextUser), []);
  const clearSession = useCallback(() => setUser(null), []);

  // Listen to live Firebase Auth state and listen to user profile changes in real-time
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (firebaseUser) {
        // Set up real-time listener on user profile document
        const userRef = doc(db, "users", firebaseUser.uid);
        unsubscribeDoc = onSnapshot(
          userRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              
              // Check approval status for Trainers
              if (userData.roles?.includes("Trainer") && !userData.isApproved) {
                setUser(null);
              } else if (!userData.isActive) {
                // Block deactivated accounts
                setUser(null);
              } else {
                setUser({
                  id: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  fullName: userData.fullName || `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User",
                  roles: userData.roles || (userData.role ? [userData.role] : ["Trainee"]),
                  role: userData.role || (userData.roles && userData.roles[0]) || "Trainee",
                });
              }
            } else {
              // Document might not exist yet during login/register callbacks
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                fullName: firebaseUser.displayName || "User",
                roles: ["Trainee"],
                role: "Trainee",
              });
            }
            setIsBootstrapping(false);
          },
          (error) => {
            console.error("Error in onSnapshot user profile:", error);
            setIsBootstrapping(false);
          }
        );
      } else {
        setUser(null);
        setIsBootstrapping(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      setSession,
      clearSession,
    }),
    [user, isBootstrapping, setSession, clearSession],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
