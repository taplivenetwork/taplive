
# WebSocket Streaming Test Guide

## ✅ WebSocket is Connected! Now Test It:

### 1. **Quick Test (Same Browser)**
Test viewer count and real-time signaling in the same browser:

1. **Broadcaster Tab:**
   - Go to `/streams?orderId=<your-order-id>` as the **provider**
   - Click "Start Broadcast"
   - Grant camera permissions
   - You should see the video preview

2. **Viewer Tab:**
   - Open a **new incognito window** (Ctrl+Shift+N)
   - Sign in as the **customer** for that order
   - Go to `/streams?orderId=<same-order-id>`
   - You should automatically see the stream

3. **Watch for:**
   - Broadcaster tab: Viewer count badge should show "👥 1 viewers"
   - Browser console: Look for WebSocket messages in both tabs
   - Backend terminal: Should show viewer joined messages

---

### 2. **Test from Another Device (Same Network)**

#### Step 1: Find Your IP Address
Run this command:
```bash
ipconfig | findstr "IPv4"
```
Look for something like: `192.168.x.x` (your local IP)

#### Step 2: Update WebSocket URLs (Temporary)

In **native-webrtc-broadcaster.tsx** and **stream-viewer.tsx**, change:
```typescript
const wsUrl = 'ws://localhost:5000/ws';
```
To:
```typescript
const wsUrl = 'ws://<YOUR-IP>:5000/ws';  // e.g., ws://192.168.1.100:5000/ws
```

#### Step 3: Access from Another Device
- On your phone/tablet connected to same WiFi
- Open browser and go to: `http://<YOUR-IP>:5173/streams?orderId=<order-id>`
- Sign in as customer
- You should see the stream!

---

### 3. **What to Watch For:**

#### Broadcaster Console Logs:
```
[Broadcaster] Connecting to WebSocket: ws://localhost:5000/ws
[Broadcaster] ✅ WebSocket connected successfully!
[Broadcaster] 📹 Starting broadcast for stream: <order-id>
[Broadcaster] 👤 Viewer joined!
[Broadcaster] 👥 Viewer count: 1
```

#### Viewer Console Logs:
```
📺 Connecting to stream...
🎯 WebSocket connected!
📺 Joining stream: <order-id>
📡 Received WebRTC offer
```

#### Backend Terminal Logs:
```
✅ WebSocket client connected
📨 Received message type: broadcaster-ready
🎬 Broadcaster ready for stream: <order-id>
✅ WebSocket client connected
📨 Received message type: join-stream
👥 Viewer joining stream: <order-id>
📢 Notifying broadcaster of viewer join
```

---

### 4. **Testing Checklist:**

- [ ] Broadcaster can start stream
- [ ] Viewer count increases when viewer joins
- [ ] Viewer can see the video stream
- [ ] When viewer leaves, count decreases
- [ ] When broadcaster stops, viewers get disconnected
- [ ] Camera switch works (front/back camera toggle)
- [ ] WebSocket reconnects if connection drops

---

### 5. **Common Issues:**

**Problem:** Viewer doesn't see video
- Check browser console for WebRTC errors
- Ensure both are on same order ID
- Check if broadcaster actually started streaming

**Problem:** Viewer count not updating
- Check backend logs for viewer-count messages
- Refresh browser to reconnect WebSocket

**Problem:** Camera permission denied
- Grant camera/microphone permissions in browser
- Check browser settings for site permissions

---

### 6. **Advanced Testing (Optional):**

#### Test Multiple Viewers:
- Open 3-4 viewer tabs
- Watch viewer count increase
- Check backend for multiple WebSocket connections

#### Test Disconnect Scenarios:
- Close viewer tab → count should decrease
- Stop broadcast → viewers should see "broadcaster disconnected"
- Refresh broadcaster → viewers should reconnect

#### Test Network Switch:
- Switch from WiFi to mobile hotspot
- WebSocket should auto-reconnect
- Stream should resume

---

## 🎯 Success Criteria:

✅ WebSocket connects on page load  
✅ Broadcaster can start streaming  
✅ Viewer count displays correctly  
✅ Viewers can watch the stream  
✅ Real-time signaling works (ICE, offer/answer)  
✅ Graceful disconnection handling  

---

## 📝 Notes:

- **WebRTC** handles the actual video/audio streaming (peer-to-peer)
- **WebSocket** handles signaling (coordinates the connection setup)
- Viewer count updates happen through WebSocket messages
- Backend acts as signaling server, forwarding messages between peers
