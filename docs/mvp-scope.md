# MVP Scope (Phase 1–2)

## Goals
- On-demand livestream order -> accept -> deliver -> minimal replay access control.
- Basic LBS check & anti-abuse guardrails (public level, no internal thresholds).
- Webhook events for order/replay lifecycle.
- Public documentation & SDK samples for integrations.

## Non-Goals
- No tokens, NFTs, assetization or “store/value balance”.
- No Phase 3+ features (e.g., advanced marketplace, robotics, etc.).
- No sensitive risk rules/weights, no production secrets.

## Deliverables
- Public docs in `/docs`.
- Webhook schema & examples in `/docs/api` and `/sdk/webhook`.
- Replay viewer public overview & plugin examples in `/docs/replay` and `/sdk/replay-viewer`.
