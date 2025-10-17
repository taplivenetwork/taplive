📄 TapLive MVP — Technical Stack (Hackathon Version)
📋 Executive Summary

TapLive is a global real-time video streaming marketplace platform.
It connects on-demand livestreaming requests with local executors, integrating real-time communication, intelligent geo-safety risk control, multi-currency payment, and automated moderation.

Tech Philosophy: Modern, scalable, compliance-first architecture with real-time streaming and intelligent verification.

🏗️ System Architecture
Core Stack

Frontend: React + Vite (hot reload)

Backend: Node.js + Express.js (REST API)

Realtime: WebSocket + WebRTC

Database: PostgreSQL (serverless hosting)

Deployment: Cloud-based runtime environment

Type Safety: Full TypeScript stack with shared schemas

Architecture Highlights

Single-page application + unified backend

Low-latency livestreaming

LBS (location-based services) with risk control

Modular design for rapid iteration

🎨 Frontend Stack
Layer	Technologies
UI Framework	React, Tailwind CSS, Radix UI, shadcn/ui
Animations	Framer Motion
Routing	Wouter
Forms & Validation	React Hook Form + Zod
Data Fetching	React Query
i18n	Context-based translation (7 languages)

✅ Key Features

Responsive design (mobile-first)

Real-time UI updates with optimistic caching

Multi-language support

Dark mode & modern UX

⚙️ Backend Stack
Layer	Technologies
Framework	Express.js
Runtime	Node.js
Realtime	WebSocket + WebRTC
ORM & DB	Drizzle ORM + PostgreSQL
Hosting	Cloud-based environment

✅ Key Features

Stateless, scalable backend

Type-safe APIs with validation

Clear separation of business logic and data layer

🌐 Real-Time Communication

Protocol: Native WebRTC (P2P)

Signaling: WebSocket server

STUN/TURN: Public STUN services (fallback TURN planned)

Features:

One-to-many livestreaming

Front/back camera switching

Auto-reconnect for unstable networks

Low-latency direct streaming

Broadcaster → WebRTC (P2P) → WebSocket Signaling → Viewer

📍 Geo-Location & Risk Engine
Component	Function
Geolocation API	Real-time user location tracking
Leaflet.js	Interactive map visualization
Geo-Safety Engine	Zone validation & risk assessment

✅ Risk Analysis

Geofence validation

High-risk zone detection

Real-time weather alerts

Content & keyword filtering

Multi-level risk scoring (safe → forbidden)

💳 Payment System

Payment Providers: Stripe, PayPal, Crypto (BTC, ETH, USDT)

Architecture: Escrow-based split (80/20 model)

Features:

Instant order payment

Automated payout tracking

Multi-currency support

Dispute & refund handling

Order Payment → Platform Fee → Provider Earnings → Payout

🛡️ Moderation & Compliance

AI-powered content moderation

Real-time keyword & voice detection

Geographical content compliance

Automated violation tagging

Dispute resolution flow (AI + human review)

🔐 Security

Session management

Input validation (Zod)

CORS & XSS protection

SQL injection prevention (ORM)

Secret management with environment variables

🌍 Internationalization (i18n)

Languages: English, Chinese, French, German, Japanese, Korean, Spanish

Dynamic language switching

Centralized i18n management

LocalStorage persistence

📈 Scalability Considerations

Serverless DB auto-scaling

Stateless backend

CDN-ready frontend

Horizontal scaling with WebSocket clustering (planned)

Future enhancements: Redis caching, message queues, load balancing

🧪 Dev Workflow & Tools

Tooling: ESLint, TypeScript, Vite, Drizzle Studio

Build: ESBuild optimized bundling

Scripts:

npm run dev      # local dev
npm run build    # production build
npm start        # run server


Repo Structure:

client/     → React frontend
server/     → Express backend
shared/     → TypeScript schemas
db/         → Migrations

📝 API Overview
Endpoint	Description
GET /api/orders	Fetch orders (with filters)
POST /api/orders	Create new order
POST /api/payments	Payment processing
POST /api/geo-check	Risk assessment
WebSocket events	offer, answer, ice-candidate, viewer-joined
🎯 Technical Highlights for Judges

✅ Native WebRTC livestreaming — no third-party SDK

✅ Geo-Safety Engine with live risk assessment

✅ Multi-currency Payments (fiat + crypto)

✅ AI Content Moderation

✅ 7-language i18n for global reach

✅ Type-Safe Full-Stack with shared schemas

✅ 80/20 Commission Model for fairness

✅ Real-Time Dispute Resolution workflow

📅 Project Status

Stage: MVP (Phase 1)

Hosting: Cloud runtime environment

API Version: 1.0.0

Last Updated: October 2025


Demonstrating modern full-stack architecture with real-time streaming, intelligent risk control, and global accessibility.
