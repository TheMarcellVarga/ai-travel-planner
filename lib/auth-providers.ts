const supportedProviders = ["google", "github"] as const;

export type OAuthProvider = (typeof supportedProviders)[number];

export const oauthProviders: OAuthProvider[] = supportedProviders.filter((provider) =>
  (process.env.AUTH_OAUTH_PROVIDERS ?? "").split(",").map((value) => value.trim()).includes(provider)
);

export function isOAuthProvider(value: string): value is OAuthProvider {
  return oauthProviders.includes(value as OAuthProvider);
}

export function getOAuthProviderLabel(provider: OAuthProvider) {
  return provider === "github" ? "GitHub" : "Google";
}
