import { NextResponse } from "next/server";

import { getGeneration } from "@/lib/store/demo-store";
import { DATABASE_PERSISTENCE, MEMORY_PERSISTENCE } from "@/lib/store/persistence";
import { getGenerationFromDatabase } from "@/lib/store/persistent-store";

type RouteContext = {
  params: Promise<{ generationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { generationId } = await context.params;
  const databaseGeneration = await getGenerationFromDatabase(generationId);
  const generation = databaseGeneration ?? getGeneration(generationId);
  const persistence = databaseGeneration ? DATABASE_PERSISTENCE : MEMORY_PERSISTENCE;

  if (!generation) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...generation,
    persistence
  });
}
