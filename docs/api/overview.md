# API Overview (Public)

## Auth
- HTTP header: `Authorization: Bearer <access_token>`
- Access tokens are short-lived; rotate and do not commit secrets.

## Versioning
- Base path with date-based versioning, e.g., `/api/v1/…`

## Rate Limits
- Default: 60 req/min per key (subject to change). Respect `429` with backoff.

## Errors
- JSON: `{ "error": { "code": "STRING", "message": "…" } }`

## Webhooks
See `docs/api/webhook.md` and `sdk/webhook/webhook-response-example.json`.
