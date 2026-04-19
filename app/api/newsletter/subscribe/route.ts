import { NextResponse } from "next/server";
import { z } from "zod";

import { sendNewsletterConfirmationEmail } from "@/lib/notifications";
import { subscribeNewsletter } from "@/lib/store/demo-store";

const requestSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(80).optional(),
  topics: z
    .object({
      newsletter: z.boolean().optional(),
      routeNotifications: z.boolean().optional()
    })
    .optional()
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const payload = parsed.data;

  const requestedTopics = [
    payload.topics?.newsletter !== false ? "newsletter" : null,
    payload.topics?.routeNotifications ? "route_notifications" : null
  ].filter(Boolean) as Array<"newsletter" | "route_notifications">;

  if (!requestedTopics.length) {
    return NextResponse.json({ error: "Select at least one email option." }, { status: 400 });
  }

  const topics = requestedTopics;
  const subscription = subscribeNewsletter({
    email: payload.email,
    name: payload.name,
    topics
  });

  if (subscription.created || subscription.gainedTopics.length > 0) {
    void sendNewsletterConfirmationEmail(subscription.subscriber).catch(() => undefined);
  }

  return NextResponse.json({
    email: subscription.subscriber.email,
    topics: subscription.subscriber.topics
  });
}
