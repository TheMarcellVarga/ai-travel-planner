"use client";

import { useState, useTransition, type FormEvent } from "react";

type NewsletterSignupProps = {
  defaultEmail?: string;
};

type NewsletterResponse = {
  error?: string;
  persistence?: {
    durable: boolean;
    detail: string;
  };
};

export function NewsletterSignup({ defaultEmail = "" }: NewsletterSignupProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [routeNotifications, setRouteNotifications] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setStatus(null);

      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          name,
          topics: {
            newsletter,
            routeNotifications
          }
        })
      });

      const payload = (await response.json()) as NewsletterResponse;

      if (!response.ok) {
        setStatus(payload.error ?? "Subscription failed.");
        return;
      }

      const confirmation = routeNotifications
        ? "Preferences accepted. Route alerts can be sent for signed-in trips when email delivery is configured."
        : "Newsletter preference accepted.";
      setStatus(
        payload.persistence?.durable
          ? confirmation
          : `${confirmation} ${payload.persistence?.detail ?? "This preview does not persist the subscription."}`
      );
      setName("");
    });
  }

  return (
    <section className="footer-newsletter newsletter-console">
      <div className="footer-newsletter__heading">
        <h2>A better route, once a month.</h2>
        <p className="muted-copy">
          One monthly dispatch, plus alerts for the trips you keep. Preview
          signups remain in demo memory unless subscriber storage is configured.
        </p>
      </div>

      <form className="newsletter-form" onSubmit={handleSubmit}>
        <div className="newsletter-console__fields">
          <label className="field newsletter-field">
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="traveler@example.com"
              type="email"
              value={email}
            />
          </label>

          <label className="field newsletter-field">
            <span>Name</span>
            <input
              autoComplete="name"
              name="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              type="text"
              value={name}
            />
          </label>
        </div>

        <div className="newsletter-options">
          <label className="newsletter-option">
            <input
              checked={newsletter}
              onChange={(event) => setNewsletter(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>Monthly dispatch</strong>
              <small>Launch notes, new destinations, and product updates.</small>
            </span>
          </label>

          <label className="newsletter-option">
            <input
              checked={routeNotifications}
              onChange={(event) => setRouteNotifications(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>Route alerts</strong>
              <small>Email me when I save, publish, or hand off a route.</small>
            </span>
          </label>
        </div>

        <button className="button button-island newsletter-console__button" disabled={isPending || !email} type="submit">
          <span>{isPending ? "Joining..." : "Join the list"}</span>
        </button>

        {status ? <p className="status-copy newsletter-status">{status}</p> : null}
      </form>
    </section>
  );
}
