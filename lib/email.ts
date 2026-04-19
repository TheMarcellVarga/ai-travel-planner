import { env } from "@/lib/env";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export function hasEmailEnv() {
  return Boolean(env.resendApiKey && env.emailFrom);
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  if (!hasEmailEnv()) {
    return { sent: false, skipped: true as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to,
      subject,
      text,
      ...(html ? { html } : {})
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email provider rejected the message: ${errorText}`);
  }

  return { sent: true, skipped: false as const };
}
