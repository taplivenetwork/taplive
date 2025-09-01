# TapLive - 完整开发者手册
## 全方位API文档、SDK集成与开发指南

![Developer Handbook](https://img.shields.io/badge/Handbook-Complete%20Developer%20Guide-blue?style=for-the-badge)
![API Version](https://img.shields.io/badge/API-v1.0%20Stable-green?style=flat-square)
![SDK Support](https://img.shields.io/badge/SDK-Multi%20Language-purple?style=flat-square)

---

## 🎯 **开发者文档概览**

### **文档结构导航**
本开发者手册为TapLive平台的完整技术文档，涵盖从快速入门到高级集成的所有开发需求。

```
├── 🚀 快速开始指南
├── 🔑 API认证与授权  
├── 📊 核心API文档
├── 🛠️ SDK使用指南
├── 💻 代码示例集合
├── 🔌 Webhook集成
├── 🧪 测试与调试
└── 📈 最佳实践
```

### **支持的开发语言和框架**
```typescript
const SupportedTechnologies = {
  // 后端语言
  backend: [
    "Node.js (TypeScript/JavaScript)",
    "Python (FastAPI/Django)",
    "Go (Gin/Echo)",
    "Java (Spring Boot)",
    "PHP (Laravel)",
    "Ruby (Rails)",
    "C# (.NET Core)"
  ],
  
  // 前端框架
  frontend: [
    "React/Next.js",
    "Vue.js/Nuxt.js", 
    "Angular",
    "Svelte/SvelteKit",
    "Vanilla JavaScript",
    "TypeScript"
  ],
  
  // 移动开发
  mobile: [
    "React Native",
    "Flutter (Dart)",
    "Swift (iOS)",
    "Kotlin (Android)",
    "Xamarin"
  ]
};
```

---

## 🚀 **快速开始指南**

### **环境准备**

#### **1. 账户注册和API密钥获取**
```bash
# 1. 注册开发者账户
curl -X POST https://api.taplive.com/v1/developers/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "name": "Your Name",
    "company": "Your Company",
    "project": "Your Project Description"
  }'

# 2. 获取API密钥(注册成功后通过邮件接收)
export TAPLIVE_API_KEY="sk_live_your_secret_key_here"
export TAPLIVE_PUBLIC_KEY="pk_live_your_public_key_here"
```

#### **2. 开发环境配置**
```javascript
// package.json
{
  "dependencies": {
    "@taplive/sdk": "^1.0.0",
    "@taplive/react": "^1.0.0",
    "@taplive/types": "^1.0.0"
  }
}

// 安装SDK
npm install @taplive/sdk
# 或者
yarn add @taplive/sdk
```

#### **3. 基础配置设置**
```typescript
// config/taplive.ts
import { TapLiveClient } from '@taplive/sdk';

export const tapLiveClient = new TapLiveClient({
  apiKey: process.env.TAPLIVE_API_KEY!,
  publicKey: process.env.TAPLIVE_PUBLIC_KEY!,
  environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  
  // 可选配置
  timeout: 10000,
  retries: 3,
  baseURL: 'https://api.taplive.com/v1'
});
```

### **30秒快速集成示例**

#### **创建第一个订单**
```typescript
// examples/create-order.ts
import { tapLiveClient } from '../config/taplive';

async function createBasicOrder() {
  try {
    const order = await tapLiveClient.orders.create({
      title: "东京塔实时直播",
      description: "请在东京塔顶层进行15分钟实时直播",
      
      // 地理位置 (东京塔坐标)
      latitude: 35.6586,
      longitude: 139.7454,
      address: "东京塔, 日本东京",
      
      // 订单详情
      price: 50.00,
      currency: "USD",
      duration: 15, // 分钟
      category: "tourism",
      
      // 创建者信息
      creatorId: "user_123456789"
    });
    
    console.log("订单创建成功:", order);
    return order;
    
  } catch (error) {
    console.error("订单创建失败:", error);
    throw error;
  }
}

// 使用示例
createBasicOrder()
  .then(order => console.log(`订单ID: ${order.id}`))
  .catch(error => console.error("错误:", error.message));
```

#### **监听订单状态变化**
```typescript
// examples/order-tracking.ts
import { tapLiveClient } from '../config/taplive';

// WebSocket实时状态监听
function trackOrderStatus(orderId: string) {
  const subscription = tapLiveClient.orders.subscribe(orderId, {
    onStatusChange: (order) => {
      console.log(`订单 ${orderId} 状态变更为: ${order.status}`);
      
      switch (order.status) {
        case 'open':
          console.log("订单已发布，等待提供者接单");
          break;
        case 'accepted':
          console.log(`提供者 ${order.providerId} 已接单`);
          break;
        case 'live':
          console.log("直播已开始:", order.liveUrl);
          break;
        case 'completed':
          console.log("订单已完成");
          subscription.close();
          break;
      }
    },
    
    onProviderMatch: (provider) => {
      console.log("找到匹配提供者:", provider);
    },
    
    onError: (error) => {
      console.error("订单追踪错误:", error);
    }
  });
  
  return subscription;
}

// 使用示例
const subscription = trackOrderStatus("order_abc123");

// 5分钟后自动关闭监听
setTimeout(() => {
  subscription.close();
  console.log("停止订单状态监听");
}, 5 * 60 * 1000);
```

---

## 🔑 **API认证与授权**

### **认证机制**

#### **API密钥认证**
```typescript
// 基础API密钥认证
const headers = {
  'Authorization': `Bearer ${TAPLIVE_API_KEY}`,
  'Content-Type': 'application/json',
  'X-TapLive-Version': '2024-01-01'
};

// 示例请求
const response = await fetch('https://api.taplive.com/v1/orders', {
  method: 'GET',
  headers
});
```

#### **JWT Token认证(用户上下文)**
```typescript
// 获取用户JWT Token
async function getUserToken(userId: string): Promise<string> {
  const response = await tapLiveClient.auth.generateUserToken({
    userId,
    permissions: ['orders:read', 'orders:create', 'streams:view'],
    expiresIn: '24h'
  });
  
  return response.token;
}

// 使用用户Token进行请求
const userToken = await getUserToken('user_123456789');
const userHeaders = {
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json'
};
```

#### **Webhook签名验证**
```typescript
// 验证Webhook签名安全性
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js中间件示例
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-taplive-signature'] as string;
  const payload = req.body.toString();
  
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // 处理webhook事件
  const event = JSON.parse(payload);
  console.log('接收到事件:', event);
  
  res.status(200).send('OK');
});
```

### **权限系统**

#### **权限范围(Scopes)**
```typescript
// 权限范围定义
const ApiScopes = {
  // 订单权限
  'orders:read': '读取订单信息',
  'orders:create': '创建新订单',
  'orders:update': '更新订单状态',
  'orders:delete': '删除订单',
  
  // 用户权限
  'users:read': '读取用户档案',
  'users:update': '更新用户信息',
  
  // 实时流权限
  'streams:view': '观看实时流',
  'streams:create': '创建实时流',
  'streams:control': '控制流设置',
  
  // 支付权限
  'payments:read': '读取支付信息',
  'payments:process': '处理支付',
  
  // 数据权限
  'analytics:read': '读取分析数据',
  'reports:generate': '生成报告'
};

// 申请特定权限的API密钥
const restrictedClient = new TapLiveClient({
  apiKey: TAPLIVE_API_KEY,
  scopes: ['orders:read', 'orders:create', 'streams:view']
});
```

---

## 📊 **核心API文档**

### **订单管理API**

#### **创建订单 - POST /v1/orders**
```typescript
// 请求接口定义
interface CreateOrderRequest {
  title: string;                    // 订单标题
  description: string;              // 详细描述
  latitude: number;                 // 纬度 (-90 to 90)
  longitude: number;                // 经度 (-180 to 180)
  address?: string;                 // 地址描述
  price: number;                    // 价格
  currency: string;                 // 货币代码 (USD, EUR, CNY 等)
  duration: number;                 // 时长(分钟)
  category?: string;                // 分类
  tags?: string[];                  // 标签
  scheduledAt?: string;             // 预约时间 (ISO 8601)
  maxParticipants?: number;         // 最大参与者数
  requirements?: string;            // 特殊要求
  creatorId: string;                // 创建者ID
}

// 响应接口定义
interface CreateOrderResponse {
  success: boolean;
  data: {
    id: string;
    status: 'pending' | 'open' | 'accepted' | 'live' | 'completed' | 'cancelled';
    title: string;
    description: string;
    location: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    pricing: {
      price: number;
      currency: string;
      platformFee: number;
    };
    timing: {
      duration: number;
      scheduledAt?: string;
      createdAt: string;
      updatedAt: string;
    };
    participants: {
      creatorId: string;
      providerId?: string;
      maxParticipants: number;
      currentParticipants: number;
    };
    metadata: {
      category?: string;
      tags?: string[];
      requirements?: string;
    };
  };
  message: string;
}

// 完整使用示例
async function createAdvancedOrder(): Promise<CreateOrderResponse> {
  const orderData: CreateOrderRequest = {
    title: "风机叶片专业检测",
    description: "需要专业工程师使用AR设备对风机叶片进行详细检测，识别潜在损伤和磨损情况",
    
    // 海上风电场坐标
    latitude: 54.9835,
    longitude: 1.6174,
    address: "北海海上风电场, 英国",
    
    // 定价信息
    price: 299.99,
    currency: "USD",
    
    // 时间安排
    duration: 120, // 2小时
    scheduledAt: "2024-03-15T09:00:00Z",
    
    // 分类和标签
    category: "industrial_inspection",
    tags: ["wind_energy", "ar_inspection", "engineering", "safety"],
    
    // 参与者设置
    maxParticipants: 3, // 检测工程师 + 2个观察员
    
    // 专业要求
    requirements: JSON.stringify({
      certifications: ["Wind Turbine Inspector Level 2", "AR Device Proficiency"],
      equipment: ["AR Headset", "High-Resolution Camera", "Measurement Tools"],
      experience: "5+ years wind turbine maintenance",
      safety: "Offshore safety certification required"
    }),
    
    creatorId: "user_wind_operator_001"
  };
  
  try {
    const response = await fetch('https://api.taplive.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAPLIVE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result: CreateOrderResponse = await response.json();
    return result;
    
  } catch (error) {
    console.error('创建订单失败:', error);
    throw error;
  }
}
```

#### **查询订单 - GET /v1/orders**
```typescript
// 查询参数接口
interface OrderQueryParams {
  // 地理过滤
  latitude?: number;
  longitude?: number;
  radius?: number;               // 半径(公里)
  
  // 状态过滤
  status?: 'pending' | 'open' | 'accepted' | 'live' | 'completed' | 'cancelled';
  
  // 时间过滤
  createdAfter?: string;         // ISO 8601
  createdBefore?: string;
  scheduledAfter?: string;
  scheduledBefore?: string;
  
  // 价格过滤
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  
  // 分类过滤
  category?: string;
  tags?: string;                 // 逗号分隔的标签
  
  // 排序选项
  sortBy?: 'created_at' | 'price' | 'distance' | 'rating';
  sortOrder?: 'asc' | 'desc';
  
  // 分页参数
  page?: number;
  limit?: number;               // 每页数量 (1-100)
  
  // 包含字段
  include?: string;             // 'creator,provider,ratings'
}

// 高级查询示例
async function searchOrders(params: OrderQueryParams) {
  const queryString = new URLSearchParams();
  
  // 构建查询字符串
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryString.append(key, value.toString());
    }
  });
  
  const response = await fetch(
    `https://api.taplive.com/v1/orders?${queryString.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${TAPLIVE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const result = await response.json();
  return result;
}

// 使用示例：搜索附近的实时流订单
const nearbyOrders = await searchOrders({
  latitude: 35.6762,
  longitude: 139.6503,
  radius: 10,                   // 10公里半径
  status: 'live',
  category: 'tourism',
  sortBy: 'distance',
  limit: 20,
  include: 'creator,provider'
});
```

#### **更新订单状态 - PATCH /v1/orders/{id}**
```typescript
// 更新订单接口
interface UpdateOrderRequest {
  status?: 'pending' | 'open' | 'accepted' | 'live' | 'completed' | 'cancelled';
  providerId?: string;          // 接单提供者ID
  liveUrl?: string;             // 直播链接
  completedAt?: string;         // 完成时间
  cancelReason?: string;        // 取消原因
  notes?: string;               // 备注信息
}

// 状态更新示例
async function updateOrderStatus(orderId: string, updates: UpdateOrderRequest) {
  const response = await fetch(`https://api.taplive.com/v1/orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${TAPLIVE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`更新失败: ${error.message}`);
  }
  
  return response.json();
}

// 提供者接单
await updateOrderStatus('order_abc123', {
  status: 'accepted',
  providerId: 'provider_xyz789'
});

// 开始直播
await updateOrderStatus('order_abc123', {
  status: 'live',
  liveUrl: 'https://stream.taplive.com/live/order_abc123'
});

// 完成订单
await updateOrderStatus('order_abc123', {
  status: 'completed',
  completedAt: new Date().toISOString(),
  notes: '订单成功完成，客户满意度很高'
});
```

### **用户管理API**

#### **用户档案 - GET /v1/users/{id}**
```typescript
// 用户档案接口
interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  
  // 评价系统
  rating: number;               // 1-5评分
  totalRatings: number;
  completedOrders: number;
  
  // 性能指标
  responseTime: number;         // 平均响应时间(秒)
  trustScore: number;           // 信任分数 (0-100)
  
  // 地理位置
  location?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  
  // 可用性
  availability: boolean;
  dispatchScore: number;        // AI计算的调度评分
  
  // 专业信息
  skills?: string[];
  certifications?: Certification[];
  languages?: string[];
  
  // 财务信息
  totalEarnings: number;
  preferredPaymentMethod: string;
  
  // 社交信息
  socialScore: number;
  followers: number;
  following: number;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

// 认证信息接口
interface Certification {
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  verificationUrl?: string;
  verified: boolean;
}

// 获取用户档案
async function getUserProfile(userId: string): Promise<UserProfile> {
  const response = await fetch(`https://api.taplive.com/v1/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${TAPLIVE_API_KEY}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`获取用户档案失败: ${response.statusText}`);
  }
  
  return response.json();
}
```

#### **更新用户档案 - PATCH /v1/users/{id}**
```typescript
// 更新用户档案
interface UpdateUserRequest {
  name?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  availability?: boolean;
  skills?: string[];
  languages?: string[];
  preferredPaymentMethod?: string;
}

async function updateUserProfile(
  userId: string, 
  updates: UpdateUserRequest
): Promise<UserProfile> {
  const response = await fetch(`https://api.taplive.com/v1/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${TAPLIVE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  return response.json();
}

// 更新示例
await updateUserProfile('user_123', {
  availability: true,
  location: {
    latitude: 35.6762,
    longitude: 139.6503
  },
  skills: ['风机检测', 'AR技术', '工程测量'],
  languages: ['zh', 'en', 'ja']
});
```

### **实时流媒体API**

#### **创建流媒体会话 - POST /v1/streams**
```typescript
// 流媒体会话接口
interface CreateStreamRequest {
  orderId: string;
  type: 'webrtc' | 'hls' | 'rtmp';
  quality: '720p' | '1080p' | '4k';
  participants: string[];        // 参与者用户ID列表
  settings?: {
    audioBitrate?: number;       // 音频比特率
    videoBitrate?: number;       // 视频比特率
    framerate?: number;          // 帧率
    enableRecording?: boolean;   // 是否录制
    watermark?: boolean;         // 是否添加水印
  };
}

interface StreamSession {
  id: string;
  orderId: string;
  type: string;
  status: 'initializing' | 'active' | 'paused' | 'ended';
  
  // 连接信息
  connectionInfo: {
    signaling: string;           // 信令服务器URL
    iceServers: RTCIceServer[];  // ICE服务器配置
    streamKey?: string;          // 流密钥(RTMP)
    playbackUrl?: string;        // 播放URL(HLS)
  };
  
  // 参与者信息
  participants: {
    userId: string;
    role: 'broadcaster' | 'viewer';
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
    joinedAt: string;
  }[];
  
  // 质量统计
  stats?: {
    viewerCount: number;
    avgBitrate: number;
    packetLoss: number;
    latency: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

// 创建流媒体会话
async function createStreamSession(request: CreateStreamRequest): Promise<StreamSession> {
  const response = await fetch('https://api.taplive.com/v1/streams', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TAPLIVE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  
  return response.json();
}

// 使用示例
const streamSession = await createStreamSession({
  orderId: 'order_abc123',
  type: 'webrtc',
  quality: '1080p',
  participants: ['creator_user_001', 'provider_user_002'],
  settings: {
    enableRecording: true,
    watermark: true,
    framerate: 30
  }
});
```

#### **流媒体统计 - GET /v1/streams/{id}/stats**
```typescript
// 实时统计接口
interface StreamStats {
  sessionId: string;
  orderId: string;
  
  // 实时指标
  realtime: {
    viewerCount: number;
    avgBitrate: number;         // kbps
    peakBitrate: number;
    currentLatency: number;     // ms
    packetLoss: number;         // %
    jitter: number;             // ms
  };
  
  // 累计统计
  cumulative: {
    totalViewTime: number;      // 总观看时长(秒)
    totalViewers: number;       // 总观看人数
    peakConcurrentViewers: number;
    avgSessionDuration: number; // 平均会话时长
    totalDataTransfer: number;  // 总传输数据(MB)
  };
  
  // 质量分析
  quality: {
    overallScore: number;       // 0-100质量分数
    videoQuality: number;       // 视频质量评分
    audioQuality: number;       // 音频质量评分
    stabilityScore: number;     // 稳定性评分
    bufferingEvents: number;    // 缓冲事件次数
  };
  
  // 地理分布
  geographic: {
    region: string;
    viewersByCountry: { [country: string]: number };
    avgLatencyByRegion: { [region: string]: number };
  };
  
  timestamp: string;
}

// 获取流媒体统计
async function getStreamStats(streamId: string): Promise<StreamStats> {
  const response = await fetch(`https://api.taplive.com/v1/streams/${streamId}/stats`, {
    headers: {
      'Authorization': `Bearer ${TAPLIVE_API_KEY}`
    }
  });
  
  return response.json();
}

// 实时统计监控
function monitorStreamStats(streamId: string, callback: (stats: StreamStats) => void) {
  const interval = setInterval(async () => {
    try {
      const stats = await getStreamStats(streamId);
      callback(stats);
      
      // 自动质量警报
      if (stats.realtime.packetLoss > 5) {
        console.warn(`⚠️ 高丢包率: ${stats.realtime.packetLoss}%`);
      }
      
      if (stats.realtime.currentLatency > 5000) {
        console.warn(`⚠️ 高延迟: ${stats.realtime.currentLatency}ms`);
      }
      
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  }, 5000); // 每5秒更新
  
  return () => clearInterval(interval);
}

// 使用示例
const stopMonitoring = monitorStreamStats('stream_xyz789', (stats) => {
  console.log(`观看人数: ${stats.realtime.viewerCount}`);
  console.log(`延迟: ${stats.realtime.currentLatency}ms`);
  console.log(`质量评分: ${stats.quality.overallScore}/100`);
});
```

### **支付处理API**

#### **创建支付意图 - POST /v1/payments/intents**
```typescript
// 支付意图接口
interface CreatePaymentIntentRequest {
  orderId: string;
  amount: number;                // 金额(最小货币单位)
  currency: string;              // 货币代码
  paymentMethods: string[];      // 支持的支付方式
  metadata?: {                   // 元数据
    [key: string]: string;
  };
  
  // 自动确认设置
  confirmationMethod: 'automatic' | 'manual';
  
  // 分账设置(多方分账)
  transfers?: {
    destination: string;         // 接收方账户
    amount: number;              // 分账金额
    description: string;
  }[];
}

interface PaymentIntent {
  id: string;
  orderId: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 
          'requires_action' | 'processing' | 'succeeded' | 'canceled';
  
  amount: number;
  currency: string;
  
  // 客户端密钥(前端使用)
  clientSecret: string;
  
  // 支付方式
  availablePaymentMethods: PaymentMethod[];
  selectedPaymentMethod?: PaymentMethod;
  
  // 时间信息
  createdAt: string;
  confirmedAt?: string;
  
  // 元数据
  metadata: { [key: string]: string };
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'digital_wallet' | 'cryptocurrency';
  details: {
    brand?: string;              // 卡品牌
    last4?: string;              // 卡号末4位
    expiryMonth?: number;
    expiryYear?: number;
    country?: string;
  };
}

// 创建支付意图
async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<PaymentIntent> {
  const response = await fetch('https://api.taplive.com/v1/payments/intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TAPLIVE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  
  return response.json();
}

// 使用示例
const paymentIntent = await createPaymentIntent({
  orderId: 'order_abc123',
  amount: 5000,                  // $50.00 (以分为单位)
  currency: 'USD',
  paymentMethods: ['card', 'bank_transfer', 'digital_wallet'],
  confirmationMethod: 'automatic',
  
  // 分账: 平台收取10%佣金
  transfers: [
    {
      destination: 'provider_account_xyz',
      amount: 4500,              // $45.00 给提供者
      description: '服务提供费用'
    },
    {
      destination: 'platform_account',
      amount: 500,               // $5.00 平台佣金
      description: '平台服务费'
    }
  ],
  
  metadata: {
    order_title: '东京塔实时直播',
    service_category: 'tourism'
  }
});
```

#### **确认支付 - POST /v1/payments/intents/{id}/confirm**
```typescript
// 确认支付
async function confirmPayment(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<PaymentIntent> {
  const response = await fetch(
    `https://api.taplive.com/v1/payments/intents/${paymentIntentId}/confirm`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAPLIVE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentMethod: paymentMethodId
      })
    }
  );
  
  return response.json();
}
```

---

## 🛠️ **SDK使用指南**

### **JavaScript/TypeScript SDK**

#### **SDK初始化**
```typescript
// @taplive/sdk 完整配置
import { TapLiveSDK } from '@taplive/sdk';

const tapLive = new TapLiveSDK({
  // 必需配置
  apiKey: process.env.TAPLIVE_API_KEY!,
  publicKey: process.env.TAPLIVE_PUBLIC_KEY!,
  
  // 环境配置
  environment: 'sandbox', // 'sandbox' | 'production'
  
  // 请求配置
  timeout: 15000,        // 15秒超时
  retries: 3,            // 重试3次
  backoff: 'exponential', // 指数退避
  
  // 日志配置
  logging: {
    level: 'info',       // 'debug' | 'info' | 'warn' | 'error'
    destination: 'console' // 'console' | 'file' | 'remote'
  },
  
  // 实时通信配置
  realtime: {
    autoConnect: true,   // 自动连接WebSocket
    heartbeat: 30000,    // 30秒心跳
    reconnect: true,     // 自动重连
    maxReconnectAttempts: 5
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 300000,         // 5分钟TTL
    maxSize: 100         // 最大缓存条目数
  },
  
  // 地理位置配置
  geolocation: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  }
});
```

#### **订单管理 - SDK方式**
```typescript
// 订单服务使用
class OrderManager {
  constructor(private sdk: TapLiveSDK) {}
  
  // 创建订单
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    return this.sdk.orders.create(orderData);
  }
  
  // 搜索附近订单
  async findNearbyOrders(location: { lat: number; lng: number; radius: number }) {
    return this.sdk.orders.search({
      location,
      status: ['open', 'live'],
      limit: 20
    });
  }
  
  // 订阅订单状态变化
  subscribeToOrder(orderId: string, callbacks: OrderCallbacks) {
    return this.sdk.orders.subscribe(orderId, {
      onStatusChange: callbacks.onStatusChange,
      onProviderMatch: callbacks.onProviderMatch,
      onStreamStart: callbacks.onStreamStart,
      onCompletion: callbacks.onCompletion,
      onError: callbacks.onError
    });
  }
  
  // 批量操作
  async batchUpdateOrders(updates: BatchOrderUpdate[]): Promise<BatchResult> {
    return this.sdk.orders.batchUpdate(updates);
  }
}

// 使用示例
const orderManager = new OrderManager(tapLive);

// 创建并监听订单
const order = await orderManager.createOrder({
  title: "新宿街头实时直播",
  description: "展示新宿繁华街景，重点介绍当地美食和购物",
  location: { lat: 35.6938, lng: 139.7034 },
  price: 30,
  duration: 20
});

const subscription = orderManager.subscribeToOrder(order.id, {
  onStatusChange: (status) => console.log(`状态变更: ${status}`),
  onProviderMatch: (provider) => console.log(`匹配提供者: ${provider.name}`),
  onStreamStart: (streamUrl) => console.log(`直播开始: ${streamUrl}`),
  onCompletion: () => console.log('订单完成'),
  onError: (error) => console.error('订单错误:', error)
});
```

#### **实时流媒体 - SDK集成**
```typescript
// 流媒体管理器
class StreamManager {
  constructor(private sdk: TapLiveSDK) {}
  
  // 创建多流会话
  async createMultiStreamSession(config: MultiStreamConfig): Promise<StreamSession> {
    const session = await this.sdk.streams.createSession({
      type: 'multi_stream',
      maxStreams: config.maxStreams || 16,
      quality: config.quality || '1080p',
      layout: config.layout || 'grid'
    });
    
    // 设置流媒体事件监听
    session.on('stream_added', this.handleStreamAdded);
    session.on('stream_removed', this.handleStreamRemoved);
    session.on('quality_changed', this.handleQualityChanged);
    
    return session;
  }
  
  // 动态网格布局
  private handleStreamAdded = (stream: MediaStream) => {
    const gridContainer = document.getElementById('stream-grid');
    const streamCount = gridContainer?.children.length || 0;
    
    // 计算最优网格布局
    const { rows, cols } = this.calculateGridLayout(streamCount + 1);
    
    if (gridContainer) {
      gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
      gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    }
    
    // 创建视频元素
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.className = 'stream-video';
    
    gridContainer?.appendChild(video);
  };
  
  private calculateGridLayout(streamCount: number): { rows: number; cols: number } {
    if (streamCount <= 1) return { rows: 1, cols: 1 };
    if (streamCount <= 4) return { rows: 2, cols: 2 };
    if (streamCount <= 9) return { rows: 3, cols: 3 };
    if (streamCount <= 16) return { rows: 4, cols: 4 };
    
    // 更大规模流的优化布局
    const cols = Math.ceil(Math.sqrt(streamCount));
    const rows = Math.ceil(streamCount / cols);
    return { rows, cols };
  }
  
  // 流质量监控
  async monitorStreamQuality(sessionId: string): Promise<QualityMonitor> {
    return this.sdk.streams.createQualityMonitor(sessionId, {
      interval: 5000,      // 5秒监控间隔
      onQualityChange: (quality) => {
        console.log('流质量变化:', quality);
        
        // 自动质量调整
        if (quality.packetLoss > 5) {
          this.adjustStreamQuality(sessionId, 'lower');
        }
      },
      onConnectionIssue: (issue) => {
        console.warn('连接问题:', issue);
        this.handleConnectionIssue(sessionId, issue);
      }
    });
  }
  
  private async adjustStreamQuality(sessionId: string, direction: 'higher' | 'lower') {
    await this.sdk.streams.adjustQuality(sessionId, {
      direction,
      step: 1  // 逐级调整
    });
  }
}
```

### **React SDK组件**

#### **React Hooks**
```typescript
// @taplive/react - React专用Hook
import { 
  useTapLive, 
  useOrder, 
  useStream, 
  useGeolocation,
  useRealtime 
} from '@taplive/react';

// 订单管理Hook
function useOrderManagement() {
  const { sdk } = useTapLive();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createOrder = useCallback(async (orderData: CreateOrderData) => {
    setLoading(true);
    setError(null);
    
    try {
      const order = await sdk.orders.create(orderData);
      setOrders(prev => [...prev, order]);
      return order;
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建订单失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sdk]);
  
  const searchOrders = useCallback(async (params: SearchParams) => {
    setLoading(true);
    try {
      const results = await sdk.orders.search(params);
      setOrders(results.data);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sdk]);
  
  return {
    orders,
    loading,
    error,
    createOrder,
    searchOrders
  };
}

// 实时位置Hook
function useRealtimeLocation() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let watchId: number;
    
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation(position);
          setError(null);
        },
        (err) => {
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setError('地理位置服务不可用');
    }
    
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);
  
  return { location, error };
}
```

#### **React组件示例**
```tsx
// 完整的订单创建组件
import React from 'react';
import { useTapLive, useGeolocation } from '@taplive/react';

interface OrderCreatorProps {
  onOrderCreated?: (order: Order) => void;
}

export const OrderCreator: React.FC<OrderCreatorProps> = ({ onOrderCreated }) => {
  const { sdk } = useTapLive();
  const { location } = useGeolocation();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    duration: 15,
    category: 'tourism'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      alert('请启用地理位置服务');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const order = await sdk.orders.create({
        ...formData,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        creatorId: 'current_user_id' // 从认证上下文获取
      });
      
      onOrderCreated?.(order);
      
      // 重置表单
      setFormData({
        title: '',
        description: '',
        price: 0,
        duration: 15,
        category: 'tourism'
      });
      
    } catch (error) {
      console.error('创建订单失败:', error);
      alert('创建订单失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="order-creator">
      <div className="form-group">
        <label htmlFor="title">订单标题 *</label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="简短描述您需要的服务"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="description">详细描述 *</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="详细说明您的需求和要求"
          rows={4}
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="price">价格 (USD) *</label>
          <input
            id="price"
            type="number"
            min="1"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="duration">时长 (分钟) *</label>
          <input
            id="duration"
            type="number"
            min="5"
            max="480"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="category">分类</label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
        >
          <option value="tourism">旅游观光</option>
          <option value="education">教育培训</option>
          <option value="business">商务会议</option>
          <option value="entertainment">娱乐表演</option>
          <option value="sports">体育运动</option>
          <option value="food">美食探店</option>
          <option value="shopping">购物指南</option>
          <option value="cultural">文化艺术</option>
        </select>
      </div>
      
      {location && (
        <div className="location-info">
          <h4>当前位置</h4>
          <p>
            纬度: {location.coords.latitude.toFixed(6)}<br/>
            经度: {location.coords.longitude.toFixed(6)}<br/>
            精度: ±{location.coords.accuracy}米
          </p>
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={isSubmitting || !location}
        className="submit-button"
      >
        {isSubmitting ? '创建中...' : '创建订单'}
      </button>
    </form>
  );
};
```

---

## 🔌 **Webhook集成**

### **Webhook事件类型**

#### **订单事件**
```typescript
// Webhook事件类型定义
interface WebhookEvent {
  id: string;
  type: string;
  created: number;              // Unix时间戳
  data: {
    object: any;               // 事件相关的对象
    previous_attributes?: any; // 变更前的属性
  };
  api_version: string;
  request?: {
    id: string;
    idempotency_key?: string;
  };
}

// 订单相关事件
const OrderWebhookEvents = {
  'order.created': '订单创建',
  'order.updated': '订单更新',
  'order.status_changed': '订单状态变更',
  'order.accepted': '订单被接受',
  'order.cancelled': '订单被取消',
  'order.completed': '订单完成',
  'order.dispute_created': '订单争议创建',
  'order.payment_succeeded': '订单支付成功',
  'order.payment_failed': '订单支付失败'
};

// 流媒体相关事件
const StreamWebhookEvents = {
  'stream.started': '直播开始',
  'stream.ended': '直播结束',
  'stream.quality_changed': '直播质量变化',
  'stream.viewer_joined': '观众加入',
  'stream.viewer_left': '观众离开',
  'stream.recording_ready': '录制文件准备就绪'
};

// 用户相关事件
const UserWebhookEvents = {
  'user.created': '用户注册',
  'user.updated': '用户信息更新',
  'user.location_changed': '用户位置变更',
  'user.availability_changed': '用户可用性变更',
  'user.rating_updated': '用户评分更新'
};
```

#### **Webhook处理器实现**
```typescript
// Express.js Webhook处理器
import express from 'express';
import crypto from 'crypto';

const app = express();

// Webhook签名验证中间件
function verifyWebhookSignature(req: express.Request, res: express.Response, next: express.NextFunction) {
  const signature = req.headers['x-taplive-signature'] as string;
  const timestamp = req.headers['x-taplive-timestamp'] as string;
  const rawBody = req.body;
  
  if (!signature || !timestamp) {
    return res.status(400).send('Missing signature or timestamp');
  }
  
  // 检查时间戳(防止重放攻击)
  const now = Math.floor(Date.now() / 1000);
  const webhookTimestamp = parseInt(timestamp);
  
  if (Math.abs(now - webhookTimestamp) > 300) { // 5分钟容忍度
    return res.status(400).send('Request timestamp too old');
  }
  
  // 验证签名
  const expectedSignature = crypto
    .createHmac('sha256', process.env.TAPLIVE_WEBHOOK_SECRET!)
    .update(timestamp + '.' + rawBody)
    .digest('hex');
    
  const providedSignature = signature.replace('v1=', '');
  
  if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature))) {
    return res.status(401).send('Invalid signature');
  }
  
  next();
}

// 原始body解析中间件
app.use('/webhook', express.raw({ type: 'application/json' }));

// Webhook端点
app.post('/webhook', verifyWebhookSignature, (req, res) => {
  const event: WebhookEvent = JSON.parse(req.body.toString());
  
  console.log(`接收到Webhook事件: ${event.type}`);
  
  // 路由到具体处理器
  switch (event.type) {
    case 'order.created':
      handleOrderCreated(event);
      break;
      
    case 'order.status_changed':
      handleOrderStatusChanged(event);
      break;
      
    case 'stream.started':
      handleStreamStarted(event);
      break;
      
    case 'stream.ended':
      handleStreamEnded(event);
      break;
      
    case 'user.location_changed':
      handleUserLocationChanged(event);
      break;
      
    default:
      console.log(`未处理的事件类型: ${event.type}`);
  }
  
  // 快速响应(避免超时)
  res.status(200).send('OK');
});

// 具体事件处理器
async function handleOrderCreated(event: WebhookEvent) {
  const order = event.data.object as Order;
  
  console.log(`新订单创建: ${order.id}`);
  
  // 1. 发送创建确认通知
  await sendNotification(order.creatorId, {
    type: 'order_created',
    title: '订单创建成功',
    message: `您的订单 "${order.title}" 已创建，正在寻找服务提供者`,
    data: { orderId: order.id }
  });
  
  // 2. 触发AI调度匹配
  await triggerAIDispatch(order.id);
  
  // 3. 更新分析数据
  await updateAnalytics('order_created', {
    orderId: order.id,
    category: order.category,
    price: order.price,
    location: {
      lat: order.latitude,
      lng: order.longitude
    }
  });
}

async function handleOrderStatusChanged(event: WebhookEvent) {
  const order = event.data.object as Order;
  const previousStatus = event.data.previous_attributes?.status;
  
  console.log(`订单 ${order.id} 状态从 ${previousStatus} 变更为 ${order.status}`);
  
  switch (order.status) {
    case 'accepted':
      // 订单被接受
      await Promise.all([
        sendNotification(order.creatorId, {
          type: 'order_accepted',
          title: '订单已被接受',
          message: `您的订单已被 ${order.providerId} 接受`,
          data: { orderId: order.id, providerId: order.providerId }
        }),
        
        // 为双方创建聊天室
        createChatRoom([order.creatorId, order.providerId!], order.id)
      ]);
      break;
      
    case 'live':
      // 直播开始
      await Promise.all([
        sendNotification(order.creatorId, {
          type: 'stream_started',
          title: '直播已开始',
          message: '您订购的服务正在直播中',
          data: { orderId: order.id, streamUrl: order.liveUrl }
        }),
        
        // 记录直播开始时间
        updateOrderMetrics(order.id, { streamStartedAt: new Date() })
      ]);
      break;
      
    case 'completed':
      // 订单完成
      await Promise.all([
        sendNotification(order.creatorId, {
          type: 'order_completed',
          title: '服务已完成',
          message: '请为本次服务进行评价',
          data: { orderId: order.id }
        }),
        
        sendNotification(order.providerId!, {
          type: 'order_completed',
          title: '服务已完成',
          message: '请等待客户评价',
          data: { orderId: order.id }
        }),
        
        // 触发自动结算
        processOrderSettlement(order.id)
      ]);
      break;
  }
}

async function handleStreamStarted(event: WebhookEvent) {
  const stream = event.data.object as StreamSession;
  
  // 1. 发送直播开始通知给所有订阅者
  await notifyStreamSubscribers(stream.orderId, {
    type: 'stream_started',
    streamUrl: stream.connectionInfo.playbackUrl,
    quality: stream.settings?.quality || '1080p'
  });
  
  // 2. 开始录制(如果启用)
  if (stream.settings?.enableRecording) {
    await startStreamRecording(stream.id);
  }
  
  // 3. 初始化质量监控
  await initializeQualityMonitoring(stream.id);
}
```

### **Webhook配置和管理**

#### **Webhook端点配置**
```typescript
// Webhook配置API
interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];              // 订阅的事件类型
  secret: string;                // 用于签名验证的密钥
  active: boolean;
  metadata?: { [key: string]: string };
  created: string;
  updated: string;
}

// 创建Webhook端点
async function createWebhookEndpoint(config: {
  url: string;
  events: string[];
  description?: string;
}): Promise<WebhookEndpoint> {
  const response = await fetch('https://api.taplive.com/v1/webhooks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TAPLIVE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  });
  
  return response.json();
}

// 使用示例
const webhook = await createWebhookEndpoint({
  url: 'https://myapp.com/webhook',
  events: [
    'order.created',
    'order.status_changed', 
    'stream.started',
    'stream.ended',
    'user.location_changed'
  ],
  description: '订单和流媒体事件处理'
});

console.log('Webhook创建成功:', webhook.id);
console.log('验证密钥:', webhook.secret);
```

---

## 🧪 **测试与调试**

### **SDK测试套件**

#### **单元测试示例**
```typescript
// tests/order-management.test.ts
import { TapLiveSDK } from '@taplive/sdk';
import { jest } from '@jest/globals';

describe('OrderManagement', () => {
  let sdk: TapLiveSDK;
  
  beforeEach(() => {
    sdk = new TapLiveSDK({
      apiKey: 'test_key',
      environment: 'sandbox'
    });
  });
  
  describe('订单创建', () => {
    it('应该成功创建订单', async () => {
      const orderData = {
        title: '测试订单',
        description: '测试描述',
        latitude: 35.6762,
        longitude: 139.6503,
        price: 50,
        duration: 30,
        creatorId: 'test_user_001'
      };
      
      const mockResponse = {
        id: 'order_test_123',
        status: 'pending',
        ...orderData
      };
      
      // Mock API响应
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);
      
      const result = await sdk.orders.create(orderData);
      
      expect(result.id).toBe('order_test_123');
      expect(result.status).toBe('pending');
      expect(result.title).toBe(orderData.title);
    });
    
    it('应该处理创建失败的情况', async () => {
      const orderData = {
        title: '',  // 无效标题
        description: '测试描述',
        latitude: 35.6762,
        longitude: 139.6503,
        price: -10, // 无效价格
        duration: 30,
        creatorId: 'test_user_001'
      };
      
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
          details: ['Title is required', 'Price must be positive']
        })
      } as Response);
      
      await expect(sdk.orders.create(orderData)).rejects.toThrow('Validation failed');
    });
  });
  
  describe('实时订阅', () => {
    it('应该正确处理订单状态变化', (done) => {
      const orderId = 'order_test_123';
      let eventCount = 0;
      
      const subscription = sdk.orders.subscribe(orderId, {
        onStatusChange: (order) => {
          eventCount++;
          
          if (eventCount === 1) {
            expect(order.status).toBe('open');
          } else if (eventCount === 2) {
            expect(order.status).toBe('accepted');
            subscription.close();
            done();
          }
        },
        onError: (error) => {
          done(error);
        }
      });
      
      // 模拟WebSocket消息
      setTimeout(() => {
        subscription._handleMessage({
          type: 'order_status_changed',
          data: { id: orderId, status: 'open' }
        });
      }, 100);
      
      setTimeout(() => {
        subscription._handleMessage({
          type: 'order_status_changed', 
          data: { id: orderId, status: 'accepted' }
        });
      }, 200);
    });
  });
});
```

#### **集成测试**
```typescript
// tests/integration/order-flow.test.ts
import { TapLiveSDK } from '@taplive/sdk';

describe('完整订单流程集成测试', () => {
  let sdk: TapLiveSDK;
  let createdOrder: Order;
  
  beforeAll(() => {
    sdk = new TapLiveSDK({
      apiKey: process.env.TAPLIVE_TEST_API_KEY!,
      environment: 'sandbox'
    });
  });
  
  it('完整的订单生命周期', async () => {
    // 1. 创建订单
    createdOrder = await sdk.orders.create({
      title: '集成测试订单',
      description: '用于测试完整流程',
      latitude: 35.6762,
      longitude: 139.6503,
      price: 25,
      duration: 15,
      creatorId: 'integration_test_user'
    });
    
    expect(createdOrder.id).toBeDefined();
    expect(createdOrder.status).toBe('pending');
    
    // 2. 查询订单
    const fetchedOrder = await sdk.orders.get(createdOrder.id);
    expect(fetchedOrder.id).toBe(createdOrder.id);
    
    // 3. 更新订单状态
    const updatedOrder = await sdk.orders.update(createdOrder.id, {
      status: 'open'
    });
    expect(updatedOrder.status).toBe('open');
    
    // 4. 搜索订单
    const searchResults = await sdk.orders.search({
      location: {
        latitude: 35.6762,
        longitude: 139.6503,
        radius: 1 // 1公里
      },
      status: ['open']
    });
    
    const foundOrder = searchResults.data.find(order => order.id === createdOrder.id);
    expect(foundOrder).toBeDefined();
    
    // 5. 取消订单
    await sdk.orders.update(createdOrder.id, {
      status: 'cancelled',
      cancelReason: '集成测试完成'
    });
    
    const cancelledOrder = await sdk.orders.get(createdOrder.id);
    expect(cancelledOrder.status).toBe('cancelled');
  }, 30000); // 30秒超时
  
  afterAll(async () => {
    // 清理测试数据
    if (createdOrder?.id) {
      try {
        await sdk.orders.delete(createdOrder.id);
      } catch (error) {
        console.warn('清理测试订单失败:', error);
      }
    }
  });
});
```

### **调试工具**

#### **SDK调试配置**
```typescript
// 开发环境调试配置
const debugSDK = new TapLiveSDK({
  apiKey: process.env.TAPLIVE_API_KEY!,
  environment: 'sandbox',
  
  // 启用详细日志
  logging: {
    level: 'debug',
    destination: 'console',
    includeRequestBodies: true,
    includeResponseBodies: true
  },
  
  // 请求拦截器(用于调试)
  interceptors: {
    request: (config) => {
      console.log('发送请求:', {
        method: config.method,
        url: config.url,
        headers: config.headers,
        body: config.body
      });
      return config;
    },
    
    response: (response) => {
      console.log('接收响应:', {
        status: response.status,
        headers: response.headers,
        body: response.body
      });
      return response;
    },
    
    error: (error) => {
      console.error('请求失败:', {
        message: error.message,
        status: error.status,
        details: error.details
      });
      throw error;
    }
  }
});
```

#### **实时事件调试**
```typescript
// WebSocket调试工具
class WebSocketDebugger {
  private events: Array<{ timestamp: Date; type: string; data: any }> = [];
  
  constructor(private sdk: TapLiveSDK) {
    this.setupEventLogging();
  }
  
  private setupEventLogging() {
    // 监听所有WebSocket事件
    this.sdk.realtime.on('*', (eventType: string, data: any) => {
      const event = {
        timestamp: new Date(),
        type: eventType,
        data: data
      };
      
      this.events.push(event);
      console.log('🔔 WebSocket事件:', event);
      
      // 保留最近1000个事件
      if (this.events.length > 1000) {
        this.events.shift();
      }
    });
  }
  
  // 获取事件历史
  getEventHistory(filter?: { type?: string; since?: Date }): Array<any> {
    let filtered = this.events;
    
    if (filter?.type) {
      filtered = filtered.filter(event => event.type === filter.type);
    }
    
    if (filter?.since) {
      filtered = filtered.filter(event => event.timestamp >= filter.since!);
    }
    
    return filtered;
  }
  
  // 导出调试报告
  exportDebugReport(): string {
    const report = {
      generatedAt: new Date().toISOString(),
      totalEvents: this.events.length,
      eventTypes: this.getEventTypeSummary(),
      recentEvents: this.events.slice(-50), // 最近50个事件
      errorEvents: this.events.filter(e => e.type.includes('error'))
    };
    
    return JSON.stringify(report, null, 2);
  }
  
  private getEventTypeSummary() {
    const summary: { [type: string]: number } = {};
    
    this.events.forEach(event => {
      summary[event.type] = (summary[event.type] || 0) + 1;
    });
    
    return summary;
  }
}

// 使用调试器
const debugger = new WebSocketDebugger(debugSDK);

// 5分钟后导出调试报告
setTimeout(() => {
  const report = debugger.exportDebugReport();
  console.log('📊 调试报告:', report);
}, 5 * 60 * 1000);
```

---

## 📈 **最佳实践**

### **性能优化建议**

#### **API调用优化**
```typescript
// 1. 使用请求批处理
class OptimizedOrderService {
  private batchQueue: Array<{ id: string; resolve: Function; reject: Function }> = [];
  private batchTimer: NodeJS.Timeout | null = null;
  
  async getOrder(orderId: string): Promise<Order> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ id: orderId, resolve, reject });
      
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, 100); // 100ms批处理窗口
      }
    });
  }
  
  private async processBatch() {
    const currentBatch = [...this.batchQueue];
    this.batchQueue.length = 0;
    this.batchTimer = null;
    
    try {
      const orderIds = currentBatch.map(item => item.id);
      const orders = await this.sdk.orders.getBatch(orderIds);
      
      currentBatch.forEach(item => {
        const order = orders.find(o => o.id === item.id);
        if (order) {
          item.resolve(order);
        } else {
          item.reject(new Error(`Order ${item.id} not found`));
        }
      });
    } catch (error) {
      currentBatch.forEach(item => item.reject(error));
    }
  }
}

// 2. 智能缓存策略
class CacheManager {
  private cache = new Map<string, { data: any; expires: number }>();
  
  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number = 300000): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
    
    return data;
  }
  
  invalidate(pattern: string) {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// 使用示例
const cacheManager = new CacheManager();

async function getCachedOrder(orderId: string): Promise<Order> {
  return cacheManager.get(
    `order:${orderId}`,
    () => sdk.orders.get(orderId),
    60000 // 1分钟缓存
  );
}
```

#### **实时连接优化**
```typescript
// 连接池管理
class ConnectionPoolManager {
  private connections = new Map<string, WebSocket>();
  private heartbeatIntervals = new Map<string, NodeJS.Timeout>();
  
  getConnection(endpoint: string): WebSocket {
    let connection = this.connections.get(endpoint);
    
    if (!connection || connection.readyState !== WebSocket.OPEN) {
      connection = this.createConnection(endpoint);
      this.connections.set(endpoint, connection);
    }
    
    return connection;
  }
  
  private createConnection(endpoint: string): WebSocket {
    const ws = new WebSocket(endpoint);
    
    ws.on('open', () => {
      console.log(`✅ 连接建立: ${endpoint}`);
      this.setupHeartbeat(endpoint, ws);
    });
    
    ws.on('close', () => {
      console.log(`❌ 连接关闭: ${endpoint}`);
      this.cleanup(endpoint);
    });
    
    ws.on('error', (error) => {
      console.error(`🔥 连接错误: ${endpoint}`, error);
      this.cleanup(endpoint);
    });
    
    return ws;
  }
  
  private setupHeartbeat(endpoint: string, ws: WebSocket) {
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        this.cleanup(endpoint);
      }
    }, 30000); // 30秒心跳
    
    this.heartbeatIntervals.set(endpoint, interval);
  }
  
  private cleanup(endpoint: string) {
    this.connections.delete(endpoint);
    
    const interval = this.heartbeatIntervals.get(endpoint);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(endpoint);
    }
  }
}
```

### **安全最佳实践**

#### **API密钥管理**
```typescript
// 安全的API密钥管理
class SecureCredentialManager {
  private apiKey: string;
  private keyRotationTimer: NodeJS.Timeout;
  
  constructor(initialKey: string) {
    this.apiKey = initialKey;
    this.setupKeyRotation();
  }
  
  getApiKey(): string {
    return this.apiKey;
  }
  
  private setupKeyRotation() {
    // 每24小时检查密钥是否需要轮换
    this.keyRotationTimer = setInterval(async () => {
      try {
        const newKey = await this.fetchRotatedKey();
        if (newKey && newKey !== this.apiKey) {
          console.log('🔄 API密钥已轮换');
          this.apiKey = newKey;
        }
      } catch (error) {
        console.error('密钥轮换失败:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }
  
  private async fetchRotatedKey(): Promise<string | null> {
    // 从安全存储或密钥管理服务获取新密钥
    // 这里是示例实现
    const response = await fetch('/api/rotate-key', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    if (response.ok) {
      const { newKey } = await response.json();
      return newKey;
    }
    
    return null;
  }
  
  destroy() {
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
    }
  }
}
```

#### **输入验证和错误处理**
```typescript
// robust错误处理
class RobustAPIClient {
  constructor(private sdk: TapLiveSDK) {}
  
  async createOrderWithValidation(orderData: any): Promise<Order> {
    // 1. 输入验证
    const validationErrors = this.validateOrderData(orderData);
    if (validationErrors.length > 0) {
      throw new ValidationError('Invalid order data', validationErrors);
    }
    
    // 2. 带重试的API调用
    return this.retryWithBackoff(
      () => this.sdk.orders.create(orderData),
      {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000
      }
    );
  }
  
  private validateOrderData(data: any): string[] {
    const errors: string[] = [];
    
    if (!data.title || data.title.length < 5) {
      errors.push('标题必须至少5个字符');
    }
    
    if (!data.description || data.description.length < 20) {
      errors.push('描述必须至少20个字符');
    }
    
    if (!data.latitude || data.latitude < -90 || data.latitude > 90) {
      errors.push('纬度必须在-90到90之间');
    }
    
    if (!data.longitude || data.longitude < -180 || data.longitude > 180) {
      errors.push('经度必须在-180到180之间');
    }
    
    if (!data.price || data.price <= 0) {
      errors.push('价格必须大于0');
    }
    
    if (!data.duration || data.duration < 5 || data.duration > 480) {
      errors.push('时长必须在5-480分钟之间');
    }
    
    return errors;
  }
  
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: { maxRetries: number; baseDelay: number; maxDelay: number }
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === options.maxRetries) {
          break;
        }
        
        // 计算退避延迟
        const delay = Math.min(
          options.baseDelay * Math.pow(2, attempt),
          options.maxDelay
        );
        
        console.log(`尝试 ${attempt + 1} 失败，${delay}ms后重试:`, error.message);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class ValidationError extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

---

## 📚 **总结**

本开发者手册为TapLive平台提供了全面的技术集成指南，涵盖：

### **核心特性**
- 🚀 **快速集成**: 30秒快速开始，完整的SDK支持
- 🔐 **安全可靠**: 多层认证，签名验证，安全最佳实践
- 📊 **功能完整**: 订单管理、实时流媒体、支付处理、用户系统
- 🛠️ **开发友好**: 完整的TypeScript类型支持，详细的代码示例
- 🧪 **测试完备**: 单元测试、集成测试、调试工具

### **支持生态**
- **多语言SDK**: JavaScript/TypeScript、Python、Go、Java等
- **框架集成**: React、Vue、Angular、React Native、Flutter
- **Webhook支持**: 实时事件通知，自动化工作流
- **丰富文档**: API参考、最佳实践、故障排除指南

### **下一步**
1. **开始开发**: 使用快速开始指南创建第一个集成
2. **深入学习**: 阅读具体API文档和SDK指南
3. **最佳实践**: 遵循性能优化和安全建议
4. **社区支持**: 加入开发者社区，获取技术支持

---

## 📞 **技术支持**

### **开发者资源**
- 📧 **技术支持**: developers@taplive.com
- 💬 **开发者社区**: https://community.taplive.com
- 📖 **在线文档**: https://docs.taplive.com
- 🐛 **问题反馈**: https://github.com/taplive/issues

### **快速链接**
- [API状态页面](https://status.taplive.com)
- [SDK版本发布](https://github.com/taplive/sdk/releases)
- [示例代码库](https://github.com/taplive/examples)
- [变更日志](https://docs.taplive.com/changelog)

---

**TapLive Developer SDK** - *构建下一代地理位置驱动的实时服务应用*

> *"为开发者提供最强大的工具，构建最创新的应用"*

---

📅 **文档版本**: v1.0 | 📝 **最后更新**: 2024年 | 🔄 **开发者手册持续更新中**