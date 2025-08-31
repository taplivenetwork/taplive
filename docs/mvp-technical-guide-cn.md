# TapLive MVP 技术实现指南 (中文版)

## 📋 项目概述

**TapLive MVP** 是一个基于地理位置的实时视频流媒体平台，连接全球用户与现实世界中的即时行动服务。本文档提供完整的技术实现指南，专为 Phase 1-2 MVP 开发设计。

## 🛠️ 技术栈架构

### 后端技术栈
- **运行环境**: Node.js
- **Web框架**: Express.js
- **数据存储**: 内存存储 (后续可迁移至数据库)
- **API设计**: RESTful API架构
- **部署平台**: Replit (开发) + 生产环境部署

### 前端技术栈
- **核心技术**: HTML5 + 原生JavaScript
- **UI框架**: 无复杂框架依赖，使用原生DOM操作
- **响应式设计**: 支持移动端和桌面端
- **交互方式**: 表单提交 + 动态内容更新

## 📁 项目结构设计

```
TapLive-MVP/
├── index.js                    # Express后端服务入口
├── package.json               # 项目依赖和脚本配置
├── public/                    # 静态资源目录
│   ├── index.html            # 主页面 - 直播订单界面
│   ├── main.js               # 前端交互逻辑
│   └── style.css             # 样式文件
├── routes/                   # API路由模块
│   ├── orders.js             # 订单相关API
│   └── users.js              # 用户相关API
└── data/                     # 数据存储模块
    └── storage.js            # 内存数据存储
```

## 🔧 核心功能模块

### 1. 直播订单系统
**功能描述**: 用户可以创建和管理实时视频直播订单

**核心特性**:
- 订单创建和提交
- 地理位置绑定
- 订单状态管理 (待接单/进行中/已完成)
- 实时订单列表展示

**技术实现**:
```javascript
// 订单数据结构
const order = {
  id: 'unique_order_id',
  title: '订单标题',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: '具体地址'
  },
  description: '订单描述',
  status: 'pending', // pending/active/completed
  createdAt: Date.now(),
  userId: 'creator_user_id'
}
```

### 2. 用户管理系统
**功能描述**: 基础用户注册、登录和信息管理

**核心特性**:
- 用户注册和身份验证
- 用户角色管理 (发起者/服务者)
- 基础用户信息存储

### 3. 地理位置服务
**功能描述**: LBS位置服务和地理围栏功能

**核心特性**:
- 获取用户当前位置
- 基于位置的订单筛选
- 地理距离计算

## 🚀 快速部署指南

### 步骤1: 环境准备
1. 在 Replit 创建新的 Node.js 项目
2. 项目名称建议: `TapLive-MVP`

### 步骤2: 依赖安装
```json
{
  "name": "taplive-mvp",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  }
}
```

### 步骤3: 后端服务器配置
```javascript
// index.js - Express服务器入口
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// API路由
app.get('/api/orders', (req, res) => {
  // 获取订单列表
  res.json({ success: true, data: [] });
});

app.post('/api/orders', (req, res) => {
  // 创建新订单
  const newOrder = req.body;
  res.json({ success: true, data: newOrder });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`TapLive MVP服务器运行在端口 ${PORT}`);
});
```

### 步骤4: 前端界面实现
```html
<!-- public/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TapLive MVP - 实时视频点播平台</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>TapLive - 实时视频直播订单</h1>
        
        <!-- 订单创建表单 -->
        <form id="orderForm">
            <input type="text" id="orderTitle" placeholder="订单标题" required>
            <textarea id="orderDescription" placeholder="详细描述"></textarea>
            <input type="text" id="orderLocation" placeholder="地理位置">
            <button type="submit">发布订单</button>
        </form>
        
        <!-- 订单列表展示 -->
        <div id="ordersList">
            <h2>当前订单</h2>
            <div id="ordersContainer"></div>
        </div>
    </div>
    
    <script src="main.js"></script>
</body>
</html>
```

## 📊 数据模型设计

### 订单数据模型
```javascript
const OrderSchema = {
  id: String,           // 唯一标识符
  title: String,        // 订单标题
  description: String,  // 订单描述
  location: {
    latitude: Number,   // 纬度
    longitude: Number,  // 经度
    address: String     // 地址
  },
  status: String,       // 订单状态
  createdAt: Date,      // 创建时间
  userId: String        // 创建者ID
}
```

### 用户数据模型
```javascript
const UserSchema = {
  id: String,           // 用户ID
  username: String,     // 用户名
  email: String,        // 邮箱
  role: String,         // 用户角色 (creator/provider)
  location: Object,     // 用户位置
  createdAt: Date       // 注册时间
}
```

## 🔄 API接口设计

### 订单相关API
- `GET /api/orders` - 获取订单列表
- `POST /api/orders` - 创建新订单
- `GET /api/orders/:id` - 获取订单详情
- `PUT /api/orders/:id` - 更新订单状态
- `DELETE /api/orders/:id` - 删除订单

### 用户相关API
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息

## 🎯 MVP阶段目标

### Phase 1 核心目标
1. ✅ 基础订单创建和展示功能
2. ✅ 简单的用户界面和交互
3. ✅ 本地存储和基础API
4. ✅ 地理位置获取功能

### Phase 2 增强目标
1. 🔄 用户注册和登录系统
2. 🔄 订单状态管理和更新
3. 🔄 基础的地理位置筛选
4. 🔄 简单的订单匹配逻辑

## ⚡ 快速启动命令

```bash
# 1. 克隆或创建项目
mkdir TapLive-MVP && cd TapLive-MVP

# 2. 初始化项目
npm init -y

# 3. 安装依赖
npm install express cors body-parser

# 4. 启动开发服务器
npm start
```

## 🔍 开发注意事项

### 安全考虑
- 所有用户输入需要验证和净化
- API接口需要基础的错误处理
- 地理位置信息需要隐私保护

### 性能优化
- 使用内存存储避免数据库复杂性
- 前端采用原生JS减少加载时间
- API响应使用标准化格式

### 扩展性设计
- 模块化代码结构便于后续功能扩展
- 数据模型设计考虑未来数据库迁移
- API设计遵循RESTful规范

---

**文档版本**: v1.0
**更新时间**: 2025年8月31日
**适用范围**: TapLive MVP Phase 1-2 开发

> 💡 **提示**: 本文档专为MVP快速开发设计，不包含生产环境的复杂功能。后续Phase 3-4的高级功能将在单独文档中说明。