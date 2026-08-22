# Design System

## Direction
Wild Route should feel like a cinematic jungle expedition interface crossed with a 00s adventure festival and motorsport paddock. It should be bold, slightly misaligned, and memorable, while keeping route decisions practical on mobile.

## Visual Keywords
- jungle canopy
- expedition map
- lime signal
- black glass
- weathered paper
- trail markers
- 00s adventure energy
- festival paddock signage
- route numbers and pit-wall panels
- cinematic globe
- editorial travel cards

## Palette Direction
Use the festival system as the base:
- background: charcoal asphalt / green-black
- surface: deep moss-black and raised charcoal panels
- primary accent: acid lime for actions, active route states, and route signal
- limited flag accent: hot coral for event markers, caution, and decorative tape
- text: warm off-white primary, paper-gray secondary
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
- Use hard-edged panels, short radii, route numbering, and one or two optical offsets per composition. Misalignment is decorative, never structural.
- Primary actions use acid lime with dark ink; secondary actions remain dark, bordered, and text-labelled.
- Use diagonal trims, paper-tape flags, and route grid lines only as supporting texture. They must never compete with labels, inputs, or route reasoning.
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
