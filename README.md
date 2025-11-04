# 🌍 TapLive — Real-time Human Collaboration Network

> “Connecting people to real-world actions through on-demand live collaboration.”

TapLive is a location-based livestream collaboration platform that allows users to place and respond to on-demand livestream tasks in real time, enabling trusted human presence anywhere in the world.

---

## 🪄 Why It Matters
- 🌐 Real-time, location-based human collaboration  
- 🔐 Trust layer with geolocation verification  
- 🤝 Open, modular developer ecosystem  
- ⚖️ Compliant: no token, no assetization

## 🚀 Tech Stack

- **Frontend:** Vite + React + TailwindCSS
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL (Neon DB)
- **Web3**
  - PYUSD (Sepolia Testnet)
  - Yellow Network API
  - Lighthouse decentralized storage

---

## 📦 Project Structure

/client → React Frontend
/server → Node.js Backend + Web3 APIs


## 🔧 Setup Instructions

### ✅ Clone the repository

```bash
git clone <your-repo-url>
cd <repo-folder>
```

### Backend Setup
```bash

cd server
npm install
```

### Configure Environment Variables
Create .env in root (see .env.example for reference)

Run migrations (if using Prisma)
```bash
npx prisma migrate deploy
```
Start server
```bash
npm run dev
```
Backend runs on:
➡ http://localhost:5000

### Frontend Setup
```bash
cd client
npm install
```
Create .env.local inside /client folder (see .env.example below)

Start frontend:

```bash
npm run dev
```
Frontend runs on:
➡ http://localhost:5173

## 📚 Documentation

- [00 Project Overview](./docs/00_project-overview.md)
- [01 Pitch Summary](./docs/01_pitch-summary.md)
- [02 Pitch](./docs/02_pitch.md)
- [03 MVP-architecture.md](./docs/03_mvp-architecture.md)
- [04 roadmap-phase-1-2.md](./docs/04_roadmap-phase-1-2.md)
- [05 Contribution Guide](./docs/05_contribution-guide.md)
- [06 Legal Notice](./docs/06_legal-notice.md)
- [07 Risk Control Basics](./docs/07_risk-control-basics.md)
- [08 Tech Stack](./docs/08_tech-stack.md)
- [09 API Draft](./docs/09_api-draft.md)
- [10 Workflow Diagram](./docs/10_workflow-diagram.md)

📘 [TapLive Project Pitch](https://www.notion.so/TapLive-Project-Pitch-289943c0201980249cafd292b7d904d8)  
🧭 [TapLive Roadmap Phase 1–2](https://www.notion.so/TapLive-Roadmap-Phase-1-2-289943c0201980f4a78aeb7cc191c17a)  
💬 [Telegram](https://t.me/taplive_global)  
🎧 [Discord](https://discord.gg/bJfcHpvwBw)

---

## 🧭 Roadmap (Public)
| Phase | Description                                    | Status          |
|------:|-----------------------------------------------|-----------------|
| 1     | MVP & on-demand live order system             | 🚧 In progress  |
| 2     | Trust layer & geo-verification mechanisms     | 🧭 Planned      |

👉 [🧭 View Roadmap](./docs/articles/roadmap-phase1-2.md)

---

## 👥 Collaboration
We’re currently looking for:
- 🧑‍💻 Backend / Full-stack developers
- 🛰️ WebRTC / real-time communication engineers
- 🧭 UI/UX designers (optional)
We welcome developers, designers, and contributors worldwide.

- Tech: WebRTC / Node.js / GraphQL
- Infra: Distributed LBS scheduling, Replay Viewer
- Contribution: Open modules, clear attribution

👉 [🤝 Collaboration Guide](./docs/developer/collaboration-guide.md)

---

## ⚖️ Legal & Compliance
TapLive does **not** issue or trade any tokens or assets.  
Platform credits are **non-financial activity markers** only.  
⚠️ This project should not be interpreted as financial advice or a financial product.

👉 [📜 Legal Notice](./LEGAL_NOTICE.md)

---

Development Plan:
##Development plan
 -Phase 1: File structure and project overview
 -Second phase: MVP code module and documentation updates
Final submission of integrated features

Earlier drafts only reflect conceptual discussions and do **not** include pre-built product code.
---

## Contact & Feedback

If you identify any security risks, have suggestions for improvements, or want to report an issue, please feel free to:
- Submit your feedback through our [GitHub Issues](https://github.com/taplivenetwork/taplive/issues)
- Or, send us an email at [taplive.team@outlook.com](mailto:taplive.team@outlook.com)

A limited live demo (Phase 1–2) is available upon request for reviewers and collaborators.
