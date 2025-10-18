import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerRoutes(app: Express): Server {
  
  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/orders", (req, res) => {
    // Mock data for now
    res.json({
      success: true,
      data: [],
      message: "Orders endpoint ready (no database yet)"
    });
  });

  app.post("/api/orders", (req, res) => {
    console.log("Received order:", req.body);
    res.json({
      success: true,
      message: "Order received",
      data: req.body
    });
  });

  // Create HTTP server (needed for WebSocket later)
  return createServer(app);
}