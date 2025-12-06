# 📚 TapLive API Documentation

**Version:** 1.0.0  
**Last Updated:** December 6, 2025  
**Base URL:** `http://localhost:5000` (Development)

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Order Management](#order-management)
4. [Notifications](#notifications)
5. [Ratings & Reviews](#ratings--reviews)
6. [Payment System](#payment-system)
7. [Stripe Connect](#stripe-connect)
8. [Smart Dispatch](#smart-dispatch)
9. [Streams & Broadcasting](#streams--broadcasting)
10. [Earnings & Transactions](#earnings--transactions)
11. [Safety & Geo-fencing](#safety--geo-fencing)
12. [WebSocket API](#websocket-api)

---

## 🔐 Authentication

### Webhooks

#### Clerk User Sync Webhook
```
POST /api/webhooks/clerk
```

**Purpose:** Automatically sync new users from Clerk authentication service to TapLive database.

**Headers:**
```json
{
  "svix-id": "string",
  "svix-timestamp": "string",
  "svix-signature": "string"
}
```

**Request Body:**
```json
{
  "type": "user.created",
  "data": {
    "id": "user_2abc123...",
    "email_addresses": [...],
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "image_url": "https://..."
  }
}
```

**Response:**
```json
{
  "success": true
}
```

**Use Case:** When a user signs up via Clerk, this webhook creates their profile in TapLive's database with initial settings.

---

### Manual User Sync
```
POST /api/users/sync
```

**Purpose:** Manually sync a Clerk user to the database (used for testing or manual migration).

**Request Body:**
```json
{
  "id": "user_2abc123...",
  "username": "johndoe",
  "email": "john@example.com",
  "name": "John Doe",
  "avatar": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "User synced successfully",
  "data": {
    "id": "user_2abc123...",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "role": "customer",
    "createdAt": "2025-12-06T10:00:00Z"
  }
}
```

---

## 👤 User Management

### Get User by ID
```
GET /api/users/:id
```

**Purpose:** Retrieve user profile information including ratings, earnings, and activity stats.

**Parameters:**
- `id` (path) - User's Clerk ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_2abc123...",
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "role": "provider",
    "trustScore": "4.8",
    "totalOrders": 45,
    "completedOrders": 42,
    "totalEarnings": "1250.50",
    "availability": true,
    "currentLatitude": 37.7749,
    "currentLongitude": -122.4194,
    "networkSpeed": 50.5,
    "devicePerformance": 85,
    "dispatchScore": "87.5",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

**Use Case:** Display user profiles, check provider availability, show earnings on dashboard.

---

### Update User Profile
```
PATCH /api/users/:id
```

**Purpose:** Update user profile information, settings, and preferences.

**Parameters:**
- `id` (path) - User's Clerk ID

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "avatar": "https://new-avatar.jpg",
  "bio": "Professional live streamer",
  "availability": true,
  "currentLatitude": 37.7749,
  "currentLongitude": -122.4194
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Updated user object */ },
  "message": "Profile updated successfully"
}
```

**Use Case:** Users update their profile, providers toggle availability, location updates.

---

### Update User Location
```
POST /api/users/:id/location
```

**Purpose:** Update user's GPS coordinates for dispatch algorithm and nearby order matching.

**Request Body:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "dispatchScore": "87.5"
  },
  "message": "Location updated successfully"
}
```

**Use Case:** Real-time location tracking for providers, finding nearby orders, dispatch optimization.

---

### Update Network Metrics
```
POST /api/users/:id/network-metrics
```

**Purpose:** Update provider's internet speed and device performance for quality-based dispatch.

**Request Body:**
```json
{
  "networkSpeed": 50.5,
  "devicePerformance": 85
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "networkSpeed": 50.5,
    "devicePerformance": 85,
    "dispatchScore": "87.5"
  },
  "message": "Network metrics updated successfully"
}
```

**Use Case:** Prioritize providers with better internet/devices for higher quality streams.

---

### Toggle User Availability
```
POST /api/users/:id/availability
```

**Purpose:** Providers can toggle their availability to receive new order notifications.

**Request Body:**
```json
{
  "availability": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "availability": true,
    "lastActive": "2025-12-06T10:00:00Z"
  },
  "message": "User availability set to available"
}
```

**Use Case:** Go online/offline to receive orders, pause notifications during breaks.

---

## 📋 Order Management

### Get All Orders
```
GET /api/orders
```

**Purpose:** Retrieve all orders with optional filtering by status, location, and radius.

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `accepted`, `live`, `done`, `cancelled`, `disputed`
- `latitude` (optional) - Center latitude for location-based search
- `longitude` (optional) - Center longitude for location-based search
- `radius` (optional) - Search radius in kilometers (default: 10km)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order_abc123",
      "title": "Live Stream at Golden Gate Park",
      "description": "Need someone to stream my proposal",
      "type": "live",
      "price": "50.00",
      "currency": "USD",
      "status": "pending",
      "scheduledAt": "2025-12-10T15:00:00Z",
      "duration": 30,
      "location": "Golden Gate Park, SF",
      "latitude": 37.7694,
      "longitude": -122.4862,
      "creatorId": "user_customer123",
      "providerId": null,
      "isPaid": false,
      "createdAt": "2025-12-06T10:00:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "timestamp": "2025-12-06T10:00:00Z"
  }
}
```

**Use Case:** Display available orders on home page, show provider's accepted orders, filter by location.

---

### Get Order by ID
```
GET /api/orders/:id
```

**Purpose:** Retrieve detailed information about a specific order.

**Parameters:**
- `id` (path) - Order ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_abc123",
    "title": "Live Stream at Golden Gate Park",
    "description": "Need someone to stream my proposal",
    "type": "live",
    "price": "50.00",
    "currency": "USD",
    "status": "accepted",
    "scheduledAt": "2025-12-10T15:00:00Z",
    "duration": 30,
    "location": "Golden Gate Park, SF",
    "latitude": 37.7694,
    "longitude": -122.4862,
    "creatorId": "user_customer123",
    "providerId": "user_provider456",
    "isPaid": true,
    "paymentMethod": "stripe",
    "createdAt": "2025-12-06T10:00:00Z",
    "updatedAt": "2025-12-06T11:00:00Z"
  }
}
```

**Use Case:** Show order details page, check order status before streaming, payment verification.

---

### Create New Order
```
POST /api/orders
```

**Purpose:** Customer creates a new live stream order with location, price, and schedule.

**Request Body:**
```json
{
  "title": "Live Stream at Golden Gate Park",
  "description": "Need someone to stream my proposal. Should be romantic and professional.",
  "type": "live",
  "price": 50.00,
  "currency": "USD",
  "scheduledAt": "2025-12-10T15:00:00Z",
  "duration": 30,
  "location": "Golden Gate Park, SF",
  "latitude": 37.7694,
  "longitude": -122.4862,
  "creatorId": "user_customer123",
  "paymentMethod": "stripe",
  "specialRequirements": "Need good camera quality"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_abc123",
    "title": "Live Stream at Golden Gate Park",
    /* ...complete order object */
  },
  "message": "Order created successfully"
}
```

**Use Case:** Customer books a live stream service, smart dispatch notifies nearby providers.

---

### Update Order Status
```
PATCH /api/orders/:id
```

**Purpose:** Update order status, accept by provider, mark as live, or complete.

**Parameters:**
- `id` (path) - Order ID

**Request Body:**
```json
{
  "status": "accepted",
  "providerId": "user_provider456"
}
```

**Possible Status Values:**
- `pending` → Provider hasn't accepted yet
- `accepted` → Provider accepted, not started
- `live` → Stream is currently broadcasting
- `done` → Stream completed successfully
- `cancelled` → Order was cancelled
- `disputed` → Customer raised a dispute

**Response:**
```json
{
  "success": true,
  "data": { /* Updated order */ },
  "message": "Order accepted! Payment will be released when broadcast ends."
}
```

**Use Case:** Provider accepts order, system updates to "live" when stream starts, auto-completes when stream ends.

---

### Provider Cancel Order
```
POST /api/orders/:id/cancel-by-provider
```

**Purpose:** Provider cancels an accepted order (with rating penalty).

**Parameters:**
- `id` (path) - Order ID

**Response:**
```json
{
  "success": true,
  "data": { /* Cancelled order */ },
  "message": "Order cancelled successfully. Your rating has been reduced as a penalty."
}
```

**Use Case:** Provider can't fulfill order, emergency cancellation, penalty applied to trust score.

---

### Customer Cancel Order
```
POST /api/orders/:id/cancel
```
**Auth Required:** ✅ Bearer Token

**Purpose:** Customer cancels order with automatic refund calculation based on cancellation timing.

**Parameters:**
- `id` (path) - Order ID

**Cancellation Penalties:**
- **Before Provider Accepts:** 0% penalty (full refund)
- **After Provider Accepts:** 20% penalty
- **During Live Stream:** 50% penalty

**Response:**
```json
{
  "success": true,
  "data": { /* Cancelled order */ },
  "refundAmount": 40.00,
  "penaltyAmount": 10.00,
  "penaltyPercent": 20,
  "message": "Order cancelled. Refund: $40.00 (20% cancellation fee: $10.00)"
}
```

**Use Case:** Customer changes plans, automatic Stripe refund processed, provider compensated if already accepted.

---

### Submit Order for Approval
```
POST /api/orders/:id/submit-for-approval
```

**Purpose:** Provider marks order as completed and requests customer approval.

**Request Body:**
```json
{
  "providerId": "user_provider456",
  "deliveryNote": "Stream completed successfully! Hope you loved the proposal coverage!"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Order with status: awaiting_approval */ },
  "message": "Order submitted for customer approval"
}
```

**Use Case:** Provider finishes stream, awaits customer confirmation before payment release (currently not used - auto-completes on stream end).

---

### Customer Dispute Order
```
POST /api/orders/:id/dispute
```

**Purpose:** Customer raises a dispute if unsatisfied with service quality.

**Request Body:**
```json
{
  "disputeType": "quality_issue",
  "title": "Poor video quality and connection issues",
  "description": "The stream kept disconnecting and video quality was very low. Not what I paid for.",
  "evidence": ["url-to-screenshot-1.jpg", "url-to-video-proof.mp4"]
}
```

**Dispute Types:**
- `quality_issue` - Poor stream quality
- `service_not_delivered` - Provider didn't show up
- `incorrect_service` - Service didn't match description
- `other` - Other issues

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dispute_xyz789",
    "orderId": "order_abc123",
    "customerId": "user_customer123",
    "providerId": "user_provider456",
    "disputeType": "quality_issue",
    "status": "pending",
    /* ...dispute details */
  },
  "message": "Dispute submitted successfully. Our team will review it shortly."
}
```

**Use Case:** Quality issues, no-shows, payment holds during dispute resolution.

---

### Delete Order (Actually Cancels)
```
DELETE /api/orders/:id
```

**Purpose:** Soft delete - marks order as cancelled instead of removing from database.

**Parameters:**
- `id` (path) - Order ID

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

**Use Case:** Admin cleanup, testing, or cancelling unwanted pending orders.

---

## 🔔 Notifications

### Get User Notifications
```
GET /api/users/:userId/notifications
```

**Purpose:** Retrieve all notifications for a user (order updates, payments, system alerts).

**Parameters:**
- `userId` (path) - User's Clerk ID

**Query Parameters:**
- `unreadOnly` (optional) - `true` to get only unread notifications

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "userId": "user_provider456",
      "type": "new_order",
      "title": "New Order Available! 📍",
      "message": "Live Stream at Golden Gate Park - $50.00",
      "orderId": "order_abc123",
      "isRead": false,
      "createdAt": "2025-12-06T10:00:00Z",
      "metadata": "{\"orderId\":\"order_abc123\",\"price\":50}"
    },
    {
      "id": "notif_124",
      "userId": "user_provider456",
      "type": "payment_received",
      "title": "Payment Received! 💰",
      "message": "You earned $40.00 for completing 'Live Stream at Golden Gate Park'",
      "isRead": true,
      "createdAt": "2025-12-06T15:00:00Z"
    }
  ]
}
```

**Notification Types:**
- `new_order` - Smart dispatch notifies provider of matching order
- `order_accepted` - Customer notified provider accepted
- `order_cancelled` - Order cancellation notification
- `payment_received` - Provider receives earnings
- `system_alert` - Important system messages
- `rating_received` - New rating from customer

**Use Case:** Bell icon notification center, real-time order alerts, payment confirmations.

---

### Get Order Dispatch Notifications
```
GET /api/users/:userId/notifications/orders
```

**Purpose:** Get active order dispatch notifications for providers (smart dispatch alerts).

**Parameters:**
- `userId` (path) - Provider's Clerk ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_125",
      "type": "new_order",
      "title": "New Order Available! 📍",
      "message": "Live Stream at Golden Gate Park - $50.00",
      "orderId": "order_abc123",
      "isRead": false,
      "createdAt": "2025-12-06T10:00:00Z",
      "metadata": "{\"distance\":2.5,\"dispatchScore\":87.5}"
    }
  ]
}
```

**Use Case:** Provider's order notification tray, shows nearby pending orders with distance/score.

---

### Mark Notification as Read
```
PATCH /api/notifications/:id/read
```

**Purpose:** Mark a single notification as read when user views it.

**Parameters:**
- `id` (path) - Notification ID

**Response:**
```json
{
  "success": true,
  "data": { /* Updated notification with isRead: true */ }
}
```

**Use Case:** User clicks notification, auto-mark as read, clear unread badge.

---

### Mark All Notifications as Read
```
POST /api/users/:userId/notifications/read-all
```

**Purpose:** Mark all user's notifications as read at once.

**Parameters:**
- `userId` (path) - User's Clerk ID

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

**Use Case:** "Mark all as read" button, clear notification counter.

---

## ⭐ Ratings & Reviews

### Create Rating
```
POST /api/ratings
```

**Purpose:** Customer rates provider after order completion, or provider rates customer.

**Request Body:**
```json
{
  "orderId": "order_abc123",
  "reviewerId": "user_customer123",
  "revieweeId": "user_provider456",
  "reviewType": "customer_to_provider",
  "rating": 5,
  "comment": "Amazing service! Very professional and great camera work.",
  "qualityRating": 5,
  "punctualityRating": 5,
  "communicationRating": 5
}
```

**Review Types:**
- `customer_to_provider` - Customer reviews provider
- `provider_to_customer` - Provider reviews customer

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rating_xyz789",
    "orderId": "order_abc123",
    "reviewerId": "user_customer123",
    "revieweeId": "user_provider456",
    "rating": 5,
    "comment": "Amazing service! Very professional and great camera work.",
    /* ...rating details */
  },
  "message": "Rating created successfully"
}
```

**Use Case:** Post-order feedback, build trust scores, improve provider rankings.

---

### Get Order Ratings
```
GET /api/orders/:id/ratings
```

**Purpose:** Get all ratings for a specific order (customer + provider reviews).

**Parameters:**
- `id` (path) - Order ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rating_xyz789",
      "orderId": "order_abc123",
      "reviewType": "customer_to_provider",
      "rating": 5,
      "comment": "Amazing service!",
      /* ...rating details */
    }
  ]
}
```

**Use Case:** Show ratings on order details page, mutual feedback system.

---

### Get User Ratings
```
GET /api/users/:id/ratings
```

**Purpose:** Get all ratings received by a user (provider's reviews from customers).

**Parameters:**
- `id` (path) - User ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "rating": 5,
      "comment": "Amazing service!",
      "createdAt": "2025-12-06T16:00:00Z"
    },
    {
      "rating": 4,
      "comment": "Good quality, slight delay",
      "createdAt": "2025-12-05T14:00:00Z"
    }
  ]
}
```

**Use Case:** Display on provider profile, calculate average rating, trust score algorithm.

---

### Recalculate User Stats
```
POST /api/users/:id/recalculate-stats
```

**Purpose:** Admin endpoint to recalculate user's trust score, total orders, earnings (debugging).

**Parameters:**
- `id` (path) - User ID

**Response:**
```json
{
  "success": true,
  "message": "User stats recalculated successfully"
}
```

**Use Case:** Fix incorrect stats, admin dashboard, data migrations.

---

## 💳 Payment System

### Get Payment Methods
```
GET /api/payment/methods
```

**Purpose:** Get list of available payment methods (Stripe, PayPal, Crypto).

**Response:**
```json
{
  "success": true,
  "data": {
    "STRIPE": {
      "name": "Stripe",
      "type": "fiat",
      "currencies": ["USD"],
      "icon": "💳",
      "description": "Credit/Debit Card"
    },
    "USDT_TRC20": {
      "name": "USDT (TRC20)",
      "type": "crypto",
      "currencies": ["USDT"],
      "icon": "₮",
      "description": "Tether (TRON Network)"
    }
  },
  "message": "Available payment methods"
}
```

**Use Case:** Show payment options on checkout page, filter by type (fiat/crypto).

---

### Create Payment for Order
```
POST /api/orders/:id/payment
```

**Purpose:** Create a Stripe PaymentIntent to authorize payment (holds money, doesn't charge yet).

**Parameters:**
- `id` (path) - Order ID

**Request Body:**
```json
{
  "payerId": "user_customer123",
  "amount": 50.00,
  "currency": "USD",
  "paymentMethod": "stripe",
  "paymentMetadata": {
    "customerNote": "Please be on time!"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pmt_abc123",
      "orderId": "order_abc123",
      "payerId": "user_customer123",
      "amount": "50.00",
      "currency": "USD",
      "paymentMethod": "stripe",
      "status": "pending",
      "externalPaymentId": "pi_3ABC123...",
      "createdAt": "2025-12-06T10:00:00Z"
    },
    "clientSecret": "pi_3ABC123_secret_DEF456"
  },
  "message": "Payment created successfully"
}
```

**Use Case:** Customer initiates payment, frontend uses clientSecret with Stripe Elements to collect card.

---

### Complete Payment (Webhook Simulation)
```
POST /api/payments/:id/complete
```

**Purpose:** Mark payment as completed (for testing, real completion via Stripe webhook).

**Parameters:**
- `id` (path) - Payment ID

**Request Body:**
```json
{
  "externalPaymentId": "pi_3ABC123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment": { /* Completed payment */ },
    "payout": { /* Auto-generated payout */ },
    "commission": {
      "totalAmount": 50,
      "platformFee": 10,
      "providerEarnings": 40,
      "platformFeePercentage": 20
    }
  },
  "message": "Payment completed and payout processed"
}
```

**Use Case:** Testing payment flows, webhook simulation in development.

---

### Get Payment Status
```
GET /api/payments/:id
```

**Purpose:** Check current status of a payment.

**Parameters:**
- `id` (path) - Payment ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pmt_abc123",
    "status": "completed",
    "amount": "50.00",
    "currency": "USD",
    "externalPaymentId": "pi_3ABC123...",
    /* ...payment details */
  },
  "message": "Payment retrieved successfully"
}
```

**Use Case:** Check if payment went through, display payment history.

---

### Confirm Payment Status
```
POST /api/payments/:paymentIntentId/confirm
```

**Purpose:** Frontend confirms Stripe payment succeeded (after customer enters card).

**Parameters:**
- `paymentIntentId` (path) - Stripe PaymentIntent ID

**Request Body:**
```json
{
  "status": "requires_capture",
  "orderId": "order_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully"
}
```

**Use Case:** After Stripe.confirmCardPayment() succeeds, notify backend to mark order as paid.

---

### Get Order Payment Status
```
GET /api/orders/:id/payment-status
```

**Purpose:** Check if order is paid and get payment details.

**Parameters:**
- `id` (path) - Order ID

**Response:**
```json
{
  "success": true,
  "data": {
    "isPaid": true,
    "payments": [
      {
        "id": "pmt_abc123",
        "amount": "50.00",
        "status": "completed",
        "paymentMethod": "stripe",
        "createdAt": "2025-12-06T10:00:00Z"
      }
    ]
  },
  "message": "Order is paid"
}
```

**Use Case:** Verify payment before allowing stream start, show payment receipt.

---

### Stripe Webhook Handler
```
POST /api/webhooks/stripe
```

**Purpose:** Receive Stripe webhook events (payment success, failure, etc.).

**Headers:**
```
stripe-signature: string (webhook signature)
```

**Request Body (Example):**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3ABC123...",
      "amount": 5000,
      "currency": "usd",
      "metadata": {
        "orderId": "order_abc123"
      }
    }
  }
}
```

**Response:**
```json
{
  "received": true
}
```

**Webhook Events Handled:**
- `payment_intent.succeeded` - Payment authorized successfully
- `payment_intent.payment_failed` - Payment failed (card declined)

**Use Case:** Stripe sends real-time payment updates, keeps database in sync.

---

### Calculate Commission Preview
```
GET /api/payment/commission/:amount
```

**Purpose:** Preview commission split before payment.

**Parameters:**
- `amount` (path) - Total payment amount
- `platformFee` (query, optional) - Platform fee percentage (default: 20%)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAmount": 50,
    "platformFee": 10,
    "providerEarnings": 40,
    "platformFeePercentage": 20
  }
}
```

**Use Case:** Show earnings breakdown to provider, customer sees service fee.

---

## 💰 Stripe Connect (Provider Payouts)

### Get Stripe Connect Status
```
GET /api/stripe/connect/status/:userId
```

**Purpose:** Check if provider has connected Stripe account for payouts.

**Parameters:**
- `userId` (path) - Provider's User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "accountId": "acct_ABC123...",
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "detailsSubmitted": true,
    "needsOnboarding": false
  }
}
```

**Use Case:** Check if provider can receive payouts, prompt to connect if not.

---

### Create Stripe Connect Onboarding Link
```
POST /api/stripe/connect/create-account-link
```

**Purpose:** Generate Stripe Connect onboarding URL for provider to link their bank account.

**Request Body:**
```json
{
  "userId": "user_provider456",
  "returnUrl": "https://taplive.com/settings?stripe_connected=true",
  "refreshUrl": "https://taplive.com/settings?stripe_refresh=true"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://connect.stripe.com/setup/s/...",
    "accountId": "acct_ABC123...",
    "expiresAt": 1733568000
  },
  "message": "Stripe Connect onboarding link created"
}
```

**Use Case:** Provider clicks "Connect Stripe" button, gets redirected to Stripe onboarding.

---

### Create Stripe Dashboard Link
```
POST /api/stripe/connect/dashboard-link
```

**Purpose:** Generate link for provider to access their Stripe Express dashboard.

**Request Body:**
```json
{
  "userId": "user_provider456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://connect.stripe.com/express/..."
  },
  "message": "Stripe dashboard link created"
}
```

**Use Case:** Provider views earnings, manages bank account, download tax forms.

---

### Disconnect Stripe Account
```
POST /api/stripe/connect/disconnect
```

**Purpose:** Unlink provider's Stripe Connect account.

**Request Body:**
```json
{
  "userId": "user_provider456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stripe account disconnected successfully"
}
```

**Use Case:** Provider wants to switch bank account, security/privacy concerns.

---

### Test Mode: Force Verify Stripe Account
```
POST /api/stripe/connect/test-verify/:userId
```

**Purpose:** DEV ONLY - Simulate Stripe account verification in test mode.

**Parameters:**
- `userId` (path) - Provider's User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "accountId": "acct_test123",
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "detailsSubmitted": true
  },
  "message": "Test account verification status updated (Test mode only)"
}
```

**Use Case:** Testing payout flows without completing real Stripe onboarding.

---

## 🎯 Smart Dispatch Algorithm

### Get Ranked Providers for Order
```
GET /api/orders/:id/providers
```

**Purpose:** Get list of available providers ranked by dispatch algorithm score.

**Parameters:**
- `id` (path) - Order ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user_provider456",
      "username": "johndoe",
      "trustScore": "4.8",
      "distance": 2.5,
      "networkSpeed": 50.5,
      "devicePerformance": 85,
      "dispatchScore": "87.5",
      "estimatedResponseTime": 3
    },
    {
      "userId": "user_provider789",
      "username": "janedoe",
      "trustScore": "4.6",
      "distance": 5.2,
      "networkSpeed": 45.0,
      "devicePerformance": 80,
      "dispatchScore": "75.3",
      "estimatedResponseTime": 5
    }
  ],
  "message": "Found 2 available providers"
}
```

**Dispatch Score Formula:**
```
Score = (Distance × 35%) + (TrustScore × 25%) + (NetworkSpeed × 20%) 
        + (DevicePerformance × 10%) + (ResponseTime × 10%)
```

**Use Case:** Auto-notify top-ranked providers, admin sees provider rankings, optimize order fulfillment.

---

### Get All Available Providers
```
GET /api/providers
```

**Purpose:** Get all providers currently available, sorted by dispatch score.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_provider456",
      "username": "johndoe",
      "trustScore": "4.8",
      "availability": true,
      "dispatchScore": "87.5",
      "currentLatitude": 37.7749,
      "currentLongitude": -122.4194
    }
  ],
  "message": "Found 5 available providers"
}
```

**Use Case:** Show all online providers on map, admin dashboard, provider directory.

---

### Get Dispatch Algorithm Info
```
GET /api/dispatch/algorithm
```

**Purpose:** Get explanation of dispatch algorithm weights and scoring.

**Response:**
```json
{
  "success": true,
  "data": {
    "weights": {
      "distance": 35,
      "trustScore": 25,
      "networkSpeed": 20,
      "devicePerformance": 10,
      "responseTime": 10
    },
    "explanation": {
      "distance": "Proximity to order location - closer providers score higher",
      "trustScore": "User reputation based on ratings and completed orders",
      "networkSpeed": "Internet connection speed in Mbps - critical for streaming quality",
      "devicePerformance": "Device capability score (0-100) - affects stream quality",
      "responseTime": "Average response time to accept orders - faster response scores higher"
    },
    "scoringRanges": {
      "distance": "0-50km optimal range, exponential decay beyond",
      "trustScore": "0-5.0 rating scale, normalized to 0-100",
      "networkSpeed": "5+ Mbps minimum, 50+ Mbps for perfect score",
      "devicePerformance": "0-100 scale directly mapped",
      "responseTime": "0-5 minutes optimal, exponential decay to 60 minutes"
    }
  },
  "message": "Dispatch algorithm configuration"
}
```

**Use Case:** Help docs, admin dashboard, transparency for providers.

---

## 📺 Streams & Broadcasting

### Get Live Streams
```
GET /api/streams/live
```

**Purpose:** Get all currently broadcasting streams.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order_abc123",
      "title": "Live Stream at Golden Gate Park",
      "status": "live",
      "provider": {
        "id": "user_provider456",
        "username": "johndoe",
        "avatar": "https://...",
        "trustScore": "4.8"
      },
      "location": "Golden Gate Park, SF",
      "latitude": 37.7694,
      "longitude": -122.4862,
      "scheduledAt": "2025-12-06T15:00:00Z",
      "duration": 30,
      "price": "50.00",
      "viewerCount": 12
    }
  ],
  "meta": {
    "total": 3,
    "timestamp": "2025-12-06T15:05:00Z"
  },
  "message": "Found 3 live streams"
}
```

**Use Case:** Home page "Live Now" section, browse active streams, join stream.

---

### Get Upcoming Streams
```
GET /api/streams/upcoming
```

**Purpose:** Get scheduled streams that haven't started yet.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order_def456",
      "title": "Sunset at Ocean Beach",
      "status": "accepted",
      "provider": {
        "id": "user_provider789",
        "username": "janedoe",
        "avatar": "https://..."
      },
      "scheduledAt": "2025-12-06T18:00:00Z",
      "timeUntilStart": 7200,
      "duration": 45,
      "price": "75.00"
    }
  ],
  "message": "Found 2 upcoming streams"
}
```

**Use Case:** "Upcoming" tab, set reminders, pre-order streams.

---

### Get Stream by ID
```
GET /api/streams/:id
```

**Purpose:** Get detailed information about a specific stream (alias for GET /api/orders/:id).

**Parameters:**
- `id` (path) - Stream/Order ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_abc123",
    "title": "Live Stream at Golden Gate Park",
    "status": "live",
    "provider": { /* Provider details */ },
    "customer": { /* Customer details */ },
    "location": "Golden Gate Park, SF",
    "scheduledAt": "2025-12-06T15:00:00Z",
    "duration": 30,
    "price": "50.00",
    "isPaid": true,
    "viewerCount": 12,
    "ratings": [ /* Order ratings */ ]
  }
}
```

**Use Case:** Stream details page, join stream, view stream info.

---

## 💵 Earnings & Transactions

### Get User Earnings Summary
```
GET /api/users/:userId/earnings
```

**Purpose:** Get provider's earnings dashboard data (total, pending, completed payouts).

**Parameters:**
- `userId` (path) - Provider's User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEarnings": "1250.50",
    "totalOrders": 45,
    "completedOrders": 42,
    "averageOrderValue": "29.78",
    "thisMonthEarnings": "325.00",
    "lastMonthEarnings": "280.50",
    "pendingPayouts": [
      {
        "id": "payout_xyz789",
        "orderId": "order_abc123",
        "amount": "40.00",
        "status": "pending",
        "createdAt": "2025-12-06T10:00:00Z"
      }
    ],
    "completedPayouts": [
      {
        "id": "payout_abc456",
        "orderId": "order_def456",
        "amount": "60.00",
        "status": "completed",
        "processedAt": "2025-12-05T14:00:00Z",
        "externalPayoutId": "tr_ABC123..."
      }
    ],
    "recentOrders": [
      {
        "id": "order_recent1",
        "title": "Sunset at Ocean Beach",
        "earnings": "60.00",
        "completedAt": "2025-12-05T18:00:00Z",
        "rating": 5
      }
    ],
    "earningsChart": [
      { "date": "2025-12-01", "amount": 120 },
      { "date": "2025-12-02", "amount": 85 },
      { "date": "2025-12-03", "amount": 150 }
    ]
  }
}
```

**Use Case:** Earnings dashboard, track income, see payout history.

---

### Get User Transactions
```
GET /api/users/:id/transactions
```

**Purpose:** Get all financial transactions for a user (payments, payouts, refunds).

**Parameters:**
- `id` (path) - User ID

**Query Parameters:**
- `type` (optional) - Filter by type: `payment`, `commission`, `refund`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "txn_abc123",
      "userId": "user_provider456",
      "orderId": "order_abc123",
      "paymentId": "pmt_xyz789",
      "payoutId": "payout_def456",
      "type": "commission",
      "amount": "40.00",
      "currency": "USD",
      "description": "Commission for completed order: Live Stream at Golden Gate Park",
      "createdAt": "2025-12-06T16:00:00Z",
      "metadata": "{\"commission\":{\"totalAmount\":50,\"platformFee\":10,\"providerEarnings\":40}}"
    }
  ],
  "message": "Found 25 transactions"
}
```

**Use Case:** Transaction history, export for taxes, audit trail.

---

### Get User Payouts
```
GET /api/users/:id/payouts
```

**Purpose:** Get all payouts sent to a provider.

**Parameters:**
- `id` (path) - Provider's User ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "payout_abc123",
      "orderId": "order_xyz789",
      "recipientId": "user_provider456",
      "amount": "40.00",
      "platformFee": "10.00",
      "currency": "USD",
      "payoutMethod": "stripe",
      "externalPayoutId": "tr_ABC123...",
      "status": "completed",
      "processedAt": "2025-12-06T16:00:00Z",
      "createdAt": "2025-12-06T10:00:00Z"
    }
  ],
  "message": "Found 15 payouts"
}
```

**Use Case:** Payout history, verify earnings received, track pending payouts.

---

## 🛡️ Safety & Geo-fencing

### Check Location Safety
```
POST /api/orders/check-location
```

**Purpose:** Validate if location is safe for streaming (not military base, disaster zone, etc.).

**Request Body:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "riskLevel": "safe",
    "canProceed": true,
    "reasons": [],
    "restrictions": [],
    "riskInfo": {
      "color": "green",
      "label": "Safe Zone",
      "icon": "✅"
    }
  }
}
```

**Risk Levels:**
- `safe` - All clear
- `low` - Minor concerns (proceed with caution)
- `medium` - Notable risks (warnings shown)
- `high` - Dangerous area (order creation blocked)
- `extreme` - Extreme danger (military, disaster zones)
- `forbidden` - Absolutely prohibited

**Use Case:** Prevent orders in restricted zones, warn users of risks, ensure safety.

---

### Check Location with Geofence & Timezone
```
POST /api/check-location
```

**Purpose:** Check if location is within allowed geofence and timezone restrictions.

**Request Body:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "timestamp": "2025-12-06T15:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "timestamp": "2025-12-06T15:00:00Z",
    "timezone": {
      "timezone": "America/Los_Angeles",
      "utcOffset": -480,
      "isDst": false,
      "localTime": "2025-12-06T07:00:00-08:00",
      "isAllowedTime": true,
      "restrictionReason": null
    },
    "geofences": [
      {
        "isInside": true,
        "geofenceId": "geo_sf_allowed",
        "geofenceName": "San Francisco Allowed Zone",
        "action": "allow",
        "priority": 1,
        "message": "This location is within an allowed streaming zone"
      }
    ],
    "decision": "allow",
    "messages": ["Location verified - safe to proceed"],
    "isAllowed": true,
    "hasTimeRestrictions": false
  }
}
```

**Use Case:** Block streams during restricted hours, enforce regional restrictions, compliance.

---

### Check Order Content Safety
```
POST /api/orders/:id/check-content
```

**Purpose:** AI-based content moderation for order titles/descriptions (detect illegal keywords).

**Parameters:**
- `id` (path) - Order ID

**Request Body:**
```json
{
  "checkTitle": true,
  "checkDescription": true,
  "checkVoice": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contentViolations": {
      "hasViolations": false,
      "violationTypes": [],
      "flaggedPhrases": [],
      "severity": "none",
      "shouldBlock": false,
      "warningMessage": null
    },
    "voiceViolations": null
  },
  "message": "Content check completed - no violations found"
}
```

**Violation Types:**
- `illegal_activity` - Drug deals, weapons, etc.
- `explicit_content` - Adult content
- `hate_speech` - Discriminatory language
- `violence` - Violent content

**Use Case:** Auto-moderate order creation, flag suspicious orders, prevent illegal activities.

---

### Get Weather Alerts
```
GET /api/weather/alerts
```

**Purpose:** Get active weather warnings (storms, disasters) that might affect streams.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert_storm123",
      "weatherCondition": "thunderstorm",
      "severity": "moderate",
      "message": "Thunderstorm warning in effect until 8 PM. Avoid outdoor streaming.",
      "startTime": "2025-12-06T14:00:00Z",
      "endTime": "2025-12-06T20:00:00Z",
      "affectedRegions": ["San Francisco", "Oakland"]
    }
  ]
}
```

**Severity Levels:**
- `minor` - Light rain, no concern
- `moderate` - Storms, caution advised
- `severe` - Dangerous conditions, recommend cancellation
- `extreme` - Life-threatening, force cancel streams

**Use Case:** Warn users about bad weather, auto-cancel streams in storms, safety alerts.

---

### Get Geofences
```
GET /api/geofences
```

**Purpose:** Get all configured geofences (allowed/blocked zones).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "geo_sf_allowed",
      "name": "San Francisco Allowed Zone",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "radius": 50,
      "action": "allow",
      "priority": 1
    },
    {
      "id": "geo_military_block",
      "name": "Military Base - Prohibited",
      "latitude": 37.8199,
      "longitude": -122.4783,
      "radius": 5,
      "action": "block",
      "priority": 10
    }
  ]
}
```

**Actions:**
- `allow` - Explicitly allowed zone
- `block` - Completely blocked
- `warn` - Show warning but allow
- `restrict_time` - Time-based restrictions

**Use Case:** Display restricted zones on map, admin configures geofences.

---

### Create Geofence
```
POST /api/geofences
```

**Purpose:** Admin creates new geofence rule.

**Request Body:**
```json
{
  "name": "Concert Venue - No Streaming",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "radius": 0.5,
  "action": "block",
  "priority": 5,
  "metadata": {
    "reason": "Copyright restrictions",
    "expiresAt": "2025-12-31T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* Created geofence */ },
  "message": "Geofence created successfully"
}
```

**Use Case:** Block streaming at copyrighted venues, temporary event restrictions.

---

### Initialize Default Geofences
```
POST /api/initialize-geofences
```

**Purpose:** Admin endpoint to populate database with default geofences and timezone rules.

**Response:**
```json
{
  "success": true,
  "data": {
    "geofences": [ /* Created geofences */ ],
    "timezoneRules": [ /* Created timezone rules */ ]
  },
  "message": "Default geofences and timezone rules initialized"
}
```

**Use Case:** First-time setup, reset geofences to defaults.

---

## 🔌 WebSocket API

**Connection URL:** `ws://localhost:5000/ws`

### Connection Flow
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  console.log('Connected to TapLive WebSocket');
};
```

---

### Message Types

#### 1. Broadcaster Ready
**Purpose:** Provider notifies server they're ready to broadcast.

**Client → Server:**
```json
{
  "type": "broadcaster-ready",
  "streamId": "order_abc123"
}
```

**Server → All Viewers:**
```json
{
  "type": "broadcaster-ready-signal",
  "streamId": "order_abc123"
}
```

---

#### 2. Join Stream
**Purpose:** Viewer joins a live stream room.

**Client → Server:**
```json
{
  "type": "join-stream",
  "streamId": "order_abc123"
}
```

**Server → All Clients:**
```json
{
  "type": "viewer-count",
  "count": 5,
  "streamId": "order_abc123"
}
```

**Server → Broadcaster:**
```json
{
  "type": "viewer-joined",
  "streamId": "order_abc123",
  "viewerId": "client_42"
}
```

---

#### 3. WebRTC Signaling (Offer)
**Purpose:** Broadcaster sends WebRTC offer to specific viewer.

**Broadcaster → Server:**
```json
{
  "type": "webrtc-offer",
  "streamId": "order_abc123",
  "viewerId": "client_42",
  "offer": {
    "type": "offer",
    "sdp": "v=0\r\no=- ..."
  }
}
```

**Server → Specific Viewer:**
```json
{
  "type": "webrtc-offer",
  "streamId": "order_abc123",
  "viewerId": "client_42",
  "offer": { /* SDP offer */ }
}
```

---

#### 4. WebRTC Signaling (Answer)
**Purpose:** Viewer sends WebRTC answer back to broadcaster.

**Viewer → Server:**
```json
{
  "type": "webrtc-answer",
  "streamId": "order_abc123",
  "answer": {
    "type": "answer",
    "sdp": "v=0\r\na=group:BUNDLE ..."
  }
}
```

**Server → Broadcaster:**
```json
{
  "type": "webrtc-answer",
  "streamId": "order_abc123",
  "viewerId": "client_42",
  "answer": { /* SDP answer */ }
}
```

---

#### 5. ICE Candidate Exchange
**Purpose:** Exchange ICE candidates for WebRTC peer connection.

**Client → Server:**
```json
{
  "type": "ice-candidate",
  "streamId": "order_abc123",
  "viewerId": "client_42",
  "candidate": {
    "candidate": "candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host",
    "sdpMLineIndex": 0,
    "sdpMid": "0"
  }
}
```

**Server → Peer:**
```json
{
  "type": "ice-candidate",
  "streamId": "order_abc123",
  "viewerId": "client_42",
  "candidate": { /* ICE candidate */ }
}
```

---

#### 6. Start Streaming
**Purpose:** Broadcaster notifies all viewers that stream has started.

**Broadcaster → Server:**
```json
{
  "type": "start-streaming",
  "orderId": "order_abc123"
}
```

**Server → All Viewers:**
```json
{
  "type": "stream-started",
  "streamId": "order_abc123"
}
```

---

#### 7. End Stream (Most Important!)
**Purpose:** Broadcaster ends stream, triggers automatic payment capture and payout.

**Broadcaster → Server:**
```json
{
  "type": "end-stream",
  "streamId": "order_abc123"
}
```

**Server Actions:**
1. Captures Stripe payment (charges customer's card)
2. Calculates commission (80/20 split)
3. Transfers earnings to provider via Stripe Connect
4. Updates order status to "done"
5. Creates payout record
6. Notifies provider of earnings
7. Updates provider's total earnings

**Server → All Viewers:**
```json
{
  "type": "stream-ended",
  "streamId": "order_abc123"
}
```

**Server → Broadcaster:**
```json
{
  "type": "stream-end-confirmed",
  "streamId": "order_abc123",
  "paymentReleased": true
}
```

---

#### 8. Broadcaster Disconnected
**Purpose:** Notify viewers if broadcaster loses connection.

**Server → All Viewers (Auto-sent on disconnect):**
```json
{
  "type": "broadcaster-disconnected",
  "streamId": "order_abc123"
}
```

---

#### 9. Viewer Count Updates
**Purpose:** Real-time viewer count updates.

**Server → All Clients (Auto-sent):**
```json
{
  "type": "viewer-count",
  "count": 8,
  "streamId": "order_abc123"
}
```

---

### WebSocket Connection States

**Room Management:**
- Each stream has a "room" (Set of WebSocket connections)
- Broadcaster tracked separately in `broadcasters` Map
- Each client gets unique ID: `client_1`, `client_2`, etc.

**Cleanup on Disconnect:**
- Client removed from all rooms
- Viewer count updated for all remaining clients
- Empty rooms deleted
- Broadcaster disconnect notifies all viewers

---

## 📊 API Response Standards

### Success Response
```json
{
  "success": true,
  "data": { /* Response data */ },
  "message": "Operation completed successfully",
  "meta": {
    "total": 10,
    "timestamp": "2025-12-06T10:00:00Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 🔑 Authentication

### Bearer Token (Clerk JWT)
All authenticated endpoints require Clerk JWT token in header:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Endpoints Requiring Auth:
- `POST /api/orders/:id/cancel` - ✅ Requires auth
- Most other endpoints - ⚠️ Currently public (auth recommended for production)

---

## 📈 Rate Limits

**Not Currently Implemented** - Recommended for production:
- 100 requests/minute per IP
- 1000 requests/hour per user
- WebSocket: 50 messages/second per connection

---

## 🌍 Supported Regions

**Currencies:**
- USD (United States Dollar) - Primary

**Languages:**
- English (en)
- Chinese (zh)
- Japanese (ja)
- Spanish (es)
- French (fr)

---

## 📝 Notes

### Payment Flow Summary:
1. **Create Payment** → Stripe PaymentIntent created (manual capture)
2. **Customer Pays** → Card authorized, money held (not charged)
3. **Confirm Payment** → Database updated, order marked as paid
4. **Stream Ends** → WebSocket `end-stream` triggers:
   - Capture payment (charge card)
   - Calculate commission (20% platform, 80% provider)
   - Transfer to provider via Stripe Connect
   - Create payout record
   - Notify provider

### Commented Out Endpoints:
- `POST /api/orders/:id/approve` - Replaced by auto-completion on stream end

### Development vs Production:
- Test Mode: Use Stripe test keys (`sk_test_...`)
- Production: Use live keys (`sk_live_...`)
- Webhooks: Configure in Stripe Dashboard

---

**Generated:** December 6, 2025  
**TapLive Version:** 1.0.0 MVP
