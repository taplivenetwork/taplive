import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

export function registerRoutes(app: Express): Server {
  
  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/orders", (req, res) => {
    res.json({
      success: true,
      data: [],
      message: "Orders endpoint ready"
    });
  });

  app.post("/api/orders", (req, res) => {
    console.log("Received order:", req.body);
    res.json({
      success: true,
      message: "Order created",
      data: { id: Date.now(), ...req.body }
    });
  });

  // Create HTTP server
  const server = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ 
    server,
    path: "/ws"
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("✅ WebSocket client connected");

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log("📨 Received:", message);
        
        // Echo back for now
        ws.send(JSON.stringify({
          type: "echo",
          data: message,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error("WebSocket error:", error);
      }
    });

    ws.on("close", () => {
      console.log("❌ WebSocket client disconnected");
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: "connected",
      message: "WebSocket connected successfully"
    }));
  });

  return server;
}