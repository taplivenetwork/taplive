import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./simple-storage";

export function registerRoutes(app: Express): Server {
  
  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      
      res.json({
        success: true,
        data: orders,
        message: "Orders retrieved successfully"
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order Not Found",
          error: "The requested live stream could not be found."
        });
      }

      res.json({
        success: true,
        data: order,
        message: "Order retrieved successfully"
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/orders", (req, res) => {
    console.log("Received order:", req.body);
    res.json({
      success: true,
      message: "Order created",
      data: { id: Date.now(), ...req.body }
    });
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedOrder = await storage.updateOrder(id, updates);
      
      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }
      
      res.json({
        success: true,
        message: "Order updated successfully",
        data: updatedOrder
      });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteOrder(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }
      
      res.json({
        success: true,
        message: "Order deleted successfully",
        data: { id }
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Web3 Payment Endpoints
  app.post("/api/payments/pyusd", (req, res) => {
    const { orderId, amount, payerId, web3TransactionHash, pyusdAmount } = req.body;
    
    console.log("PYUSD Payment:", { orderId, amount, payerId, web3TransactionHash, pyusdAmount });
    
    // In a real app, you would:
    // 1. Verify the transaction on-chain
    // 2. Store the payment in database
    // 3. Update order status
    
    res.json({
      success: true,
      message: "PYUSD payment processed",
      data: {
        paymentId: `pay_${Date.now()}`,
        transactionHash: web3TransactionHash,
        amount: pyusdAmount,
        status: "completed"
      }
    });
  });

  app.post("/api/payments/yellow-swap", (req, res) => {
    const { 
      orderId, 
      amount, 
      payerId, 
      web3TransactionHash, 
      yellowSwapHash, 
      originalToken, 
      originalAmount, 
      pyusdAmount 
    } = req.body;
    
    console.log("Yellow Network Swap:", { 
      orderId, 
      amount, 
      payerId, 
      web3TransactionHash, 
      yellowSwapHash, 
      originalToken, 
      originalAmount, 
      pyusdAmount 
    });
    
    // In a real app, you would:
    // 1. Verify both transactions on-chain
    // 2. Store the swap details in database
    // 3. Update order status
    
    res.json({
      success: true,
      message: "Yellow Network swap completed",
      data: {
        paymentId: `pay_${Date.now()}`,
        transactionHash: web3TransactionHash,
        swapHash: yellowSwapHash,
        originalToken,
        originalAmount,
        pyusdAmount,
        status: "completed"
      }
    });
  });

  app.get("/api/payments/methods", (req, res) => {
    res.json({
      success: true,
      data: {
        pyusd: {
          name: 'PYUSD',
          type: 'web3',
          icon: '₮',
          description: 'PayPal USD (Ethereum)',
          currencies: ['PYUSD'],
          requiresWallet: true
        },
        yellow_swap: {
          name: 'Yellow Network Swap',
          type: 'swap',
          icon: '🔄',
          description: 'Swap any token to PYUSD',
          currencies: ['PYUSD', 'USDT', 'USDC', 'DAI'],
          requiresWallet: true
        }
      }
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