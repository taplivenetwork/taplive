# 📄 TapLive MVP — Technical Stack (Phase 1–2)

## 📋 Executive Summary

TapLive is a **real-time video streaming marketplace** that connects on-demand livestreaming requests with local executors.
It integrates livestreaming, location-based risk control, multi-currency payments, and automated moderation to build a global “real-world presence” network.

**Tech Philosophy:** modern, scalable, compliance-first architecture with real-time streaming and intelligent verification.

---

## 🏗️ System Architecture

* **Frontend**: React + Vite
* **Backend**: Node.js + Express.js
* **Realtime**: WebSocket + WebRTC
* **Database**: PostgreSQL (serverless)
* **Deployment**: Cloud-based runtime environment
* **Language**: Full TypeScript stack with shared schemas

### Feature Layering

| Status                | Meaning                                  |
| --------------------- | ---------------------------------------- |
| ✅ Implemented         | Fully functional in MVP demo             |
| 🧪 Planned / Optional | Partially designed, not required for MVP |
| 🛣️ Future Roadmap    | Scheduled for later development          |

---

## 🎨 Frontend Stack

| Feature                         | Status | Description                         |
| ------------------------------- | ------ | ----------------------------------- |
| React + Vite                    | ✅      | Core UI framework & dev environment |
| Tailwind + Radix UI + shadcn/ui | ✅      | Component library & styling         |
| Framer Motion                   | 🧪     | Basic animation structure planned   |
| i18n (EN + CN)                  | ✅      | Language switching                  |
| i18n (extra 5 languages)        | 🧪     | Planned for global access           |
| Responsive Navigation           | ✅      | Mobile & desktop support            |

---

## ⚙️ Backend Stack

| Feature              | Status | Description                     |
| -------------------- | ------ | ------------------------------- |
| Node.js + Express    | ✅      | Core backend                    |
| WebSocket signaling  | ✅      | Realtime communication          |
| RESTful API          | ✅      | Order / Payment / Geo endpoints |
| Session management   | ✅      | Authentication & security       |
| Scaling architecture | 🛣️    | Planned multi-region deployment |

---

## 🌐 Realtime Communication

| Feature                    | Status | Description                        |
| -------------------------- | ------ | ---------------------------------- |
| WebRTC P2P                 | ✅      | Core livestreaming                 |
| WebSocket signaling server | ✅      | Real-time session management       |
| STUN                       | ✅      | Basic NAT traversal                |
| TURN fallback              | 🧪     | Reliability improvement (Phase 2+) |
| Multi-peer optimization    | 🛣️    | Advanced streaming (Phase 3+)      |

```
Broadcaster → WebRTC (P2P) → WebSocket Signaling → Viewer
```

---

## 📍 Geo-Location & Risk Engine

| Feature                        | Status | Description              |
| ------------------------------ | ------ | ------------------------ |
| Geolocation API                | ✅      | Location tracking        |
| Leaflet.js map                 | ✅      | Interactive maps         |
| Geofence validation            | ✅      | Core risk check          |
| Real-time weather alerts       | 🧪     | Planned risk enhancement |
| Full multi-factor risk scoring | 🛣️    | Advanced engine Phase 3+ |

---

## 💳 Payment System

| Feature                    | Status | Description             |
| -------------------------- | ------ | ----------------------- |
| Stripe integration         | ✅      | Core payment processing |
| Crypto payments (ETH/USDT) | 🧪     | Optional gateway        |
| Escrow 80/20 split         | ✅      | Payment structure       |
| Automated payouts          | 🛣️    | Scalable payout system  |

```
Order Payment → Platform Fee → Provider Earnings → Payout
```

---

## 🛡️ Moderation & Compliance

| Feature           | Status | Description                |
| ----------------- | ------ | -------------------------- |
| Keyword detection | ✅      | Real-time text scanning    |
| Voice flagging    | 🧪     | Planned Phase 2            |
| Geo-compliance    | ✅      | Restricted area detection  |
| AI risk labeling  | 🛣️    | Future moderation pipeline |

---

## 🔐 Security

* ✅ Session management
* ✅ Zod input validation
* ✅ CORS & XSS protection
* ✅ SQL injection prevention (ORM)
* 🧪 Enhanced secret management (planned for later scale)

---

## 🌍 Internationalization (i18n)

* ✅ English & Chinese supported in MVP
* 🧪 5 additional languages planned (FR, DE, JP, KR, ES)
* 🛣️ Auto language detection & full localization in Phase 3+

---

## 📈 Scalability Considerations

| Layer                        | Status | Description          |
| ---------------------------- | ------ | -------------------- |
| Serverless DB auto-scaling   | ✅      | Neon hosting         |
| Stateless backend            | ✅      | Horizontal ready     |
| Redis caching                | 🧪     | Optional enhancement |
| Message queue & multi-region | 🛣️    | Future scaling plan  |

---

## 🧪 Dev Workflow & Tools

* ESLint + TypeScript + Vite
* Hot reload dev environment
* Shared schema between client/server
* Drizzle ORM + database migrations

```
npm run dev      # local development
npm run build    # production build
npm start        # run server
```

---

## 📝 API Overview (Phase 1–2)

| Endpoint                                              | Status | Description              |
| ----------------------------------------------------- | ------ | ------------------------ |
| `GET /api/orders`                                     | ✅      | List orders with filters |
| `POST /api/orders`                                    | ✅      | Create order             |
| `POST /api/payments`                                  | ✅      | Payment                  |
| `POST /api/geo-check`                                 | ✅      | Risk assessment          |
| WebSocket events (`offer`, `answer`, `ice-candidate`) | ✅      | Realtime signaling       |
| Dispute handling endpoints                            | 🛣️    | Planned (Phase 3+)       |

---

## 🎯 Technical Highlights for Judges

* ✅ **Native WebRTC livestreaming** — no third-party SDK
* ✅ **Geo-Safety Engine** with live risk validation
* ✅ **Multi-currency Payment System** (Stripe + optional crypto)
* ✅ **AI-assisted Moderation** (basic keyword detection, future escalation)
* ✅ **i18n ready** for global accessibility
* 🧪 Optional components and 🛣️ Future roadmap clearly separated
* 🧠 Type-safe full-stack with real-time architecture

---

## 📅 Project Status

* **Stage**: MVP (Phase 1–2)
* **Hosting**: Cloud runtime environment
* **Core features**: Live order placement, LBS + Risk Engine, Real-time streaming, Payment, Basic moderation
* **Optional features**: Crypto payment, weather alert, voice flagging
* **Future**: Full risk engine, advanced moderation, multi-region scaling

*Demonstrating a clear architecture, real-time functionality, and planned scalability.*
