export const oauthProviders = ["google", "github"] as const;

export type OAuthProvider = (typeof oauthProviders)[number];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return oauthProviders.includes(value as OAuthProvider);
}

export function getOAuthProviderLabel(provider: OAuthProvider) {
  return provider === "github" ? "GitHub" : "Google";
}
