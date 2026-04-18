import { PlannerWorkspace } from "@/components/planner/planner-workspace";
import { createTripGeneration } from "@/lib/planner/generate-routes";
import { interpretTripIntent } from "@/lib/planner/intent";

export default function PlannerPage() {
  const generation = createTripGeneration(
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

  return <PlannerWorkspace initialGeneration={generation} />;
}
