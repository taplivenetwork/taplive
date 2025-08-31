# TapLive MVP API Developer Guide
## RESTful API Specification and Integration Documentation

### API Overview
The TapLive platform provides a comprehensive RESTful API for managing location-based live streaming orders, user profiles, payments, and real-time communications. All APIs follow standard HTTP methods and return JSON responses with consistent error handling.

**Base URL**: `https://your-domain.com/api`
**API Version**: v1
**Authentication**: Bearer Token (future implementation)

---

## API Response Format Standards

### Success Response Format
```json
{
  "success": true,
  "data": {}, // Response payload
  "meta": {   // Optional metadata
    "total": 100,
    "page": 1,
    "limit": 20,
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "message": "Operation completed successfully"
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [  // Optional detailed errors
    {
      "field": "email",
      "code": "INVALID_FORMAT",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### HTTP Status Codes
- `200` - OK: Successful GET, PATCH requests
- `201` - Created: Successful POST requests
- `400` - Bad Request: Invalid request data
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource does not exist
- `422` - Unprocessable Entity: Validation errors
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server-side error

---

## Order Management APIs

### Get Orders List
Retrieve orders with optional filtering by status, location, and category.

**Endpoint**: `GET /api/orders`

**Query Parameters**:
```typescript
{
  status?: 'pending' | 'open' | 'accepted' | 'live' | 'completed' | 'cancelled',
  latitude?: number,     // Geographic latitude
  longitude?: number,    // Geographic longitude  
  radius?: number,       // Search radius in kilometers (default: 10)
  category?: string,     // Order category filter
  page?: number,         // Pagination page (default: 1)
  limit?: number         // Items per page (default: 20)
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Tokyo Tower Live Stream",
      "description": "360-degree Tokyo night view",
      "type": "single",
      "status": "pending",
      "latitude": "35.6586",
      "longitude": "139.7454",
      "address": "Tokyo Tower, Japan",
      "price": "25.00",
      "currency": "USD",
      "scheduledAt": "2024-01-15T18:00:00Z",
      "duration": 60,
      "category": "travel",
      "creatorId": "uuid",
      "providerId": null,
      "maxParticipants": 1,
      "currentParticipants": 1,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### Get Single Order
Retrieve detailed information for a specific order.

**Endpoint**: `GET /api/orders/:id`

**Path Parameters**:
- `id` (string, required): Order UUID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Tokyo Tower Live Stream",
    // ... full order details
    "ratings": [
      {
        "id": "uuid",
        "rating": 5,
        "comment": "Amazing view!",
        "reviewerName": "John Doe",
        "createdAt": "2024-01-15T20:00:00Z"
      }
    ],
    "provider": {
      "id": "uuid",
      "name": "Stream Provider",
      "rating": 4.8,
      "completedOrders": 150
    }
  }
}
```

### Create New Order
Create a new streaming order with location and scheduling details.

**Endpoint**: `POST /api/orders`

**Request Body**:
```json
{
  "title": "Tokyo Tower Live Stream",
  "description": "360-degree Tokyo night view, real-time streaming",
  "type": "single",
  "latitude": 35.6586,
  "longitude": 139.7454,
  "address": "Tokyo Tower, Minato City, Tokyo, Japan",
  "price": "25.00",
  "currency": "USD",
  "scheduledAt": "2024-01-15T18:00:00Z",
  "duration": 60,
  "category": "travel",
  "maxParticipants": 1,
  "tags": ["tourism", "nightview", "tokyo"]
}
```

**Validation Rules**:
- `title`: 5-100 characters
- `description`: 20-1000 characters
- `price`: Positive decimal, max 2 decimal places
- `scheduledAt`: Must be future timestamp
- `duration`: 15-480 minutes (8 hours max)
- `latitude`: -90 to 90
- `longitude`: -180 to 180

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Tokyo Tower Live Stream",
    "status": "pending",
    // ... full order details
  },
  "message": "Order created successfully"
}
```

### Update Order
Update order details or status (limited fields based on current status).

**Endpoint**: `PATCH /api/orders/:id`

**Request Body** (partial update):
```json
{
  "status": "open",
  "providerId": "uuid",
  "liveUrl": "https://stream.example.com/live/12345"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    // ... updated order details
  },
  "message": "Order updated successfully"
}
```

### Cancel Order by Provider
Allows provider to cancel accepted orders (applies rating penalty).

**Endpoint**: `POST /api/orders/:id/cancel-by-provider`

**Request Body**:
```json
{
  "reason": "Equipment failure",
  "providerId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "cancelled",
    "providerId": null
  },
  "message": "Order cancelled. Rating penalty applied."
}
```

---

## User Management APIs

### Get User Profile
Retrieve user profile information including ratings and statistics.

**Endpoint**: `GET /api/users/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "streamProvider123",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatars/john.jpg",
    "rating": "4.85",
    "totalRatings": 234,
    "completedOrders": 156,
    "responseTime": 15,
    "trustScore": "92.5",
    "networkSpeed": "45.60",
    "devicePerformance": "88.0",
    "availability": true,
    "dispatchScore": "94.2",
    "totalEarnings": "2450.75",
    "createdAt": "2023-06-15T10:00:00Z"
  }
}
```

### Update User Location
Update user's current geographic location for dispatch algorithm.

**Endpoint**: `POST /api/users/:id/location`

**Request Body**:
```json
{
  "latitude": 35.6762,
  "longitude": 139.6503
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "latitude": "35.6762",
    "longitude": "139.6503",
    "dispatchScore": "94.2"
  },
  "message": "Location updated successfully"
}
```

### Update Network Metrics
Update user's network and device performance metrics.

**Endpoint**: `POST /api/users/:id/network-metrics`

**Request Body**:
```json
{
  "networkSpeed": 50.5,
  "devicePerformance": 92.0
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "networkSpeed": "50.5",
    "devicePerformance": "92.0",
    "dispatchScore": "95.1"
  },
  "message": "Network metrics updated successfully"
}
```

---

## Provider Dispatch APIs

### Get Ranked Providers for Order
Retrieve providers ranked by dispatch algorithm for specific order.

**Endpoint**: `GET /api/orders/:id/providers`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "name": "Expert Streamer",
      "rating": 4.9,
      "completedOrders": 200,
      "distance": 2.5,
      "dispatchScore": 96.8,
      "networkSpeed": "60.0",
      "devicePerformance": "95.0",
      "estimatedResponse": 8,
      "availability": true
    }
  ],
  "message": "Found 15 available providers"
}
```

### Get Available Providers
Get all currently available providers sorted by dispatch score.

**Endpoint**: `GET /api/providers`

**Query Parameters**:
```typescript
{
  latitude?: number,     // Filter by distance from location
  longitude?: number,
  radius?: number,       // Search radius in km
  minRating?: number,    // Minimum rating filter
  available?: boolean    // Filter by availability status
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Pro Streamer",
      "rating": "4.92",
      "completedOrders": 189,
      "dispatchScore": "97.5",
      "networkSpeed": "65.8",
      "devicePerformance": "94.0",
      "currentLatitude": "35.6762",
      "currentLongitude": "139.6503",
      "availability": true,
      "responseTime": 12
    }
  ]
}
```

---

## Rating and Review APIs

### Create Rating
Submit a rating and review for completed order.

**Endpoint**: `POST /api/ratings`

**Request Body**:
```json
{
  "orderId": "uuid",
  "reviewerId": "uuid",
  "revieweeId": "uuid",
  "rating": 5,
  "comment": "Excellent service and great video quality!",
  "reviewType": "creator_to_provider"
}
```

**Validation Rules**:
- `rating`: Integer 1-5
- `comment`: Optional, max 500 characters
- `reviewType`: "creator_to_provider" or "provider_to_creator"

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "rating": 5,
    "comment": "Excellent service and great video quality!",
    "reviewType": "creator_to_provider",
    "createdAt": "2024-01-15T20:00:00Z"
  },
  "message": "Rating submitted successfully"
}
```

### Get Order Ratings
Retrieve all ratings for a specific order.

**Endpoint**: `GET /api/orders/:id/ratings`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Great experience!",
      "reviewType": "creator_to_provider",
      "reviewerName": "Customer Name",
      "createdAt": "2024-01-15T20:00:00Z"
    }
  ]
}
```

### Get User Ratings
Get all ratings received by a specific user.

**Endpoint**: `GET /api/users/:id/ratings`

**Query Parameters**:
- `type`: "received" | "given" (default: "received")
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "orderTitle": "Tokyo Tower Stream",
      "rating": 5,
      "comment": "Professional service",
      "reviewerName": "John Doe",
      "createdAt": "2024-01-15T20:00:00Z"
    }
  ],
  "meta": {
    "averageRating": 4.85,
    "totalRatings": 156
  }
}
```

---

## Payment APIs

### Create Payment Intent (Stripe)
Initialize payment process for order.

**Endpoint**: `POST /api/create-payment-intent`

**Request Body**:
```json
{
  "orderId": "uuid",
  "amount": 25.00,
  "currency": "USD"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_1234567890_secret_abcdef",
    "paymentIntentId": "pi_1234567890"
  }
}
```

### Process Crypto Payment
Handle cryptocurrency payment verification.

**Endpoint**: `POST /api/payments/crypto`

**Request Body**:
```json
{
  "orderId": "uuid",
  "amount": 25.00,
  "currency": "USDT",
  "paymentMethod": "usdt_trc20",
  "senderWallet": "TXYZabc123...",
  "transactionHash": "0xabcdef123..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "status": "pending",
    "verificationUrl": "https://tronscan.org/#/transaction/0xabcdef123"
  },
  "message": "Payment submitted for verification"
}
```

### Get Payment Status
Check payment status for order.

**Endpoint**: `GET /api/payments/:paymentId/status`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "status": "completed",
    "amount": "25.00",
    "currency": "USD",
    "paymentMethod": "stripe",
    "processedAt": "2024-01-15T15:30:00Z"
  }
}
```

---

## Order Lifecycle Management APIs

### Submit for Approval
Provider submits completed order for customer approval.

**Endpoint**: `POST /api/orders/:id/submit-for-approval`

**Request Body**:
```json
{
  "providerId": "uuid",
  "deliveryNote": "Stream completed successfully with great audio quality."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "awaiting_approval",
    "approvalId": "uuid"
  },
  "message": "Order submitted for customer approval"
}
```

### Approve Order
Customer approves completed order and triggers payout.

**Endpoint**: `POST /api/orders/:id/approve`

**Request Body**:
```json
{
  "customerId": "uuid",
  "customerRating": 5,
  "customerFeedback": "Excellent service, will order again!"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "status": "done"
    },
    "payout": {
      "id": "uuid",
      "amount": "22.50",
      "status": "completed",
      "processedAt": "2024-01-15T16:00:00Z"
    },
    "commission": {
      "totalAmount": 25.00,
      "platformFee": 2.50,
      "providerEarnings": 22.50
    },
    "realTimePayoutProcessed": true
  },
  "message": "Order approved! Provider earned $22.50 commission (paid instantly)"
}
```

### Dispute Order
Customer disputes order quality or delivery.

**Endpoint**: `POST /api/orders/:id/dispute`

**Request Body**:
```json
{
  "disputeType": "quality_issue",
  "title": "Poor video quality",
  "description": "Stream was constantly buffering and audio was unclear",
  "evidence": [
    "https://example.com/screenshots/evidence1.jpg"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "disputeId": "uuid",
    "status": "submitted",
    "estimatedResolution": "24-48 hours"
  },
  "message": "Dispute submitted successfully. Our team will review it shortly."
}
```

---

## Real-time WebSocket Events

### WebSocket Connection
Connect to real-time event stream:

```javascript
const wsUrl = `wss://${window.location.host}/ws`;
const socket = new WebSocket(wsUrl);

socket.onopen = function(event) {
    console.log('WebSocket connected');
};

socket.onmessage = function(event) {
    const message = JSON.parse(event.data);
    handleWebSocketEvent(message);
};
```

### Event Types
```typescript
type WebSocketEvent = 
  | { type: 'new_order', data: Order }
  | { type: 'order_updated', data: { orderId: string, status: string } }
  | { type: 'payment_completed', data: { orderId: string, amount: string } }
  | { type: 'stream_started', data: { orderId: string, liveUrl: string } }
  | { type: 'provider_matched', data: { orderId: string, providerId: string } }
  | { type: 'dispute_created', data: { orderId: string, disputeId: string } };
```

---

## Health Check and System APIs

### Health Check
Monitor system health and status.

**Endpoint**: `GET /healthz`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "TapLive Backend",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 86400,
  "database": "connected",
  "cache": "operational"
}
```

---

## Error Handling

### Common Error Codes
```typescript
enum ErrorCodes {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  LOCATION_NOT_ALLOWED = 'LOCATION_NOT_ALLOWED',
  ORDER_STATUS_INVALID = 'ORDER_STATUS_INVALID',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

### Error Response Examples
```json
{
  "success": false,
  "message": "Order cannot be updated in current status",
  "error": {
    "code": "ORDER_STATUS_INVALID",
    "details": {
      "currentStatus": "completed",
      "allowedStatuses": ["pending", "open"]
    }
  }
}
```

---

## Rate Limiting

**Default Limits**:
- General API: 100 requests/minute per IP
- Payment API: 10 requests/minute per IP
- Location Update: 60 requests/minute per user
- WebSocket: 1000 messages/minute per connection

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

---

## SDK and Integration Examples

### JavaScript/TypeScript SDK
```typescript
import { TapLiveAPI } from '@taplive/sdk';

const client = new TapLiveAPI({
  baseURL: 'https://api.taplive.com',
  apiKey: 'your-api-key'
});

// Create order
const order = await client.orders.create({
  title: 'Live Stream',
  latitude: 35.6762,
  longitude: 139.6503,
  price: '25.00'
});

// Get providers
const providers = await client.orders.getProviders(order.id);
```

### Python SDK
```python
from taplive import TapLiveClient

client = TapLiveClient(api_key='your-api-key')

# Create order
order = client.orders.create(
    title='Live Stream',
    latitude=35.6762,
    longitude=139.6503,
    price='25.00'
)

# Get providers  
providers = client.orders.get_providers(order['id'])
```

This comprehensive API documentation provides all the technical details needed for third-party developers to integrate with the TapLive platform effectively.