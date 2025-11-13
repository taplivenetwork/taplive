> **Purpose:** This diagram illustrates the complete flow of TapLive during the MVP phase — from user interaction to order creation, payment, livestream execution, and replay access.  
> It helps reviewers understand the project at a glance.

## 1. High-Level Sequence Diagram (User → Order → Streaming → Replay)
```mermaid
sequenceDiagram
    autonumber
    actor U as User (Web/Mobile)
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant DB as PostgreSQL
    participant PP as PayPal
    participant WS as WebSocket/RTC
    participant STR as Stream Provider
    participant STO as Object Storage

    U->>FE: Browse livestreams / Create order
    FE->>BE: POST /v1/orders
    BE->>DB: Insert order (status=pending_payment)
    DB-->>BE: orderId
    BE-->>FE: {orderId, status:"pending_payment"}

    U->>FE: Initiate payment (PayPal)
    FE->>BE: POST /v1/payments/intent
    BE->>PP: Create PayPal Order
    PP-->>BE: approval link
    BE-->>FE: approval link

    U->>PP: Approve & complete payment
    FE->>BE: POST /v1/paypal/capture
    BE->>PP: Capture payment
    PP-->>BE: CAPTURED
    BE->>DB: update order status = in_progress
    BE-->>FE: {status:"in_progress"}

    note over U,STR: Livestream execution
    FE-->>WS: viewer connect
    STR-->>WS: broadcaster connect
    WS-->>FE: broadcaster_ready
    FE-->>STR: WebRTC signaling
    STR-->>FE: Media streaming

    U->>FE: Send tip
    FE->>BE: POST /v1/tips
    BE->>DB: record tip
    BE-->>WS: tip_event (real-time update)

    STR->>STO: Upload replay
    U->>FE: End session, approve order
    FE->>BE: POST /v1/orders/:id/approve
    BE->>DB: finalize order + payout
    BE-->>FE: completed
    U->>FE: Access replay
    FE->>STO: GET /recordings
    STO-->>FE: playback
```

## 2. Business Flow (Order → Payment → Execution → Settlement)
```mermaid
flowchart LR
    A[User creates order] --> B[Order: pending_payment]
    B --> C{Payment method}
    C -->|PayPal| D[Create PayPal order]
    D --> E[User approves & captures payment]
    E --> F[Order: in_progress]
    F --> G[Livestream execution]
    G --> H[Tips & realtime events]
    H --> I[End of session]
    I --> J{Customer approves?}
    J -->|Yes| K[Order completed & payout]
    J -->|No| L[Dispute / Arbitration]
    K --> M[Replay generated]
    M --> N[Replay accessed by users]
```

## 3. Realtime WebSocket / Signaling Flow
```mermaid
sequenceDiagram
    autonumber
    participant V as Viewer
    participant B as Broadcaster
    participant WS as WebSocket
    participant BE as Backend

    V->>WS: connect
    B->>WS: connect
    WS-->>V: broadcaster_ready
    V-->>WS: webrtc_offer
    WS-->>B: offer
    B-->>WS: answer
    WS-->>V: answer
    V-->>WS: ICE
    B-->>WS: ICE
    WS-->>V: ICE
    WS-->>B: ICE

    V->>BE: POST /v1/tips
    BE-->>WS: tip_event
    WS-->>V: tip_event
    WS-->>B: tip_event

    B-->>WS: stream_ended
    WS-->>V: stream_ended
```

## 4. Payment & Order State Machine
```mermaid
stateDiagram-v2
    [*] --> PendingPayment
    PendingPayment --> InProgress: PayPal Capture success
    PendingPayment --> Cancelled: timeout / user cancel
    InProgress --> AwaitingApproval: session ends
    AwaitingApproval --> Completed: user approves
    AwaitingApproval --> Disputed: user disputes
    Disputed --> Resolved: platform resolution
    Completed --> [*]
    Cancelled --> [*]
    Resolved --> [*]
```

## 5. Failure & Recovery Path
```mermaid
flowchart TB
    X[Start payment] --> Y{PayPal available?}
    Y -->|No| Y1[Show error & retry]
    Y -->|Yes| Z[Create Order & Capture]
    Z --> Z1{Capture success?}
    Z1 -->|No| Z2[Rollback payment & order]
    Z1 -->|Yes| Z3[In progress]
    Z3 --> Z4{WS/RTC OK?}
    Z4 -->|No| Z5[Fallback: recorded session]
    Z4 -->|Yes| Z6[Streaming OK]
```

## 6. Data Objects (Minimal Fields)
- **Order**  
  - `id`, `title`, `startAt`, `durationMin`, `amount {currency, value}`, `status`
- **Payment**  
  - `id`, `orderId`, `method`, `status`, `externalId`, `capturedAt`
- **Tip**  
  - `id`, `streamId`, `userId`, `amount {currency, value}`, `confirmed`, `timestamp`
- **Webhook Log**  
  - `id`, `source`, `eventType`, `payloadHash`, `status`, `retries`

## 7. Replay Flow (Optional)
```mermaid
sequenceDiagram
    autonumber
    participant STR as Broadcaster
    participant REC as Recorder
    participant STO as Object Storage
    participant FE as Frontend
    participant BE as Backend

    STR->>REC: Start recording
    REC->>STO: Upload chunks
    STO-->>BE: Callback / indexing
    BE-->>FE: recording list
    FE->>STO: GET replay
    STO-->>FE: Stream file
```

## 8. Legend
- 🟦 Frontend / Backend / Third-party services (PayPal, storage)  
- 🟩 Key states (pending_payment → in_progress → completed)  
- 🟧 Error or dispute branches  
- 🟪 Optional components (e.g., recording)

## 9. API Reference Mapping
- `POST /v1/orders` → Order creation  
- `POST /v1/payments/intent` → Payment initiation  
- `POST /v1/paypal/create-order` / `capture` → Payment flow  
- `WS /v1/ws` → Livestream signaling  
- `POST /v1/tips` → Tip  
- `POST /v1/orders/:id/approve` → Completion & payout  
- Replay (optional) → Object storage URL

📎 See also: `09_api-draft.md`

✅ Usage:  
- Save this file as `docs/10_workflow-diagram.md`  
- GitHub will render the Mermaid diagrams automatically.  
- Suitable for ETHGlobal Hackathon submission.
