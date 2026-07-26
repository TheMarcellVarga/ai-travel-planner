import type {
  DestinationProfile,
  RouteDataSource,
  TripIntent
} from "@/lib/types";

export type RouteProviderPayload = {
  status: RouteDataSource["status"];
  freshness: RouteDataSource["freshness"];
  assumptions: string[];
  destinations: DestinationProfile[];
};

export type RouteProviderSnapshot = RouteProviderPayload & {
  providerId: string;
  mode: RouteDataSource["mode"];
  checkedAt: string;
  latencyMs: number;
  fallbackProviderId: string | null;
};

export interface RouteDataProvider {
  id: string;
  mode: RouteDataSource["mode"];
  load(intent: TripIntent): Promise<RouteProviderPayload>;
}
