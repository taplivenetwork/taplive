# 🔑 Lighthouse IPFS Setup Guide

## 📋 **API Key Setup**

### **1. Get Lighthouse API Key**

1. **Visit**: [https://lighthouse.storage/](https://lighthouse.storage/)
2. **Sign up** for a free account
3. **Get your API key** from the dashboard
4. **Add to environment variables**:

```bash
# .env file
VITE_LIGHTHOUSE_API_KEY=your_api_key_here
```

### **2. Lighthouse Pricing**

| Plan | Price | Storage | Bandwidth |
|------|-------|---------|-----------|
| **Free** | $0 | 1GB | 1GB/month |
| **Pro** | $10/month | 100GB | 100GB/month |
| **Enterprise** | Custom | Unlimited | Unlimited |

### **3. Alternative IPFS Providers**

If you don't want to use Lighthouse, here are alternatives:

#### **Pinata** (Popular choice)
```bash
VITE_PINATA_API_KEY=your_pinata_key
VITE_PINATA_SECRET_KEY=your_pinata_secret
```

#### **Web3.Storage** (Protocol Labs)
```bash
VITE_WEB3_STORAGE_TOKEN=your_web3_storage_token
```

#### **IPFS.io** (Public gateway)
```bash
# No API key needed, but less reliable
```

---

## 🌍 **Where Data is Stored**

### **IPFS Network Distribution**

Your data is stored across **multiple nodes** in the IPFS network:

#### **1. Lighthouse Nodes**
- **Primary storage**: Lighthouse's IPFS nodes
- **Location**: Distributed globally
- **Reliability**: High (paid service)

#### **2. Public IPFS Network**
- **Secondary storage**: Other IPFS nodes
- **Location**: Global network
- **Reliability**: Medium (depends on pinning)

#### **3. Gateway Access**
Your data can be accessed via multiple gateways:

```
https://gateway.lighthouse.storage/ipfs/YOUR_HASH
https://ipfs.io/ipfs/YOUR_HASH
https://cloudflare-ipfs.com/ipfs/YOUR_HASH
https://dweb.link/ipfs/YOUR_HASH
```

### **Data Persistence**

#### **Pinned Data** (Guaranteed persistence)
- Stored on Lighthouse nodes
- Guaranteed availability
- Paid service ensures persistence

#### **Unpinned Data** (May be garbage collected)
- Stored temporarily on IPFS
- May be removed if not accessed
- Not recommended for important data

---

## 🔍 **How to View Your Data**

### **1. IPFS Hash Lookup**
```typescript
// Get file info
const fileInfo = await LighthouseService.getFileInfo(hash);
console.log('File URL:', fileInfo.url);

// Access via multiple gateways
const urls = LighthouseService.getMultipleGatewayUrls(hash);
console.log('Available URLs:', urls);
```

### **2. IPFS Explorer**
- **Lighthouse Explorer**: [https://explorer.lighthouse.storage/](https://explorer.lighthouse.storage/)
- **IPFS.io Explorer**: [https://explore.ipfs.io/](https://explore.ipfs.io/)
- **Pinata Explorer**: [https://app.pinata.cloud/](https://app.pinata.cloud/)

### **3. Direct Access**
```typescript
// Get file directly
const fileBlob = await LighthouseService.getFile(hash);
const fileUrl = URL.createObjectURL(fileBlob);
window.open(fileUrl, '_blank');
```

---

## 🛠️ **Implementation Example**

### **Environment Setup**
```bash
# .env
VITE_LIGHTHOUSE_API_KEY=your_api_key_here
VITE_IPFS_GATEWAY_URL=https://gateway.lighthouse.storage
```

### **Upload with Persistence**
```typescript
// Upload and pin file
const fileInfo = await LighthouseService.uploadFile(file);
await LighthouseService.pinFile(fileInfo.hash); // Ensure persistence

console.log('File stored at:', fileInfo.url);
console.log('IPFS Hash:', fileInfo.hash);
```

### **Verify Data Storage**
```typescript
// Check if file exists
const exists = await LighthouseService.fileExists(hash);
console.log('File exists:', exists);

// Get file from different gateways
const urls = LighthouseService.getMultipleGatewayUrls(hash);
urls.forEach(url => {
  console.log('Available at:', url);
});
```

---

## 📊 **Data Storage Visualization**

```
Your File
    ↓
Lighthouse API
    ↓
IPFS Network
    ├── Lighthouse Nodes (Pinned)
    ├── Public IPFS Nodes
    └── Gateway Access
        ├── gateway.lighthouse.storage
        ├── ipfs.io
        ├── cloudflare-ipfs.com
        └── dweb.link
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. API Key Not Working**
```typescript
// Check API key
if (!LIGHTHOUSE_API_KEY) {
  throw new Error('Lighthouse API key not found');
}
```

#### **2. File Not Accessible**
```typescript
// Try multiple gateways
const urls = LighthouseService.getMultipleGatewayUrls(hash);
for (const url of urls) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      console.log('File accessible at:', url);
      break;
    }
  } catch (error) {
    console.log('Gateway failed:', url);
  }
}
```

#### **3. File Not Persisting**
```typescript
// Ensure file is pinned
await LighthouseService.pinFile(hash);
console.log('File pinned for persistence');
```

---

## 💡 **Best Practices**

### **1. Always Pin Important Files**
```typescript
// Upload and pin
const fileInfo = await LighthouseService.uploadFile(file);
await LighthouseService.pinFile(fileInfo.hash);
```

### **2. Use Multiple Gateways**
```typescript
// Get multiple URLs for redundancy
const urls = LighthouseService.getMultipleGatewayUrls(hash);
```

### **3. Verify File Integrity**
```typescript
// Check file exists before using
const exists = await LighthouseService.fileExists(hash);
if (!exists) {
  throw new Error('File not found on IPFS');
}
```

### **4. Monitor Storage Usage**
```typescript
// Track your storage usage
const stats = await LighthouseService.getStorageStats();
console.log('Storage used:', stats.used);
console.log('Storage limit:', stats.limit);
```

---

## 🎯 **Summary**

- **API Key**: Required for Lighthouse (free tier available)
- **Data Storage**: Distributed across IPFS network
- **Persistence**: Pinned files are guaranteed to persist
- **Access**: Multiple gateways ensure availability
- **Monitoring**: Use IPFS explorers to view your data

Your data is stored **decentrally** across the IPFS network, making it **censorship-resistant** and **permanent**!
