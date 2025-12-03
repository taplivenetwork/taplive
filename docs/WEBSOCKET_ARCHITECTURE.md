# WebSocket Video Streaming Architecture

## Overview
The system uses WebSocket for signaling and WebRTC for peer-to-peer video streaming between broadcaster (service provider) and viewers (customers).

## Architecture Diagram

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│   Broadcaster   │◄─────── Signaling ────────►│  Backend Server │
│  (Provider)     │         ws://...:5000/ws    │   (Node.js)     │
└─────────────────┘                             └─────────────────┘
        ║                                               ║
        ║         WebRTC P2P Video/Audio               ║ WebSocket
        ║         (Direct Connection)                  ║ Signaling
        ║                                               ║
        ╚═════════════════════════════════════════════╗║
                                                      ╚╬════════════┐
                                                       ║            │
                                                ┌──────▼──────┐ ┌──▼───────────┐
                                                │  Viewer 1   │ │  Viewer 2    │
                                                │ (Customer)  │ │ (Customer)   │
                                                └─────────────┘ └──────────────┘
```

## Connection Flow

### 1. Initial WebSocket Connection

**Backend Server:**
```typescript
// Each client gets a unique ID upon connection
const clientId = `client_${++clientIdCounter}`;  // e.g., "client_1", "client_2"
clientIds.set(ws, clientId);
```

**Broadcaster (Provider):**
```typescript
// Connects to ws://localhost:5000/ws
const socket = new WebSocket('ws://localhost:5000/ws');
```

**Viewer (Customer):**
```typescript
// Connects to ws://localhost:5000/ws
const websocket = new WebSocket('ws://localhost:5000/ws');
```

### 2. Broadcaster Starts Streaming

**Step 1:** Broadcaster starts webcam
```typescript
// Get camera/microphone access
const mediaStream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'environment', width: 1280, height: 720 },
  audio: { echoCancellation: true, noiseSuppression: true }
});
```

**Step 2:** Notify backend that broadcaster is ready
```typescript
websocket.send(JSON.stringify({
  type: 'broadcaster-ready',
  streamId: orderId  // e.g., "9c23f06d-2f69-46d6-8a81-3057e5d90a32"
}));
```

**Step 3:** Backend registers broadcaster
```typescript
// Backend stores: streamId -> broadcaster WebSocket
broadcasters.set(streamId, ws);
streamRooms.set(streamId, new Set([ws]));
```

### 3. Viewer Joins Stream

**Step 1:** Viewer opens live stream page
```typescript
// Viewer connects WebSocket and joins stream
websocket.send(JSON.stringify({
  type: 'join-stream',
  streamId: orderId  // Same orderId as broadcaster
}));
```

**Step 2:** Backend adds viewer to room
```typescript
// Backend adds viewer to stream room
streamRooms.get(streamId).add(viewerWs);

// Backend notifies broadcaster with viewer's unique ID
broadcaster.send(JSON.stringify({
  type: 'viewer-joined',
  streamId: orderId,
  viewerId: 'client_2'  // Viewer's unique client ID
}));
```

### 4. WebRTC Peer Connection Setup (The Magic!)

This is where the actual video/audio connection happens:

**Step 1:** Broadcaster creates peer connection for this specific viewer
```typescript
// Broadcaster creates RTCPeerConnection for viewer "client_2"
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// Add broadcaster's video/audio tracks
mediaStream.getTracks().forEach(track => {
  pc.addTrack(track, mediaStream);
});

// Store: viewerId -> peer connection
peerConnectionsRef.current.set('client_2', pc);
```

**Step 2:** Broadcaster creates and sends offer
```typescript
// Create SDP offer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

// Send offer to backend
websocket.send(JSON.stringify({
  type: 'webrtc-offer',
  offer: offer,
  streamId: orderId,
  viewerId: 'client_2'  // Target this specific viewer
}));
```

**Step 3:** Backend routes offer to specific viewer
```typescript
// Backend finds viewer with clientId === 'client_2'
streamRooms.get(streamId).forEach(client => {
  const targetClientId = clientIds.get(client);
  if (targetClientId === 'client_2') {
    client.send(JSON.stringify({
      type: 'webrtc-offer',
      offer: offer,
      viewerId: 'client_2'  // Tell viewer their ID
    }));
  }
});
```

**Step 4:** Viewer receives offer and creates answer
```typescript
// Viewer stores their ID
viewerIdRef.current = 'client_2';

// Viewer creates peer connection
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// Viewer sets up to receive video tracks
pc.ontrack = (event) => {
  videoElement.srcObject = event.streams[0];  // Display video!
};

// Set remote description (broadcaster's offer)
await pc.setRemoteDescription(new RTCSessionDescription(offer));

// Create answer
const answer = await pc.createAnswer();
await pc.setLocalDescription(answer);

// Send answer back
websocket.send(JSON.stringify({
  type: 'webrtc-answer',
  answer: answer,
  streamId: orderId,
  viewerId: 'client_2'  // Include viewer ID
}));
```

**Step 5:** Backend routes answer to broadcaster
```typescript
// Backend forwards answer with viewerId
const answerBroadcaster = broadcasters.get(streamId);
answerBroadcaster.send(JSON.stringify({
  type: 'webrtc-answer',
  answer: answer,
  viewerId: 'client_2'  // So broadcaster knows which peer
}));
```

**Step 6:** Broadcaster receives answer
```typescript
// Broadcaster finds the correct peer connection
const pc = peerConnectionsRef.current.get('client_2');

// Complete the connection
await pc.setRemoteDescription(new RTCSessionDescription(answer));
```

### 5. ICE Candidate Exchange (Connection Optimization)

Both broadcaster and viewer discover their network paths and exchange ICE candidates:

**From Broadcaster:**
```typescript
pc.onicecandidate = (event) => {
  if (event.candidate) {
    websocket.send(JSON.stringify({
      type: 'webrtc-ice-candidate',
      candidate: event.candidate,
      streamId: orderId,
      viewerId: 'client_2'  // For specific viewer
    }));
  }
};
```

**Backend Routes:**
```typescript
// If from broadcaster -> send to specific viewer
if (isBroadcaster && targetClientId === viewerId) {
  viewerWs.send(JSON.stringify({ ...candidate, viewerId }));
}

// If from viewer -> send to broadcaster
if (!isBroadcaster) {
  broadcasterWs.send(JSON.stringify({ ...candidate, viewerId }));
}
```

**Viewer Receives and Adds:**
```typescript
const pc = peerRef.current;
await pc.addIceCandidate(new RTCIceCandidate(candidate));
```

### 6. Connection States

**WebRTC Connection States:**
- `new` → Connection just created
- `connecting` → Exchanging ICE candidates
- `connected` → **Video is flowing!** 🎉
- `disconnected` → Temporary network issue
- `failed` → Connection failed, need to retry
- `closed` → Connection terminated

**Signaling States (SDP negotiation):**
- `stable` → No offer/answer in progress
- `have-local-offer` → Sent offer, waiting for answer
- `have-remote-offer` → Received offer, need to send answer
- `closed` → Connection closed

## Key Design Decisions

### 1. One Peer Connection Per Viewer
```typescript
// OLD (BROKEN): One peer for all viewers
peerConnectionRef.current = pc;  // ❌ All viewers share same connection

// NEW (WORKING): Map of peer connections
peerConnectionsRef.current.set(viewerId, pc);  // ✅ Each viewer gets own connection
```

**Why?** WebRTC is peer-to-peer (1-to-1). You can't send one offer and get multiple answers.

### 2. Client ID Assignment by Backend
```typescript
// Backend assigns IDs immediately on connection
const clientId = `client_${++clientIdCounter}`;
clientIds.set(ws, clientId);
```

**Why?** Ensures unique identification for routing messages between specific peers.

### 3. Direct WebSocket Connection (Not Vite Proxy)
```typescript
// Connect directly to backend
const wsUrl = 'ws://localhost:5000/ws';  // ✅ Direct

// NOT through Vite proxy
const wsUrl = 'ws://localhost:5173/ws';  // ❌ Would fail
```

**Why?** WebSocket upgrade must happen on the actual server, not the dev proxy.

### 4. Viewer ID in All Messages
```typescript
// Every WebRTC message includes viewerId
{
  type: 'webrtc-offer',
  offer: {...},
  streamId: 'abc123',
  viewerId: 'client_2'  // ← Critical for routing!
}
```

**Why?** Backend routes messages to correct peer; broadcaster identifies which connection.

## Data Structures

### Backend Storage
```typescript
// Client ID mapping
clientIds: Map<WebSocket, string>
// Example: WebSocket#1 → "client_1", WebSocket#2 → "client_2"

// Broadcaster registry
broadcasters: Map<string, WebSocket>
// Example: "order-123" → WebSocket#1 (broadcaster)

// Stream rooms (all participants)
streamRooms: Map<string, Set<WebSocket>>
// Example: "order-123" → Set(WebSocket#1, WebSocket#2, WebSocket#3)
```

### Broadcaster Storage
```typescript
// Multiple peer connections (one per viewer)
peerConnectionsRef: Map<string, RTCPeerConnection>
// Example: 
// "client_2" → RTCPeerConnection (to viewer 1)
// "client_3" → RTCPeerConnection (to viewer 2)
```

### Viewer Storage
```typescript
// Single peer connection (to broadcaster)
peerRef: RTCPeerConnection

// Own ID from backend
viewerIdRef: string  // "client_2"
```

## Message Flow Summary

```
1. BROADCASTER READY
   Broadcaster → Backend: { type: 'broadcaster-ready', streamId }
   Backend: Stores broadcaster WebSocket

2. VIEWER JOINS
   Viewer → Backend: { type: 'join-stream', streamId }
   Backend → Broadcaster: { type: 'viewer-joined', streamId, viewerId: 'client_2' }

3. OFFER
   Broadcaster → Backend: { type: 'webrtc-offer', offer, streamId, viewerId: 'client_2' }
   Backend → Viewer: { type: 'webrtc-offer', offer, viewerId: 'client_2' }

4. ANSWER
   Viewer → Backend: { type: 'webrtc-answer', answer, streamId, viewerId: 'client_2' }
   Backend → Broadcaster: { type: 'webrtc-answer', answer, viewerId: 'client_2' }

5. ICE CANDIDATES (bidirectional)
   Broadcaster ↔ Backend ↔ Viewer
   { type: 'webrtc-ice-candidate', candidate, streamId, viewerId: 'client_2' }

6. VIDEO FLOWS
   Broadcaster ═══════════════════► Viewer (P2P, not through backend!)
```

## Security & Scalability Notes

### Current Implementation
- **Security:** No authentication on WebSocket (anyone can connect)
- **Scalability:** All viewers get separate peer connections = N connections for N viewers
- **Bandwidth:** Broadcaster uploads N times (once per viewer)

### Production Considerations
1. **Add WebSocket authentication:** Verify Clerk userId on connection
2. **Use SFU (Selective Forwarding Unit):** Broadcaster uploads once, SFU distributes
3. **Add TURN servers:** For NAT traversal when STUN fails
4. **Rate limiting:** Prevent DoS attacks on WebSocket
5. **Viewer limit:** Cap max viewers per stream (e.g., 50)

## Troubleshooting

### "Video not loading" (Viewer stuck on "正在连接直播...")
**Check:**
- Viewer received `webrtc-offer`? (Check console logs)
- Peer connection created? (`peerRef.current` should exist)
- ICE candidates exchanging? (Look for "🧊" logs)
- Connection state? Should go `new` → `connecting` → `connected`

### "Multiple answers error" (Fixed!)
**Was:** Broadcaster received answer, tried to set remote description but already in "stable" state
**Fix:** Each viewer gets own peer connection with separate state machine

### "Autoplay blocked"
**Symptom:** Video element has srcObject but won't play
**Fix:** Show "Click to Play" button, user interaction required by browser

### ICE candidates failing
**Check:**
- STUN servers reachable? (Google's STUN: `stun.l.google.com:19302`)
- Firewall blocking UDP? (WebRTC uses UDP)
- Corporate network? (May need TURN server for relay)

## Testing Checklist

- [ ] Broadcaster starts, video preview shows
- [ ] Backend receives `broadcaster-ready`
- [ ] Viewer opens page, backend receives `join-stream`
- [ ] Broadcaster receives `viewer-joined` with viewerId
- [ ] Broadcaster creates peer connection for viewerId
- [ ] Viewer receives offer with viewerId
- [ ] Viewer sends answer with viewerId
- [ ] Broadcaster receives answer for correct peer
- [ ] ICE candidates exchange (both directions)
- [ ] Connection state becomes "connected"
- [ ] Viewer's video element shows broadcaster's stream
- [ ] Multiple viewers can join independently
- [ ] Each viewer has separate peer connection on broadcaster side
