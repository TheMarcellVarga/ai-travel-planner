import { site } from "@/lib/site";
import { env } from "@/lib/env";
import type { AppUser, NewsletterSubscriber, RouteOption } from "@/lib/types";

import { getNewsletterSubscriber } from "@/lib/store/demo-store";
import { sendEmail } from "@/lib/email";

type RouteNotificationAction = "saved" | "published" | "handoff";

function buildRouteSummary(route: RouteOption) {
  return `${route.title} | ${route.tagline} | Estimated cost $${route.estimatedCostUsd}`;
}

function buildRouteHtml(route: RouteOption, bodyCopy: string, extraLink?: string) {
  const bookingLinkMarkup = extraLink
    ? `<p><a href="${extraLink}">Open the share page</a></p>`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102118;">
      <h1 style="margin: 0 0 16px; font-size: 24px;">${site.name}</h1>
      <p>${bodyCopy}</p>
      <p><strong>${route.title}</strong></p>
      <p>${route.tagline}</p>
      <p>Estimated cost: $${route.estimatedCostUsd}</p>
      ${bookingLinkMarkup}
    </div>
  `;
}

export async function sendNewsletterConfirmationEmail(subscriber: NewsletterSubscriber) {
  const topics = subscriber.topics
    .map((topic) => (topic === "newsletter" ? "newsletter drops" : "route alerts"))
    .join(" and ");

  return sendEmail({
    to: subscriber.email,
    subject: `${site.name} subscription confirmed`,
    text: `You're subscribed to ${topics} from ${site.name}.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #102118;">
        <h1 style="margin: 0 0 16px; font-size: 24px;">${site.name}</h1>
        <p>You're subscribed to ${topics}.</p>
        <p>We’ll send occasional expedition updates and, if enabled, route alerts for your saved trips.</p>
      </div>
    `
  });
}

export async function maybeSendRouteNotification({
  user,
  route,
  action,
  shareUrl
}: {
  user: AppUser;
  route: RouteOption;
  action: RouteNotificationAction;
  shareUrl?: string;
}) {
  const subscriber = getNewsletterSubscriber(user.email);

  if (!subscriber?.topics.includes("route_notifications")) {
    return { sent: false, skipped: true as const };
  }

  const summary = buildRouteSummary(route);
  const subject =
    action === "saved"
      ? `${site.name}: route saved`
      : action === "published"
        ? `${site.name}: route published`
        : `${site.name}: booking handoff ready`;
  const shareLink = shareUrl ? `${env.appUrl}${shareUrl}` : undefined;
  const bodyCopy =
    action === "handoff"
      ? "Your booking handoff is ready."
      : action === "published"
        ? "Your public share page is live."
        : "Your route was saved to your vault.";

  return sendEmail({
    to: user.email,
    subject,
    text: [bodyCopy, summary, shareLink ? `Share: ${shareLink}` : null].filter(Boolean).join("\n"),
    html: buildRouteHtml(route, bodyCopy, shareLink)
  });
}
