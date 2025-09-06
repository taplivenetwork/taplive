# TapLive 技术架构设计

## 🏗️ 系统架构概览

TapLive采用现代化的全栈架构，结合WebRTC实时通信技术、响应式前端设计和可扩展后端服务，构建高性能的实时视频流平台。

### 架构设计原则

1. **高性能** - 支持大规模并发用户和实时视频流
2. **可扩展** - 支持从MVP到全球平台的无缝扩展
3. **高可用** - 99.9%以上的服务可用性保证
4. **用户友好** - 直观的用户界面和流畅的用户体验
5. **国际化** - 支持多语言和全球化部署

## 🎨 前端架构

### 技术栈

```typescript
// 核心框架和库
React 18.x          // 用户界面构建
TypeScript 5.x      // 类型安全的JavaScript
Vite 4.x           // 快速开发构建工具

// UI和样式
shadcn/ui          // 现代化组件库  
Tailwind CSS 3.x   // 实用优先的CSS框架
Radix UI           // 无障碍的原始组件
Lucide React       // 现代图标库

// 状态管理和数据
TanStack React Query // 服务器状态管理
React Hook Form     // 高性能表单处理
Zod                // 运行时类型验证

// 路由和国际化
Wouter             // 轻量级路由库
自定义翻译系统       // 支持5种语言
```

### 组件架构

```
src/
├── components/
│   ├── ui/                    # 基础UI组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── video/                 # 视频相关组件
│   │   ├── live-stream-card.tsx
│   │   ├── native-webrtc-broadcaster.tsx
│   │   └── video-grid.tsx
│   ├── orders/                # 订单相关组件
│   │   ├── order-form.tsx
│   │   ├── order-list.tsx
│   │   └── order-details.tsx
│   └── layout/                # 布局组件
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── mobile-nav.tsx
├── pages/                     # 页面组件
│   ├── home.tsx
│   ├── orders.tsx
│   ├── stream.tsx
│   └── create.tsx
├── hooks/                     # 自定义Hooks
│   ├── useSimpleTranslation.ts
│   ├── useWebRTC.ts
│   └── useGeolocation.ts
├── lib/                       # 工具函数
│   ├── api.ts
│   ├── queryClient.ts
│   └── utils.ts
└── shared/                    # 共享类型定义
    └── schema.ts
```

### 响应式设计

```scss
// 移动优先的断点系统
sm: 640px    // 小屏设备
md: 768px    // 平板设备  
lg: 1024px   // 桌面设备
xl: 1280px   // 大屏设备
2xl: 1536px  // 超大屏设备

// 核心响应式策略
- 移动端：单列布局，底部导航
- 平板端：两列布局，侧边栏导航
- 桌面端：多列布局，完整功能面板
```

### WebRTC集成

```typescript
// WebRTC广播器组件架构
interface WebRTCBroadcaster {
  // 核心功能
  startBroadcast(): Promise<void>
  stopBroadcast(): void
  switchCamera(): void
  
  // 状态管理
  isStreaming: boolean
  isConnected: boolean
  needsUserClick: boolean
  
  // 事件处理
  onStreamStart(): void
  onStreamEnd(): void
  onError(error: Error): void
}

// 支持的功能
- 原生WebRTC直播
- 前后摄像头切换
- 自动状态检测和修复
- 跨平台兼容性
```

## ⚙️ 后端架构

### 技术栈

```typescript
// 核心框架
Node.js 20.x       // JavaScript运行时
Express.js 4.x     // Web应用框架
TypeScript 5.x     // 类型安全

// 数据库和ORM
PostgreSQL 15.x    // 关系型数据库
Drizzle ORM       // 类型安全的ORM
Neon Database     // 无服务器PostgreSQL

// 实时通信
WebSocket (ws)    // 实时双向通信
WebRTC           // 点对点视频流

// 开发工具
tsx              // TypeScript执行器
Vite             // 开发服务器集成
```

### 服务器架构

```
server/
├── index.ts              # 应用入口点
├── routes.ts             # API路由定义
├── storage.ts            # 数据存储层
├── db.ts                 # 数据库连接
└── vite.ts              # Vite开发服务器集成

shared/
├── schema.ts             # 共享数据模型
├── dispatch.ts           # 派单系统类型
├── geo-safety.ts         # 地理安全类型
├── payment.ts            # 支付系统类型
└── aa-group.ts          # AA分账类型
```

### API设计

```typescript
// RESTful API接口设计
GET    /api/orders              # 获取订单列表
POST   /api/orders              # 创建新订单
GET    /api/orders/:id          # 获取订单详情
PUT    /api/orders/:id          # 更新订单状态
DELETE /api/orders/:id          # 删除订单

GET    /api/users/:id           # 获取用户信息
POST   /api/users               # 创建用户
PUT    /api/users/:id           # 更新用户信息

// WebSocket事件
connection                      # 客户端连接
broadcaster-ready               # 广播器就绪
viewer-join                     # 观众加入
stream-data                     # 流数据传输
```

### 数据模型

```typescript
// 核心数据模型
interface Order {
  id: string
  title: string
  description: string
  latitude: string
  longitude: string
  price: string
  currency: 'USD'
  status: OrderStatus
  type: 'single' | 'group'
  maxParticipants: number
  currentParticipants: number
  createdAt: Date
  // ... 更多字段
}

interface User {
  id: string
  username: string
  email: string
  name: string
  avatar: string
  role: 'creator' | 'provider'
  rating: string
  completedOrders: number
  // ... 更多字段
}

// 支持的订单状态
type OrderStatus = 
  | 'pending'      // 待确认
  | 'open'         // 开放中
  | 'accepted'     // 已接受
  | 'live'         // 直播中
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
```

## 🗄️ 数据库设计

### 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  avatar VARCHAR,
  role VARCHAR CHECK (role IN ('creator', 'provider')),
  rating DECIMAL(3,2),
  total_ratings INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 订单表  
CREATE TABLE orders (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  creator_id VARCHAR REFERENCES users(id),
  provider_id VARCHAR REFERENCES users(id),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'USD',
  status VARCHAR NOT NULL,
  type VARCHAR CHECK (type IN ('single', 'group')),
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 评价表
CREATE TABLE ratings (
  id VARCHAR PRIMARY KEY,
  order_id VARCHAR REFERENCES orders(id),
  reviewer_id VARCHAR REFERENCES users(id),
  reviewee_id VARCHAR REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 索引优化

```sql
-- 地理位置查询优化
CREATE INDEX idx_orders_location ON orders (latitude, longitude);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);

-- 用户查询优化
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_rating ON users (rating DESC);
```

## 🔄 实时通信架构

### WebSocket连接管理

```typescript
// WebSocket服务器配置
const wss = new WebSocketServer({ 
  server: httpServer, 
  path: '/ws' 
});

// 连接管理
interface Connection {
  id: string
  userId?: string
  streamId?: string
  role: 'broadcaster' | 'viewer'
  ws: WebSocket
}

// 消息类型定义
type WSMessage = 
  | { type: 'broadcaster-ready', streamId: string }
  | { type: 'viewer-join', streamId: string }
  | { type: 'stream-data', data: any }
  | { type: 'connection-status', status: string }
```

### WebRTC信令服务器

```typescript
// WebRTC信令处理
class SignalingServer {
  private connections = new Map<string, Connection>()
  
  handleOffer(streamId: string, offer: RTCSessionDescription) {
    // 处理连接提议
  }
  
  handleAnswer(streamId: string, answer: RTCSessionDescription) {
    // 处理连接应答
  }
  
  handleIceCandidate(streamId: string, candidate: RTCIceCandidate) {
    // 处理ICE候选者
  }
}
```

## 🎯 性能优化

### 前端性能优化

```typescript
// 代码分割和懒加载
const StreamPage = lazy(() => import('./pages/stream'))
const OrdersPage = lazy(() => import('./pages/orders'))

// 图片优化
const optimizedImages = {
  placeholder: '/images/placeholder-blur.jpg',
  loading: 'lazy',
  sizes: '(max-width: 768px) 100vw, 50vw'
}

// 缓存策略
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5分钟
      cacheTime: 10 * 60 * 1000,   // 10分钟
      refetchOnWindowFocus: false,
    },
  },
})
```

### 后端性能优化

```typescript
// 连接池配置
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,                    // 最大连接数
  idleTimeoutMillis: 30000,   // 空闲超时
  connectionTimeoutMillis: 2000, // 连接超时
})

// 缓存策略
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

// API限流
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 100个请求
}
```

### WebRTC优化

```typescript
// WebRTC配置优化
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
}

// 视频编码优化
const videoConstraints = {
  width: { min: 640, ideal: 1280, max: 1920 },
  height: { min: 480, ideal: 720, max: 1080 },
  frameRate: { min: 15, ideal: 30, max: 60 },
  facingMode: 'user' // 前置摄像头
}
```

## 🔒 安全架构

### 数据安全

```typescript
// 输入验证
const orderSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  price: z.number().positive(),
})

// SQL注入防护
const safeQuery = `
  SELECT * FROM orders 
  WHERE latitude BETWEEN $1 AND $2 
  AND longitude BETWEEN $3 AND $4
`
```

### WebRTC安全

```typescript
// STUN/TURN服务器安全配置
const secureRTCConfig = {
  iceServers: [
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ],
  iceCandidatePoolSize: 10,
}

// 流访问控制
const streamAccess = {
  validateViewer: (streamId: string, userId?: string) => {
    // 验证观众访问权限
  },
  validateBroadcaster: (streamId: string, userId: string) => {
    // 验证广播者权限
  }
}
```

## 📱 移动端适配

### 响应式布局

```scss
// 移动端优化
@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .mobile-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
  }
}
```

### 触摸交互优化

```typescript
// 触摸手势支持
const touchHandlers = {
  onTouchStart: (e: TouchEvent) => {
    // 触摸开始
  },
  onTouchMove: (e: TouchEvent) => {
    // 触摸移动
  },
  onTouchEnd: (e: TouchEvent) => {
    // 触摸结束
  }
}
```

## 🌍 国际化架构

### 多语言支持

```typescript
// 支持的语言
const SUPPORTED_LANGUAGES = [
  'en', // 英语（默认）
  'zh', // 中文
  'ja', // 日语
  'ko', // 韩语
  'es'  // 西班牙语
]

// 翻译组件
const T = ({ children, values }: TransProps) => {
  const { t } = useSimpleTranslation()
  return <>{t(children, values)}</>
}

// 使用示例
<T>创建新订单</T>
```

### 本地化数据

```json
{
  "en": {
    "orders.create.title": "Create New Order",
    "orders.list.empty": "No orders found",
    "stream.status.live": "Live",
    "stream.status.ended": "Ended"
  },
  "zh": {
    "orders.create.title": "创建新订单", 
    "orders.list.empty": "未找到订单",
    "stream.status.live": "直播中",
    "stream.status.ended": "已结束"
  }
}
```

## 🚀 部署架构

### 开发环境

```bash
# 开发服务器启动
npm run dev

# 同时启动前后端服务
- Frontend: Vite Dev Server (HMR)
- Backend: Express Server (tsx watch mode)
- Database: Neon PostgreSQL (serverless)
```

### 生产部署

```dockerfile
# 多阶段构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

### 监控和日志

```typescript
// 应用监控
const monitoring = {
  errorTracking: 'Sentry',
  performanceMonitoring: 'New Relic',
  logAggregation: 'Winston + CloudWatch',
  uptime: 'Pingdom'
}

// 关键指标
const metrics = {
  responseTime: '< 200ms (p95)',
  availability: '99.9%',
  errorRate: '< 0.1%',
  concurrentUsers: '1000+',
  videoBandwidth: '1080p @ 30fps'
}
```

## 📊 扩展性设计

### 水平扩展

```typescript
// 负载均衡配置
const loadBalancer = {
  algorithm: 'round-robin',
  healthCheck: '/api/health',
  maxConnections: 1000,
  timeout: 30000
}

// 微服务架构迁移路径
const microservices = {
  userService: 'users 和 authentication',
  orderService: 'orders 和 matching',
  streamService: 'WebRTC 和 media',
  paymentService: 'payments 和 billing'
}
```

### 数据库扩展

```sql
-- 数据库分片策略
-- 按地理位置分片
CREATE TABLE orders_asia (...) INHERITS (orders);
CREATE TABLE orders_europe (...) INHERITS (orders);
CREATE TABLE orders_americas (...) INHERITS (orders);

-- 读写分离
-- 主数据库：写操作
-- 从数据库：读操作
```

---

**这个技术架构设计为TapLive平台提供了坚实的技术基础，支持从MVP到大规模商业化应用的平滑过渡。通过现代化的技术栈和最佳实践，确保平台的高性能、高可用性和良好的用户体验。**