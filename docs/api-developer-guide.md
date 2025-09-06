# TapLive API开发者指南

## 📖 概述

TapLive提供完整的RESTful API和WebSocket接口，支持开发者构建自定义应用和集成第三方服务。本文档详细说明API的使用方法、认证机制、数据格式和最佳实践。

## 🔐 认证和授权

### API密钥认证

```typescript
// API请求头配置
const apiHeaders = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json',
  'X-API-Version': 'v1'
}

// API基础URL
const BASE_URL = 'https://api.taplive.com/v1'
```

### JWT令牌认证

```typescript
// 用户登录获取JWT
POST /api/auth/login
{
  "email": "user@example.com", 
  "password": "password123"
}

// 响应
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600,
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

## 📡 RESTful API接口

### 订单管理API

#### 获取订单列表
```http
GET /api/orders

Query Parameters:
- page: int (页码，默认1)
- limit: int (每页数量，默认20，最大100)
- status: string (订单状态筛选)
- location: string (地理位置筛选，格式: "lat,lng,radius")
- sort: string (排序字段，默认"created_at")
- order: string (排序方向，"asc"或"desc")
```

```typescript
// 请求示例
const getOrders = async (params?: OrderListParams) => {
  const queryString = new URLSearchParams(params).toString()
  const response = await fetch(`${BASE_URL}/orders?${queryString}`, {
    headers: apiHeaders
  })
  return response.json()
}

// 响应格式
interface OrderListResponse {
  success: boolean
  data: {
    orders: Order[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}
```

#### 创建新订单
```http
POST /api/orders

Request Body:
{
  "title": "埃菲尔铁塔现场直播",
  "description": "希望看到埃菲尔铁塔日落时分的美景",
  "latitude": 48.8584,
  "longitude": 2.2945,
  "price": 50.00,
  "currency": "USD",
  "type": "single",
  "maxParticipants": 1,
  "scheduledTime": "2025-03-15T18:00:00Z",
  "duration": 30,
  "requirements": ["4K画质", "稳定网络", "专业设备"]
}
```

```typescript
// TypeScript接口
interface CreateOrderRequest {
  title: string
  description: string
  latitude: number
  longitude: number
  price: number
  currency: 'USD' | 'EUR' | 'JPY' | 'CNY'
  type: 'single' | 'group'
  maxParticipants?: number
  scheduledTime?: string // ISO 8601格式
  duration?: number // 分钟
  requirements?: string[]
  tags?: string[]
}

// 创建订单函数
const createOrder = async (orderData: CreateOrderRequest): Promise<Order> => {
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: apiHeaders,
    body: JSON.stringify(orderData)
  })
  
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.message)
  }
  
  return result.data
}
```

#### 获取订单详情
```http
GET /api/orders/{orderId}

Path Parameters:
- orderId: string (订单ID)
```

```typescript
// 获取订单详情
const getOrderDetails = async (orderId: string): Promise<Order> => {
  const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: apiHeaders
  })
  return response.json()
}

// 完整的订单数据结构
interface Order {
  id: string
  title: string
  description: string
  creator: {
    id: string
    name: string
    avatar: string
    rating: number
    completedOrders: number
  }
  provider?: {
    id: string
    name: string
    avatar: string
    rating: number
    completedOrders: number
  }
  location: {
    latitude: number
    longitude: number
    address: string
    timezone: string
  }
  price: number
  currency: string
  status: OrderStatus
  type: 'single' | 'group'
  maxParticipants: number
  currentParticipants: number
  scheduledTime?: string
  actualStartTime?: string
  actualEndTime?: string
  duration: number
  requirements: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
  
  // 流媒体相关
  streamUrl?: string
  streamId?: string
  viewers?: number
  
  // 支付相关
  totalAmount: number
  platformFee: number
  providerAmount: number
  paymentStatus: PaymentStatus
}
```

#### 更新订单状态
```http
PUT /api/orders/{orderId}

Request Body:
{
  "status": "accepted",
  "providerId": "provider123",
  "estimatedStartTime": "2025-03-15T18:00:00Z"
}
```

#### 删除订单
```http
DELETE /api/orders/{orderId}

Response:
{
  "success": true,
  "message": "Order deleted successfully"
}
```

### 用户管理API

#### 获取用户信息
```http
GET /api/users/{userId}

Response:
{
  "success": true,
  "data": {
    "id": "user123",
    "username": "john_doe",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "role": "creator",
    "rating": 4.8,
    "totalRatings": 156,
    "completedOrders": 89,
    "responseTime": 12,
    "trustScore": 4.7,
    "location": {
      "city": "New York",
      "country": "USA",
      "timezone": "America/New_York"
    },
    "preferences": {
      "languages": ["en", "zh"],
      "categories": ["travel", "technology", "food"],
      "notifications": {
        "email": true,
        "push": true,
        "sms": false
      }
    },
    "statistics": {
      "totalEarnings": 2450.00,
      "averageOrderValue": 27.53,
      "responseRate": 95,
      "completionRate": 98
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "lastActiveAt": "2025-01-06T15:45:00Z"
  }
}
```

#### 更新用户信息
```http
PUT /api/users/{userId}

Request Body:
{
  "name": "John Smith",
  "avatar": "https://newavatar.com/image.jpg",
  "bio": "Professional photographer and videographer",
  "location": {
    "city": "Los Angeles", 
    "country": "USA"
  },
  "preferences": {
    "languages": ["en", "es"],
    "categories": ["photography", "travel"]
  }
}
```

### 评价系统API

#### 提交评价
```http
POST /api/ratings

Request Body:
{
  "orderId": "order123",
  "revieweeId": "user456", 
  "rating": 5,
  "comment": "Excellent service! High quality video and very professional.",
  "categories": {
    "communication": 5,
    "quality": 5,
    "punctuality": 4,
    "professionalism": 5
  }
}
```

#### 获取用户评价
```http
GET /api/users/{userId}/ratings

Query Parameters:
- page: int
- limit: int
- role: string ("creator" | "provider")
```

### 支付系统API

#### 创建支付意图
```http
POST /api/payments/intents

Request Body:
{
  "orderId": "order123",
  "amount": 50.00,
  "currency": "USD",
  "paymentMethod": "card"
}

Response:
{
  "success": true,
  "data": {
    "clientSecret": "pi_1234567890_secret_abcdef",
    "paymentIntentId": "pi_1234567890",
    "amount": 5000,
    "currency": "usd",
    "status": "requires_payment_method"
  }
}
```

#### 确认支付
```http
POST /api/payments/confirm

Request Body:
{
  "paymentIntentId": "pi_1234567890",
  "paymentMethodId": "pm_card_visa"
}
```

#### 获取支付历史
```http
GET /api/payments/history

Query Parameters:
- userId: string
- orderId: string
- status: string
- startDate: string
- endDate: string
```

## 🔄 WebSocket实时通信

### 连接建立

```typescript
// WebSocket连接
const ws = new WebSocket('wss://api.taplive.com/ws')

ws.onopen = (event) => {
  console.log('WebSocket连接已建立')
  
  // 发送认证信息
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your_jwt_token'
  }))
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  handleWebSocketMessage(message)
}

ws.onclose = (event) => {
  console.log('WebSocket连接已关闭:', event.code, event.reason)
}

ws.onerror = (error) => {
  console.error('WebSocket错误:', error)
}
```

### 消息格式

```typescript
// WebSocket消息类型
interface WebSocketMessage {
  id: string // 消息ID
  type: MessageType
  timestamp: string
  data: any
}

enum MessageType {
  // 认证相关
  AUTH = 'auth',
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILED = 'auth_failed',
  
  // 订单相关
  ORDER_CREATED = 'order_created',
  ORDER_UPDATED = 'order_updated', 
  ORDER_DELETED = 'order_deleted',
  ORDER_MATCHED = 'order_matched',
  
  // 直播相关
  STREAM_STARTED = 'stream_started',
  STREAM_ENDED = 'stream_ended',
  VIEWER_JOINED = 'viewer_joined',
  VIEWER_LEFT = 'viewer_left',
  
  // 聊天相关
  CHAT_MESSAGE = 'chat_message',
  CHAT_TYPING = 'chat_typing',
  
  // 通知相关
  NOTIFICATION = 'notification',
  SYSTEM_ALERT = 'system_alert'
}
```

### 实时订单状态

```typescript
// 订阅订单状态更新
const subscribeToOrder = (orderId: string) => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: `order:${orderId}`
  }))
}

// 处理订单状态更新
const handleOrderUpdate = (message: WebSocketMessage) => {
  if (message.type === 'ORDER_UPDATED') {
    const { orderId, status, provider } = message.data
    
    // 更新UI状态
    updateOrderStatus(orderId, status)
    
    // 显示通知
    if (status === 'accepted') {
      showNotification(`您的订单已被${provider.name}接受！`)
    }
  }
}
```

### 实时直播功能

```typescript
// 加入直播间
const joinStream = (streamId: string) => {
  ws.send(JSON.stringify({
    type: 'join_stream',
    streamId: streamId,
    role: 'viewer'
  }))
}

// 处理直播事件
const handleStreamEvent = (message: WebSocketMessage) => {
  switch (message.type) {
    case 'STREAM_STARTED':
      // 直播开始
      onStreamStart(message.data.streamId)
      break
      
    case 'STREAM_ENDED':
      // 直播结束
      onStreamEnd(message.data.streamId)
      break
      
    case 'VIEWER_JOINED':
      // 新观众加入
      updateViewerCount(message.data.viewerCount)
      break
  }
}
```

## 📊 数据模型和类型定义

### 核心数据类型

```typescript
// 订单状态枚举
enum OrderStatus {
  PENDING = 'pending',
  OPEN = 'open', 
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  LIVE = 'live',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  RESOLVED = 'resolved'
}

// 支付状态枚举
enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// 用户角色枚举
enum UserRole {
  CREATOR = 'creator',
  PROVIDER = 'provider',
  ADMIN = 'admin'
}

// 地理位置类型
interface Location {
  latitude: number
  longitude: number
  address: string
  city: string
  country: string
  timezone: string
}

// 用户统计类型
interface UserStatistics {
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  averageRating: number
  totalRatings: number
  totalEarnings: number
  responseTime: number // 分钟
  responseRate: number // 百分比
  completionRate: number // 百分比
}
```

### API响应格式

```typescript
// 统一API响应格式
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId: string
    version: string
  }
}

// 分页响应格式
interface PaginatedResponse<T = any> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// 错误响应格式
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: {
      field?: string
      value?: any
      constraint?: string
    }[]
  }
}
```

## 🛡️ 错误处理和状态码

### HTTP状态码

```typescript
// API状态码定义
const HTTP_STATUS = {
  // 成功响应
  OK: 200,                    // 请求成功
  CREATED: 201,               // 资源创建成功
  ACCEPTED: 202,              // 请求已接受，正在处理
  NO_CONTENT: 204,            // 请求成功，无返回内容
  
  // 客户端错误
  BAD_REQUEST: 400,           // 请求参数错误
  UNAUTHORIZED: 401,          // 未授权访问
  FORBIDDEN: 403,             // 禁止访问
  NOT_FOUND: 404,             // 资源不存在
  METHOD_NOT_ALLOWED: 405,    // 方法不被允许
  CONFLICT: 409,              // 资源冲突
  UNPROCESSABLE_ENTITY: 422,  // 请求格式正确但语义错误
  TOO_MANY_REQUESTS: 429,     // 请求频率过高
  
  // 服务器错误
  INTERNAL_SERVER_ERROR: 500, // 内部服务器错误
  BAD_GATEWAY: 502,           // 网关错误
  SERVICE_UNAVAILABLE: 503,   // 服务不可用
  GATEWAY_TIMEOUT: 504        // 网关超时
}
```

### 错误代码定义

```typescript
// 业务错误代码
enum ErrorCode {
  // 认证相关
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // 订单相关
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_ALREADY_ACCEPTED = 'ORDER_ALREADY_ACCEPTED', 
  ORDER_CANNOT_BE_CANCELLED = 'ORDER_CANNOT_BE_CANCELLED',
  INVALID_ORDER_STATUS = 'INVALID_ORDER_STATUS',
  
  // 用户相关
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_USER_ROLE = 'INVALID_USER_ROLE',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  
  // 支付相关
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',
  
  // 验证相关
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // 系统相关
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

### 错误处理示例

```typescript
// API客户端错误处理
class TapLiveAPIError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message)
    this.name = 'TapLiveAPIError'
  }
}

// API客户端封装
class TapLiveAPI {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { ...apiHeaders, ...options.headers },
        ...options
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new TapLiveAPIError(
          data.error?.code || 'UNKNOWN_ERROR',
          data.error?.message || 'An unknown error occurred',
          response.status,
          data.error?.details
        )
      }
      
      return data.data
    } catch (error) {
      if (error instanceof TapLiveAPIError) {
        throw error
      }
      
      // 网络错误或其他异常
      throw new TapLiveAPIError(
        ErrorCode.INTERNAL_ERROR,
        'Network error or unexpected exception',
        0,
        error
      )
    }
  }
}

// 使用示例
const api = new TapLiveAPI()

try {
  const order = await api.createOrder(orderData)
  console.log('订单创建成功:', order)
} catch (error) {
  if (error instanceof TapLiveAPIError) {
    switch (error.code) {
      case ErrorCode.VALIDATION_ERROR:
        handleValidationError(error.details)
        break
      case ErrorCode.INSUFFICIENT_FUNDS:
        showInsufficientFundsDialog()
        break
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        showRateLimitMessage()
        break
      default:
        showGenericError(error.message)
    }
  }
}
```

## 🔧 SDK和工具库

### JavaScript/TypeScript SDK

```typescript
// TapLive SDK主类
class TapLiveSDK {
  private apiKey: string
  private baseURL: string
  private ws: WebSocket | null = null
  
  constructor(apiKey: string, options: SDKOptions = {}) {
    this.apiKey = apiKey
    this.baseURL = options.baseURL || 'https://api.taplive.com/v1'
  }
  
  // 订单管理
  orders = {
    list: (params?: OrderListParams) => this.request<PaginatedResponse<Order>>('/orders', { params }),
    create: (data: CreateOrderRequest) => this.request<Order>('/orders', { method: 'POST', data }),
    get: (id: string) => this.request<Order>(`/orders/${id}`),
    update: (id: string, data: UpdateOrderRequest) => this.request<Order>(`/orders/${id}`, { method: 'PUT', data }),
    delete: (id: string) => this.request<void>(`/orders/${id}`, { method: 'DELETE' }),
  }
  
  // 用户管理
  users = {
    get: (id: string) => this.request<User>(`/users/${id}`),
    update: (id: string, data: UpdateUserRequest) => this.request<User>(`/users/${id}`, { method: 'PUT', data }),
    getProfile: () => this.request<User>('/users/profile'),
  }
  
  // 支付管理
  payments = {
    createIntent: (data: CreatePaymentIntentRequest) => this.request<PaymentIntent>('/payments/intents', { method: 'POST', data }),
    confirm: (data: ConfirmPaymentRequest) => this.request<PaymentResult>('/payments/confirm', { method: 'POST', data }),
    history: (params?: PaymentHistoryParams) => this.request<PaginatedResponse<Payment>>('/payments/history', { params }),
  }
  
  // WebSocket连接
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.baseURL.replace('http', 'ws')}/ws`)
      
      this.ws.onopen = () => {
        this.authenticate()
        resolve()
      }
      
      this.ws.onerror = reject
    })
  }
  
  // 订阅订单更新
  subscribeToOrder(orderId: string, callback: (update: OrderUpdate) => void): () => void {
    this.send({ type: 'subscribe', channel: `order:${orderId}` })
    
    const handler = (event: MessageEvent) => {
      const message = JSON.parse(event.data)
      if (message.type === 'ORDER_UPDATED' && message.data.orderId === orderId) {
        callback(message.data)
      }
    }
    
    this.ws?.addEventListener('message', handler)
    
    // 返回取消订阅函数
    return () => {
      this.ws?.removeEventListener('message', handler)
      this.send({ type: 'unsubscribe', channel: `order:${orderId}` })
    }
  }
}

// SDK使用示例
const taplive = new TapLiveSDK('your_api_key')

// 创建订单
const order = await taplive.orders.create({
  title: '东京塔直播',
  description: '实时东京塔夜景',
  latitude: 35.6586,
  longitude: 139.7454,
  price: 30
})

// 订阅订单状态
const unsubscribe = taplive.subscribeToOrder(order.id, (update) => {
  console.log('订单状态更新:', update.status)
})
```

### React Hooks

```typescript
// React Hook for TapLive
export const useTapLive = (apiKey: string) => {
  const [sdk] = useState(() => new TapLiveSDK(apiKey))
  
  useEffect(() => {
    sdk.connect()
    return () => sdk.disconnect()
  }, [sdk])
  
  return sdk
}

// 订单列表Hook
export const useOrders = (params?: OrderListParams) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => taplive.orders.list(params)
  })
}

// 创建订单Hook
export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => taplive.orders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  })
}

// 订单状态订阅Hook
export const useOrderUpdates = (orderId: string) => {
  const [orderUpdate, setOrderUpdate] = useState<OrderUpdate | null>(null)
  const { sdk } = useTapLive()
  
  useEffect(() => {
    if (!orderId || !sdk) return
    
    const unsubscribe = sdk.subscribeToOrder(orderId, setOrderUpdate)
    return unsubscribe
  }, [orderId, sdk])
  
  return orderUpdate
}
```

## 📚 最佳实践

### API调用最佳实践

```typescript
// 1. 使用适当的HTTP方法
const apiMethods = {
  GET: '获取资源',
  POST: '创建资源',
  PUT: '更新整个资源',
  PATCH: '部分更新资源',
  DELETE: '删除资源'
}

// 2. 合理使用缓存
const cacheStrategies = {
  // 静态数据长期缓存
  staticData: { maxAge: 24 * 60 * 60 * 1000 }, // 24小时
  
  // 动态数据短期缓存
  dynamicData: { maxAge: 5 * 60 * 1000 }, // 5分钟
  
  // 实时数据不缓存
  realTimeData: { maxAge: 0 }
}

// 3. 错误重试机制
const retryRequest = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // 指数退避
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
}

// 4. 请求去重
const requestCache = new Map()

const dedupeRequest = async (key: string, fn: () => Promise<any>) => {
  if (requestCache.has(key)) {
    return requestCache.get(key)
  }
  
  const promise = fn()
  requestCache.set(key, promise)
  
  try {
    const result = await promise
    requestCache.delete(key)
    return result
  } catch (error) {
    requestCache.delete(key)
    throw error
  }
}
```

### 性能优化建议

```typescript
// 1. 批量请求
const batchRequests = async (requests: ApiRequest[]) => {
  const results = await Promise.allSettled(
    requests.map(request => api.request(request.endpoint, request.options))
  )
  
  return results.map((result, index) => ({
    request: requests[index],
    result: result.status === 'fulfilled' ? result.value : result.reason
  }))
}

// 2. 分页数据无限滚动
const useInfiniteOrders = (params: OrderListParams) => {
  return useInfiniteQuery({
    queryKey: ['orders', 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      taplive.orders.list({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined
  })
}

// 3. WebSocket消息处理优化
const useWebSocketMessages = () => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  
  // 使用节流避免频繁更新
  const throttledAddMessage = useCallback(
    throttle((message: WebSocketMessage) => {
      setMessages(prev => [...prev, message].slice(-100)) // 只保留最近100条
    }, 100),
    []
  )
  
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = JSON.parse(event.data)
      throttledAddMessage(message)
    }
    
    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [throttledAddMessage])
  
  return messages
}
```

### 安全最佳实践

```typescript
// 1. API密钥安全存储
const secureStorage = {
  setApiKey: (key: string) => {
    // 使用加密存储
    const encrypted = encrypt(key, getDeviceId())
    localStorage.setItem('taplive_api_key', encrypted)
  },
  
  getApiKey: () => {
    const encrypted = localStorage.getItem('taplive_api_key')
    return encrypted ? decrypt(encrypted, getDeviceId()) : null
  }
}

// 2. 请求签名验证
const signRequest = (endpoint: string, body: string, timestamp: number, nonce: string) => {
  const message = `${endpoint}${timestamp}${nonce}${body}`
  return hmacSHA256(message, API_SECRET)
}

// 3. 输入验证和清理
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // 移除潜在的XSS字符
    .trim()
    .substring(0, 1000) // 限制长度
}

// 4. CSRF防护
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')

const apiHeadersWithCSRF = {
  ...apiHeaders,
  'X-CSRF-Token': csrfToken
}
```

## 📖 代码示例

### 完整的订单创建流程

```typescript
// 完整的订单创建示例
const OrderCreationExample = () => {
  const [orderForm, setOrderForm] = useState<CreateOrderRequest>({
    title: '',
    description: '',
    latitude: 0,
    longitude: 0,
    price: 0,
    currency: 'USD',
    type: 'single'
  })
  
  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderRequest) => taplive.orders.create(data),
    onSuccess: (order) => {
      console.log('订单创建成功:', order)
      // 跳转到订单详情页
      navigate(`/orders/${order.id}`)
    },
    onError: (error) => {
      console.error('订单创建失败:', error)
      // 显示错误信息
      toast.error(error.message)
    }
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 1. 获取用户位置
      const position = await getCurrentPosition()
      orderForm.latitude = position.coords.latitude
      orderForm.longitude = position.coords.longitude
      
      // 2. 验证表单数据
      const validatedData = CreateOrderSchema.parse(orderForm)
      
      // 3. 创建订单
      await createOrderMutation.mutateAsync(validatedData)
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        // 处理表单验证错误
        handleValidationErrors(error.errors)
      } else {
        // 处理其他错误
        console.error('Error creating order:', error)
      }
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={orderForm.title}
        onChange={(e) => setOrderForm(prev => ({ ...prev, title: e.target.value }))}
        placeholder="订单标题"
        required
      />
      <textarea
        value={orderForm.description}
        onChange={(e) => setOrderForm(prev => ({ ...prev, description: e.target.value }))}
        placeholder="订单描述"
        required
      />
      <input
        type="number"
        value={orderForm.price}
        onChange={(e) => setOrderForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
        placeholder="价格"
        min="0"
        step="0.01"
        required
      />
      <button 
        type="submit" 
        disabled={createOrderMutation.isLoading}
      >
        {createOrderMutation.isLoading ? '创建中...' : '创建订单'}
      </button>
    </form>
  )
}
```

### 实时直播功能集成

```typescript
// 直播功能集成示例
const LiveStreamingExample = ({ orderId }: { orderId: string }) => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  
  useEffect(() => {
    // 连接WebSocket
    wsRef.current = new WebSocket('wss://api.taplive.com/ws')
    
    wsRef.current.onopen = () => {
      // 加入直播间
      wsRef.current?.send(JSON.stringify({
        type: 'join_stream',
        streamId: orderId,
        role: 'viewer'
      }))
    }
    
    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data)
      
      switch (message.type) {
        case 'stream_started':
          setIsStreaming(true)
          setupVideoStream(message.data.streamUrl)
          break
          
        case 'stream_ended':
          setIsStreaming(false)
          cleanupVideoStream()
          break
          
        case 'viewer_count_updated':
          setViewerCount(message.data.count)
          break
      }
    }
    
    return () => {
      wsRef.current?.close()
    }
  }, [orderId])
  
  const setupVideoStream = async (streamUrl: string) => {
    if (videoRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        videoRef.current.srcObject = stream
      } catch (error) {
        console.error('Failed to access media devices:', error)
      }
    }
  }
  
  const cleanupVideoStream = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }
  
  return (
    <div className="live-stream-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto rounded-lg"
        />
        
        {isStreaming && (
          <div className="stream-overlay">
            <div className="live-indicator">
              <span className="live-dot"></span>
              LIVE
            </div>
            <div className="viewer-count">
              👥 {viewerCount} viewers
            </div>
          </div>
        )}
      </div>
      
      {!isStreaming && (
        <div className="stream-placeholder">
          <p>等待直播开始...</p>
        </div>
      )}
    </div>
  )
}
```

---

**这个API开发者指南为TapLive平台提供了完整的集成方案。开发者可以使用这些API构建自定义应用、集成第三方服务或扩展平台功能。我们致力于提供简洁、强大且易于使用的API，帮助开发者快速构建优秀的应用。**

**如有任何问题或建议，请通过[developer@taplive.com](mailto:developer@taplive.com)联系我们的开发者支持团队。** 🚀