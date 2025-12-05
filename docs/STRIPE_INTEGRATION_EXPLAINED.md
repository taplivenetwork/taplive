# 🎓 Stripe Integration - Complete Beginner's Guide for TapLive

## 📚 Table of Contents
1. [What is Stripe?](#what-is-stripe)
2. [Basic Stripe Concepts](#basic-stripe-concepts)
3. [How TapLive Uses Stripe](#how-taplive-uses-stripe)
4. [Payment Flow Step-by-Step](#payment-flow-step-by-step)
5. [Code Walkthrough](#code-walkthrough)
6. [Key Components](#key-components)
7. [Troubleshooting](#troubleshooting)

---

## 🏦 What is Stripe?

**Stripe** is a payment processing platform that lets your app accept credit card payments, manage subscriptions, and handle money transfers - all without you having to deal with banks directly.

Think of Stripe as a **middleman** between:
- Your customer (who wants to pay)
- Your app (TapLive)
- The banks (who actually move the money)

### Why Stripe?
- ✅ **Secure**: Handles sensitive card data (you never touch credit card numbers)
- ✅ **Easy**: Provides APIs to create payments with just a few lines of code
- ✅ **Compliant**: Handles PCI compliance (security rules for payments)
- ✅ **Global**: Supports payments from 135+ countries

---

## 🔑 Basic Stripe Concepts

### 1. **Payment Intent** (Most Important!)
A Payment Intent is Stripe's way of representing **"a customer wants to pay you money"**.

```
Real Life Analogy:
Payment Intent = A written check that hasn't been cashed yet
- It shows the amount ($50)
- It shows who's paying (customer)
- It shows who's receiving (you)
- But the money hasn't moved yet!
```

**Payment Intent Lifecycle:**
```
1. Created       → "Check is written" (you create the intent)
2. Requires Action → "Customer needs to sign" (enter card details)
3. Processing    → "Bank is verifying" (Stripe processes the card)
4. Requires Capture → "Check is ready to cash" (money is held)
5. Succeeded     → "Money transferred!" (payment complete)
```

### 2. **Client Secret**
A secret code that Stripe gives you so the frontend can complete the payment.

```javascript
// It looks like this:
"pi_3ABC123_secret_DEF456"
```

Think of it as a **one-time password** - only the customer who created this payment can use it to pay.

### 3. **Capture Method**
How you want to charge the customer:

- **Automatic**: Money is charged immediately when card is verified
- **Manual** (what TapLive uses): Money is "held" on the card, you charge it later

```
Real Life Analogy:
Manual Capture = Hotel Authorization
- Hotel puts $200 hold on your card when you check in
- They only charge the actual amount when you check out
- If you cancel, they release the hold without charging you
```

**Why Manual?** In TapLive:
1. Customer pays → money is **held** (not charged yet)
2. Provider completes the live stream → money is **captured** (charged)
3. If provider cancels → money is **released** (refunded automatically)

### 4. **Webhook**
Stripe's way of telling your server "Hey, something happened!"

```
Example Webhook Flow:
Customer enters card → Stripe verifies → Stripe sends webhook to your server:
"Hey! Payment pi_123 succeeded!"
```

### 5. **Stripe Connect** (Advanced - for paying providers)
Allows you to pay money OUT to your providers (streamers).

```
Flow:
Customer pays $50 → You take $10 (20% fee) → Provider gets $40
```

---

## 🎯 How TapLive Uses Stripe

### Business Flow
```
1. Customer creates order: "Watch my live stream for $50"
2. Provider accepts order: "I'll do it!"
3. Customer pays: $50 held on their card (via Stripe)
4. Provider does live stream: Streams for 30 minutes
5. Stream ends: Money captured and split:
   - Provider gets: $40 (80%)
   - Platform (you) keeps: $10 (20%)
```

### Technical Setup
```typescript
// In server/routes.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});
```

**What this does:**
- Creates a connection to Stripe's servers
- Uses your secret API key (like a password) to authenticate
- Now you can create payments, refunds, etc.

---

## 📋 Payment Flow Step-by-Step

### Step 1: Customer Creates Payment
**Location:** `POST /api/orders/:orderId/payment`

```typescript
// Frontend sends:
{
  amount: 50,
  currency: "USD",
  paymentMethod: "stripe"
}
```

**Backend does:**
```typescript
// 1. Create Payment Intent on Stripe
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000, // $50 in cents (Stripe uses cents!)
  currency: "usd",
  capture_method: 'manual', // Don't charge yet, just hold
  metadata: {
    orderId: "order_123",
    payerId: "customer_xyz"
  }
});

// 2. Save to database
await storage.createPayment({
  orderId: "order_123",
  amount: "50",
  externalPaymentId: paymentIntent.id, // "pi_ABC123..."
  paymentMethod: "stripe",
  status: "pending"
});

// 3. Send back client secret to frontend
return {
  clientSecret: paymentIntent.client_secret // Frontend needs this!
}
```

**What happens on Stripe's side:**
- Stripe creates a record: "Someone wants to pay $50"
- Generates a client secret
- Returns PaymentIntent ID: `pi_ABC123...`
- Status is now: `requires_payment_method` (waiting for card)

### Step 2: Customer Enters Card Details
**Location:** Frontend (client/src/pages/payment.tsx)

```typescript
// Using Stripe Elements (a React component)
const { stripe, elements } = useStripe();

// When customer clicks "Pay"
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement, // Card number, expiry, CVV
    billing_details: {
      name: customerName
    }
  }
});

// Result can be:
if (result.error) {
  // Card declined or invalid
  console.error(result.error.message);
} else if (result.paymentIntent.status === 'requires_capture') {
  // SUCCESS! Money is held on card
  console.log("Payment authorized!");
}
```

**What happens:**
1. Stripe encrypts card details (you never see them)
2. Stripe contacts the bank: "Can this card pay $50?"
3. Bank responds: "Yes, putting $50 hold on card"
4. PaymentIntent status → `requires_capture`
5. Money is **HELD** but not **CHARGED** yet

### Step 3: Confirm Payment in Database
**Location:** `POST /api/payments/:paymentIntentId/confirm`

```typescript
// Frontend calls this after successful card authorization
await fetch(`/api/payments/${paymentIntent.id}/confirm`, {
  method: 'POST',
  body: JSON.stringify({
    status: 'requires_capture',
    orderId: 'order_123'
  })
});

// Backend updates database:
await storage.updatePayment(paymentId, {
  status: 'completed', // Mark as completed
  paymentMetadata: JSON.stringify({
    stripeStatus: 'requires_capture',
    authorizedAt: new Date(),
    requiresCapture: true // Money held, waiting to be captured
  })
});

// Update order
await storage.updateOrder(orderId, {
  isPaid: true // Customer has paid!
});
```

**Database state now:**
```
Order: isPaid = true
Payment: status = 'completed', externalPaymentId = 'pi_ABC123'
Stripe: PaymentIntent status = 'requires_capture'
Customer's Card: $50 held (not charged)
```

### Step 4: Provider Completes Stream
**Location:** WebSocket `end-stream` event

When provider clicks "End Stream", WebSocket sends event:

```typescript
// In WebSocket handler (server/routes.ts)
ws.on('message', async (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'end-stream') {
    const orderId = message.orderId;
    
    // 1. Get the payment for this order
    const payments = await storage.getPaymentsByOrder(orderId);
    const payment = payments.find(p => p.status === 'completed');
    
    if (payment && payment.externalPaymentId) {
      // 2. CAPTURE the payment on Stripe (charge the card!)
      const paymentIntent = await stripe.paymentIntents.capture(
        payment.externalPaymentId
      );
      
      console.log(`💰 Captured $${payment.amount} for order ${orderId}`);
      
      // 3. Calculate commission (platform fee)
      const commission = calculateCommission(parseFloat(payment.amount));
      // Result: { totalAmount: 50, platformFee: 10, providerEarnings: 40 }
      
      // 4. Pay provider (via Stripe Connect)
      const provider = await storage.getUser(order.providerId);
      
      if (provider.stripeConnectedAccountId) {
        // Transfer money to provider's Stripe account
        const transfer = await stripe.transfers.create({
          amount: 4000, // $40 in cents (provider's share)
          currency: 'usd',
          destination: provider.stripeConnectedAccountId,
          metadata: {
            orderId: orderId,
            providerId: provider.id
          }
        });
        
        console.log(`✅ Paid provider ${provider.username} $40`);
      }
    }
  }
});
```

**What happens:**
1. **Capture**: Stripe charges the customer's card ($50)
2. **Commission**: Calculate split (80/20)
3. **Transfer**: Send provider their share ($40)
4. **Platform keeps**: $10 (20% commission)

### Step 5: Webhooks (Background Updates)
**Location:** `POST /api/webhooks/stripe`

Stripe sends webhooks to keep your database in sync:

```typescript
app.post("/api/webhooks/stripe", async (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Payment was successful
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      
      // Update your database
      await storage.updatePayment(paymentId, {
        status: 'completed',
        paymentGatewayResponse: JSON.stringify({
          webhookReceived: true,
          receivedAt: new Date()
        })
      });
      break;
      
    case 'payment_intent.payment_failed':
      // Payment failed
      await storage.updatePayment(paymentId, {
        status: 'failed',
        failureReason: 'Card declined'
      });
      break;
  }
});
```

**Why webhooks?**
- Sometimes customer closes browser before payment completes
- Webhook ensures your database stays up-to-date
- Backup mechanism if frontend confirmation fails

---

## 💻 Code Walkthrough

### File Structure
```
server/
├── routes.ts                 # All payment endpoints
├── storage.ts               # Database operations
└── auth.ts                  # User authentication

shared/
└── payment.ts               # Commission calculations

client/src/
└── pages/payment.tsx        # Payment form UI
```

### Key Endpoints

#### 1. Create Payment (`POST /api/orders/:orderId/payment`)
```typescript
// INPUT: Order ID + payment details
// OUTPUT: Client secret for frontend

const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(paymentData.amount * 100), // Dollars → cents
  currency: 'usd',
  capture_method: 'manual', // IMPORTANT: Hold money, don't charge
  metadata: { orderId, payerId }
});

return {
  clientSecret: paymentIntent.client_secret
};
```

**Why `Math.round(amount * 100)`?**
Stripe works in cents (smallest currency unit):
- $50.00 → 5000 cents
- $12.99 → 1299 cents
- Avoids decimal issues (computers hate decimals!)

#### 2. Confirm Payment (`POST /api/payments/:id/confirm`)
```typescript
// Called after customer authorizes card
// Updates database to mark order as paid

await storage.updatePayment(paymentId, {
  status: 'completed'
});

await storage.updateOrder(orderId, {
  isPaid: true
});
```

#### 3. Capture Payment (WebSocket `end-stream`)
```typescript
// Called when provider ends stream
// Actually charges the customer's card

const paymentIntent = await stripe.paymentIntents.capture(
  payment.externalPaymentId
);

// Money moves from customer → Stripe → Provider
```

### Database Schema

**payments table:**
```typescript
{
  id: string,                    // "pmt_123"
  orderId: string,              // Links to order
  payerId: string,              // Who's paying
  amount: string,               // "50.00"
  currency: string,             // "USD"
  paymentMethod: string,        // "stripe"
  status: string,               // "pending" | "completed" | "failed"
  externalPaymentId: string,    // Stripe's ID: "pi_ABC123..."
  paymentMetadata: string,      // JSON: { clientSecret, stripeStatus }
  paymentGatewayResponse: string, // JSON: Stripe's full response
  createdAt: Date,
  updatedAt: Date
}
```

**Key fields:**
- `externalPaymentId`: Stripe's PaymentIntent ID (starts with `pi_`)
- `paymentMetadata`: Frontend needs this for `clientSecret`
- `status`: Your app's payment status (might differ from Stripe's)

---

## 🔧 Key Components

### 1. Commission Calculation (`shared/payment.ts`)
```typescript
export function calculateCommission(
  totalAmount: number, 
  platformFeePercentage: number = 20
) {
  const platformFee = (totalAmount * platformFeePercentage) / 100;
  const providerEarnings = totalAmount - platformFee;
  
  return {
    totalAmount: 50,
    platformFee: 10,        // 20% of 50
    providerEarnings: 40    // 80% of 50
  };
}
```

### 2. Payment Methods Config
```typescript
export const PAYMENT_METHODS = {
  STRIPE: {
    name: 'Stripe',
    type: 'fiat',          // Fiat = regular currency (USD, EUR)
    currencies: ['USD'],
    icon: '💳',
    description: 'Credit/Debit Card'
  },
  USDT_TRC20: {
    name: 'USDT (TRC20)',
    type: 'crypto',        // Cryptocurrency
    currencies: ['USDT'],
    icon: '₮'
  }
  // ... more payment methods
};
```

### 3. Environment Variables
```bash
# .env file
STRIPE_SECRET_KEY=sk_test_ABC123...           # Backend API key
STRIPE_PUBLISHABLE_KEY=pk_test_XYZ789...      # Frontend API key
STRIPE_WEBHOOK_SECRET=whsec_DEF456...         # Webhook signature
```

**What each key does:**
- `STRIPE_SECRET_KEY`: Backend uses this to create payments (NEVER share this!)
- `STRIPE_PUBLISHABLE_KEY`: Frontend uses this (safe to expose)
- `STRIPE_WEBHOOK_SECRET`: Verifies webhook came from Stripe (security)

---

## 🐛 Troubleshooting

### Issue 1: "Payment Intent requires capture"
**Meaning:** Money is held on card, waiting to be charged.

**Solution:** This is correct! Call `stripe.paymentIntents.capture()` when stream ends.

### Issue 2: "Invalid API Key"
**Meaning:** Wrong `STRIPE_SECRET_KEY` or missing from `.env`.

**Solution:**
```bash
# Check .env file
STRIPE_SECRET_KEY=sk_test_...  # Must start with sk_test_ or sk_live_
```

### Issue 3: "Amount must be integer"
**Meaning:** Sent `50` instead of `5000` (cents).

**Solution:**
```typescript
// WRONG:
amount: 50

// CORRECT:
amount: Math.round(50 * 100) // = 5000 cents
```

### Issue 4: "Cannot capture already captured payment"
**Meaning:** Trying to capture payment twice.

**Solution:** Check payment status first:
```typescript
const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

if (paymentIntent.status === 'requires_capture') {
  await stripe.paymentIntents.capture(paymentId);
} else {
  console.log(`Already captured: ${paymentIntent.status}`);
}
```

---

## 📊 Complete Payment Flow Diagram

```
┌─────────────┐
│  Customer   │
│ Creates     │
│  Order      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /api/orders/:id/payment        │
│ ────────────────────────────────    │
│ 1. Create Stripe PaymentIntent      │
│    → amount: 5000 (cents)           │
│    → capture_method: 'manual'       │
│ 2. Save to database                 │
│ 3. Return clientSecret              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend: Customer Enters Card     │
│ ────────────────────────────────    │
│ stripe.confirmCardPayment()         │
│ → Stripe verifies card              │
│ → Bank puts $50 hold on card        │
│ → Status: requires_capture          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ POST /api/payments/:id/confirm      │
│ ────────────────────────────────    │
│ Update database:                    │
│ → payment.status = 'completed'      │
│ → order.isPaid = true               │
└──────┬──────────────────────────────┘
       │
       ▼
   ⏰ Wait for stream...
       │
       ▼
┌─────────────────────────────────────┐
│  Provider Ends Stream (WebSocket)   │
│ ────────────────────────────────    │
│ 1. Capture payment:                 │
│    stripe.paymentIntents.capture()  │
│    → Charge customer's card $50     │
│                                     │
│ 2. Calculate commission:            │
│    → Platform: $10 (20%)            │
│    → Provider: $40 (80%)            │
│                                     │
│ 3. Transfer to provider:            │
│    stripe.transfers.create()        │
│    → Send $40 to provider           │
└─────────────────────────────────────┘
```

---

## 🎓 Summary

### What You Learned:
1. **Payment Intent**: Stripe's way of saying "someone wants to pay"
2. **Client Secret**: Password for frontend to complete payment
3. **Manual Capture**: Hold money first, charge later
4. **Webhooks**: Stripe's way of telling you what happened
5. **Commission**: Platform keeps 20%, provider gets 80%

### Payment States:
```
pending → requires_payment_method → processing → 
requires_capture → succeeded
```

### Key Operations:
1. **Create**: `stripe.paymentIntents.create()` - Start payment
2. **Confirm**: `stripe.confirmCardPayment()` - Customer pays
3. **Capture**: `stripe.paymentIntents.capture()` - Charge card
4. **Transfer**: `stripe.transfers.create()` - Pay provider

### Remember:
- ✅ Always work in **cents**, not dollars
- ✅ Use **manual capture** for escrow-like payments
- ✅ Store **externalPaymentId** to reference Stripe payment
- ✅ Listen to **webhooks** for reliability
- ✅ Never expose **secret key** to frontend

---

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Payment Intents Guide](https://stripe.com/docs/payments/payment-intents)
- [Stripe Connect (Payouts)](https://stripe.com/docs/connect)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

---

**Last Updated:** December 5, 2025
**TapLive Version:** 1.0.0
