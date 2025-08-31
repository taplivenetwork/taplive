# TapLive MVP - API Reference Guide

## 📋 API Overview

The TapLive MVP API provides a comprehensive RESTful interface for building location-based live streaming applications. This guide covers all endpoints, authentication methods, data models, and integration patterns for developers building on the TapLive platform.

## 🔐 Authentication

### API Key Authentication
All API requests require authentication using API keys or JWT tokens.

```bash
# API Key in header (for server-to-server communication)
curl -H "X-API-Key: your_api_key_here" \
     -H "Content-Type: application/json" \
     https://api.taplive.tv/v1/orders

# JWT Bearer token (for user-authenticated requests)
curl -H "Authorization: Bearer your_jwt_token_here" \
     -H "Content-Type: application/json" \
     https://api.taplive.tv/v1/orders
```

### Authentication Endpoints

#### POST /api/v1/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "john_creator",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "creator",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "timezone": "America/New_York"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "username": "john_creator",
      "email": "john@example.com",
      "role": "creator",
      "createdAt": "2025-08-31T08:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/v1/auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "username": "john_creator",
      "role": "creator"
    },
    "token": "jwt_token_here",
    "expiresIn": "24h"
  }
}
```

## 📋 Order Management API

### GET /api/v1/orders
Retrieve a list of live streaming orders with filtering and pagination.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Results per page (default: 20, max: 100)
- `status` (string): Filter by order status (`pending`, `active`, `completed`)
- `latitude` (number): User's latitude for location-based filtering
- `longitude` (number): User's longitude for location-based filtering
- `radius` (number): Search radius in meters (default: 5000)

**Example Request:**
```bash
curl "https://api.taplive.tv/v1/orders?latitude=40.7128&longitude=-74.0060&radius=2000&status=pending" \
     -H "Authorization: Bearer your_token_here"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order-uuid-123",
        "title": "Live Stream Central Park",
        "description": "Need someone to live stream the fall foliage in Central Park",
        "location": {
          "latitude": 40.7829,
          "longitude": -73.9654,
          "address": "Central Park, New York, NY",
          "radius": 500
        },
        "pricing": {
          "baseAmount": 25.00,
          "currency": "USD",
          "paymentMethod": "stripe"
        },
        "status": "pending",
        "creator": {
          "id": "user-uuid-456",
          "username": "nature_lover",
          "rating": 4.8
        },
        "createdAt": "2025-08-31T10:30:00.000Z",
        "scheduledFor": "2025-08-31T14:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### POST /api/v1/orders
Create a new live streaming order.

**Request Body:**
```json
{
  "title": "Live Stream Times Square NYE",
  "description": "Looking for someone to live stream the New Year's Eve celebration from Times Square",
  "location": {
    "latitude": 40.7580,
    "longitude": -73.9855,
    "address": "Times Square, New York, NY",
    "radius": 200
  },
  "pricing": {
    "baseAmount": 100.00,
    "currency": "USD"
  },
  "scheduledFor": "2025-12-31T23:00:00.000Z",
  "duration": 120,
  "requirements": [
    "4K video quality",
    "Good audio equipment",
    "Stable internet connection"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order-uuid-789",
      "title": "Live Stream Times Square NYE",
      "status": "pending",
      "createdAt": "2025-08-31T08:25:00.000Z",
      "estimatedResponses": 12,
      "paymentIntentId": "pi_stripe_payment_intent"
    }
  }
}
```

### PUT /api/v1/orders/:id/accept
Accept an order as a service provider.

**Request Body:**
```json
{
  "message": "I'm a professional videographer with 4K equipment and great reviews!",
  "eta": "2025-08-31T13:45:00.000Z",
  "equipment": [
    "Sony FX3 Camera",
    "DJI Ronin Gimbal",
    "Wireless Microphone System"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order-uuid-789",
      "status": "accepted",
      "provider": {
        "id": "provider-uuid-101",
        "username": "pro_videographer",
        "rating": 4.9
      },
      "acceptedAt": "2025-08-31T08:30:00.000Z"
    }
  }
}
```

## 📍 Location Services API

### POST /api/v1/location/validate
Validate geographic coordinates and resolve address information.

**Request Body:**
```json
{
  "latitude": 40.7580,
  "longitude": -73.9855
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coordinates": {
      "latitude": 40.7580,
      "longitude": -73.9855
    },
    "address": {
      "formatted": "Times Square, New York, NY 10036, USA",
      "components": {
        "street": "Times Square",
        "city": "New York",
        "state": "NY",
        "zipCode": "10036",
        "country": "USA"
      }
    },
    "timezone": "America/New_York",
    "accuracy": "high"
  }
}
```

### GET /api/v1/location/nearby
Discover nearby users, orders, or points of interest.

**Query Parameters:**
- `latitude` (required): Center latitude
- `longitude` (required): Center longitude  
- `radius` (required): Search radius in meters
- `type` (required): Search type (`users`, `orders`, `hotspots`)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "user",
        "id": "user-uuid-202",
        "username": "street_photographer",
        "distance": 245,
        "rating": 4.7,
        "specialties": ["street photography", "urban exploration"],
        "available": true
      }
    ],
    "center": {
      "latitude": 40.7580,
      "longitude": -73.9855
    },
    "radius": 1000
  }
}
```

## 💰 Payment & Billing API

### GET /api/v1/payments/methods
Retrieve available payment methods for the user.

**Response:**
```json
{
  "success": true,
  "data": {
    "methods": [
      {
        "id": "pm_stripe_card_123",
        "type": "card",
        "card": {
          "brand": "visa",
          "last4": "4242",
          "expMonth": 12,
          "expYear": 2028
        },
        "isDefault": true
      }
    ],
    "currencies": ["USD", "EUR", "GBP", "CAD"]
  }
}
```

### POST /api/v1/payments/charge
Process payment for a completed order.

**Request Body:**
```json
{
  "orderId": "order-uuid-789",
  "paymentMethodId": "pm_stripe_card_123",
  "amount": 100.00,
  "currency": "USD",
  "tip": 15.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid-456",
    "status": "succeeded",
    "amount": 115.00,
    "fees": {
      "platform": 11.50,
      "processing": 3.45
    },
    "providerEarnings": 100.05,
    "receiptUrl": "https://receipts.taplive.tv/payment-uuid-456"
  }
}
```

## 🔄 Real-time Events API

### WebSocket Connection
Connect to real-time order updates and notifications.

```javascript
// Client-side WebSocket connection
const ws = new WebSocket('wss://api.taplive.tv/v1/realtime');

ws.onopen = () => {
  // Authenticate the connection
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your_jwt_token_here'
  }));
  
  // Subscribe to order updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'order_updates',
    orderId: 'order-uuid-789'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'order_update':
      console.log('Order status changed:', data.payload);
      break;
    case 'new_message':
      console.log('New chat message:', data.payload);
      break;
    case 'provider_location':
      console.log('Provider location update:', data.payload);
      break;
  }
};
```

### Event Types
- `order_update`: Order status changes
- `new_message`: Chat messages between creator and provider
- `provider_location`: Real-time provider location updates
- `stream_start`: Live stream has begun
- `stream_end`: Live stream has ended
- `payment_complete`: Payment processing completed

## 📊 Analytics & Reporting API

### GET /api/v1/analytics/orders
Retrieve order analytics and performance metrics.

**Query Parameters:**
- `startDate` (ISO date): Analytics period start
- `endDate` (ISO date): Analytics period end
- `groupBy` (string): Group results by (`day`, `week`, `month`)

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalOrders": 156,
      "completedOrders": 142,
      "completionRate": 91.0,
      "averageOrderValue": 47.50,
      "totalRevenue": 6745.00
    },
    "timeSeries": [
      {
        "date": "2025-08-24",
        "orders": 23,
        "revenue": 1092.50
      }
    ]
  }
}
```

## 🛠️ Developer Tools

### API Testing
Use our interactive API explorer at `https://api.taplive.tv/docs` for testing endpoints.

### Rate Limiting
- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour
- **WebSocket connections**: 10 concurrent connections per user

### Error Handling
All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid latitude coordinate",
    "details": {
      "field": "latitude",
      "value": "invalid_value",
      "constraint": "must_be_between_-90_and_90"
    }
  },
  "requestId": "req_12345abcdef"
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_ERROR`: Request data validation failed
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `PAYMENT_REQUIRED`: Payment method required
- `GEOFENCE_VIOLATION`: Location outside allowed area

## 📚 SDKs & Libraries

### Official SDKs
- **JavaScript/Node.js**: `npm install @taplive/api-client`
- **Python**: `pip install taplive-api`
- **React Native**: `npm install @taplive/react-native`

### Community SDKs
- **PHP**: Available via Composer
- **Go**: Available on GitHub
- **Swift**: iOS SDK in development

## 🔗 Webhook Integration

### Webhook Events
Configure webhooks to receive real-time notifications about order events.

**Setup:**
```bash
curl -X POST https://api.taplive.tv/v1/webhooks \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/taplive",
    "events": ["order.created", "order.completed", "payment.succeeded"],
    "secret": "your_webhook_secret"
  }'
```

**Event Payload Example:**
```json
{
  "event": "order.completed",
  "timestamp": "2025-08-31T15:30:00.000Z",
  "data": {
    "orderId": "order-uuid-789",
    "status": "completed",
    "completedAt": "2025-08-31T15:30:00.000Z",
    "rating": 5,
    "review": "Amazing work! Perfect video quality."
  }
}
```

---

**API Version**: v1.0  
**Last Updated**: August 31, 2025  
**Base URL**: `https://api.taplive.tv/v1`  
**Documentation**: `https://docs.taplive.tv`  
**Support**: `developers@taplive.tv`

> 💡 **Developer Note**: This API reference covers the core MVP functionality. Advanced features including AI content moderation, multi-stream orchestration, and blockchain integration are available in our enterprise API documentation.