import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type WebhookEventRow = {
  status: "processing" | "completed" | "failed";
  lease_expires_at: string | null;
  attempt_count: number;
};

type InsertResult = "inserted" | "duplicate" | "error";

export type WebhookEventStore = {
  insert: (input: {
    eventId: string;
    eventType: string;
    now: string;
    leaseExpiresAt: string;
  }) => Promise<InsertResult>;
  find: (eventId: string) => Promise<WebhookEventRow | null | undefined>;
  reclaim: (input: {
    eventId: string;
    previousStatus: "processing" | "failed";
    nextAttemptCount: number;
    now: string;
    leaseExpiresAt: string;
  }) => Promise<boolean | null>;
  complete: (eventId: string, now: string) => Promise<boolean>;
  fail: (eventId: string, errorKind: string, now: string) => Promise<boolean>;
};

export type WebhookClaim =
  | { status: "claimed" }
  | { status: "duplicate" }
  | { status: "unavailable" };

const PROCESSING_LEASE_MS = 5 * 60_000;

function createSupabaseWebhookEventStore(): WebhookEventStore | null {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  return {
    async insert({ eventId, eventType, now, leaseExpiresAt }) {
      const { error } = await admin.from("stripe_webhook_events").insert({
        event_id: eventId,
        event_type: eventType,
        status: "processing",
        attempt_count: 1,
        received_at: now,
        updated_at: now,
        lease_expires_at: leaseExpiresAt
      });

      if (!error) {
        return "inserted";
      }

      return error.code === "23505" ? "duplicate" : "error";
    },
    async find(eventId) {
      const { data, error } = await admin
        .from("stripe_webhook_events")
        .select("status, lease_expires_at, attempt_count")
        .eq("event_id", eventId)
        .maybeSingle<WebhookEventRow>();

      return error ? undefined : data;
    },
    async reclaim({
      eventId,
      previousStatus,
      nextAttemptCount,
      now,
      leaseExpiresAt
    }) {
      let query = admin
        .from("stripe_webhook_events")
        .update({
          status: "processing",
          updated_at: now,
          lease_expires_at: leaseExpiresAt,
          processed_at: null,
          last_error_kind: null,
          attempt_count: nextAttemptCount
        })
        .eq("event_id", eventId)
        .eq("status", previousStatus)
        .eq("attempt_count", nextAttemptCount - 1);

      if (previousStatus === "processing") {
        query = query.or(`lease_expires_at.lt.${now},lease_expires_at.is.null`);
      }

      const { data, error } = await query
        .select("event_id")
        .maybeSingle<{ event_id: string }>();

      if (error) {
        return null;
      }

      return Boolean(data);
    },
    async complete(eventId, now) {
      const { data, error } = await admin
        .from("stripe_webhook_events")
        .update({
          status: "completed",
          updated_at: now,
          processed_at: now,
          lease_expires_at: null,
          last_error_kind: null
        })
        .eq("event_id", eventId)
        .eq("status", "processing")
        .select("event_id")
        .maybeSingle<{ event_id: string }>();

      return !error && Boolean(data);
    },
    async fail(eventId, errorKind, now) {
      const { data, error } = await admin
        .from("stripe_webhook_events")
        .update({
          status: "failed",
          updated_at: now,
          lease_expires_at: null,
          last_error_kind: errorKind
        })
        .eq("event_id", eventId)
        .select("event_id")
        .maybeSingle<{ event_id: string }>();

      return !error && Boolean(data);
    }
  };
}

export async function claimWebhookEvent(
  input: { eventId: string; eventType: string },
  options: { now?: number; store?: WebhookEventStore | null } = {}
): Promise<WebhookClaim> {
  const now = options.now ?? Date.now();
  const store = options.store ?? createSupabaseWebhookEventStore();
  if (!store) {
    return { status: "unavailable" };
  }

  const nowIso = new Date(now).toISOString();
  const leaseExpiresAt = new Date(now + PROCESSING_LEASE_MS).toISOString();
  const insertResult = await store.insert({
    ...input,
    now: nowIso,
    leaseExpiresAt
  });

  if (insertResult === "inserted") {
    return { status: "claimed" };
  }

  if (insertResult === "error") {
    return { status: "unavailable" };
  }

  const existing = await store.find(input.eventId);
  if (existing === undefined || existing === null) {
    return { status: "unavailable" };
  }

  if (existing.status === "completed") {
    return { status: "duplicate" };
  }

  const leaseIsActive =
    existing.status === "processing" &&
    existing.lease_expires_at !== null &&
    Date.parse(existing.lease_expires_at) >= now;

  if (leaseIsActive) {
    return { status: "duplicate" };
  }

  const reclaimed = await store.reclaim({
    eventId: input.eventId,
    previousStatus: existing.status,
    nextAttemptCount: existing.attempt_count + 1,
    now: nowIso,
    leaseExpiresAt
  });

  if (reclaimed === null) {
    return { status: "unavailable" };
  }

  return reclaimed ? { status: "claimed" } : { status: "duplicate" };
}

export async function completeWebhookEvent(
  eventId: string,
  options: { now?: number; store?: WebhookEventStore | null } = {}
) {
  const store = options.store ?? createSupabaseWebhookEventStore();
  return store?.complete(
    eventId,
    new Date(options.now ?? Date.now()).toISOString()
  ) ?? false;
}

export async function failWebhookEvent(
  eventId: string,
  errorKind: string,
  options: { now?: number; store?: WebhookEventStore | null } = {}
) {
  const store = options.store ?? createSupabaseWebhookEventStore();
  return store?.fail(
    eventId,
    errorKind,
    new Date(options.now ?? Date.now()).toISOString()
  ) ?? false;
}
