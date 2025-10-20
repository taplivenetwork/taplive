> **Purpose:**  
> Demonstrate TapLive’s real backend capability and payment flow during hackathon evaluation.  
> REST + WebSocket | JSON UTF-8 | Auth required for write operations.

---

## 0. API Specification

- **Base URL (example)**  
  - Dev: `http://localhost:5000`  
  - Prod: `https://api.taplive.tv`

- **Authentication**  
  `Authorization: Bearer <session-credential>`

- **Response Format**
  ```json
  { "ok": true, "data": { }, "message": "ok" }
json

{ "ok": false, "error": "VALIDATION_ERROR", "message": "bad input" }
1. Auth / Users
POST /v1/auth/register
json

{ "email":"a@b.com", "password":"******", "name":"Alice" }
json

{ "userId":"usr_123", "accessToken":"<session>", "expiresIn":3600 }
POST /v1/auth/login
json

{ "email":"a@b.com", "password":"******" }
json

{ "userId":"usr_123", "accessToken":"<session>", "expiresIn":3600 }
GET /v1/me (Auth)
json

{ "userId":"usr_123","name":"Alice","roles":["customer"],"wallets":{"evm":"0xabc..."} }
2. Orders
ts

type Order = {
  id: string;
  customerId: string;
  providerId?: string;
  title: string;
  startAt: string;        // ISO
  durationMin: number;
  amount: { currency:"USD"; value:string };
  status: "draft"|"pending_payment"|"in_progress"|"completed"|"cancelled"|"refunded";
};
POST /v1/orders
json

{
  "providerId":"usr_provider_001",
  "title":"On-site livestream",
  "startAt":"2025-10-21T13:00:00Z",
  "durationMin":30,
  "amount":{"currency":"USD","value":"19.99"}
}
json

{ "orderId":"ord_1001", "status":"pending_payment" }
GET /v1/orders/:id
json

{ "id":"ord_1001","status":"pending_payment","amount":{"currency":"USD","value":"19.99"} }
3. Payments (PayPal)
POST /v1/payments/intent
json

{ "orderId":"ord_1001", "preferred":"paypal" }
Response Example (PayPal):

json

{
  "paymentId":"pay_abc",
  "method":"paypal",
  "next":{
    "createOrderUrl":"/v1/paypal/create-order?paymentId=pay_abc",
    "captureUrl":"/v1/paypal/capture?paymentId=pay_abc"
  }
}
POST /v1/paypal/create-order
Creates PayPal order.

Returns PayPal approval link.

POST /v1/paypal/capture
Captures funds after user approval.

Updates order status to in_progress.

4. Tips (Unified Entry)
POST /v1/tips
json

{ "streamId":"str_9001", "amount":{"currency":"USD","value":"0.10"}, "channel":"paypal" }
GET /v1/tips/stream/:streamId
json

[{ "tipId":"tip_101","userId":"usr_123","amount":{"currency":"USD","value":"0.10"},"confirmed":true }]
5. Subscriptions (Optional)
POST /v1/subscriptions/plan (Admin)
json

{ "name":"Pro Monthly", "price":{"currency":"USD","value":"9.99"}, "providerId":"usr_provider_001" }
POST /v1/subscriptions
json

{ "planId":"plan_5001", "method":"paypal" }
6. Realtime (WebSocket)
Endpoint: WS /v1/ws

Events:

broadcaster_ready / stream_started / stream_ended

webrtc_offer|answer|ice_candidate

tip_event

order_status

Example tip event:

json

{ "type":"tip_event","streamId":"str_9001","from":"usr_123","amount":{"currency":"USD","value":"0.10"} }
7. Webhooks
POST /v1/webhooks/paypal

All webhook endpoints are idempotent and support retry.

8. Errors & Idempotency
json

{ "ok": false, "error":"BUSINESS_RULE_VIOLATION", "message":"cannot approve before capture" }
Supports Idempotency-Key for payment-related POSTs.

Error codes: 400/401/403/404/409/422/500.

9. Minimal OpenAPI Example
yaml

openapi: 3.0.0
info:
  title: TapLive MVP API
  version: 0.1.0
paths:
  /v1/orders:
    post:
      summary: Create order
  /v1/payments/intent:
    post:
      summary: Create payment intent (PayPal)
  /v1/tips:
    post:
      summary: Create tip
10. Local Test Examples
bash

# Create order
curl -X POST http://localhost:5000/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "providerId":"usr_provider_001",
    "title":"On-site livestream",
    "startAt":"2025-10-21T13:00:00Z",
    "durationMin":30,
    "amount":{"currency":"USD","value":"19.99"}
  }'

# Create payment intent
curl -X POST http://localhost:5000/v1/payments/intent \
  -H "Content-Type: application/json" \
  -d '{ "orderId":"ord_1001", "preferred":"paypal" }'
11. Environment Variables
makefile

DATABASE_URL=
JWT_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_SECRET=
12. MVP Scope
✅ Now: Order creation, PayPal one-time payment, WebSocket signaling, tip events.

🚀 Future: Auto-settlement for subscriptions and advanced risk control hooks.
