# Browser QA

## Phase 2 Pass
Date: 2026-06-17

Scope:
- Phase 2 app shell and design-system verification.
- Local target: `http://localhost:3000`.
- Browser surface: Codex in-app browser.
- Dev server: `npm run dev`.

Automated verification before browser pass:

```bash
npm run test
npm run build
```

Result:
- Tests passed: 4 files, 11 tests.
- Production build passed on Next.js 15.5.15.

HTTP route checks:
- `/`: `200 OK`
- `/planner`: `200 OK`
- `/saved`: `200 OK`
- `/auth`: `200 OK`
- `/account`: `200 OK`

Browser route checks:

| Route | Result | Notes |
| --- | --- | --- |
| `/` | Pass | Homepage renders `Travel, composed.` and primary navigation/CTA links. No browser console errors recorded. |
| `/planner` | Pass | Planner renders route options, `Route controls`, 3D globe shell, and wired 2D fallback. No browser console errors recorded. |
| `/saved` | Pass | Signed-out empty state renders `Route memory needs an account.` with auth/planner actions. No browser console errors recorded. |
| `/auth` | Pass | Auth page renders magic link, OAuth, demo mode, and anonymous exploration actions. No browser console errors recorded. |
| `/account` | Pass | Signed-out account gate renders sign-in and planner actions. No browser console errors recorded. |

Planner interaction check:
- Opened `/planner`.
- Opened `Route controls`.
- Replaced prompt with `Find a 10 day surf and hiking route from Lisbon with one stop.`
- Clicked `Compose new routes`.
- Verified a fresh ranked set rendered:
  - `Chiang Mai Breakline`
  - `Bali Breakline`
  - `Tulum Breakline`
  - `Cape Town Breakline`
- No planner error message appeared.
- No browser console errors recorded.

Mobile breakpoint check:
- Viewport: `390x844`.
- `/planner` rendered with grid layout.
- Route dock uses horizontal overflow for route cards.
- `Route controls` toggle remains available.
- Inspector remains available.
- 2D route fallback is visible at this breakpoint.
- No browser console errors recorded.

Fallback behavior:
- `RouteMapFallback` is now wired through `RouteGlobe`.
- Fallback is visible while the 3D globe is loading.
- Fallback becomes primary when reduced-motion is requested or the globe does not become ready within the timeout.
- The planner remains usable through route cards and controls even if WebGL is unavailable.

Phase 2 decision:
- Phase 2 is complete for the current MVP app shell/design-system gate.
- Remaining deeper QA belongs to Phase 7: accessibility pass, broader browser matrix, rate limits/observability, and formal security QA.

## Phase 7 Targeted Pass
Date: 2026-07-06

Scope:
- Golden-path browser verification through demo sign-in, planner selection, save, publish, public share, saved routes, and account states.
- Desktop viewport: `1280x720`.
- Mobile viewport: `390x844`.
- Browser surface: Codex in-app browser.

Automated verification:

```bash
npm run test
npm run build
```

Result:
- Tests passed: 9 files, 40 tests.
- Production build passed on Next.js 15.5.15.

Flow results:

| Surface | Result | Notes |
| --- | --- | --- |
| `/` desktop | Pass | Hero, primary navigation, and route preview render without console errors. |
| `/planner` demo | Pass after repair | Default generation is now persisted once per user and reused, so route actions resolve a durable route ID. |
| Save and publish | Pass | Save returned `Saved to your route vault.` and publish returned a working `/share/[slug]` URL. |
| `/share/[slug]` | Pass after repair | Disclaimer and freshness are visible; no provider booking links appear in the public snapshot; desktop and mobile have no horizontal overflow. |
| `/saved` demo | Pass | Saved route and public share render at `390x844` without navigation/header overlap. |
| `/account` demo | Pass | Demo limitations, inactive billing status, and managed-sign-in handoff render without overflow. |
| `/account` signed out | Pass | Sign-in gate and planner return action render without overflow. |

Issues repaired during this pass:
- Default planner generations were rendered without persistence, causing Save and Publish to return `Route not found.` The planner now reuses the latest user generation and persists the default only when none exists.
- Mobile saved/share headers rendered under the fixed navigation. Both shells now reserve enough top space below `720px`.

Accessibility observations:
- Planner route controls, route choices, Save, Publish, handoff, auth, and account actions use semantic links/buttons.
- Account and auth inputs have visible labels.
- A visible 2px focus outline was observed on planner route controls.
- Reduced-motion safeguards exist in CSS and component logic: animation/transition durations are clamped, homepage scroll effects exit early, the route story disables motion, and the globe uses its fallback path.

Remaining manual checks:
- Run a complete keyboard-only tab-order pass beyond the automated skip-link path.
- Investigate the non-blocking development warning about multiple Three.js instances.
- Remote Unsplash image optimization intermittently timed out and returned `500` responses in the dev server; route content and actions remained usable, but launch QA needs reliable media delivery or local fallbacks.

## Portfolio Upgrade Phase 2 Golden Path

Date: 2026-07-27

Manual browser verification:

- demo sign-in redirected to `/saved`
- planner rendered four ranked routes and the map fallback
- Save returned `Saved to your route vault.`
- Publish returned a working `/share/[slug]`
- public share exposed estimate and provider-freshness boundaries
- saved vault displayed both the private route and public share link

Repeatable automation:

```bash
npm run test:e2e
```

`e2e/golden-path.spec.ts` runs the same demo-mode product path in Chromium. It
captures the outbound `window.open` URL, avoiding external navigation while
still asserting the real handoff response, provider URL, and browser behavior.

## Portfolio Upgrade Phase 3 Accessibility Automation

Date: 2026-07-30

`e2e/accessibility.spec.ts` adds repeatable Chromium checks for:

- serious or critical axe violations across `/`, `/planner`, `/auth`, and
  `/saved`, using WCAG 2.0, 2.1, and 2.2 A/AA tags
- the first keyboard focus landing on the visible skip link and activation
  moving focus to the main content container
- active `prefers-reduced-motion: reduce` emulation with visible animation and
  transition durations clamped to one millisecond

The first run found and the implementation repaired an invalid homepage ARIA
label, unlabeled auth email input, and skip-link target that could not receive
focus. All six accessibility tests now pass. Automated scanning complements
rather than replaces a complete manual keyboard-order and screen-reader pass.
