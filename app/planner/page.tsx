import { PlannerWorkspace } from "@/components/planner/planner-workspace";
import { getCurrentUser } from "@/lib/auth";
import {
  ANONYMOUS_GENERATION_USER_ID,
  getLatestGenerationForUser
} from "@/lib/store/demo-store";
import {
  getLatestGenerationForUserFromDatabase
} from "@/lib/store/persistent-store";

export default async function PlannerPage() {
  const user = await getCurrentUser();
  const memoryUserId = user?.id ?? ANONYMOUS_GENERATION_USER_ID;
  const existingGeneration =
    (user?.authMode === "supabase"
      ? await getLatestGenerationForUserFromDatabase(user.id)
      : null) ?? getLatestGenerationForUser(memoryUserId);

  return <PlannerWorkspace initialGeneration={existingGeneration} />;
}
