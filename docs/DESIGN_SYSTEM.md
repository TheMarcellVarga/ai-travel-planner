# Design System

## Direction
Wild Route should feel like a cinematic jungle expedition interface crossed with a modern route-planning product. It should be bold and memorable, but still practical on mobile.

## Visual Keywords
- jungle canopy
- expedition map
- lime signal
- black glass
- weathered paper
- trail markers
- 00s adventure energy
- cinematic globe
- editorial travel cards

## Palette Direction
Use the existing visual direction as the base:
- background: deep jungle black / green-black
- surface: dark moss, charcoal, smoky glass
- accent: sharp lime for action and route signal
- secondary accents: sand, amber, muted leaf, off-white
- text: warm off-white primary, muted green-gray secondary
- warning: amber with text labels
- destructive: red with text labels

Avoid:
- generic purple SaaS gradients
- sterile white travel marketplace UI
- low-contrast green-on-black text

## Typography
- Use expressive display typography for marketing and route titles.
- Keep form fields, route details, and account screens highly readable.
- Use monospace only for airport codes, route tags, IDs, or technical status.
- Mobile line lengths should stay short enough for scanning outdoors.

## Component Rules
- Planner form should feel like an expedition console, not a generic lead form.
- Route cards should expose title, tagline, stops, reasons, confidence, and actions without hiding key tradeoffs.
- Globe/map is a hero support layer, not the only way to understand the route.
- The 2D/list fallback must be first-class.
- Use badges for wish tags and confidence, but do not rely on color alone.

## Motion
- Use motion for route reveals, globe arcs, hover depth, and page-load staging.
- Respect reduced-motion preferences.
- Avoid motion that blocks planning, reading, or form completion.

## Responsive Rules
- Mobile is first-class.
- Planner inputs should stack cleanly.
- Route cards should remain actionable without horizontal scrolling.
- Globe/map can collapse or become secondary if performance or viewport size demands it.
- Account and saved routes pages should prioritize clarity over spectacle.

## Media Rules
- Use licensed or owned assets.
- Keep image source and credit metadata where needed.
- Optimize images for fast loading.
- Do not use generic beach/office stock that weakens the adventure positioning.

## Accessibility
- Maintain visible focus states.
- Form labels must be programmatically associated.
- Route confidence and errors must be text-visible.
- Interactive map/globe features need non-map alternatives.
- Check contrast after any palette change.

