# 🌍 TapLive — Real-time Human Collaboration Network

> "Connecting people to real-world actions through on-demand live collaboration."

TapLive is a location-based livestream collaboration platform that allows users to place and respond to on-demand livestream tasks in real time, enabling trusted human presence anywhere in the world.

---

## 🪄 Why It Matters
- 🌐 Real-time, location-based human collaboration
- 🔐 Trust layer with geolocation verification
- 🤝 Open, modular developer ecosystem
- ⚖️ Compliant: no token, no assetization

## 🚀 Tech Stack

- **Frontend:** Vite + React + TypeScript + TailwindCSS + shadcn/ui
- **Backend:** Node.js + Express.js + TypeScript
- **Database:** PostgreSQL (Drizzle ORM)
- **Real-time:** WebRTC + WebSocket
- **Build:** pnpm workspaces

---

## 📦 Project Structure

```
/ (workspace root)
├── client/          # React Frontend (Vite)
├── server/          # Node.js Backend (Express)
├── shared/          # Shared types and schemas
├── docs/            # Documentation
├── migrations/      # Database migrations
└── package.json     # Workspace configuration
```

## 🔧 Setup Instructions

### ✅ Prerequisites
- Node.js 20.x or later
- pnpm (recommended) or npm
- PostgreSQL database

### Database Setup (PostgreSQL)

1. **Install PostgreSQL** locally or use a cloud service
2. **Create a database** for the project
3. **Get your connection string** (e.g., `postgresql://user:pass@localhost:5432/taplive`)

### Backend Setup
```bash
cd server
pnpm install
```

### Configure Backend Environment Variables
Create `.env` file in the `/server` directory:

```bash
# Database
DATABASE_URL="your_postgresql_connection_string_here"

# Server
PORT=5000
NODE_ENV=development

# Optional: Authentication (if implemented)
# CLERK_SECRET_KEY="your_clerk_secret_key_here"
# CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key_here"

# Optional: Payments (if implemented)
# STRIPE_SECRET_KEY="your_stripe_secret_key_here"
```

Start backend:
```bash
pnpm run dev
```
Backend runs on:
➡ http://localhost:5000

### Frontend Setup
```bash
cd client
pnpm install
```

### Configure Frontend Environment Variables
Create `.env.local` file in the `/client` directory:

```bash
# API Base URL
VITE_API_BASE_URL="http://localhost:5000"

# Optional: Authentication
# VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key_here"

# Optional: Payments
# VITE_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key_here"
```

Start frontend:
```bash
pnpm run dev
```
Frontend runs on:
➡ http://localhost:5173

### Database Migration
```bash
# From workspace root
pnpm run db:push
```

## 📚 Documentation

- [01 Project Origin and Vision](./docs/01-project-origin-and-vision.md)
- [Streaming Test Guide](./docs/STREAMING_TEST_GUIDE.md)
- [WebSocket Architecture](./docs/WEBSOCKET_ARCHITECTURE.md)
- [Stripe Integration](./docs/STRIPE_INTEGRATION_EXPLAINED.md)

### 🏗️ Architecture Diagrams

- [Provider Architecture](./docs/architectureDiagram/provider%20architecture-diagram.png)
- [Workflow Step 1](./docs/architectureDiagram/Workflow-Step1.png)
- [Workflow Step 2](./docs/architectureDiagram/WorkFlow-Step2.png)
- [Workflow Step 3](./docs/architectureDiagram/WorkFlow-Step3.png)
- [Workflow Step 4](./docs/architectureDiagram/Workflow-Step4M.png)
- [Workflow Step 5](./docs/architectureDiagram/WorkFlow-Step5.png)
- [Workflow Step 6](./docs/architectureDiagram/WorkFLow-Step6.png)

### 📊 System Diagrams

- [Access Bypass Prevention](./docs/images/access-bypass-prevention.webp)
- [Payment Settlement Process](./docs/images/payment-settlement-process.webp)
- [Replay Viewer](./docs/images/replay-viewer.webp)
- [Risk Control SDK](./docs/images/risk-control-sdk.webp)
- [Webhook Response Flow](./docs/images/webhook-response-flow.png)
- [Webhook Retry Logic](./docs/images/webhook-retry-logic.webp)

---

## 🧭 Current Development Phase

**Phase 1: MVP Foundation** (2025 Q1)
- ✅ Core order management system
- ✅ WebRTC live streaming
- ✅ Responsive UI with internationalization
- 🚧 User authentication system
- 🚧 Payment integration

**Phase 2: Enhanced Features** (2025 Q2) - *Planned*
- 🤖 AI-powered features (new additions):
  - Map display with GIS + Weather + AI decision layer
  - AI Real-time Collaboration Summary & Credibility Report
  - AI Cross-Language Collaboration Mode
  - AI Risk & Weather Intelligent Recommendation System
- 🔍 Advanced matching algorithms
- 💰 Complete payment system

---

## 👥 Collaboration

We're looking for talented contributors worldwide:

- 🧑‍💻 **Full-stack developers** (React + Node.js)
- 🛰️ **WebRTC specialists** (real-time communication)
- 🤖 **AI/ML engineers** (for new AI features)
- 🎨 **UI/UX designers** (optional)
- 📊 **Product managers**

**Tech Focus:**
- WebRTC / Real-time systems
- AI integration
- Geolocation services
- Internationalization

👉 [Team Recruitment Guide](./05-team-recruitment.md)

---

## ⚖️ Legal & Compliance

TapLive does **not** issue or trade any tokens or assets.
Platform activities are **non-financial** only.
⚠️ This project should not be interpreted as financial advice or a financial product.

---

## 📞 Contact

- **GitHub Issues:** [Report bugs & request features](https://github.com/your-repo/issues)
- **Email:** taplive.team@outlook.com
- **Discord:** [Join our community](https://discord.gg/bJfcHpvwBw)
- **Telegram:** [Developer chat](https://t.me/taplive_global)

---

*TapLive is building the future of decentralized real-time collaboration. Join us in connecting people to real-world actions globally!* 🌍✨