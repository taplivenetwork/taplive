# Webhooks

## Events (public)
- `order.created`
- `order.accepted`
- `order.completed`
- `replay.available`
- `risk.label.updated`

## Delivery
- POST JSON to your HTTPS endpoint.
- Retries: exponential backoff; verify via signature header `X-TL-Signature`.

## Security
- Validate signature with your secret.
- Respond `2xx` within 10s.

## Example Payload
See `sdk/webhook/webhook-response-example.json`.
