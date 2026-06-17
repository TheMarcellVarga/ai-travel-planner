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

