# Getting Started — Setup

## Prerequisites
- Node.js 18+ and pnpm or npm
- Git

## Install & Run
```bash
pnpm i || npm i
pnpm dev || npm run dev
```

## Project Layout (public)
```
docs/      # user-facing docs
sdk/       # examples & samples
assets/    # images (no secrets)
```

## Environment Notes
Do not commit secrets. Use `.env.local` for local testing and never push it.
