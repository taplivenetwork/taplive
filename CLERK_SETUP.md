# Clerk Authentication Setup Guide

## ✅ Completed Implementation

All Clerk authentication has been successfully integrated into TapLive! Here's what was done:

### 1. **Packages Installed**
- `@clerk/clerk-react` - Frontend authentication
- `@clerk/backend` - Backend authentication & user management

### 2. **Frontend Setup**
- ✅ ClerkProvider wrapped around App
- ✅ User authentication UI (Sign In/Sign Up buttons)
- ✅ UserButton for authenticated users
- ✅ Replace dummy user ID with real Clerk user ID

### 3. **Backend Setup**
- ✅ Authentication middleware (`server/auth.ts`)
- ✅ Clerk webhook endpoint for user sync
- ✅ Database user sync on sign up

### 4. **Database Schema Updated**
- ✅ Users table now accepts Clerk user IDs (no auto-gen UUID)
- ✅ Password field set to 'clerk_managed' for Clerk users

---

## 🚀 Next Steps - Complete Your Setup

### Step 1: Create Clerk Account & Application

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application
4. Choose authentication methods:
   - ✅ Email/Password
   - ✅ Google OAuth (recommended)
   - ✅ GitHub OAuth (optional)
   - ✅ Email Magic Links (optional)

### Step 2: Get Your API Keys

From your Clerk Dashboard:

1. Go to **API Keys** section
2. Copy your keys:
   - `Publishable Key` (starts with `pk_test_` or `pk_live_`)
   - `Secret Key` (starts with `sk_test_` or `sk_live_`)

### Step 3: Update `.env` File

Replace the placeholder values in your `.env` file:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
CLERK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### Step 4: Set Up Clerk Webhook (User Sync)

This webhook automatically syncs Clerk users to your PostgreSQL database:

1. In Clerk Dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/webhooks/clerk
   ```
   For local development:
   ```
   http://localhost:5000/api/webhooks/clerk
   ```
   (Use ngrok for local testing: `ngrok http 5000`)

4. Subscribe to event: **user.created**
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Paste it in `.env` as `CLERK_WEBHOOK_SECRET`

### Step 5: Update Database Schema

Run the database migration to update the users table:

```bash
npm run db:push
```

This will:
- Remove auto-generated UUID from users table
- Allow Clerk user IDs to be used directly

### Step 6: Test Authentication Flow

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open the app: `http://localhost:5173`

3. Test the flow:
   - Click **Sign Up** → Create account
   - Check database: User should be synced
   - Click **Sign In** → Login works
   - User ID in app matches Clerk user ID
   - Provider accepts order → `providerId` is real Clerk ID

---

## 🔒 How Authentication Works

### **Frontend (Client)**
```tsx
// 1. User clicks "Sign In" button
<SignInButton mode="modal">
  <Button>Sign In</Button>
</SignInButton>

// 2. Clerk modal opens, user authenticates

// 3. Get current user anywhere in app
const { user, isLoaded } = useUser();
const userId = user?.id; // Real Clerk user ID

// 4. Include auth token in API requests
const token = await getToken();
headers: {
  Authorization: `Bearer ${token}`
}
```

### **Backend (Server)**
```typescript
// 1. Webhook receives user.created event
POST /api/webhooks/clerk
  → Clerk sends new user data
  → Sync user to PostgreSQL database

// 2. Protected routes verify JWT token
import { authenticateUser } from './auth';

app.post("/api/orders", authenticateUser, async (req, res) => {
  const userId = req.auth.userId; // Real Clerk user ID
  // Create order with authenticated user
});

// 3. Optional auth for public endpoints
app.get("/api/orders", optionalAuth, async (req, res) => {
  const userId = req.auth?.userId; // May be undefined
});
```

---

## 🎯 Updated Flow: Provider Accepts Order

**Before (Dummy User):**
```typescript
const CURRENT_USER_ID = "demo-user-1"; // ❌ Fake
```

**After (Real Clerk User):**
```typescript
const { user } = useUser();
const CURRENT_USER_ID = user?.id; // ✅ Real Clerk user ID

// When provider accepts order:
await api.orders.update(orderId, {
  status: 'accepted',
  providerId: CURRENT_USER_ID  // ✅ Real Clerk user ID saved
});
```

---

## 🛡️ Security Features

- ✅ **Secure JWT tokens** - Clerk handles token generation/validation
- ✅ **Password hashing** - Clerk manages all password security
- ✅ **Session management** - Automatic session refresh
- ✅ **OAuth providers** - Google, GitHub, etc.
- ✅ **Email verification** - Built-in email verification
- ✅ **Multi-factor auth** - Optional MFA support
- ✅ **Account recovery** - Password reset flows

---

## 🔧 Customization Options

### 1. **Customize Sign In/Up UI**
```tsx
<SignInButton mode="modal">
  <Button className="custom-class">
    Custom Sign In Button
  </Button>
</SignInButton>
```

### 2. **Redirect After Auth**
```tsx
<ClerkProvider 
  publishableKey={PUBLISHABLE_KEY}
  afterSignInUrl="/dashboard"
  afterSignUpUrl="/onboarding"
>
```

### 3. **Protect Specific Routes**
```typescript
import { authenticateUser } from './auth';

// Only authenticated users can access
app.post("/api/orders", authenticateUser, handler);
app.post("/api/ratings", authenticateUser, handler);
app.get("/api/earnings", authenticateUser, handler);
```

### 4. **Get User Details Anywhere**
```typescript
import { getClerkUser } from './auth';

const clerkUser = await getClerkUser(userId);
console.log(clerkUser.emailAddresses);
console.log(clerkUser.firstName);
console.log(clerkUser.imageUrl);
```

---

## 📝 Testing Checklist

- [ ] Sign up with email/password
- [ ] Check database - user synced automatically
- [ ] Sign out and sign back in
- [ ] Create order as customer (creatorId = Clerk user ID)
- [ ] Accept order as provider (providerId = Clerk user ID)
- [ ] Verify order shows correct user IDs in database
- [ ] Test notifications with real user IDs
- [ ] Test payment flow with authenticated users

---

## 🐛 Troubleshooting

### Issue: "Missing Clerk Publishable Key"
**Solution:** Add `VITE_CLERK_PUBLISHABLE_KEY` to `.env` file

### Issue: Webhook not receiving events
**Solution:** 
1. Check webhook URL is correct
2. Use ngrok for local testing
3. Verify `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard

### Issue: User not syncing to database
**Solution:**
1. Check webhook is subscribed to `user.created`
2. Check server logs for errors
3. Verify `DATABASE_URL` is correct

### Issue: "Unauthorized" errors
**Solution:**
1. Ensure token is sent in `Authorization` header
2. Check `CLERK_SECRET_KEY` is correct
3. Verify token hasn't expired

---

## 🎉 You're All Set!

Once you complete the setup steps above, you'll have:
- ✅ Secure authentication with Clerk
- ✅ Real user accounts (no more dummy users)
- ✅ Automatic user sync to database
- ✅ Protected API endpoints
- ✅ Beautiful auth UI (no custom forms needed)
- ✅ OAuth support (Google, GitHub, etc.)

**Need help?** Check Clerk's documentation: https://clerk.com/docs
