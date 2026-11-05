import { PlannerWorkspace } from "@/components/planner/planner-workspace";
import { getCurrentUser } from "@/lib/auth";
import {
  getLatestGenerationForUser
} from "@/lib/store/demo-store";
import {
  getLatestGenerationForUserFromDatabase
} from "@/lib/store/persistent-store";

export default async function PlannerPage() {
  const user = await getCurrentUser();
  const existingGeneration = !user ? null :
    (user.authMode === "supabase"
      ? await getLatestGenerationForUserFromDatabase(user.id)
      : null) ?? getLatestGenerationForUser(user.id);

  return <PlannerWorkspace initialGeneration={existingGeneration} />;
}
