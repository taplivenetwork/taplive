import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, ratingValidationSchema, type Order } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/healthz", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "TapLive Backend",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const { status, latitude, longitude, radius } = req.query;
      
      let orders: Order[];
      
      if (status && typeof status === 'string') {
        orders = await storage.getOrdersByStatus(status);
      } else if (latitude && longitude && typeof latitude === 'string' && typeof longitude === 'string') {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const radiusKm = radius ? parseFloat(radius as string) : 10;
        orders = await storage.getOrdersByLocation(lat, lng, radiusKm);
      } else {
        orders = await storage.getAllOrders();
      }

      res.json({
        success: true,
        data: orders,
        meta: {
          total: orders.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch orders"
      });
    }
  });

  // Get order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch order"
      });
    }
  });

  // Create new order
  app.post("/api/orders", async (req, res) => {
    try {
      const validation = insertOrderSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid order data",
          errors: validation.error.errors
        });
      }

      const orderData = validation.data;
      
      // Additional validations
      if (new Date(orderData.scheduledAt) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Scheduled time must be in the future"
        });
      }

      if (orderData.type === 'group' && (!orderData.maxParticipants || orderData.maxParticipants < 2)) {
        return res.status(400).json({
          success: false,
          message: "Group orders must have at least 2 max participants"
        });
      }

      const order = await storage.createOrder(orderData);

      res.status(201).json({
        success: true,
        data: order,
        message: "Order created successfully"
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: "Failed to create order"
      });
    }
  });

  // Update order
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
        data: updatedOrder,
        message: "Order updated successfully"
      });
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update order"
      });
    }
  });

  // Delete order
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
        message: "Order deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({
        success: false,
        message: "Failed to delete order"
      });
    }
  });

  // Get user by ID (for displaying user profiles with ratings)
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Don't expose password
      const { password, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user"
      });
    }
  });

  // Create a rating
  app.post("/api/ratings", async (req, res) => {
    try {
      const validation = ratingValidationSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid rating data",
          errors: validation.error.errors
        });
      }

      const ratingData = validation.data;
      
      // Check if order exists and is completed
      const order = await storage.getOrderById(ratingData.orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      if (order.status !== 'done') {
        return res.status(400).json({
          success: false,
          message: "Can only rate completed orders"
        });
      }

      // Check if user already rated this order
      const existingRatings = await storage.getRatingsByOrder(ratingData.orderId);
      const alreadyRated = existingRatings.some(rating => 
        rating.reviewerId === req.body.reviewerId && 
        rating.reviewType === ratingData.reviewType
      );

      if (alreadyRated) {
        return res.status(400).json({
          success: false,
          message: "You have already rated this order"
        });
      }

      const rating = await storage.createRating({
        ...ratingData,
        reviewerId: req.body.reviewerId, // This would come from auth in real app
      });

      res.status(201).json({
        success: true,
        data: rating,
        message: "Rating created successfully"
      });
    } catch (error) {
      console.error('Error creating rating:', error);
      res.status(500).json({
        success: false,
        message: "Failed to create rating"
      });
    }
  });

  // Get ratings for a specific order
  app.get("/api/orders/:id/ratings", async (req, res) => {
    try {
      const { id } = req.params;
      const ratings = await storage.getRatingsByOrder(id);

      res.json({
        success: true,
        data: ratings
      });
    } catch (error) {
      console.error('Error fetching order ratings:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch ratings"
      });
    }
  });

  // Get ratings received by a user
  app.get("/api/users/:id/ratings", async (req, res) => {
    try {
      const { id } = req.params;
      const ratings = await storage.getUserRatings(id);

      res.json({
        success: true,
        data: ratings
      });
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user ratings"
      });
    }
  });

  // Recalculate user stats (admin/debug endpoint)
  app.post("/api/users/:id/recalculate-stats", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.calculateUserStats(id);

      res.json({
        success: true,
        message: "User stats recalculated successfully"
      });
    } catch (error) {
      console.error('Error recalculating user stats:', error);
      res.status(500).json({
        success: false,
        message: "Failed to recalculate user stats"
      });
    }
  });

  // DISPATCH ALGORITHM ENDPOINTS

  // Get ranked providers for specific order
  app.get("/api/orders/:id/providers", async (req, res) => {
    try {
      const { id } = req.params;
      const rankings = await storage.getRankedProvidersForOrder(id);

      res.json({
        success: true,
        data: rankings,
        message: `Found ${rankings.length} available providers`
      });
    } catch (error) {
      console.error('Error getting ranked providers:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get ranked providers"
      });
    }
  });

  // Get all available providers (sorted by dispatch score)
  app.get("/api/providers", async (req, res) => {
    try {
      const providers = await storage.getAvailableProviders();
      
      // Sort by dispatch score descending
      const sortedProviders = providers
        .sort((a, b) => parseFloat(b.dispatchScore || '0') - parseFloat(a.dispatchScore || '0'))
        .map(provider => {
          // Remove password from response
          const { password, ...safeProvider } = provider;
          return safeProvider;
        });

      res.json({
        success: true,
        data: sortedProviders,
        message: `Found ${sortedProviders.length} available providers`
      });
    } catch (error) {
      console.error('Error getting available providers:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get available providers"
      });
    }
  });

  // Update user location
  app.post("/api/users/:id/location", async (req, res) => {
    try {
      const { id } = req.params;
      const validation = z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid location data",
          errors: validation.error.errors
        });
      }

      const { latitude, longitude } = validation.data;
      const updatedUser = await storage.updateUserLocation(id, latitude, longitude);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.json({
        success: true,
        data: {
          latitude: updatedUser.currentLatitude,
          longitude: updatedUser.currentLongitude,
          dispatchScore: updatedUser.dispatchScore
        },
        message: "Location updated successfully"
      });
    } catch (error) {
      console.error('Error updating user location:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update location"
      });
    }
  });

  // Update user network metrics
  app.post("/api/users/:id/network-metrics", async (req, res) => {
    try {
      const { id } = req.params;
      const validation = z.object({
        networkSpeed: z.number().min(0).max(1000), // Max 1000 Mbps
        devicePerformance: z.number().min(0).max(100), // 0-100 score
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid network metrics data",
          errors: validation.error.errors
        });
      }

      const { networkSpeed, devicePerformance } = validation.data;
      const updatedUser = await storage.updateUserNetworkMetrics(id, networkSpeed, devicePerformance);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.json({
        success: true,
        data: {
          networkSpeed: updatedUser.networkSpeed,
          devicePerformance: updatedUser.devicePerformance,
          dispatchScore: updatedUser.dispatchScore
        },
        message: "Network metrics updated successfully"
      });
    } catch (error) {
      console.error('Error updating network metrics:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update network metrics"
      });
    }
  });

  // Toggle user availability
  app.post("/api/users/:id/availability", async (req, res) => {
    try {
      const { id } = req.params;
      const validation = z.object({
        availability: z.boolean(),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid availability data",
          errors: validation.error.errors
        });
      }

      const { availability } = validation.data;
      const updatedUser = await storage.updateUser(id, { 
        availability,
        lastActive: new Date()
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.json({
        success: true,
        data: {
          availability: updatedUser.availability,
          lastActive: updatedUser.lastActive
        },
        message: `User availability set to ${availability ? 'available' : 'unavailable'}`
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update availability"
      });
    }
  });

  // Get dispatch algorithm weights and explanation
  app.get("/api/dispatch/algorithm", async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          weights: {
            distance: 35, // 35%
            trustScore: 25, // 25%
            networkSpeed: 20, // 20%
            devicePerformance: 10, // 10%
            responseTime: 10, // 10%
          },
          explanation: {
            distance: "Proximity to order location - closer providers score higher",
            trustScore: "User reputation based on ratings and completed orders",
            networkSpeed: "Internet connection speed in Mbps - critical for streaming quality",
            devicePerformance: "Device capability score (0-100) - affects stream quality",
            responseTime: "Average response time to accept orders - faster response scores higher"
          },
          scoringRanges: {
            distance: "0-50km optimal range, exponential decay beyond",
            trustScore: "0-5.0 rating scale, normalized to 0-100",
            networkSpeed: "5+ Mbps minimum, 50+ Mbps for perfect score",
            devicePerformance: "0-100 scale directly mapped",
            responseTime: "0-5 minutes optimal, exponential decay to 60 minutes"
          }
        },
        message: "Dispatch algorithm configuration"
      });
    } catch (error) {
      console.error('Error getting algorithm info:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get algorithm information"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
