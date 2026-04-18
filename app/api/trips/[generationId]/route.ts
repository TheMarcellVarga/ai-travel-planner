import { NextResponse } from "next/server";

import { getGeneration } from "@/lib/store/demo-store";

type RouteContext = {
  params: Promise<{ generationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { generationId } = await context.params;
  const generation = getGeneration(generationId);

  if (!generation) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  return NextResponse.json(generation);
}
