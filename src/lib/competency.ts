import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export interface TrainerMatch {
  trainerId: string;
  fullName: string;
  email: string;
  skills: string[];
  experienceLevel: number;
  matchPercentage: number;
  weightedScore: number;
}

/**
 * Calculates matching trainers for a given course skill requirement list using a Weighted Skill Matrix.
 */
export async function getRecommendedTrainers(requiredSkills: string[]): Promise<TrainerMatch[]> {
  if (!requiredSkills || requiredSkills.length === 0) return [];

  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const matches: TrainerMatch[] = [];

    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const roles = data.roles || [];

      // Only check trainers who are approved
      if (roles.includes("Trainer") && data.isApproved !== false) {
        const trainerSkills: string[] = data.skills || [];
        const expLevel: number = data.experienceLevel || 1; // Scale of 1 to 5

        // Intersect course skills with trainer skills (case insensitive match)
        const overlapping = trainerSkills.filter((tSkill) =>
          requiredSkills.some((req) => req.toLowerCase().trim() === tSkill.toLowerCase().trim())
        );

        if (overlapping.length > 0) {
          const matchPct = Math.round((overlapping.length / requiredSkills.length) * 100);
          // Weighted Score = Match Percentage * (Experience Level / 5)
          const weightedScore = Math.round(matchPct * (expLevel / 5));

          matches.push({
            trainerId: docSnap.id,
            fullName: data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            email: data.email || "",
            skills: trainerSkills,
            experienceLevel: expLevel,
            matchPercentage: matchPct,
            weightedScore,
          });
        }
      }
    });

    // Sort by highest weighted score, followed by experience level
    return matches.sort((a, b) => b.weightedScore - a.weightedScore || b.experienceLevel - a.experienceLevel);
  } catch (error) {
    console.error("Error calculating competency mapping:", error);
    return [];
  }
}
