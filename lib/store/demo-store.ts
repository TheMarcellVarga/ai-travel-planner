import type { TripGeneration } from "@/lib/types";

declare global {
  var __wildRouteStore__: {
    generations: Map<string, TripGeneration>;
  } | undefined;
}

function createStore() {
  if (!globalThis.__wildRouteStore__) {
    globalThis.__wildRouteStore__ = {
      generations: new Map<string, TripGeneration>()
    };
  }

  return globalThis.__wildRouteStore__;
}

export function saveGeneration(generation: TripGeneration) {
  createStore().generations.set(generation.id, generation);
  return generation;
}

export function getGeneration(generationId: string) {
  return createStore().generations.get(generationId) ?? null;
}

