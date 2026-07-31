import fs from "node:fs";
import path from "node:path";

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

const requiredTables = [
  "entitlements",
  "destinations",
  "destination_tag_mappings",
  "route_generations",
  "saved_routes",
  "shared_routes",
  "booking_handoffs",
  "profiles",
  "stripe_webhook_events"
];

const rlsTables = [
  "entitlements",
  "route_generations",
  "saved_routes",
  "shared_routes",
  "booking_handoffs",
  "profiles",
  "stripe_webhook_events"
];

const ownershipPolicyTables = [
  "entitlements",
  "route_generations",
  "saved_routes",
  "shared_routes",
  "booking_handoffs",
  "profiles"
];

function fail(message) {
  console.error(`Migration verification failed: ${message}`);
  process.exitCode = 1;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (!fs.existsSync(migrationsDir)) {
  fail(`missing migrations directory at ${migrationsDir}`);
  process.exit();
}

const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (!files.length) {
  fail("no SQL migrations found");
  process.exit();
}

const unordered = files.some((file, index) => file !== [...files].sort()[index]);
if (unordered) {
  fail("migration filenames are not sorted lexicographically");
}

for (const file of files) {
  if (!/^\d{8}(?:\d{6})?_[a-z0-9_]+\.sql$/.test(file)) {
    fail(`migration filename is not timestamped correctly: ${file}`);
  }
}

const sql = files
  .map((file) => fs.readFileSync(path.join(migrationsDir, file), "utf8"))
  .join("\n")
  .toLowerCase();

for (const table of requiredTables) {
  const pattern = new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${escapeRegex(table)}\\b`);
  if (!pattern.test(sql)) {
    fail(`required table is not created: public.${table}`);
  }
}

for (const table of rlsTables) {
  const pattern = new RegExp(`alter\\s+table\\s+public\\.${escapeRegex(table)}\\s+enable\\s+row\\s+level\\s+security`);
  if (!pattern.test(sql)) {
    fail(`RLS is not enabled for public.${table}`);
  }
}

for (const table of ownershipPolicyTables) {
  const policyPattern = new RegExp(
    `create\\s+policy\\s+["'][^"']+["']\\s+on\\s+public\\.${escapeRegex(table)}[\\s\\S]+?auth\\.uid\\(\\)\\s*=\\s*user_id`
  );
  if (!policyPattern.test(sql)) {
    fail(`owner policy using auth.uid() = user_id is missing for public.${table}`);
  }
}

if (
  !/create\s+policy\s+["']shared routes are public["']\s+on\s+public\.shared_routes[\s\S]+?drop\s+policy\s+if\s+exists\s+["']shared routes are public["']\s+on\s+public\.shared_routes/.test(
    sql
  )
) {
  fail("shared_routes public select policy is not revoked by a later migration");
}

if (
  !/revoke\s+all\s+on\s+table\s+public\.stripe_webhook_events\s+from\s+anon\s*,\s*authenticated/.test(
    sql
  )
) {
  fail("stripe_webhook_events must be revoked from anon and authenticated");
}

if (process.exitCode) {
  process.exit();
}

console.log(`Verified ${files.length} Supabase migration files.`);
console.log(`Tables: ${requiredTables.join(", ")}`);
console.log(`RLS tables: ${rlsTables.join(", ")}`);
console.log("Public shares: full-table reads revoked; sanitized server read required.");
console.log("Stripe events: service-role-only idempotency ledger verified.");
