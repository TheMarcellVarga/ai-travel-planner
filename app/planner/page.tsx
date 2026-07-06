import { PlannerWorkspace } from "@/components/planner/planner-workspace";
import { getCurrentUser } from "@/lib/auth";
import { createTripGeneration } from "@/lib/planner/generate-routes";
import { interpretTripIntent } from "@/lib/planner/intent";
import {
  ANONYMOUS_GENERATION_USER_ID,
  getLatestGenerationForUser,
  saveGeneration
} from "@/lib/store/demo-store";
import {
  getLatestGenerationForUserFromDatabase,
  saveGenerationToDatabase
} from "@/lib/store/persistent-store";

export default async function PlannerPage() {
  const user = await getCurrentUser();
  const memoryUserId = user?.id ?? ANONYMOUS_GENERATION_USER_ID;
  const existingGeneration =
    (user?.authMode === "supabase"
      ? await getLatestGenerationForUserFromDatabase(user.id)
      : null) ?? getLatestGenerationForUser(memoryUserId);

  if (existingGeneration) {
    return <PlannerWorkspace initialGeneration={existingGeneration} />;
  }

  const candidateGeneration = createTripGeneration(
    interpretTripIntent({
      prompt:
        "Find the best one-way adventure from Singapore for 12 days with max 1 stop, jungle energy, crypto-friendly towns, hiking, and one promoted stop on the free plan.",
      origin: "Singapore",
      tripLengthDays: 12,
      maxStops: 1,
      wishTags: ["crypto-friendly", "hiking", "mtb", "animal-friendly"],
      budgetMode: "balanced"
    })
  );
  const persistedGeneration =
    user?.authMode === "supabase"
      ? await saveGenerationToDatabase(candidateGeneration, user.id)
      : null;
  const generation =
    persistedGeneration ?? saveGeneration(candidateGeneration, memoryUserId);

  return <PlannerWorkspace initialGeneration={generation} />;
}
