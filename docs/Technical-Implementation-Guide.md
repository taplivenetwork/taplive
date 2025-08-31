# TapLive MVP Technical Implementation Guide
## Location-Driven Real-Time Video Streaming Platform

### Project Overview
TapLive MVP is a location-based real-time video streaming marketplace that integrates idle people and smart devices into a video streaming supply chain, built for ETH Global hackathon participation. The platform features React + TypeScript frontend with PostgreSQL database, stable WebRTC-based live streaming, and intelligent multi-screen grid displays (1-256+ concurrent streams) optimized for large monitor demonstrations.

---

## Technical Architecture

### Core Technology Stack
- **Frontend Framework**: React 18 + TypeScript + Vite
- **UI Component Library**: shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: TanStack React Query v5 + React Hook Form
- **Routing System**: Wouter lightweight client-side routing
- **Backend Framework**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Real-time Communication**: WebSocket (ws library)
- **Payment Integration**: Stripe API
- **Geographic Services**: Leaflet.js map integration

### Project Structure
```
taplive-mvp/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # UI component library
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React Hooks
│   │   ├── lib/           # Utility libraries and API clients
│   │   └── index.css      # Global styles
├── server/                 # Backend Express application
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data storage abstraction layer
│   └── index.ts           # Server entry point
├── shared/                 # Shared frontend-backend code
│   ├── schema.ts          # Database schema definitions
│   ├── payment.ts         # Payment business logic
│   └── geo-safety.ts      # Geographic safety module
└── docs/                  # Technical documentation
```

---

## Database Design

### Core Data Tables

#### Users Table
```sql
- id: Primary key UUID
- username: Username
- email: Email address
- name: Real name
- rating: Average rating (0.00-5.00)
- totalRatings: Total rating count
- completedOrders: Completed order count
- responseTime: Average response time
- trustScore: Trust score
- networkSpeed: Network speed (Mbps)
- devicePerformance: Device performance score (0-100)
- currentLatitude/Longitude: Current location
- availability: Available for orders
- dispatchScore: Dispatch algorithm score
- totalEarnings: Total earnings
- preferredPaymentMethod: Preferred payment method
```

#### Orders Table
```sql
- id: Primary key UUID
- title: Order title
- description: Detailed description
- type: Order type (single/group)
- status: Status enum (pending/open/accepted/live/completed/cancelled)
- latitude/longitude: Geographic coordinates
- address: Address text
- price: Price
- currency: Currency type
- platformFee: Platform fee percentage
- maxParticipants: Maximum participants
- scheduledAt: Scheduled time
- duration: Duration in minutes
- liveUrl: Live stream URL
- creatorId: Creator ID
- providerId: Service provider ID
- category: Category tags
- isPaid: Payment status
- riskLevel: Risk level
- weatherAlert: Weather alert
```

#### Ratings Table
```sql
- id: Primary key UUID
- orderId: Associated order
- reviewerId: Reviewer ID
- revieweeId: Reviewee ID
- rating: Rating (1-5 stars)
- comment: Review content
- reviewType: Review type (creator_to_provider/provider_to_creator)
```

#### Payments Table
```sql
- id: Primary key UUID
- orderId: Associated order
- payerId: Payer ID
- amount: Amount
- currency: Currency
- paymentMethod: Payment method (stripe/paypal/usdt_trc20/usdt_erc20/bitcoin/ethereum)
- status: Payment status
- externalPaymentId: External payment ID
- externalTransactionHash: Blockchain transaction hash
```

---

## API Interface Design

### Order Management API

#### Get Orders List
```http
GET /api/orders
Query Parameters:
- status: Order status filter
- latitude/longitude: Geographic location
- radius: Search radius (km)

Response:
{
  "success": true,
  "data": [Order...],
  "meta": {
    "total": number,
    "timestamp": string
  }
}
```

#### Create New Order
```http
POST /api/orders
Request Body:
{
  "title": string,
  "description": string,
  "type": "single" | "group",
  "latitude": number,
  "longitude": number,
  "price": string,
  "scheduledAt": string,
  "duration": number,
  "category": string,
  "maxParticipants": number?
}

Response:
{
  "success": true,
  "data": Order,
  "message": "Order created successfully"
}
```

#### Update Order Status
```http
PATCH /api/orders/:id
Request Body: { partial order fields }
```

### User Management API

#### Get User Information
```http
GET /api/users/:id
Response:
{
  "success": true,
  "data": UserWithoutPassword
}
```

#### Update User Location
```http
POST /api/users/:id/location
Request Body:
{
  "latitude": number,
  "longitude": number
}
```

#### Update Network Metrics
```http
POST /api/users/:id/network-metrics
Request Body:
{
  "networkSpeed": number,
  "devicePerformance": number
}
```

### Dispatch Algorithm API

#### Get Ranked Providers for Order
```http
GET /api/orders/:id/providers
Response:
{
  "success": true,
  "data": [RankedProvider...],
  "message": string
}
```

#### Get Available Providers
```http
GET /api/providers
Response: Provider list sorted by dispatch score
```

---

## Frontend Architecture Design

### Component Hierarchy

#### Page-level Components
- **Home.tsx**: Main page, integrating map, order list, multi-screen grid
- **OrderCard.tsx**: Order card component
- **MultiStreamGrid.tsx**: Multi-stream grid display component
- **CreateOrderModal.tsx**: Order creation modal

#### Functional Components
- **LanguageSelector.tsx**: Multi-language switcher
- **DemoControls.tsx**: Demo control panel
- **TranslatedText.tsx**: Internationalization text component

#### Hook Components
- **useTranslation.ts**: Multi-language state management
- **useToast.ts**: Message notification management

### State Management Strategy

#### React Query Configuration
```typescript
// Query configuration
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/orders'],
  queryFn: () => api.orders.getAll(),
  refetchInterval: 30000
});

// Mutation configuration
const mutation = useMutation({
  mutationFn: api.orders.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    toast({ title: "Order created successfully" });
  }
});
```

#### Form Management
```typescript
// React Hook Form + Zod validation
const form = useForm<CreateOrderForm>({
  resolver: zodResolver(orderValidationSchema),
  defaultValues: {
    title: "",
    description: "",
    type: "single",
    price: "",
    duration: 60
  }
});
```

---

## Real-time Communication Architecture

### WebSocket Integration
```typescript
// Server-side WebSocket
const wss = new WebSocketServer({ 
  server: httpServer, 
  path: '/ws' 
});

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    handleWebSocketMessage(ws, message);
  });
});

// Client-side connection
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${window.location.host}/ws`;
const socket = new WebSocket(wsUrl);
```

### Multi-screen Grid System

#### Grid Display Algorithm
```typescript
const getGridDimensions = (streamCount: number) => {
  if (streamCount <= 1) return { rows: 1, cols: 1 };
  if (streamCount <= 4) return { rows: 2, cols: 2 };
  if (streamCount <= 9) return { rows: 3, cols: 3 };
  if (streamCount <= 16) return { rows: 4, cols: 4 };
  // Support for 256+ concurrent streams with dynamic grid
  const cols = Math.ceil(Math.sqrt(streamCount));
  const rows = Math.ceil(streamCount / cols);
  return { rows, cols };
};
```

#### Stream State Management
- Connection status monitoring
- Automatic reconnection mechanism
- Bandwidth adaptive adjustment
- Failover handling

---

## Geographic Location Services

### Map Integration
```typescript
// Leaflet.js dynamic loading
const loadMap = async () => {
  const L = (await import('leaflet')).default;
  const map = L.map('map').setView([latitude, longitude], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
};
```

### Geographic Risk Assessment
- Military zone detection
- Extreme weather alerts
- High crime rate area marking
- Timezone restriction management

### Core Dispatch Algorithm
```typescript
// Provider ranking algorithm
const calculateDispatchScore = (user: User, order: Order) => {
  const distance = calculateDistance(user.location, order.location);
  const reliabilityScore = user.rating * (user.completedOrders / 100);
  const performanceScore = (user.networkSpeed / 100) * user.devicePerformance;
  const availabilityBonus = user.availability ? 10 : 0;
  
  return (reliabilityScore * 0.4) + (performanceScore * 0.3) + 
         (1 / Math.max(distance, 0.1) * 0.2) + (availabilityBonus * 0.1);
};
```

---

## Payment System Integration

### Stripe Payment Flow
```typescript
// Create payment intent
app.post("/api/create-payment-intent", async (req, res) => {
  const { amount, orderId } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: "usd",
    metadata: { orderId }
  });
  
  res.json({ clientSecret: paymentIntent.client_secret });
});
```

### Cryptocurrency Payments
- USDT TRC20/ERC20 support
- Bitcoin/Ethereum integration
- Transaction hash verification
- Real-time exchange rate conversion

### Commission Distribution System
```typescript
// Real-time commission processing
const calculateCommission = (amount: number) => {
  const platformFee = amount * 0.10; // 10% platform fee
  const providerEarnings = amount - platformFee;
  
  return {
    totalAmount: amount,
    platformFee,
    providerEarnings,
    commission: platformFee
  };
};
```

---

## Multi-language Internationalization

### Language Support
Supporting 12 major languages:
- 中文 (zh)
- English (en)  
- Español (es)
- Français (fr)
- Deutsch (de)
- 日本語 (ja)
- 한국어 (ko)
- Português (pt)
- Русский (ru)
- العربية (ar)
- हिन्दी (hi)
- Italiano (it)

### Translation System Implementation
```typescript
// Translation Hook
const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  const translate = (key: string): string => {
    return translations[currentLanguage]?.[key] || key;
  };
  
  return { currentLanguage, setCurrentLanguage, translate };
};

// Component usage
<TranslatedText textKey="order.title" fallback="Order Title" />
```

---

## Performance Optimization Strategies

### Frontend Optimization
- **Code Splitting**: Split by routes and functional modules
- **Lazy Loading**: Maps and heavy components loaded on demand
- **Caching Strategy**: React Query intelligent caching
- **Virtualization**: Virtual scrolling for large lists

### Backend Optimization
- **Database Indexing**: Geographic location, status, timestamp indexes
- **Query Optimization**: Avoid N+1 query problems
- **Cache Layer**: Redis caching for hotspot data
- **Connection Pooling**: PostgreSQL connection pool management

### Real-time Stream Optimization
- **Adaptive Bitrate**: Adjust based on network conditions
- **P2P Fallback**: WebRTC peer-to-peer transmission
- **CDN Distribution**: Global content delivery network
- **Smart Routing**: Optimal transmission path selection

---

## Security Measures

### Data Security
- **Input Validation**: Strict Zod schema validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content escaping and CSP policies
- **CSRF Protection**: CSRF token verification

### Payment Security
- **PCI Compliance**: Stripe secure payment processing
- **Encrypted Transmission**: HTTPS/TLS 1.3
- **Key Management**: Environment variable isolation
- **Audit Logs**: Complete transaction records

### Geographic Security
- **Regional Restrictions**: Prohibit high-risk areas
- **Content Moderation**: AI + human review mechanism  
- **Privacy Protection**: Encrypted location data storage
- **Compliance Checks**: Local legal regulation verification

---

## Deployment Architecture

### Development Environment
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Database push
npm run db:push
```

### Production Deployment
```bash
# Build application
npm run build

# Start production server
npm start
```

### Environment Configuration
```env
# Database
DATABASE_URL=postgresql://...
PGHOST=localhost
PGPORT=5432
PGDATABASE=taplive
PGUSER=postgres
PGPASSWORD=password

# Stripe payments
STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_PUBLIC_KEY=pk_...

# Node environment
NODE_ENV=production
PORT=5000
```

---

## Monitoring and Logging

### Application Monitoring
- **Health Checks**: `/healthz` endpoint monitoring
- **Performance Metrics**: Response time, error rate statistics
- **Resource Monitoring**: CPU, memory, database usage
- **User Behavior**: Order creation, payment success rates

### Error Handling
- **Global Error Capture**: React Error Boundary
- **API Error Handling**: Unified error response format
- **Log Recording**: Structured log output
- **Alert Mechanism**: Real-time critical error notifications

---

## Testing Strategy

### Unit Testing
- **Component Testing**: React Testing Library
- **API Testing**: Jest + Supertest
- **Utility Function Testing**: Pure function unit tests

### Integration Testing
- **End-to-End Testing**: Playwright/Cypress
- **API Integration Testing**: Complete flow verification
- **Payment Testing**: Stripe test environment

### Performance Testing
- **Load Testing**: Concurrent order processing capability
- **Stress Testing**: System limit testing
- **Streaming Testing**: Multi-concurrent stream stability

---

## Technical Debt and Future Planning

### MVP Phase Limitations
- Simplified user authentication (no complete registration/login)
- Basic memory storage (upgradeable to database)
- Limited error handling and retry mechanisms
- Basic UI/UX design

### Future Iteration Plans
1. **User System**: Complete user registration, login, permission management
2. **Data Persistence**: Comprehensive database integration and migration
3. **High Availability Architecture**: Microservices architecture, containerized deployment
4. **AI Intelligence**: Smart order matching, content moderation
5. **Blockchain Integration**: Decentralized payments, smart contracts

### Scalability Considerations
- **Horizontal Scaling**: Multi-instance load balancing
- **Database Sharding**: Geographic location sharding strategy  
- **Microservice Decomposition**: Independent order, payment, streaming services
- **Edge Computing**: CDN edge node deployment

---

This technical implementation guide provides a complete technical architecture overview of the TapLive MVP platform, covering all core technical details from database design to frontend implementation, from payment integration to real-time communication. Development teams can use this guide for specific feature development and optimization work.