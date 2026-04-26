export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripeProPriceId: process.env.STRIPE_PRO_PRICE_ID,
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM
};

export const hasSupabaseEnv = Boolean(
  env.supabaseUrl && env.supabasePublishableKey
);
export const hasSupabaseAdminEnv = Boolean(
  env.supabaseUrl && env.supabaseServiceRoleKey
);
export const hasStripeEnv = Boolean(
  env.stripeSecretKey && env.stripeProPriceId
);
