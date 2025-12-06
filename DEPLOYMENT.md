# Deployment Guide

## Backend Deployment (Render)

1. Deploy your backend to Render
2. Note your backend URL (e.g., `https://your-app.onrender.com`)

## Frontend Deployment (Vercel)

### Environment Variables

Add these environment variables in your Vercel project settings:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_API_URL=https://your-backend.onrender.com
```

**Important:** `VITE_API_URL` should be your deployed backend URL from Render (without trailing slash).

### Build Settings

- **Framework Preset:** Vite
- **Root Directory:** `client`
- **Build Command:** `pnpm run build`
- **Output Directory:** `dist`
- **Install Command:** `pnpm install`

## Connection Issues

If you see "Failed to connect to the server":

1. ✅ Verify `VITE_API_URL` is set correctly in Vercel environment variables
2. ✅ Ensure your backend is running on Render
3. ✅ Check that your backend URL doesn't have a trailing slash
4. ✅ Redeploy the frontend after setting environment variables

## Testing

After deployment:
- Frontend should be at `https://your-app.vercel.app`
- Backend should be at `https://your-backend.onrender.com`
- Test API connection at `https://your-backend.onrender.com/healthz`
