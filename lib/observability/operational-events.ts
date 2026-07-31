import { createHmac, randomBytes } from "node:crypto";

export type ObservedRoute =
  | "/api/auth/demo"
  | "/api/auth/signin"
  | "/api/newsletter/subscribe"
  | "/api/stripe/webhook"
  | "/api/trips/plan";

export type OperationalEventName =
  | "request.rate_limited"
  | "stripe.webhook.duplicate"
  | "stripe.webhook.failed"
  | "stripe.webhook.invalid_signature"
  | "stripe.webhook.processed";

type OperationalEventFields = {
  route?: ObservedRoute;
  status?: number;
  code?: string;
  durationMs?: number;
  eventType?: string;
  subjectHash?: string;
  errorKind?: string;
};

type OperationalLevel = "info" | "warn" | "error";

const processSalt =
  process.env.OBSERVABILITY_HASH_SECRET ?? randomBytes(32).toString("hex");
const safeTokenPattern = /^[a-zA-Z0-9._:/-]{1,80}$/;

function safeToken(value: string | undefined) {
  return value && safeTokenPattern.test(value) ? value : undefined;
}

function safeNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

export function hashOperationalIdentifier(identifier: string) {
  return createHmac("sha256", processSalt)
    .update(identifier)
    .digest("hex")
    .slice(0, 24);
}

export function getSafeErrorKind(error: unknown) {
  if (!(error instanceof Error)) {
    return "unknown_error";
  }

  return safeToken(error.name)?.toLowerCase() ?? "unknown_error";
}

export function emitOperationalEvent(
  level: OperationalLevel,
  name: OperationalEventName,
  fields: OperationalEventFields = {}
) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    name,
    route: fields.route,
    status: safeNumber(fields.status),
    code: safeToken(fields.code),
    durationMs: safeNumber(fields.durationMs),
    eventType: safeToken(fields.eventType),
    subjectHash: safeToken(fields.subjectHash),
    errorKind: safeToken(fields.errorKind)
  };
  const serializedRecord = JSON.stringify(record);

  if (level === "error") {
    console.error(serializedRecord);
  } else if (level === "warn") {
    console.warn(serializedRecord);
  } else {
    console.info(serializedRecord);
  }
}
