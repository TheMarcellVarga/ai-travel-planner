import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const strict = process.argv.includes("--strict");
const timeoutMs = 8_000;

function timedFetch(input, init = {}) {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs)
  });
}

async function verifySupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const configured = Boolean(url && publishableKey && serviceRoleKey);

  if (!configured) {
    return {
      configured: false,
      adminReachable: false,
      publicReadBoundary: "unverified"
    };
  }

  const clientOptions = {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: timedFetch
    }
  };
  const admin = createClient(url, serviceRoleKey, clientOptions);
  const anonymous = createClient(url, publishableKey, clientOptions);

  try {
    const [adminResult, anonymousResult] = await Promise.all([
      admin.from("shared_routes").select("id", { count: "exact", head: true }),
      anonymous.from("shared_routes").select("id, slug").limit(1)
    ]);
    const adminReachable = !adminResult.error;
    const anonymousRows = anonymousResult.data?.length ?? 0;
    let publicReadBoundary = "unverified";

    if (adminReachable && anonymousRows > 0) {
      publicReadBoundary = "failed";
    } else if (adminReachable && anonymousResult.error) {
      publicReadBoundary = "passed";
    } else if (adminReachable && (adminResult.count ?? 0) > 0 && anonymousRows === 0) {
      publicReadBoundary = "passed";
    } else if (adminReachable && (adminResult.count ?? 0) === 0) {
      publicReadBoundary = "inconclusive_empty_table";
    }

    return {
      configured,
      adminReachable,
      publicReadBoundary
    };
  } catch {
    return {
      configured,
      adminReachable: false,
      publicReadBoundary: "unverified"
    };
  }
}

async function verifyStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  const configured = Boolean(secretKey && webhookSecret && priceId);
  const testMode = Boolean(secretKey?.startsWith("sk_test_"));

  if (!configured) {
    return {
      configured: false,
      reachable: false,
      testMode
    };
  }

  try {
    const stripe = new Stripe(secretKey, {
      timeout: timeoutMs
    });
    await stripe.accounts.retrieve();

    return {
      configured,
      reachable: true,
      testMode
    };
  } catch {
    return {
      configured,
      reachable: false,
      testMode
    };
  }
}

const [supabase, stripe] = await Promise.all([
  verifySupabase(),
  verifyStripe()
]);

console.log(
  JSON.stringify(
    {
      supabase,
      stripe
    },
    null,
    2
  )
);

if (
  strict &&
  (!supabase.configured ||
    !supabase.adminReachable ||
    supabase.publicReadBoundary !== "passed" ||
    !stripe.configured ||
    !stripe.reachable ||
    !stripe.testMode)
) {
  process.exitCode = 1;
}
