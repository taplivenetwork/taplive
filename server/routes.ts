import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { Webhook } from "svix";
import { storage } from "./storage";
import { syncClerkUserToDatabase, authenticateUser } from "./auth";
import { insertOrderSchema, ratingValidationSchema, paymentValidationSchema, cryptoPaymentSchema, disputeSubmissionSchema, geoLocationSchema, aaGroupCreationSchema, type Order } from "@shared/schema";
import { calculateCommission, PAYMENT_METHODS } from "@shared/payment";
import { assessGeoRisk, checkContentViolations, checkVoiceContent, formatRiskLevel } from "@shared/geo-safety";
import { validateAAGroupCreation, getAAGroupStatus, calculateSplitAmount, getAAGroupExpirationTime } from "@shared/aa-group";
import { z } from "zod";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set - payment processing will fail');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "empty", {
  apiVersion: "2025-08-27.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Clerk webhook for user sync
  app.post("/api/webhooks/clerk", async (req, res) => {
    try {
      const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
      
      if (!WEBHOOK_SECRET) {
        console.error('Missing CLERK_WEBHOOK_SECRET');
        return res.status(500).json({ error: 'Webhook secret not configured' });
      }

      const svix_id = req.headers["svix-id"] as string;
      const svix_timestamp = req.headers["svix-timestamp"] as string;
      const svix_signature = req.headers["svix-signature"] as string;

      if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ error: 'Missing svix headers' });
      }

      const wh = new Webhook(WEBHOOK_SECRET);
      const payload = JSON.stringify(req.body);
      
      let evt: any;
      try {
        evt = wh.verify(payload, {
          "svix-id": svix_id,
          "svix-timestamp": svix_timestamp,
          "svix-signature": svix_signature,
        });
      } catch (err) {
        console.error('Webhook verification failed:', err);
        return res.status(400).json({ error: 'Webhook verification failed' });
      }

      // Handle user.created event
      if (evt.type === 'user.created') {
        const clerkUserId = evt.data.id;
        await syncClerkUserToDatabase(clerkUserId, storage);
        console.log(`✅ Synced Clerk user ${clerkUserId} to database`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Clerk webhook error:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });

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

  // Sync Clerk user to database (manual sync endpoint)
  app.post("/api/users/sync", async (req, res) => {
    try {
      const { id, username, email, name, avatar } = req.body;

      if (!id || !email) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: id, email"
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUser(id);
      
      if (existingUser) {
        return res.json({
          success: true,
          message: "User already exists",
          data: existingUser
        });
      }

      // Create new user
      const newUser = await storage.createUser({
        id,
        username,
        password: 'clerk_managed',
        email,
        name,
        avatar,
        role: 'customer', // Default role for new users
      });

      res.json({
        success: true,
        message: "User synced successfully",
        data: newUser
      });
    } catch (error) {
      console.error('Error syncing user:', error);
      res.status(500).json({
        success: false,
        message: "Failed to sync user"
      });
    }
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
         console.log("created order:", order);
      // SMART DISPATCH: Find and notify matching providers
      try {
        // console.log("entered dispatch block")
        const rankedProviders = await storage.getRankedProvidersForOrder(order.id);
        // console.log("ranked providers:", rankedProviders);
        // MVP: Ensure we notify at least 3-4 providers for testing
        // Notify top 5 matched providers (or all if less than 5, minimum 3 for MVP)
        let providersToNotify = rankedProviders.slice(0, 5);
        
        if (providersToNotify.length === 0) {
          console.log('⚠️ MVP Mode: No ranked providers found, attempting fallback notification');
        }
        
        // Create order expires 30 minutes from now for provider notifications
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        
        for (const ranking of providersToNotify) {
          await storage.createNotification({
            userId: ranking.userId,
            type: 'order_dispatch',
            title: `New Order Match: ${order.title}`,
            message: `Match Score: ${ranking.dispatchScore.toFixed(0)}% | Distance: ${ranking.factors.distance.toFixed(1)}km | ${order.price} ${order.currency}`,
            orderId: order.id,
            metadata: JSON.stringify({
              dispatchScore: ranking.dispatchScore,
              distance: ranking.factors.distance,
              rank: ranking.rank,
              orderLocation: {
                latitude: order.latitude,
                longitude: order.longitude,
                address: order.address
              }
            }),
            expiresAt
          });
        }
        
        console.log(`✅ Dispatched order ${order.id} to ${providersToNotify.length} matched providers`);
      } catch (dispatchError) {
        console.error('Dispatch notification error (non-critical):', dispatchError);
        // Don't fail the order creation if dispatch fails
      }

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

      // Get current order for validation
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Handle provider acceptance (status change to 'accepted')
      if (updates.status === 'accepted' && order.status === 'pending') {
        // DON'T authorize payment when provider accepts - wait for customer to pay first
        // The authorization happens during the actual payment process
        console.log(`Provider accepted order ${id} - payment will be authorized when customer pays`);
      }

      // Handle order completion (status change to 'done')
      if (updates.status === 'done' && (order.status === 'live' || order.status === 'accepted')) {
        const price = typeof order.price === 'number' ? order.price : parseFloat(order.price);
        const commission = calculateCommission(price);
        
        // Authorize and capture payment when order is completed
        if (order.isPaid) {
          const payments = await storage.getPaymentsByOrder(id);
          const completedPayment = payments.find(p => p.status === 'completed');
          
          if (completedPayment && completedPayment.externalPaymentId && completedPayment.paymentMethod === 'stripe') {
            try {
              // Capture the authorized payment
              const capturedPayment = await stripe.paymentIntents.capture(completedPayment.externalPaymentId, {
                metadata: {
                  capturedAt: new Date().toISOString(),
                  providerId: order.providerId || '',
                  commissionAmount: commission.providerEarnings.toString()
                }
              });
              
              console.log(`✅ Payment captured for order ${id}: $${commission.providerEarnings.toFixed(2)} to provider`);
              
              // Update payment metadata with capture info
              await storage.updatePayment(completedPayment.id, {
                paymentGatewayResponse: JSON.stringify({
                  ...JSON.parse(completedPayment.paymentGatewayResponse || '{}'),
                  captured: true,
                  capturedAt: new Date().toISOString(),
                  captureAmount: commission.providerEarnings
                })
              });
            } catch (error) {
              console.error('Error capturing payment:', error);
            }
          }
        }
        
        // Process payout to provider
        if (order.isPaid && order.providerId) {
          const payments = await storage.getPaymentsByOrder(id);
          const completedPayment = payments.find(p => p.status === 'completed');
          
          if (completedPayment) {
            await storage.processOrderPayment(id, completedPayment.id);
            console.log(`✅ Payout processed: $${commission.providerEarnings.toFixed(2)} to provider ${order.providerId}`);
          }
        }
      }

      const updatedOrder = await storage.updateOrder(id, updates);
      
      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Mark notification as read when order is accepted
      if (updates.status === 'accepted' && updatedOrder.providerId) {
        try {
          const userNotifications = await storage.getUserNotifications(updatedOrder.providerId, false);
          const orderNotification = userNotifications.find(n => n.orderId === id);
          if (orderNotification) {
            await storage.markNotificationAsRead(orderNotification.id);
            console.log(`Marked notification ${orderNotification.id} as read for accepted order ${id}`);
          }
        } catch (notificationError) {
          console.error('Error marking notification as read:', notificationError);
          // Don't fail the order update if notification marking fails
        }
      }

      // Custom success messages based on status change
      let message = "Order updated successfully";
      if (updates.status === 'accepted') {
        message = "Order accepted! Payment has been frozen until stream completion.";
      } else if (updates.status === 'done') {
        const price = typeof order.price === 'number' ? order.price : parseFloat(order.price);
        const providerEarnings = price * 0.9;
        message = `Payment released! You earned $${providerEarnings.toFixed(2)}`;
      }

      res.json({
        success: true,
        data: updatedOrder,
        message: message
      });
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update order"
      });
    }
  });

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

  // Customer cancels order with penalty calculation
  app.post("/api/orders/:id/cancel", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const customerId = req.auth?.userId; 

      // Fetch order
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      // Validate customer owns this order
      if (order.creatorId !== customerId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to cancel this order"
        });
      }

      // Cannot cancel if already done or cancelled
      if (order.status === 'done' || order.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: `Order is already ${order.status}`
        });
      }

      const price = typeof order.price === 'number' ? order.price : parseFloat(order.price);
      let penaltyPercent = 0;
      let penaltyAmount = 0;
      let refundAmount = price;

      // Calculate penalty based on order status
      if (order.status === 'pending') {
        // Free cancellation before provider accepts
        penaltyPercent = 0;
        refundAmount = price;
      } else if (order.status === 'accepted' || order.status === 'live') {
        // 5% penalty after provider accepts (can be tiered by time)
        penaltyPercent = 5;
        penaltyAmount = price * 0.05;
        refundAmount = price - penaltyAmount;

        // Optional: Tiered penalty based on time until scheduled date
        if (order.scheduledAt) {
          const hoursUntilStream = (new Date(order.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);
          if (hoursUntilStream < 2) {
            penaltyPercent = 15;
            penaltyAmount = price * 0.15;
            refundAmount = price - penaltyAmount;
          } else if (hoursUntilStream < 24) {
            penaltyPercent = 10;
            penaltyAmount = price * 0.10;
            refundAmount = price - penaltyAmount;
          }
        }
      }

      // Process Stripe refund if order was paid
      if (order.isPaid) {
        const payments = await storage.getPaymentsByOrder(id);
        const completedPayment = payments.find(p => p.status === 'completed');
        
        if (completedPayment && completedPayment.externalPaymentId && completedPayment.paymentMethod === 'stripe') {
          try {
            // Create Stripe refund
            const refund = await stripe.refunds.create({
              payment_intent: completedPayment.externalPaymentId,
              amount: Math.round(refundAmount * 100), // Convert to cents
              reason: 'requested_by_customer',
              metadata: {
                orderId: id,
                customerId: customerId,
                penaltyPercent: penaltyPercent.toString(),
                cancelledAt: new Date().toISOString()
              }
            });
            
            // Update payment record with refund info
            await storage.updatePayment(completedPayment.id, {
              paymentGatewayResponse: JSON.stringify({
                refundId: refund.id,
                refundAmount,
                penaltyAmount,
                refundStatus: refund.status
              })
            });
            
            console.log(`✅ Stripe refund processed: $${refundAmount.toFixed(2)} to customer ${customerId}`);
            
            // Create refund transaction record for customer
            await storage.createTransaction({
              userId: customerId,
              orderId: id,
              paymentId: completedPayment.id,
              type: 'refund',
              amount: refundAmount.toString(),
              currency: order.currency,
              description: `Refund for cancelled order: ${order.title}`,
              metadata: JSON.stringify({
                refundId: refund.id,
                refundAmount,
                penaltyAmount,
                penaltyPercent,
                originalAmount: price,
                cancelledAt: new Date().toISOString()
              })
            });
            
            // Pay penalty to provider if applicable
            if (penaltyAmount > 0 && order.providerId && completedPayment) {
              // Create a payout record for the penalty using storage layer
              const penaltyPayout = await storage.createPayout({
                orderId: id,
                paymentId: completedPayment.id,
                recipientId: order.providerId,
                amount: penaltyAmount.toString(),
                platformFee: '0',
                currency: order.currency,
                payoutMethod: 'stripe'
              });
              
              // Update payout to completed
              await storage.updatePayout(penaltyPayout.id, {
                status: 'completed',
                processedAt: new Date(),
                externalPayoutId: `penalty_${Date.now()}`,
                payoutMetadata: JSON.stringify({
                  type: 'cancellation_penalty',
                  refundId: refund.id
                })
              });
              
              // Create transaction record for penalty payment to provider
              await storage.createTransaction({
                userId: order.providerId,
                orderId: id,
                paymentId: completedPayment.id,
                payoutId: penaltyPayout.id,
                type: 'commission',
                amount: penaltyAmount.toString(),
                currency: order.currency,
                description: `Cancellation penalty compensation: ${order.title}`,
                metadata: JSON.stringify({
                  type: 'cancellation_penalty',
                  refundId: refund.id,
                  penaltyPercent,
                  receivedAt: new Date().toISOString()
                })
              });
              
              console.log(`✅ Penalty payment: $${penaltyAmount.toFixed(2)} to provider ${order.providerId}`);
            }
          } catch (error) {
            console.error('Error processing Stripe refund:', error);
            // Continue with order cancellation even if refund fails
          }
        }
      }

      // Update order status
      const updatedOrder = await storage.updateOrder(id, { 
        status: 'cancelled' as const
      });

      res.json({
        success: true,
        data: updatedOrder,
        refundAmount,
        penaltyAmount,
        penaltyPercent,
        message: penaltyPercent === 0 
          ? "Order cancelled successfully. Full refund processed."
          : `Order cancelled. Refund: $${refundAmount.toFixed(2)} (${penaltyPercent}% cancellation fee: $${penaltyAmount.toFixed(2)})`
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
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

  // Update user profile
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated via this endpoint
      const { password, id: _, createdAt, ...allowedUpdates } = updates;

      const updatedUser = await storage.updateUser(id, allowedUpdates);
      
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Don't expose password
      const { password: pwd, ...userWithoutPassword } = updatedUser;

      res.json({
        success: true,
        data: userWithoutPassword,
        message: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update user profile"
      });
    }
  });

  // ========== NOTIFICATION ROUTES ==========

  // Get user notifications
  app.get("/api/users/:userId/notifications", async (req, res) => {
    try {
      const { userId } = req.params;
      const { unreadOnly } = req.query;
      
      const notifications = await storage.getUserNotifications(
        userId,
        unreadOnly === 'true'
      );
      console.log("got the notification", notifications)
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch notifications"
      });
    }
  });

  // Get active order dispatch notifications for provider
  app.get("/api/users/:userId/notifications/orders", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getActiveOrderNotifications(userId);
      // console.log("fetched order notifications:", notifications);
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error fetching order notifications:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch order notifications"
      });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found"
        });
      }
      
      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: "Failed to mark notification as read"
      });
    }
  });

  // Mark all notifications as read for user
  app.post("/api/users/:userId/notifications/read-all", async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.markAllNotificationsAsRead(userId);
      
      res.json({
        success: true,
        message: "All notifications marked as read"
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read"
      });
    }
  });

  // ========== RATING ROUTES ==========

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
      const validation = paymentValidationSchema.safeParse({
        orderId,
        ...req.body
      });

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
 console.log("this is the order", order);
      if (order.isPaid) {
        return res.status(400).json({
          success: false,
          message: "Order is already paid"
        });
      }

      // Check if payment already exists for this order
      const existingPayments = await storage.getPaymentsByOrder(orderId);
      const existingStripePayment = existingPayments.find(p => p.paymentMethod === 'stripe' && p.externalPaymentId);

      if (existingStripePayment) {
        // Return existing PaymentIntent data instead of creating new one
        const existingMetadata = typeof existingStripePayment.paymentMetadata === 'string' 
          ? JSON.parse(existingStripePayment.paymentMetadata)
          : (existingStripePayment.paymentMetadata || {});

        console.log(`✅ Using existing PaymentIntent: ${existingStripePayment.externalPaymentId}`);
        
        res.status(200).json({
          success: true,
          data: {
            payment: existingStripePayment,
            clientSecret: existingMetadata.clientSecret
          },
          message: "Existing payment found"
        });
        return;
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

      // Create Stripe payment intent if using Stripe
      let clientSecret = null;
      if (paymentData.paymentMethod === 'stripe') {
        try {
          if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'empty') {
            throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
          }

          // Create real Stripe PaymentIntent
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(paymentData.amount * 100), // Convert to cents
            currency: paymentData.currency.toLowerCase(),
            payment_method_types: ['card'], // Explicitly specify card payments only
            metadata: {
              orderId: orderId,
              payerId: req.body.payerId,
              paymentId: payment.id,
              ...(paymentData.paymentMetadata || {})
            },
            description: `Payment for order ${orderId}`,
            capture_method: 'manual' // Changed from automatic_async to manual
          });

          console.log("this is the payment intent", paymentIntent);

          clientSecret = paymentIntent.client_secret;

          // Update payment with Stripe metadata
          await storage.updatePayment(payment.id, {
            externalPaymentId: paymentIntent.id,
            paymentMetadata: JSON.stringify({
              ...paymentData.paymentMetadata,
              clientSecret: clientSecret,
              paymentIntentId: paymentIntent.id,
              status: paymentIntent.status
            })
          });

          console.log(`✅ Stripe PaymentIntent created: ${paymentIntent.id}`);
          console.log("status of the payment intent", paymentIntent.status);
        } catch (error) {
          console.error('Error creating Stripe PaymentIntent:', error);
          // Clean up payment record
          await storage.updatePayment(payment.id, {
            status: 'failed',
            failureReason: error instanceof Error ? error.message : 'Failed to create Stripe payment'
          });
          throw error;
        }
      }

      res.status(201).json({
        success: true,
        data: {
          payment,
          clientSecret
        },
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
  
  // Webhook endpoint for Stripe payment status updates
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      let event;

      try {
        // Skip signature verification if no webhook secret (local dev without Stripe CLI)
        if (process.env.STRIPE_WEBHOOK_SECRET) {
          event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET);
        } else {
          console.warn('⚠️  STRIPE_WEBHOOK_SECRET not set - webhook signature verification skipped');
          event = JSON.parse(req.body);
        }
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
            // Update payment status to completed
            const payments = await storage.getPaymentsByOrder(orderId);
            const payment = payments.find(p => p.externalPaymentId === paymentIntent.id);
            
            if (payment) {
              await storage.updatePayment(payment.id, {
                status: 'completed',
                paymentGatewayResponse: JSON.stringify({
                  ...JSON.parse(payment.paymentGatewayResponse || '{}'),
                  webhookReceived: true,
                  webhookEvent: 'payment_intent.succeeded',
                  receivedAt: new Date().toISOString()
                })
              });
              
              // Update order to mark as paid, but don't change status yet
              await storage.updateOrder(orderId, {
                isPaid: true
              });
              
              console.log(`✅ Payment completed for order ${orderId} via webhook`);
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

  // Confirm payment status from frontend
  app.post("/api/payments/:paymentIntentId/confirm", async (req, res) => {
    try {
      const { paymentIntentId } = req.params;
      const { status, orderId } = req.body;
      
      console.log(`💳 Confirming payment ${paymentIntentId} with status: ${status}`);
      
      // Get payment by external payment ID
      const payments = await storage.getPaymentsByOrder(orderId);
      const payment = payments.find(p => p.externalPaymentId === paymentIntentId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found"
        });
      }
      
      // Update payment to completed status (requires_capture is considered completed)
      const existingMetadata = typeof payment.paymentMetadata === 'string' 
        ? JSON.parse(payment.paymentMetadata || '{}')
        : (payment.paymentMetadata || {});
      
      const existingGatewayResponse = typeof payment.paymentGatewayResponse === 'string'
        ? JSON.parse(payment.paymentGatewayResponse || '{}')
        : (payment.paymentGatewayResponse || {});
      
      await storage.updatePayment(payment.id, {
        status: 'completed',
        paymentMetadata: JSON.stringify({
          ...existingMetadata,
          stripeStatus: status,
          authorizedAt: new Date().toISOString(),
          requiresCapture: status === 'requires_capture'
        }),
        paymentGatewayResponse: JSON.stringify({
          ...existingGatewayResponse,
          frontendConfirmed: true,
          confirmedStatus: status,
          confirmedAt: new Date().toISOString()
        })
      });
      
      // Update order to mark as paid
      const order = await storage.updateOrder(orderId, {
        isPaid: true
      });
      
      // Create transaction record for customer payment
      if (order) {
        await storage.createTransaction({
          userId: payment.payerId,
          orderId: orderId,
          paymentId: payment.id,
          type: 'payment',
          amount: payment.amount.toString(),
          currency: payment.currency,
          description: `Payment for order: ${order.title}`,
          metadata: JSON.stringify({
            paymentIntentId,
            stripeStatus: status,
            paymentMethod: payment.paymentMethod,
            authorizedAt: new Date().toISOString()
          })
        });
        console.log(`✅ Transaction record created for payment ${payment.id}`);
      }
      
      console.log(`✅ Payment ${paymentIntentId} marked as completed in database`);
      console.log(`✅ Order ${orderId} marked as paid`);
      
      res.json({
        success: true,
        message: "Payment confirmed successfully"
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({
        success: false,
        message: "Failed to confirm payment"
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

  // ========== STREAM ENDPOINTS ==========

  // Get live streams
  app.get("/api/streams/live", async (req, res) => {
    try {
      const liveStreams = await storage.getOrdersByStatus('live');

      // Enrich with user data
      const enrichedStreams = await Promise.all(
        liveStreams.map(async (stream) => {
          const creator = stream.creatorId ? await storage.getUser(stream.creatorId) : null;
          const provider = stream.providerId ? await storage.getUser(stream.providerId) : null;

          return {
            id: stream.id,
            title: stream.title,
            description: stream.description,
            location: stream.address,
            latitude: stream.latitude,
            longitude: stream.longitude,
            viewers: Math.floor(Math.random() * 50) + 1, // Mock viewer count for now
            duration: stream.duration,
            streamer: provider?.name || creator?.name || 'Anonymous',
            streamerId: provider?.id || creator?.id,
            status: stream.status,
            thumbnail: stream.liveUrl || '/api/placeholder/300/200',
            liveUrl: stream.liveUrl,
            scheduledAt: stream.scheduledAt,
            createdAt: stream.createdAt,
            category: stream.category,
            price: stream.price,
            currency: stream.currency
          };
        })
      );

      res.json({
        success: true,
        data: enrichedStreams,
        meta: {
          total: enrichedStreams.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching live streams:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch live streams"
      });
    }
  });

  // Get upcoming streams
  app.get("/api/streams/upcoming", async (req, res) => {
    try {
      const upcomingStreams = await storage.getOrdersByStatus('accepted');

      // Filter for future scheduled streams
      const now = new Date();
      const futureStreams = upcomingStreams.filter(stream =>
        new Date(stream.scheduledAt) > now
      );

      // Enrich with user data
      const enrichedStreams = await Promise.all(
        futureStreams.map(async (stream) => {
          const creator = stream.creatorId ? await storage.getUser(stream.creatorId) : null;
          const provider = stream.providerId ? await storage.getUser(stream.providerId) : null;

          return {
            id: stream.id,
            title: stream.title,
            description: stream.description,
            location: stream.address,
            latitude: stream.latitude,
            longitude: stream.longitude,
            scheduledTime: new Date(stream.scheduledAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            duration: stream.duration,
            streamer: provider?.name || creator?.name || 'Anonymous',
            streamerId: provider?.id || creator?.id,
            status: stream.status,
            thumbnail: '/api/placeholder/300/200',
            scheduledAt: stream.scheduledAt,
            createdAt: stream.createdAt,
            category: stream.category,
            price: stream.price,
            currency: stream.currency
          };
        })
      );

      // Sort by scheduled time
      enrichedStreams.sort((a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );

      res.json({
        success: true,
        data: enrichedStreams,
        meta: {
          total: enrichedStreams.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching upcoming streams:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch upcoming streams"
      });
    }
  });

  // Get stream by ID
  app.get("/api/streams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const stream = await storage.getOrderById(id);

      if (!stream) {
        return res.status(404).json({
          success: false,
          message: "Stream not found"
        });
      }

      // Enrich with user data
      const creator = stream.creatorId ? await storage.getUser(stream.creatorId) : null;
      const provider = stream.providerId ? await storage.getUser(stream.providerId) : null;

      const enrichedStream = {
        id: stream.id,
        title: stream.title,
        description: stream.description,
        location: stream.address,
        latitude: stream.latitude,
        longitude: stream.longitude,
        viewers: Math.floor(Math.random() * 50) + 1, // Mock viewer count
        duration: stream.duration,
        streamer: provider?.name || creator?.name || 'Anonymous',
        streamerId: provider?.id || creator?.id,
        status: stream.status,
        thumbnail: stream.liveUrl || '/api/placeholder/300/200',
        liveUrl: stream.liveUrl,
        scheduledAt: stream.scheduledAt,
        createdAt: stream.createdAt,
        category: stream.category,
        price: stream.price,
        currency: stream.currency,
        tags: stream.tags,
        isPaid: stream.isPaid,
        maxParticipants: stream.maxParticipants,
        currentParticipants: stream.currentParticipants
      };

      res.json({
        success: true,
        data: enrichedStream
      });
    } catch (error) {
      console.error('Error fetching stream:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch stream"
      });
    }
  });

  // ========== EARNINGS ENDPOINTS ==========

  // Get user earnings summary
  app.get("/api/users/:userId/earnings", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user to verify they are a provider
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      if (user.role !== 'provider') {
        return res.status(403).json({
          success: false,
          message: "Earnings data is only available for providers"
        });
      }

      // Get payouts for the user
      const payouts = await storage.getPayoutsByUser(userId);
      
      // Calculate total earnings
      const totalEarnings = payouts
        .filter(p => p.status === 'completed')
        .reduce((sum, payout) => sum + parseFloat(payout.amount.toString()), 0);

      // Calculate monthly earnings (current month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyEarnings = payouts
        .filter(p => p.status === 'completed' && new Date(p.createdAt!) >= startOfMonth)
        .reduce((sum, payout) => sum + parseFloat(payout.amount.toString()), 0);

      // Get completed orders count (this month)
      const completedOrdersThisMonth = await storage.getOrdersByStatus('done');
      const providerCompletedOrders = completedOrdersThisMonth.filter(order => 
        order.providerId === userId && new Date(order.updatedAt!) >= startOfMonth
      ).length;

      // Get average rating from completed orders
      const completedOrders = await storage.getOrdersByStatus('done');
      const providerOrders = completedOrders.filter(order => order.providerId === userId);
      
      let avgRating = 0;
      if (providerOrders.length > 0) {
        const ratings = await Promise.all(
          providerOrders.map(order => storage.getRatingsByOrder(order.id))
        );
        const allRatings = ratings.flat();
        if (allRatings.length > 0) {
          avgRating = allRatings.reduce((sum, rating) => sum + rating.rating, 0) / allRatings.length;
        }
      }

      // Get recent earnings (last 10 payouts)
      const recentPayouts = payouts
        .filter(p => p.status === 'completed')
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 10);

      // Enrich recent payouts with order data
      const recentEarnings = await Promise.all(
        recentPayouts.map(async (payout) => {
          const order = await storage.getOrderById(payout.orderId);
          return {
            id: payout.id,
            title: order?.title || 'Unknown Order',
            amount: parseFloat(payout.amount.toString()),
            date: new Date(payout.createdAt!).toISOString().split('T')[0],
            duration: order?.duration || 0,
            orderId: payout.orderId,
            status: payout.status
          };
        })
      );

      res.json({
        success: true,
        data: {
          totalEarnings,
          monthlyEarnings,
          completedStreams: providerCompletedOrders,
          avgRating: parseFloat(avgRating.toFixed(1)),
          recentEarnings
        }
      });
    } catch (error) {
      console.error('Error fetching earnings:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch earnings data"
      });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for video streaming signaling
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active stream rooms and broadcaster connections
  const streamRooms = new Map<string, Set<WebSocket>>();
  const broadcasters = new Map<string, WebSocket>(); // streamId -> broadcaster WebSocket
  const clientIds = new Map<WebSocket, string>(); // WebSocket -> unique client ID
  let clientIdCounter = 0;
  
  wss.on('connection', (ws: WebSocket) => {
    const clientId = `client_${++clientIdCounter}`;
    clientIds.set(ws, clientId);
    console.log(`✅ WebSocket client connected: ${clientId}`);
    let clientStreamId: string | null = null;
    let isBroadcaster = false;
    
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Received message type: ${message.type}`, { streamId: message.streamId });
        
        switch (message.type) {
          case 'broadcaster-ready':
            // Provider is ready to broadcast
            const broadcastStreamId = message.streamId;
            clientStreamId = broadcastStreamId;
            isBroadcaster = true;
            
            console.log(`🎬 Broadcaster ready for stream: ${broadcastStreamId}`);
            broadcasters.set(broadcastStreamId, ws);
            
            if (!streamRooms.has(broadcastStreamId)) {
              streamRooms.set(broadcastStreamId, new Set());
            }
            streamRooms.get(broadcastStreamId)!.add(ws);
            
            // Notify all waiting viewers that broadcaster is ready
            streamRooms.get(broadcastStreamId)!.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                console.log(`📢 Notifying viewer that broadcaster is ready`);
                client.send(JSON.stringify({
                  type: 'broadcaster-ready-signal',
                  streamId: broadcastStreamId
                }));
              }
            });
            break;
            
          case 'join-stream':
            // Viewer joining stream
            const { streamId } = message;
            clientStreamId = streamId;
            isBroadcaster = false;
            
            console.log(`👥 Viewer joining stream: ${streamId}`);
            
            if (!streamRooms.has(streamId)) {
              streamRooms.set(streamId, new Set());
            }
            streamRooms.get(streamId)!.add(ws);
            
            // Send viewer count to all clients
            const viewerCount = streamRooms.get(streamId)!.size;
            streamRooms.get(streamId)!.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'viewer-count',
                  count: viewerCount,
                  streamId
                }));
              }
            });
            
            // Notify broadcaster that a viewer joined
            const broadcaster = broadcasters.get(streamId);
            if (broadcaster && broadcaster.readyState === WebSocket.OPEN) {
              const newViewerId = clientIds.get(ws);
              console.log(`📢 Notifying broadcaster of viewer join: ${newViewerId}`);
              broadcaster.send(JSON.stringify({
                type: 'viewer-joined',
                streamId,
                viewerId: newViewerId
              }));
            }
            break;
            
          case 'webrtc-offer':
            // Broadcaster sending offer to specific viewer
            const viewerId = message.viewerId;
            console.log(`📡 Forwarding WebRTC offer for stream: ${message.streamId}, viewerId: ${viewerId}`);
            const offerStreamId = message.streamId;
            if (streamRooms.has(offerStreamId)) {
              // Find the specific viewer by their clientId
              streamRooms.get(offerStreamId)!.forEach(client => {
                const targetClientId = clientIds.get(client);
                if (targetClientId === viewerId && client !== ws && client.readyState === WebSocket.OPEN) {
                  console.log(`📡 Sending offer to viewer: ${targetClientId}`);
                  client.send(JSON.stringify({
                    ...message,
                    viewerId: targetClientId // Send back the viewer's own ID
                  }));
                }
              });
            }
            break;
            
          case 'webrtc-answer':
            // Viewer sending answer to broadcaster
            const answerViewerId = clientIds.get(ws);
            console.log(`📡 Forwarding WebRTC answer to broadcaster for stream: ${message.streamId}, from viewer: ${answerViewerId}`);
            const answerStreamId = message.streamId;
            const answerBroadcaster = broadcasters.get(answerStreamId);
            if (answerBroadcaster && answerBroadcaster.readyState === WebSocket.OPEN) {
              answerBroadcaster.send(JSON.stringify({
                ...message,
                viewerId: answerViewerId // Include viewer ID so broadcaster knows which peer
              }));
            }
            break;
            
          case 'webrtc-ice-candidate':
          case 'ice-candidate':
            // Forward ICE candidates between broadcaster and specific viewer
            const iceViewerId = message.viewerId || clientIds.get(ws);
            const iceStreamId = message.streamId;
            console.log(`🧊 Forwarding ICE candidate for stream: ${iceStreamId}, viewerId: ${iceViewerId}`);
            
            if (isBroadcaster) {
              // Broadcaster sending to specific viewer
              if (streamRooms.has(iceStreamId)) {
                streamRooms.get(iceStreamId)!.forEach(client => {
                  const targetClientId = clientIds.get(client);
                  if (targetClientId === iceViewerId && client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                      ...message,
                      viewerId: targetClientId
                    }));
                  }
                });
              }
            } else {
              // Viewer sending to broadcaster
              const iceBroadcaster = broadcasters.get(iceStreamId);
              if (iceBroadcaster && iceBroadcaster.readyState === WebSocket.OPEN) {
                iceBroadcaster.send(JSON.stringify({
                  ...message,
                  viewerId: iceViewerId
                }));
              }
            }
            break;
            
          case 'start-streaming':
            // Streamer started broadcasting
            const { orderId } = message;
            console.log(`🎥 Stream started: ${orderId}`);
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
        console.error('❌ WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('❌ WebSocket client disconnected');
      
      // If broadcaster disconnected, notify all viewers
      if (clientStreamId && isBroadcaster) {
        console.log(`🎬 Broadcaster disconnected from stream: ${clientStreamId}`);
        broadcasters.delete(clientStreamId);
        
        if (streamRooms.has(clientStreamId)) {
          streamRooms.get(clientStreamId)!.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'broadcaster-disconnected',
                streamId: clientStreamId
              }));
            }
          });
        }
      }
      
      // Remove client from all rooms
      streamRooms.forEach((clients, streamId) => {
        clients.delete(ws);
        
        // Update viewer count
        if (clients.size > 0) {
          clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'viewer-count',
                count: clients.size,
                streamId
              }));
            }
          });
        }
        
        if (clients.size === 0) {
          streamRooms.delete(streamId);
        }
      });
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });

  return httpServer;
}
