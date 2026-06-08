# Route Generation And AI

## Use When
- Changing prompt interpretation.
- Changing route scoring.
- Adding destination/provider data.
- Adding live AI or structured model output.
- Writing route-generation evals.

## Rules
- Keep deterministic constraints outside prompts.
- Validate every structured output.
- Do not fabricate provider-confirmed prices or availability.
- Include assumptions, confidence, and freshness where relevant.
- Live AI/provider calls stay disabled in tests and CI.
- Prompt injection cannot override product guardrails.
- Entitlement limits must be enforced after generation and before response.

## Checklist
- Prompt parsing has tests.
- Scoring changes have tests.
- Free-plan promoted stop behavior is tested.
- Provider failure returns partial, honest output.
- AI schema validation exists if live AI is used.
- Unsafe travel and stale-data fixtures are covered.

