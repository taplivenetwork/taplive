import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
<<<<<<< HEAD
import Stripe from "stripe";
import { storage } from "./storage";
import { insertOrderSchema, ratingValidationSchema, paymentValidationSchema, cryptoPaymentSchema, disputeSubmissionSchema, geoLocationSchema, aaGroupCreationSchema, type Order } from "@shared/schema";
import { calculateCommission, PAYMENT_METHODS } from "@shared/payment";
import { assessGeoRisk, checkContentViolations, checkVoiceContent, formatRiskLevel } from "@shared/geo-safety";
import { validateAAGroupCreation, getAAGroupStatus, calculateSplitAmount, getAAGroupExpirationTime } from "@shared/aa-group";
import { z } from "zod";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

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
=======
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
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
      });
    }
  });

<<<<<<< HEAD
  // Get order by ID
=======
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
<<<<<<< HEAD
          message: "Order not found"
=======
          message: "Order Not Found",
          error: "The requested live stream could not be found."
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
        });
      }

      res.json({
        success: true,
<<<<<<< HEAD
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
        console.error('Order validation failed:', {
          body: req.body,
          errors: validation.error.errors
        });
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

      // Create the order directly (simplified for MVP)
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
=======
        data: order,
        message: "Order retrieved successfully"
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch order",
        error: error instanceof Error ? error.message : "Unknown error"
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
      });
    }
  });

<<<<<<< HEAD
  // Update order
=======
  app.post("/api/orders", (req, res) => {
    console.log("Received order:", req.body);
    res.json({
      success: true,
      message: "Order created",
      data: { id: Date.now(), ...req.body }
    });
  });

>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
<<<<<<< HEAD

=======
      
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
      const updatedOrder = await storage.updateOrder(id, updates);
      
      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }
<<<<<<< HEAD

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
=======
      
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
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
      });
    }
  });

<<<<<<< HEAD
  // Provider cancel order (with rating penalty)
  app.post("/api/orders/:id/cancel-by-provider", async (req, res) => {
    try {
      const { id } = req.params;
      
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Only allow cancellation if order is accepted or live
      if (!['accepted', 'live'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel order in current status"
        });
      }

      // Update order status to cancelled
      const updatedOrder = await storage.updateOrder(id, { 
        status: 'cancelled' as const,
        providerId: null // Remove provider assignment
      });

      // Apply rating penalty to the provider (if exists)
      if (order.providerId) {
        await storage.applyProviderCancelPenalty(order.providerId);
      }

      res.json({
        success: true,
        data: updatedOrder,
        message: "Order cancelled successfully. Your rating has been reduced as a penalty."
      });
    } catch (error) {
      console.error('Error cancelling order by provider:', error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel order"
      });
    }
  });

  // Submit order for customer approval (Provider completes service)
  app.post("/api/orders/:id/submit-for-approval", async (req, res) => {
    try {
      const { id: orderId } = req.params;
      const { providerId, deliveryNote } = req.body;
      
      // Get current order
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Verify order can be submitted
      if (!['accepted', 'live'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: "Order must be accepted or live to submit for approval"
        });
      }

      if (!order.isPaid) {
        return res.status(400).json({
          success: false,
          message: "Order must be paid before submission"
        });
      }

      // Update order status to awaiting approval
      const submittedOrder = await storage.updateOrder(orderId, {
        status: 'awaiting_approval',
        updatedAt: new Date(),
      });

      // Create approval request
      await storage.createOrderApproval({
        orderId: orderId,
        customerId: order.creatorId!,
        providerId: providerId,
        deliveryNote: deliveryNote,
      });

      res.json({
        success: true,
        data: submittedOrder,
        message: "Order submitted for customer approval"
      });

    } catch (error) {
      console.error('Error submitting order for approval:', error);
      res.status(500).json({
        success: false,
        message: "Failed to submit order for approval"
      });
    }
  });

  // Customer approves order and triggers commission payout
  app.post("/api/orders/:id/approve", async (req, res) => {
    try {
      const { id: orderId } = req.params;
      const { customerId, customerRating, customerFeedback } = req.body;
      
      // Get current order
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Verify order status
      if (order.status !== 'awaiting_approval') {
        return res.status(400).json({
          success: false,
          message: "Order is not awaiting approval"
        });
      }

      // Get approval request
      const approval = await storage.getOrderApprovalByOrder(orderId);
      if (!approval) {
        return res.status(404).json({
          success: false,
          message: "Approval request not found"
        });
      }

      // Update approval status
      await storage.updateOrderApproval(approval.id, {
        status: 'approved',
        customerRating,
        customerFeedback,
        approvedAt: new Date(),
      });

      // Update order status to done
      const approvedOrder = await storage.updateOrder(orderId, {
        status: 'done',
        updatedAt: new Date(),
      });

      // Process real-time commission payout
      const payments = await storage.getPaymentsByOrder(orderId);
      const completedPayment = payments.find(p => p.status === 'completed');

      let payout = null;
      let commission = null;

      if (completedPayment && approvedOrder!.providerId) {
        // Calculate and create real-time payout
        payout = await storage.calculateAndCreatePayout(orderId, completedPayment.id);
        
        if (payout) {
          // Auto-approve and process payout immediately
          const processedPayout = await storage.updatePayout(payout.id, {
            status: 'completed',
            processedAt: new Date(),
            externalPayoutId: `approved_payout_${Date.now()}`,
          });
          
          commission = calculateCommission(parseFloat(completedPayment.amount.toString()));
          
          // Create commission transaction
          await storage.createTransaction({
            userId: approvedOrder!.providerId,
            orderId: orderId,
            paymentId: completedPayment.id,
            payoutId: payout.id,
            type: 'commission',
            amount: commission.providerEarnings.toString(),
            currency: completedPayment.currency,
            description: `Commission for approved order: ${approvedOrder!.title}`,
            metadata: JSON.stringify({ 
              commission, 
              payoutId: payout.id,
              approvedAt: new Date(),
              customerRating,
              payoutMethod: 'customer-approved'
            }),
          });

          payout = processedPayout;
        }
      }

      res.json({
        success: true,
        data: {
          order: approvedOrder,
          payout: payout,
          commission: commission,
          realTimePayoutProcessed: !!payout
        },
        message: payout 
          ? `Order approved! Provider earned $${commission?.providerEarnings.toFixed(2)} commission (paid instantly)`
          : "Order approved successfully"
      });

    } catch (error) {
      console.error('Error approving order:', error);
      res.status(500).json({
        success: false,
        message: "Failed to approve order"
      });
    }
  });

  // Customer disputes order
  app.post("/api/orders/:id/dispute", async (req, res) => {
    try {
      const { id: orderId } = req.params;
      const validation = disputeSubmissionSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid dispute data",
          errors: validation.error.errors
        });
      }

      const disputeData = validation.data;
      
      // Get current order
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Verify order status
      if (order.status !== 'awaiting_approval') {
        return res.status(400).json({
          success: false,
          message: "Can only dispute orders awaiting approval"
        });
      }

      // Create dispute
      const dispute = await storage.createDispute({
        orderId: orderId,
        customerId: order.creatorId!,
        providerId: order.providerId!,
        disputeType: disputeData.disputeType,
        title: disputeData.title,
        description: disputeData.description,
        evidence: disputeData.evidence || [],
      });

      // Update order status to disputed
      await storage.updateOrder(orderId, {
        status: 'disputed',
        updatedAt: new Date(),
      });

      // Update approval request
      const approval = await storage.getOrderApprovalByOrder(orderId);
      if (approval) {
        await storage.updateOrderApproval(approval.id, {
          status: 'disputed',
        });
      }

      res.json({
        success: true,
        data: dispute,
        message: "Dispute submitted successfully. Our team will review it shortly."
      });

    } catch (error) {
      console.error('Error creating dispute:', error);
      res.status(500).json({
        success: false,
        message: "Failed to submit dispute"
      });
    }
  });

  // Delete order
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
=======
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
      const deleted = await storage.deleteOrder(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }
<<<<<<< HEAD

      res.json({
        success: true,
        message: "Order deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({
        success: false,
        message: "Failed to delete order"
=======
      
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
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
      });
    }
  });

<<<<<<< HEAD
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

  // PAYMENT SYSTEM ENDPOINTS

  // Get available payment methods
  app.get("/api/payment/methods", async (req, res) => {
    try {
      res.json({
        success: true,
        data: PAYMENT_METHODS,
        message: "Available payment methods"
      });
    } catch (error) {
      console.error('Error getting payment methods:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get payment methods"
      });
    }
  });

  // Create payment for order
  app.post("/api/orders/:id/payment", async (req, res) => {
    try {
      const { id: orderId } = req.params;
      const validation = paymentValidationSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment data",
          errors: validation.error.errors
        });
      }

      const paymentData = validation.data;
      
      // Verify order exists and is not already paid
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      if (order.isPaid) {
        return res.status(400).json({
          success: false,
          message: "Order is already paid"
        });
      }

      // Create payment record
      const payment = await storage.createPayment({
        orderId,
        payerId: req.body.payerId, // This would come from auth in real app
        amount: paymentData.amount.toString(),
        currency: paymentData.currency,
        paymentMethod: paymentData.paymentMethod,
        paymentMetadata: JSON.stringify(paymentData.paymentMetadata || {}),
      });

      res.status(201).json({
        success: true,
        data: payment,
        message: "Payment created successfully"
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        message: "Failed to create payment"
      });
    }
  });

  // Process crypto payment
  app.post("/api/payments/:id/crypto", async (req, res) => {
    try {
      const { id: paymentId } = req.params;
      const validation = cryptoPaymentSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid crypto payment data",
          errors: validation.error.errors
        });
      }

      const cryptoData = validation.data;
      
      // Get payment record
      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }

      // Update payment with crypto transaction details
      const updatedPayment = await storage.updatePayment(paymentId, {
        status: 'processing',
        externalTransactionHash: cryptoData.transactionHash,
        paymentGatewayResponse: JSON.stringify({
          senderWallet: cryptoData.senderWallet,
          transactionHash: cryptoData.transactionHash,
          submittedAt: new Date()
        }),
      });

      // In a real app, here we would verify the transaction on blockchain
      // For MVP, we'll simulate verification after a short delay
      setTimeout(async () => {
        try {
          // Simulate blockchain verification success
          await storage.updatePayment(paymentId, {
            status: 'completed',
          });
          
          // Process order payment and create payout
          await storage.processOrderPayment(payment.orderId, paymentId);
          const order = await storage.getOrderById(payment.orderId);
          
          if (order && order.providerId) {
            await storage.calculateAndCreatePayout(payment.orderId, paymentId);
          }
        } catch (error) {
          console.error('Error processing crypto payment:', error);
          await storage.updatePayment(paymentId, {
            status: 'failed',
            failureReason: 'Blockchain verification failed',
          });
        }
      }, 2000); // 2 second delay to simulate verification

      res.json({
        success: true,
        data: updatedPayment,
        message: "Crypto payment submitted for verification"
      });
    } catch (error) {
      console.error('Error processing crypto payment:', error);
      res.status(500).json({
        success: false,
        message: "Failed to process crypto payment"
      });
    }
  });

  // Complete fiat payment (webhook simulation)
  app.post("/api/payments/:id/complete", async (req, res) => {
    try {
      const { id: paymentId } = req.params;
      
      const payment = await storage.getPaymentById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }

      // Update payment status to completed
      const updatedPayment = await storage.updatePayment(paymentId, {
        status: 'completed',
        externalPaymentId: req.body.externalPaymentId || `stripe_${Date.now()}`,
        paymentGatewayResponse: JSON.stringify(req.body),
      });

      // Process order payment and create automatic payout
      await storage.processOrderPayment(payment.orderId, paymentId);
      const order = await storage.getOrderById(payment.orderId);
      
      let payout = null;
      if (order && order.providerId) {
        payout = await storage.calculateAndCreatePayout(payment.orderId, paymentId);
        
        // Auto-approve payout for MVP (in real app, this might have approval workflow)
        if (payout) {
          await storage.updatePayout(payout.id, {
            status: 'completed',
            processedAt: new Date(),
            externalPayoutId: `payout_${Date.now()}`,
          });
        }
      }

      res.json({
        success: true,
        data: {
          payment: updatedPayment,
          payout: payout,
          commission: calculateCommission(parseFloat(payment.amount.toString()))
        },
        message: "Payment completed and payout processed"
      });
    } catch (error) {
      console.error('Error completing payment:', error);
      res.status(500).json({
        success: false,
        message: "Failed to complete payment"
      });
    }
  });

  // Get payment status
  app.get("/api/payments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getPaymentById(id);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }

      res.json({
        success: true,
        data: payment,
        message: "Payment retrieved successfully"
      });
    } catch (error) {
      console.error('Error getting payment:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get payment"
      });
    }
  });

  // Get user transactions
  app.get("/api/users/:id/transactions", async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.query;
      
      let transactions = await storage.getTransactionsByUser(id);
      
      if (type && typeof type === 'string') {
        transactions = transactions.filter(t => t.type === type);
      }
      
      res.json({
        success: true,
        data: transactions.sort((a, b) => 
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        ),
        message: `Found ${transactions.length} transactions`
      });
    } catch (error) {
      console.error('Error getting user transactions:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get user transactions"
      });
    }
  });

  // Get user payouts
  app.get("/api/users/:id/payouts", async (req, res) => {
    try {
      const { id } = req.params;
      const payouts = await storage.getPayoutsByUser(id);
      
      res.json({
        success: true,
        data: payouts.sort((a, b) => 
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        ),
        message: `Found ${payouts.length} payouts`
      });
    } catch (error) {
      console.error('Error getting user payouts:', error);
      res.status(500).json({
        success: false,
        message: "Failed to get user payouts"
      });
    }
  });

  // Calculate commission preview
  app.get("/api/payment/commission/:amount", async (req, res) => {
    try {
      const { amount } = req.params;
      const { platformFee } = req.query;
      
      const totalAmount = parseFloat(amount);
      const feePercentage = platformFee ? parseFloat(platformFee as string) : 10;
      
      if (isNaN(totalAmount) || totalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount"
        });
      }
      
      const commission = calculateCommission(totalAmount, feePercentage);
      
      res.json({
        success: true,
        data: commission,
        message: "Commission calculated successfully"
      });
    } catch (error) {
      console.error('Error calculating commission:', error);
      res.status(500).json({
        success: false,
        message: "Failed to calculate commission"
      });
    }
  });

  // Geographic safety routes
  app.post("/api/orders/check-location", async (req, res) => {
    try {
      const location = geoLocationSchema.parse(req.body);
      const assessment = assessGeoRisk(location.latitude, location.longitude);
      const riskInfo = formatRiskLevel(assessment.riskLevel);
      
      res.json({
        success: true,
        data: {
          ...assessment,
          riskInfo
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Location check failed"
      });
    }
  });

  // Content moderation routes
  app.post("/api/orders/:id/check-content", async (req, res) => {
    try {
      const { content, type } = req.body;
      const orderId = req.params.id;
      
      if (type === 'voice') {
        const voiceCheck = checkVoiceContent(content);
        if (voiceCheck.emergencyDetected || voiceCheck.shouldTerminate) {
          // Create content violation
          await storage.createContentViolation({
            orderId,
            userId: 'system',
            violationType: 'voice_violation',
            content,
            confidence: '0.95',
            isConfirmed: false,
            action: voiceCheck.shouldTerminate ? 'order_cancelled' : 'warning'
          });

          res.json({
            success: true,
            data: {
              violation: true,
              action: voiceCheck.shouldTerminate ? 'terminate' : 'warning',
              alerts: voiceCheck.alerts,
              emergency: voiceCheck.emergencyDetected
            }
          });
        } else {
          res.json({
            success: true,
            data: { violation: false }
          });
        }
      } else {
        const contentCheck = checkContentViolations(content);
        if (contentCheck.violations.length > 0) {
          await storage.createContentViolation({
            orderId,
            userId: 'system',
            violationType: 'keyword_detected',
            content,
            confidence: contentCheck.confidence.toString(),
            isConfirmed: false,
            action: contentCheck.severity === 'critical' ? 'order_cancelled' : 'warning'
          });

          res.json({
            success: true,
            data: {
              violation: true,
              severity: contentCheck.severity,
              violations: contentCheck.violations,
              action: contentCheck.severity === 'critical' ? 'terminate' : 'warning'
            }
          });
        } else {
          res.json({
            success: true,
            data: { violation: false }
          });
        }
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Content check failed"
      });
    }
  });

  // AA Group routes
  app.post("/api/orders/:id/create-aa-group", async (req, res) => {
    try {
      const orderId = req.params.id;
      const groupData = aaGroupCreationSchema.parse(req.body);
      
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      const validation = validateAAGroupCreation(order, groupData.maxParticipants);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(', ')
        });
      }

      const splitAmount = calculateSplitAmount(parseFloat(order.price), groupData.maxParticipants);
      const expiresAt = getAAGroupExpirationTime(groupData.expirationHours);

      const aaGroup = await storage.createOrderGroup({
        originalOrderId: orderId,
        groupType: 'aa_split',
        totalAmount: order.price,
        splitAmount: splitAmount.toString(),
        maxParticipants: groupData.maxParticipants,
        currentParticipants: 1,
        isComplete: false,
        expiresAt
      });

      // Add creator as first participant
      await storage.addGroupParticipant({
        groupId: aaGroup.id,
        userId: order.creatorId || 'anonymous',
        amount: splitAmount.toString(),
        isPaid: false
      });

      res.json({
        success: true,
        data: aaGroup
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create AA group"
      });
    }
  });

  app.get("/api/aa-groups/:id", async (req, res) => {
    try {
      const groupId = req.params.id;
      
      const group = await storage.getOrderGroupById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "AA group not found"
        });
      }

      const participants = await storage.getGroupParticipants(groupId);
      const status = getAAGroupStatus(group, participants);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get AA group"
      });
    }
  });

  app.post("/api/aa-groups/:id/join", async (req, res) => {
    try {
      const groupId = req.params.id;
      const { userId } = req.body;
      
      const group = await storage.getOrderGroupById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "AA group not found"
        });
      }

      const participants = await storage.getGroupParticipants(groupId);
      const status = getAAGroupStatus(group, participants);

      if (!status.canJoin) {
        return res.status(400).json({
          success: false,
          message: "Cannot join this group"
        });
      }

      // Check if user already joined
      const existingParticipant = participants.find(p => p.userId === userId);
      if (existingParticipant) {
        return res.status(400).json({
          success: false,
          message: "User already joined this group"
        });
      }

      await storage.addGroupParticipant({
        groupId,
        userId,
        amount: group.splitAmount.toString(),
        isPaid: false
      });

      // Update group participant count
      await storage.updateOrderGroup(groupId, {
        currentParticipants: (group.currentParticipants || 0) + 1
      });

      res.json({
        success: true,
        message: "Successfully joined AA group"
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to join AA group"
      });
    }
  });

  // Weather alerts
  app.get("/api/weather/alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveWeatherAlerts();
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get weather alerts"
      });
    }
  });

  // Geofencing endpoints
  app.get("/api/geofences", async (req, res) => {
    try {
      const geofences = await storage.getGeofences();
      res.json({
        success: true,
        data: geofences
      });
    } catch (error) {
      console.error("Error fetching geofences:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch geofences"
      });
    }
  });

  app.post("/api/geofences", async (req, res) => {
    try {
      const { geofenceCreationSchema } = await import("@shared/schema");
      const geofenceData = geofenceCreationSchema.parse(req.body);
      
      // Convert coordinates to JSON string
      const coordinatesJson = JSON.stringify(geofenceData.coordinates);
      const timeRestrictionsJson = geofenceData.timeRestrictions ? 
        JSON.stringify(geofenceData.timeRestrictions) : null;

      const geofence = await storage.createGeofence({
        name: geofenceData.name,
        description: geofenceData.description || null,
        type: geofenceData.type,
        coordinates: coordinatesJson,
        action: geofenceData.action,
        priority: geofenceData.priority,
        timeRestrictions: timeRestrictionsJson
      });

      res.json({
        success: true,
        data: geofence
      });
    } catch (error) {
      console.error("Error creating geofence:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create geofence"
      });
    }
  });

  // Location timezone check endpoint
  app.post("/api/check-location", async (req, res) => {
    try {
      const { timezoneCheckSchema } = await import("@shared/schema");
      const { checkLocationWithTimezone } = await import("@shared/geofence-timezone");
      
      const { latitude, longitude, timestamp } = timezoneCheckSchema.parse(req.body);
      
      const activeGeofences = await storage.getActiveGeofences();
      const activeTimezoneRules = await storage.getActiveTimezoneRules();
      
      const checkTime = timestamp ? new Date(timestamp) : new Date();
      const result = checkLocationWithTimezone(
        latitude,
        longitude,
        activeGeofences,
        activeTimezoneRules,
        checkTime
      );

      res.json({
        success: true,
        data: {
          location: { latitude, longitude },
          timestamp: checkTime.toISOString(),
          timezone: result.timezoneInfo,
          geofences: result.geofenceResults,
          decision: result.finalDecision,
          messages: result.messages,
          isAllowed: result.finalDecision === 'allow',
          hasTimeRestrictions: result.finalDecision === 'restrict_time'
        }
      });
    } catch (error) {
      console.error("Error checking location:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to check location"
      });
    }
  });

  // Initialize default geofences and timezone rules
  app.post("/api/initialize-geofences", async (req, res) => {
    try {
      const { DEFAULT_GEOFENCES, DEFAULT_TIMEZONE_RULES } = await import("@shared/geofence-timezone");
      
      const createdGeofences = [];
      const createdRules = [];
      
      // Create default geofences
      for (const gf of DEFAULT_GEOFENCES) {
        const geofence = await storage.createGeofence({
          name: gf.name,
          description: gf.description,
          type: gf.type,
          coordinates: gf.coordinates,
          action: gf.action,
          priority: gf.priority,
          timeRestrictions: gf.timeRestrictions || null
        });
        createdGeofences.push(geofence);
      }
      
      // Create default timezone rules
      for (const rule of DEFAULT_TIMEZONE_RULES) {
        const tzRule = await storage.createTimezoneRule({
          region: rule.region,
          timezone: rule.timezone,
          allowedHours: rule.allowedHours,
          restrictedDays: rule.restrictedDays
        });
        createdRules.push(tzRule);
      }

      res.json({
        success: true,
        data: {
          geofences: createdGeofences,
          timezoneRules: createdRules
        },
        message: "Default geofences and timezone rules initialized"
      });
    } catch (error) {
      console.error("Error initializing defaults:", error);
      res.status(500).json({
        success: false,
        message: "Failed to initialize defaults"
      });
    }
  });

  // Payment endpoints for MVP
  
  // Create payment intent for order
  app.post("/api/orders/:id/payment", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      if (order.isPaid) {
        return res.status(400).json({
          success: false,
          message: "Order is already paid"
        });
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(order.price) * 100), // Convert to cents
        currency: order.currency.toLowerCase(),
        metadata: {
          orderId: order.id,
          orderTitle: order.title,
          creatorId: order.creatorId || ''
        }
      });

      // Create payment record
      const payment = await storage.createPayment({
        orderId: order.id,
        payerId: req.body.payerId || order.creatorId || '', // Assuming authenticated user
        amount: order.price,
        currency: order.currency,
        paymentMethod: 'stripe',
        paymentMetadata: JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          externalPaymentId: paymentIntent.id
        })
      });

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentId: payment.id
        }
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        message: "Failed to create payment"
      });
    }
  });

  // Webhook endpoint for Stripe payment status updates
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send('Webhook signature verification failed');
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const orderId = paymentIntent.metadata.orderId;
          
          if (orderId) {
            // Update payment status
            const payments = await storage.getPaymentsByOrder(orderId);
            const payment = payments.find(p => p.externalPaymentId === paymentIntent.id);
            
            if (payment) {
              await storage.updatePayment(payment.id, {
                status: 'completed'
              });
              
              // Update order payment status
              await storage.updateOrder(orderId, {
                isPaid: true,
                status: 'accepted' // Move order to next status
              });
              
              // Process commission and create payout
              await storage.processOrderPayment(orderId, payment.id);
            }
          }
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          const failedOrderId = failedPayment.metadata.orderId;
          
          if (failedOrderId) {
            const payments = await storage.getPaymentsByOrder(failedOrderId);
            const payment = payments.find(p => p.externalPaymentId === failedPayment.id);
            
            if (payment) {
              await storage.updatePayment(payment.id, {
                status: 'failed',
                failureReason: failedPayment.last_payment_error?.message || 'Payment failed'
              });
            }
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({
        success: false,
        message: "Webhook processing failed"
      });
    }
  });

  // Get payment status for an order
  app.get("/api/orders/:id/payment-status", async (req, res) => {
    try {
      const { id } = req.params;
      const payments = await storage.getPaymentsByOrder(id);
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      res.json({
        success: true,
        data: {
          isPaid: order.isPaid,
          payments: payments.map(p => ({
            id: p.id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            paymentMethod: p.paymentMethod,
            createdAt: p.createdAt
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching payment status:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment status"
      });
    }
  });

  // Cancel order - update status to cancelled instead of deleting
  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Update order status to cancelled instead of actual deletion
      const updatedOrder = await storage.updateOrder(id, { status: 'cancelled' });
      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }
      
      res.json({
        success: true,
        data: updatedOrder,
        message: "Order cancelled successfully"
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel order"
      });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for video streaming signaling
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active stream rooms
  const streamRooms = new Map<string, Set<WebSocket>>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join-stream':
            const { streamId } = message;
            if (!streamRooms.has(streamId)) {
              streamRooms.set(streamId, new Set());
            }
            streamRooms.get(streamId)!.add(ws);
            
            // Notify others in the room
            streamRooms.get(streamId)!.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'user-joined',
                  streamId
                }));
              }
            });
            break;
            
          case 'webrtc-offer':
          case 'webrtc-answer':
          case 'webrtc-ice-candidate':
            // Forward WebRTC signaling to all other clients in the stream
            const targetStreamId = message.streamId;
            if (streamRooms.has(targetStreamId)) {
              streamRooms.get(targetStreamId)!.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(data.toString());
                }
              });
            }
            break;
            
          case 'start-streaming':
            // Streamer started broadcasting
            const { orderId } = message;
            if (streamRooms.has(orderId)) {
              streamRooms.get(orderId)!.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'stream-started',
                    streamId: orderId
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove client from all rooms
      streamRooms.forEach((clients, streamId) => {
        clients.delete(ws);
        if (clients.size === 0) {
          streamRooms.delete(streamId);
        }
      });
    });
  });

  return httpServer;
}
=======
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
>>>>>>> 5a80c919e762d1f1ca97ba29eb4d9e63ec9af417
