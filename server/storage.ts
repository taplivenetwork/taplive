import { type User, type InsertUser, type Order, type InsertOrder, type Rating, type InsertRating,
         type Payment, type InsertPayment, type Payout, type InsertPayout, type Transaction, type InsertTransaction,
         type Dispute, type InsertDispute, type OrderApproval, type InsertOrderApproval,
         type GeoRiskZone, type InsertGeoRiskZone, type WeatherAlert, type InsertWeatherAlert,
         type ContentViolation, type InsertContentViolation, type OrderGroup, type InsertOrderGroup,
         type GroupParticipant, type InsertGroupParticipant, type Geofence, type InsertGeofence,
         type TimezoneRule, type InsertTimezoneRule, type LocationTimezone, type InsertLocationTimezone,
         type Notification, type InsertNotification,
         users, orders, ratings, payments, payouts, transactions, disputes, orderApprovals,
         geoRiskZones, weatherAlerts, contentViolations, orderGroups, groupParticipants,
         geofences, timezoneRules, locationTimezone, notifications } from "@shared/schema";
import { type ProviderRanking, rankProvidersForOrder, updateUserDispatchScore } from "@shared/dispatch";
import { calculateCommission } from "@shared/payment";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, isNotNull, desc, or, isNull, gt, lt } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Order operations
  getAllOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getOrdersByLocation(lat: number, lng: number, radiusKm: number): Promise<Order[]>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByUser(userId: string): Promise<Rating[]>;
  getRatingsByOrder(orderId: string): Promise<Rating[]>;
  getUserRatings(userId: string): Promise<Rating[]>;
  calculateUserStats(userId: string): Promise<void>;
  
  // Dispatch operations
  getAvailableProviders(): Promise<User[]>;
  getRankedProvidersForOrder(orderId: string): Promise<ProviderRanking[]>;
  updateUserLocation(userId: string, latitude: number, longitude: number): Promise<User | undefined>;
  updateUserNetworkMetrics(userId: string, networkSpeed: number, devicePerformance: number): Promise<User | undefined>;
  calculateUserDispatchScore(userId: string): Promise<void>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentById(id: string): Promise<Payment | undefined>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
  getPaymentsByOrder(orderId: string): Promise<Payment[]>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  
  // Payout operations
  createPayout(payout: InsertPayout): Promise<Payout>;
  getPayoutById(id: string): Promise<Payout | undefined>;
  updatePayout(id: string, updates: Partial<Payout>): Promise<Payout | undefined>;
  getPayoutsByOrder(orderId: string): Promise<Payout[]>;
  getPayoutsByUser(userId: string): Promise<Payout[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUser(userId: string): Promise<Transaction[]>;
  getTransactionsByOrder(orderId: string): Promise<Transaction[]>;
  
  // Commission and payout processing
  processOrderPayment(orderId: string, paymentId: string): Promise<void>;
  calculateAndCreatePayout(orderId: string, paymentId: string): Promise<Payout | undefined>;
  
  // Dispute operations
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDisputeById(id: string): Promise<Dispute | undefined>;
  updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined>;
  getDisputesByOrder(orderId: string): Promise<Dispute[]>;
  getDisputesByStatus(status: string): Promise<Dispute[]>;

  // Order approval operations
  createOrderApproval(approval: InsertOrderApproval): Promise<OrderApproval>;
  getOrderApprovalById(id: string): Promise<OrderApproval | undefined>;
  updateOrderApproval(id: string, updates: Partial<OrderApproval>): Promise<OrderApproval | undefined>;
  getOrderApprovalByOrder(orderId: string): Promise<OrderApproval | undefined>;

  // Geographic safety operations
  createGeoRiskZone(zone: InsertGeoRiskZone): Promise<GeoRiskZone>;
  getGeoRiskZones(): Promise<GeoRiskZone[]>;
  checkLocationRisk(latitude: number, longitude: number): Promise<{ riskLevel: string; restrictions: string[] }>;

  // Weather alert operations
  createWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert>;
  getWeatherAlerts(latitude: number, longitude: number, radius: number): Promise<WeatherAlert[]>;
  getActiveWeatherAlerts(): Promise<WeatherAlert[]>;

  // Content violation operations
  createContentViolation(violation: InsertContentViolation): Promise<ContentViolation>;
  getContentViolationsByOrder(orderId: string): Promise<ContentViolation[]>;
  getContentViolationsByUser(userId: string): Promise<ContentViolation[]>;

  // AA Group operations
  createOrderGroup(group: InsertOrderGroup): Promise<OrderGroup>;
  getOrderGroupById(id: string): Promise<OrderGroup | undefined>;
  updateOrderGroup(id: string, updates: Partial<OrderGroup>): Promise<OrderGroup | undefined>;
  getOrderGroupByOrder(orderId: string): Promise<OrderGroup | undefined>;
  
  // Group participant operations
  addGroupParticipant(participant: InsertGroupParticipant): Promise<GroupParticipant>;
  getGroupParticipants(groupId: string): Promise<GroupParticipant[]>;
  updateGroupParticipant(id: string, updates: Partial<GroupParticipant>): Promise<GroupParticipant | undefined>;

  // Geofence operations
  createGeofence(geofence: InsertGeofence): Promise<Geofence>;
  getGeofences(): Promise<Geofence[]>;
  getActiveGeofences(): Promise<Geofence[]>;
  updateGeofence(id: string, updates: Partial<Geofence>): Promise<Geofence | undefined>;
  deleteGeofence(id: string): Promise<boolean>;
  checkPointInGeofences(latitude: number, longitude: number): Promise<any[]>;

  // Timezone rule operations
  createTimezoneRule(rule: InsertTimezoneRule): Promise<TimezoneRule>;
  getTimezoneRules(): Promise<TimezoneRule[]>;
  getActiveTimezoneRules(): Promise<TimezoneRule[]>;
  updateTimezoneRule(id: string, updates: Partial<TimezoneRule>): Promise<TimezoneRule | undefined>;
  deleteTimezoneRule(id: string): Promise<boolean>;

  // Location timezone operations
  createLocationTimezone(locationTz: InsertLocationTimezone): Promise<LocationTimezone>;
  getLocationTimezoneByOrder(orderId: string): Promise<LocationTimezone | undefined>;
  updateLocationTimezone(id: string, updates: Partial<LocationTimezone>): Promise<LocationTimezone | undefined>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getActiveOrderNotifications(userId: string): Promise<Notification[]>;
  deleteExpiredNotifications(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private orders: Map<string, Order>;
  private ratings: Map<string, Rating>;
  private payments: Map<string, Payment>;
  private payouts: Map<string, Payout>;
  private transactions: Map<string, Transaction>;
  private disputes: Map<string, Dispute>;
  private orderApprovals: Map<string, OrderApproval>;
  private geoRiskZones: Map<string, GeoRiskZone>;
  private weatherAlerts: Map<string, WeatherAlert>;
  private contentViolations: Map<string, ContentViolation>;
  private orderGroups: Map<string, OrderGroup>;
  private groupParticipants: Map<string, GroupParticipant>;
  private geofences: Map<string, Geofence>;
  private timezoneRules: Map<string, TimezoneRule>;
  private locationTimezones: Map<string, LocationTimezone>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.ratings = new Map();
    this.payments = new Map();
    this.payouts = new Map();
    this.transactions = new Map();
    this.disputes = new Map();
    this.orderApprovals = new Map();
    this.geoRiskZones = new Map();
    this.weatherAlerts = new Map();
    this.contentViolations = new Map();
    this.orderGroups = new Map();
    this.groupParticipants = new Map();
    this.geofences = new Map();
    this.timezoneRules = new Map();
    this.locationTimezones = new Map();
    this.notifications = new Map();
  }


  // Payment operations implementation
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const now = new Date();
    const payment: Payment = {
      id,
      ...insertPayment,
      paymentMetadata: insertPayment.paymentMetadata || null,
      status: 'pending',
      externalPaymentId: null,
      externalTransactionHash: null,
      paymentGatewayResponse: null,
      failureReason: null,
      createdAt: now,
      updatedAt: now,
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = {
      ...payment,
      ...updates,
      updatedAt: new Date(),
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      payment => payment.orderId === orderId
    );
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      payment => payment.payerId === userId
    );
  }

  // Payout operations implementation
  async createPayout(insertPayout: InsertPayout): Promise<Payout> {
    const id = randomUUID();
    const now = new Date();
    const payout: Payout = {
      id,
      ...insertPayout,
      recipientWallet: insertPayout.recipientWallet || null,
      payoutMetadata: insertPayout.payoutMetadata || null,
      status: 'pending',
      externalPayoutId: null,
      externalTransactionHash: null,
      payoutGatewayResponse: null,
      failureReason: null,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.payouts.set(id, payout);
    return payout;
  }

  async getPayoutById(id: string): Promise<Payout | undefined> {
    return this.payouts.get(id);
  }

  async updatePayout(id: string, updates: Partial<Payout>): Promise<Payout | undefined> {
    const payout = this.payouts.get(id);
    if (!payout) return undefined;
    
    const updatedPayout = {
      ...payout,
      ...updates,
      updatedAt: new Date(),
    };
    this.payouts.set(id, updatedPayout);
    return updatedPayout;
  }

  async getPayoutsByOrder(orderId: string): Promise<Payout[]> {
    return Array.from(this.payouts.values()).filter(
      payout => payout.orderId === orderId
    );
  }

  async getPayoutsByUser(userId: string): Promise<Payout[]> {
    return Array.from(this.payouts.values()).filter(
      payout => payout.recipientId === userId
    );
  }

  // Transaction operations implementation
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      id,
      ...insertTransaction,
      orderId: insertTransaction.orderId || null,
      paymentId: insertTransaction.paymentId || null,
      payoutId: insertTransaction.payoutId || null,
      metadata: insertTransaction.metadata || null,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      transaction => transaction.userId === userId
    );
  }

  async getTransactionsByOrder(orderId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      transaction => transaction.orderId === orderId
    );
  }

  // Commission and payout processing
  async processOrderPayment(orderId: string, paymentId: string): Promise<void> {
    const order = this.orders.get(orderId);
    const payment = this.payments.get(paymentId);
    
    if (!order || !payment) {
      throw new Error('Order or payment not found');
    }

    // Update order as paid
    const updatedOrder = {
      ...order,
      isPaid: true,
      updatedAt: new Date(),
    };
    this.orders.set(orderId, updatedOrder);

    // Create transaction record for customer payment
    await this.createTransaction({
      userId: payment.payerId,
      orderId: orderId,
      paymentId: paymentId,
      payoutId: null,
      type: 'payment',
      amount: payment.amount,
      currency: payment.currency,
      description: `Payment for order: ${order.title}`,
      metadata: JSON.stringify({ orderId, paymentId }),
    });
  }

  // Check if order is ready for real-time payout
  async isOrderReadyForRealTimePayout(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) return false;
    
    return !!(order.isPaid && !order.isPayoutProcessed && order.providerId);
  }

  // Get pending payout orders for a provider
  async getPendingPayoutOrders(providerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      order => order.providerId === providerId && 
               order.isPaid && 
               !order.isPayoutProcessed &&
               order.status === 'done'
    );
  }

  // Dispute operations
  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    const id = randomUUID();
    const newDispute: Dispute = {
      id,
      ...dispute,
      status: 'submitted',
      evidence: dispute.evidence || null,
      aiReviewResult: null,
      humanReviewResult: null,
      resolution: null,
      resolvedAt: null,
      reviewerNotes: null,
      escalatedAt: null,
      submittedAt: new Date(),
      updatedAt: new Date(),
    };
    this.disputes.set(id, newDispute);
    return newDispute;
  }

  async getDisputeById(id: string): Promise<Dispute | undefined> {
    return this.disputes.get(id);
  }

  async updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined> {
    const dispute = this.disputes.get(id);
    if (!dispute) return undefined;
    
    const updatedDispute = { ...dispute, ...updates, updatedAt: new Date() };
    this.disputes.set(id, updatedDispute);
    return updatedDispute;
  }

  async getDisputesByOrder(orderId: string): Promise<Dispute[]> {
    return Array.from(this.disputes.values()).filter(dispute => dispute.orderId === orderId);
  }

  async getDisputesByStatus(status: string): Promise<Dispute[]> {
    return Array.from(this.disputes.values()).filter(dispute => dispute.status === status);
  }

  // Order approval operations
  async createOrderApproval(approval: InsertOrderApproval): Promise<OrderApproval> {
    const id = randomUUID();
    const newApproval: OrderApproval = {
      id,
      ...approval,
      status: 'pending',
      deliveryNote: approval.deliveryNote || null,
      customerRating: approval.customerRating || null,
      customerFeedback: approval.customerFeedback || null,
      approvedAt: approval.approvedAt || null,
      requestedAt: new Date(),
    };
    this.orderApprovals.set(id, newApproval);
    return newApproval;
  }

  async getOrderApprovalById(id: string): Promise<OrderApproval | undefined> {
    return this.orderApprovals.get(id);
  }

  async updateOrderApproval(id: string, updates: Partial<OrderApproval>): Promise<OrderApproval | undefined> {
    const approval = this.orderApprovals.get(id);
    if (!approval) return undefined;
    
    const updatedApproval = { ...approval, ...updates };
    this.orderApprovals.set(id, updatedApproval);
    return updatedApproval;
  }

  async getOrderApprovalByOrder(orderId: string): Promise<OrderApproval | undefined> {
    return Array.from(this.orderApprovals.values()).find(approval => approval.orderId === orderId);
  }

  async calculateAndCreatePayout(orderId: string, paymentId: string): Promise<Payout | undefined> {
    const order = this.orders.get(orderId);
    const payment = this.payments.get(paymentId);
    
    if (!order || !payment || !order.providerId) {
      return undefined;
    }

    // Calculate commission (10% platform fee, 90% to provider)
    const commission = calculateCommission(parseFloat(payment.amount.toString()));
    
    // Create payout record
    const payout = await this.createPayout({
      orderId: orderId,
      paymentId: paymentId,
      recipientId: order.providerId,
      amount: commission.providerEarnings.toString(),
      platformFee: commission.platformFee.toString(),
      currency: payment.currency,
      payoutMethod: 'stripe', // Default, would be based on user preference
      recipientWallet: null,
      payoutMetadata: JSON.stringify({ commission }),
    });

    // Update order with calculated provider earnings
    const updatedOrder = {
      ...order,
      providerEarnings: commission.providerEarnings.toString(),
      isPayoutProcessed: true,
      updatedAt: new Date(),
    };
    this.orders.set(orderId, updatedOrder);

    // Create transaction record for provider payout
    await this.createTransaction({
      userId: order.providerId,
      orderId: orderId,
      paymentId: paymentId,
      payoutId: payout.id,
      type: 'payout',
      amount: commission.providerEarnings.toString(),
      currency: payment.currency,
      description: `Payout for completed order: ${order.title}`,
      metadata: JSON.stringify({ commission, payoutId: payout.id }),
    });

    // Update provider's total earnings
    const provider = this.users.get(order.providerId);
    if (provider) {
      const currentEarnings = parseFloat(provider.totalEarnings || '0');
      const newEarnings = currentEarnings + commission.providerEarnings;
      const updatedProvider = {
        ...provider,
        totalEarnings: newEarnings.toFixed(2),
      };
      this.users.set(order.providerId, updatedProvider);
    }

    return payout;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      role: 'user',
      avatar: insertUser.avatar || null,
      rating: "0.00",
      totalRatings: 0,
      completedOrders: 0,
      responseTime: 0,
      trustScore: "0.00",
      // Dispatch defaults
      networkSpeed: "0.00",
      devicePerformance: "0.00",
      currentLatitude: null,
      currentLongitude: null,
      availability: true,
      lastActive: new Date(),
      dispatchScore: "0.00",
      // Financial defaults
      totalEarnings: "0.00",
      walletAddress: null,
      preferredPaymentMethod: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      status: insertOrder.type === 'single' ? 'open' : 'pending',
      address: insertOrder.address || null,
      maxParticipants: insertOrder.maxParticipants || null,
      currentParticipants: 1,
      currency: 'USD',
      platformFee: '10.00',
      providerEarnings: '0.00',
      isPaid: false,
      isPayoutProcessed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      liveUrl: null,
      replayUrl: null,
      providerId: null,
      creatorId: insertOrder.creatorId || null,
      tags: insertOrder.tags || null,
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...updates, updatedAt: new Date() };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.orders.delete(id);
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.status === status);
  }

  async getOrdersByLocation(lat: number, lng: number, radiusKm: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => {
      const orderLat = parseFloat(order.latitude);
      const orderLng = parseFloat(order.longitude);
      const latDiff = Math.abs(orderLat - lat);
      const lngDiff = Math.abs(orderLng - lng);
      const roughDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Rough km conversion
      return roughDistance <= radiusKm;
    });
  }

  // Rating operations
  async createRating(insertRating: InsertRating): Promise<Rating> {
    const id = randomUUID();
    const rating: Rating = {
      ...insertRating,
      id,
      comment: insertRating.comment || null,
      createdAt: new Date(),
    };
    this.ratings.set(id, rating);
    
    // Automatically update user stats after rating creation
    await this.calculateUserStats(insertRating.revieweeId);
    
    return rating;
  }

  async getRatingsByUser(userId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(rating => 
      rating.reviewerId === userId
    );
  }

  async getRatingsByOrder(orderId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(rating => 
      rating.orderId === orderId
    );
  }

  async getUserRatings(userId: string): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(rating => 
      rating.revieweeId === userId
    );
  }

  async calculateUserStats(userId: string): Promise<void> {
    const userRatings = await this.getUserRatings(userId);
    const user = await this.getUser(userId);
    
    if (!user || userRatings.length === 0) return;

    // Calculate average rating
    const avgRating = userRatings.reduce((sum, rating) => sum + rating.rating, 0) / userRatings.length;
    
    // Calculate completed orders (orders that have ratings)
    const completedOrderIds = new Set(userRatings.map(r => r.orderId));
    const completedOrders = completedOrderIds.size;
    
    // Simple trust score calculation (can be enhanced with more factors)
    const trustScore = Math.min(5.0, avgRating * (1 + Math.log10(userRatings.length + 1) / 10));
    
    // Update user stats
    await this.updateUser(userId, {
      rating: avgRating.toFixed(2),
      totalRatings: userRatings.length,
      completedOrders,
      trustScore: trustScore.toFixed(2),
    });
    
    // Recalculate dispatch score
    await this.calculateUserDispatchScore(userId);
  }

  // Dispatch operations implementation
  async getAvailableProviders(): Promise<User[]> {
    // First try to get providers with full criteria
    let providers = Array.from(this.users.values()).filter(user => 
      user.role === 'provider' && 
      user.availability &&
      user.currentLatitude &&
      user.currentLongitude
    );

    // MVP: If no providers match strict criteria, get any providers for testing
    if (providers.length === 0) {
      console.log('⚠️ MVP Mode: No providers with full criteria, using any available providers for testing');
      providers = Array.from(this.users.values()).filter(user => 
        user.role === 'provider'
      );
      
      // Set default location for providers without location (for MVP testing)
      providers = providers.map(provider => {
        if (!provider.currentLatitude || !provider.currentLongitude) {
          return {
            ...provider,
            currentLatitude: '40.7128', // Default NYC location
            currentLongitude: '-74.0060',
            availability: true,
            networkSpeed: provider.networkSpeed || '50',
            devicePerformance: provider.devicePerformance || '75'
          };
        }
        return provider;
      });
    }

    return providers;
  }

  async getRankedProvidersForOrder(orderId: string): Promise<ProviderRanking[]> {
    const order = await this.getOrderById(orderId);
    console.log("this is the order that we are getting providers for", order);
    if (!order) return [];

    let availableProviders = await this.getAvailableProviders();
    
    // MVP: If still no providers, just get 3-4 users with provider role for testing
    if (availableProviders.length === 0) {
      console.log('⚠️ MVP Mode: No available providers, picking random users for notification testing');
      const allUsers = Array.from(this.users.values());
      availableProviders = allUsers.slice(0, 4).map(user => ({
        ...user,
        role: 'provider' as const,
        currentLatitude: user.currentLatitude || '40.7128',
        currentLongitude: user.currentLongitude || '-74.0060',
        availability: true,
        networkSpeed: user.networkSpeed || '50',
        devicePerformance: user.devicePerformance || '75',
        trustScore: user.trustScore || '4.0'
      }));
    }

    const rankings = rankProvidersForOrder(order, availableProviders);
    console.log(`✅ Found ${rankings.length} providers for order, dispatching to top matches`);
    return rankings;
  }

  async updateUserLocation(userId: string, latitude: number, longitude: number): Promise<User | undefined> {
    const updates = {
      currentLatitude: latitude.toString(),
      currentLongitude: longitude.toString(),
      lastActive: new Date(),
    };
    
    const updatedUser = await this.updateUser(userId, updates);
    if (updatedUser) {
      await this.calculateUserDispatchScore(userId);
    }
    return updatedUser;
  }

  async updateUserNetworkMetrics(userId: string, networkSpeed: number, devicePerformance: number): Promise<User | undefined> {
    const updates = {
      networkSpeed: networkSpeed.toString(),
      devicePerformance: devicePerformance.toString(),
      lastActive: new Date(),
    };
    
    const updatedUser = await this.updateUser(userId, updates);
    if (updatedUser) {
      await this.calculateUserDispatchScore(userId);
    }
    return updatedUser;
  }

  async calculateUserDispatchScore(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const dispatchScore = updateUserDispatchScore(user);
    await this.updateUser(userId, {
      dispatchScore: dispatchScore.toString(),
    });
  }

  // Geographic safety operations
  async createGeoRiskZone(zone: InsertGeoRiskZone): Promise<GeoRiskZone> {
    const id = randomUUID();
    const newZone: GeoRiskZone = {
      id,
      ...zone,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.geoRiskZones.set(id, newZone);
    return newZone;
  }

  async getGeoRiskZones(): Promise<GeoRiskZone[]> {
    return Array.from(this.geoRiskZones.values()).filter(zone => zone.isActive);
  }

  async checkLocationRisk(latitude: number, longitude: number): Promise<{ riskLevel: string; restrictions: string[] }> {
    if (latitude > 70 || latitude < -60) {
      return {
        riskLevel: 'extreme',
        restrictions: ['Extreme weather conditions', 'Limited rescue access']
      };
    }
    return {
      riskLevel: 'safe',
      restrictions: []
    };
  }

  // Weather alert operations
  async createWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert> {
    const id = randomUUID();
    const newAlert: WeatherAlert = {
      id,
      ...alert,
      createdAt: new Date(),
    };
    this.weatherAlerts.set(id, newAlert);
    return newAlert;
  }

  async getWeatherAlerts(latitude: number, longitude: number, radius: number): Promise<WeatherAlert[]> {
    return Array.from(this.weatherAlerts.values()).filter(alert => alert.isActive);
  }

  async getActiveWeatherAlerts(): Promise<WeatherAlert[]> {
    const now = new Date();
    return Array.from(this.weatherAlerts.values()).filter(alert => 
      alert.isActive && 
      new Date(alert.startTime) <= now && 
      (!alert.endTime || new Date(alert.endTime) >= now)
    );
  }

  // Content violation operations
  async createContentViolation(violation: InsertContentViolation): Promise<ContentViolation> {
    const id = randomUUID();
    const newViolation: ContentViolation = {
      id,
      ...violation,
      createdAt: new Date(),
    };
    this.contentViolations.set(id, newViolation);
    return newViolation;
  }

  async getContentViolationsByOrder(orderId: string): Promise<ContentViolation[]> {
    return Array.from(this.contentViolations.values()).filter(violation => violation.orderId === orderId);
  }

  async getContentViolationsByUser(userId: string): Promise<ContentViolation[]> {
    return Array.from(this.contentViolations.values()).filter(violation => violation.userId === userId);
  }

  // AA Group operations
  async createOrderGroup(group: InsertOrderGroup): Promise<OrderGroup> {
    const id = randomUUID();
    const newGroup: OrderGroup = {
      id,
      ...group,
      createdAt: new Date(),
    };
    this.orderGroups.set(id, newGroup);
    return newGroup;
  }

  async getOrderGroupById(id: string): Promise<OrderGroup | undefined> {
    return this.orderGroups.get(id);
  }

  async updateOrderGroup(id: string, updates: Partial<OrderGroup>): Promise<OrderGroup | undefined> {
    const group = this.orderGroups.get(id);
    if (!group) return undefined;
    
    const updatedGroup = { ...group, ...updates };
    this.orderGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  async getOrderGroupByOrder(orderId: string): Promise<OrderGroup | undefined> {
    return Array.from(this.orderGroups.values()).find(group => group.originalOrderId === orderId);
  }
  
  // Group participant operations
  async addGroupParticipant(participant: InsertGroupParticipant): Promise<GroupParticipant> {
    const id = randomUUID();
    const newParticipant: GroupParticipant = {
      id,
      ...participant,
      joinedAt: new Date(),
    };
    this.groupParticipants.set(id, newParticipant);
    return newParticipant;
  }

  async getGroupParticipants(groupId: string): Promise<GroupParticipant[]> {
    return Array.from(this.groupParticipants.values()).filter(participant => participant.groupId === groupId);
  }

  async updateGroupParticipant(id: string, updates: Partial<GroupParticipant>): Promise<GroupParticipant | undefined> {
    const participant = this.groupParticipants.get(id);
    if (!participant) return undefined;
    
    const updatedParticipant = { ...participant, ...updates };
    this.groupParticipants.set(id, updatedParticipant);
    return updatedParticipant;
  }

  // Geofence operations
  async createGeofence(geofence: InsertGeofence): Promise<Geofence> {
    const id = randomUUID();
    const newGeofence: Geofence = {
      id,
      ...geofence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.geofences.set(id, newGeofence);
    return newGeofence;
  }

  async getGeofences(): Promise<Geofence[]> {
    return Array.from(this.geofences.values());
  }

  async getActiveGeofences(): Promise<Geofence[]> {
    return Array.from(this.geofences.values()).filter(gf => gf.isActive);
  }

  async updateGeofence(id: string, updates: Partial<Geofence>): Promise<Geofence | undefined> {
    const geofence = this.geofences.get(id);
    if (!geofence) return undefined;
    
    const updatedGeofence = { ...geofence, ...updates, updatedAt: new Date() };
    this.geofences.set(id, updatedGeofence);
    return updatedGeofence;
  }

  async deleteGeofence(id: string): Promise<boolean> {
    return this.geofences.delete(id);
  }

  async checkPointInGeofences(latitude: number, longitude: number): Promise<any[]> {
    const { checkLocationWithTimezone } = await import("@shared/geofence-timezone");
    const activeGeofences = await this.getActiveGeofences();
    const activeTimezoneRules = await this.getActiveTimezoneRules();
    
    const result = checkLocationWithTimezone(
      latitude, 
      longitude, 
      activeGeofences, 
      activeTimezoneRules
    );
    
    return result.geofenceResults;
  }

  // Timezone rule operations
  async createTimezoneRule(rule: InsertTimezoneRule): Promise<TimezoneRule> {
    const id = randomUUID();
    const newRule: TimezoneRule = {
      id,
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.timezoneRules.set(id, newRule);
    return newRule;
  }

  async getTimezoneRules(): Promise<TimezoneRule[]> {
    return Array.from(this.timezoneRules.values());
  }

  async getActiveTimezoneRules(): Promise<TimezoneRule[]> {
    return Array.from(this.timezoneRules.values()).filter(rule => rule.isActive);
  }

  async updateTimezoneRule(id: string, updates: Partial<TimezoneRule>): Promise<TimezoneRule | undefined> {
    const rule = this.timezoneRules.get(id);
    if (!rule) return undefined;
    
    const updatedRule = { ...rule, ...updates, updatedAt: new Date() };
    this.timezoneRules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteTimezoneRule(id: string): Promise<boolean> {
    return this.timezoneRules.delete(id);
  }

  // Location timezone operations
  async createLocationTimezone(locationTz: InsertLocationTimezone): Promise<LocationTimezone> {
    const id = randomUUID();
    const newLocationTz: LocationTimezone = {
      id,
      ...locationTz,
      createdAt: new Date(),
    };
    this.locationTimezones.set(id, newLocationTz);
    return newLocationTz;
  }

  async getLocationTimezoneByOrder(orderId: string): Promise<LocationTimezone | undefined> {
    return Array.from(this.locationTimezones.values()).find(lt => lt.orderId === orderId);
  }

  async updateLocationTimezone(id: string, updates: Partial<LocationTimezone>): Promise<LocationTimezone | undefined> {
    const locationTz = this.locationTimezones.get(id);
    if (!locationTz) return undefined;
    
    const updatedLocationTz = { ...locationTz, ...updates };
    this.locationTimezones.set(id, updatedLocationTz);
    return updatedLocationTz;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      orderId: notification.orderId || null,
      metadata: notification.metadata || null,
      read: notification.read ?? false,
      createdAt: new Date(),
      expiresAt: notification.expiresAt || null,
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId && (!unreadOnly || !n.read))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    return userNotifications;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    Array.from(this.notifications.entries()).forEach(([id, notification]) => {
      if (notification.userId === userId && !notification.read) {
        this.notifications.set(id, { ...notification, read: true });
      }
    });
  }

  async getActiveOrderNotifications(userId: string): Promise<Notification[]> {
    const now = new Date();
    return Array.from(this.notifications.values())
      .filter(n => 
        n.userId === userId &&
        n.type === 'order_dispatch' &&
        !n.read &&
        (!n.expiresAt || n.expiresAt > now)
      )
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async deleteExpiredNotifications(): Promise<void> {
    const now = new Date();
    Array.from(this.notifications.entries()).forEach(([id, notification]) => {
      if (notification.expiresAt && notification.expiresAt < now) {
        this.notifications.delete(id);
      }
    });
  }
}







// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Order operations
  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db.update(orders).set({ ...updates, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return order || undefined;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return result.count > 0;
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.status, status as any));
  }

  async getOrdersByLocation(lat: number, lng: number, radiusKm: number): Promise<Order[]> {
    // Simple implementation - in production would use PostGIS for accurate geo queries
    return await db.select().from(orders);
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async getRatingsByUser(userId: string): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.revieweeId, userId));
  }

  async getRatingsByOrder(orderId: string): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.orderId, orderId));
  }

  async getUserRatings(userId: string): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.revieweeId, userId));
  }

  async calculateUserStats(userId: string): Promise<void> {
    const userRatings = await this.getUserRatings(userId);
    const user = await this.getUser(userId);
    
    if (!user || userRatings.length === 0) return;

    // Calculate average rating
    const avgRating = userRatings.reduce((sum, rating) => sum + rating.rating, 0) / userRatings.length;
    
    // Calculate completed orders (orders that have ratings)
    const completedOrderIds = new Set(userRatings.map(r => r.orderId));
    const completedOrders = completedOrderIds.size;
    
    // Simple trust score calculation (can be enhanced with more factors)
    const trustScore = Math.min(5.0, avgRating * (1 + Math.log10(userRatings.length + 1) / 10));
    
    // Update user stats
    await this.updateUser(userId, {
      rating: avgRating.toFixed(2),
      totalRatings: userRatings.length,
      completedOrders,
      trustScore: trustScore.toFixed(2),
    });
    
    // Recalculate dispatch score
    await this.calculateUserDispatchScore(userId);
  }

  // Apply rating penalty for provider cancellation
  async applyProviderCancelPenalty(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    // Reduce trust score and rating by 0.2 points (penalty)
    const currentRating = parseFloat(user.rating || '0');
    const currentTrustScore = parseFloat(user.trustScore || '0');
    
    const newRating = Math.max(1.0, currentRating - 0.2);
    const newTrustScore = Math.max(1.0, currentTrustScore - 0.2);
    
    await this.updateUser(userId, {
      rating: newRating.toFixed(2),
      trustScore: newTrustScore.toFixed(2),
    });

    console.log(`Applied cancellation penalty to user ${userId}. Rating: ${currentRating} → ${newRating}, Trust Score: ${currentTrustScore} → ${newTrustScore}`);
  }

  // Dispatch operations implementation
  async getAvailableProviders(): Promise<User[]> {
    // First try to get providers with full criteria using database query
    let providers = await db.select().from(users).where(
      and(
        eq(users.role, 'provider'),
        eq(users.availability, true),
        isNotNull(users.currentLatitude),
        isNotNull(users.currentLongitude)
      )
    );
//change
    // MVP: If no providers match strict criteria, get any providers for testing
    if (providers.length === 0) {
      console.log('⚠️ MVP Mode: No providers with full criteria, using any available providers for testing');
      providers = await db.select().from(users).where(eq(users.role, 'provider'));
      
      // Set default location for providers without location (for MVP testing)
      providers = providers.map(provider => {
        if (!provider.currentLatitude || !provider.currentLongitude) {
          return {
            ...provider,
            currentLatitude: '40.7128', // Default NYC location
            currentLongitude: '-74.0060',
            availability: true,
            networkSpeed: provider.networkSpeed || '50',
            devicePerformance: provider.devicePerformance || '75'
          };
        }
        return provider;
      });
    }

    return providers;
  }

  async getRankedProvidersForOrder(orderId: string): Promise<ProviderRanking[]> {
    const order = await this.getOrderById(orderId);
    console.log("this is the order that we are getting providers for", order);
    if (!order) return [];

    let availableProviders = await this.getAvailableProviders();
    
    // MVP: If still no providers, just get 3-4 users for notification testing
    if (availableProviders.length === 0) {
      console.log('⚠️ MVP Mode: No available providers, picking random users for notification testing');
      const allUsers = await db.select().from(users).limit(4);
      availableProviders = allUsers.map(user => ({
        ...user,
        role: 'provider' as const,
        currentLatitude: user.currentLatitude || '40.7128',
        currentLongitude: user.currentLongitude || '-74.0060',
        availability: true,
        networkSpeed: user.networkSpeed || '50',
        devicePerformance: user.devicePerformance || '75',
        trustScore: user.trustScore || '4.0'
      }));
    }

    const rankings = rankProvidersForOrder(order, availableProviders);
    console.log(`✅ Found ${rankings.length} providers for order, dispatching to top matches`);
    return rankings;
  }

  async updateUserLocation(userId: string, latitude: number, longitude: number): Promise<User | undefined> {
    const [user] = await db.update(users).set({
      currentLatitude: latitude.toString(),
      currentLongitude: longitude.toString(),
      lastActive: new Date()
    }).where(eq(users.id, userId)).returning();
    return user || undefined;
  }

  async updateUserNetworkMetrics(userId: string, networkSpeed: number, devicePerformance: number): Promise<User | undefined> {
    const [user] = await db.update(users).set({
      networkSpeed: networkSpeed.toString(),
      devicePerformance: devicePerformance.toString(),
      lastActive: new Date()
    }).where(eq(users.id, userId)).returning();
    return user || undefined;
  }

  async calculateUserDispatchScore(userId: string): Promise<void> {
    // Implementation for dispatch score calculation
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [payment] = await db.update(payments).set({ ...updates, updatedAt: new Date() }).where(eq(payments.id, id)).returning();
    return payment || undefined;
  }

  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.orderId, orderId));
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.payerId, userId));
  }

  // Simplified implementations for all other methods
  async createPayout(payout: InsertPayout): Promise<Payout> {
    const [newPayout] = await db.insert(payouts).values(payout).returning();
    return newPayout;
  }

  async getPayoutById(id: string): Promise<Payout | undefined> {
    const [payout] = await db.select().from(payouts).where(eq(payouts.id, id));
    return payout || undefined;
  }

  async updatePayout(id: string, updates: Partial<Payout>): Promise<Payout | undefined> {
    const [payout] = await db.update(payouts).set({ ...updates, updatedAt: new Date() }).where(eq(payouts.id, id)).returning();
    return payout || undefined;
  }

  async getPayoutsByOrder(orderId: string): Promise<Payout[]> {
    return await db.select().from(payouts).where(eq(payouts.orderId, orderId));
  }

  async getPayoutsByUser(userId: string): Promise<Payout[]> {
    return await db.select().from(payouts).where(eq(payouts.recipientId, userId));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async getTransactionsByOrder(orderId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.orderId, orderId));
  }

  async processOrderPayment(orderId: string, paymentId: string): Promise<void> {
    const order = await this.getOrderById(orderId);
    const payment = await this.getPaymentById(paymentId);
    
    if (!order || !payment) {
      throw new Error('Order or payment not found');
    }

    // Update order as paid
    await db.update(orders).set({
      isPaid: true,
    }).where(eq(orders.id, orderId));
  }

  async calculateAndCreatePayout(orderId: string, paymentId: string): Promise<Payout | undefined> {
    const order = await this.getOrderById(orderId);
    const payment = await this.getPaymentById(paymentId);
    
    if (!order || !payment || !order.providerId) {
      return undefined;
    }

    // Calculate commission using the updated 80/20 split
    const commission = calculateCommission(parseFloat(payment.amount.toString()));
    
    // Create payout record
    const payout = await this.createPayout({
      recipientId: order.providerId,
      orderId: orderId,
      paymentId: paymentId,
      amount: commission.providerEarnings.toString(),
      platformFee: commission.platformFee.toString(),
      currency: payment.currency,
      payoutMethod: 'stripe', // Default for demo
    });
    
    return payout;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values({
      ...notification,
      read: notification.read ?? false,
    }).returning();
    return newNotification;
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    let query = db.select().from(notifications).where(eq(notifications.userId, userId));
    
    if (unreadOnly) {
      query = query.where(eq(notifications.read, false)) as any;
    }
    
    const userNotifications = await query.orderBy(desc(notifications.createdAt));
    return userNotifications;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [updatedNotification] = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification || undefined;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async getActiveOrderNotifications(userId: string): Promise<Notification[]> {
    const now = new Date();
    const activeNotifications = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, 'order_dispatch'),
          eq(notifications.read, false),
          or(
            isNull(notifications.expiresAt),
            gt(notifications.expiresAt, now)
          )
        )
      )
      .orderBy(desc(notifications.createdAt));
    return activeNotifications;
  }

  async deleteExpiredNotifications(): Promise<void> {
    const now = new Date();
    await db.delete(notifications)
      .where(
        and(
          isNotNull(notifications.expiresAt),
          lt(notifications.expiresAt, now)
        )
      );
  }

  // Stub implementations for other methods
  async createDispute(dispute: InsertDispute): Promise<Dispute> { throw new Error("Not implemented"); }
  async getDisputeById(id: string): Promise<Dispute | undefined> { return undefined; }
  async updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined> { return undefined; }
  async getDisputesByOrder(orderId: string): Promise<Dispute[]> { return []; }
  async getDisputesByStatus(status: string): Promise<Dispute[]> { return []; }
  async createOrderApproval(approval: InsertOrderApproval): Promise<OrderApproval> {
    const [newApproval] = await db.insert(orderApprovals).values(approval).returning();
    return newApproval;
  }
  async getOrderApprovalById(id: string): Promise<OrderApproval | undefined> { return undefined; }
  async updateOrderApproval(id: string, updates: Partial<OrderApproval>): Promise<OrderApproval | undefined> {
    const [approval] = await db.update(orderApprovals).set(updates).where(eq(orderApprovals.id, id)).returning();
    return approval || undefined;
  }
  async getOrderApprovalByOrder(orderId: string): Promise<OrderApproval | undefined> {
    const [approval] = await db.select().from(orderApprovals).where(eq(orderApprovals.orderId, orderId));
    return approval || undefined;
  }
  async createGeoRiskZone(zone: InsertGeoRiskZone): Promise<GeoRiskZone> { throw new Error("Not implemented"); }
  async getGeoRiskZones(): Promise<GeoRiskZone[]> { return []; }
  async checkLocationRisk(latitude: number, longitude: number): Promise<{ riskLevel: string; restrictions: string[] }> { return { riskLevel: "safe", restrictions: [] }; }
  async createWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert> { throw new Error("Not implemented"); }
  async getWeatherAlerts(latitude: number, longitude: number, radius: number): Promise<WeatherAlert[]> { return []; }
  async getActiveWeatherAlerts(): Promise<WeatherAlert[]> { return []; }
  async createContentViolation(violation: InsertContentViolation): Promise<ContentViolation> { throw new Error("Not implemented"); }
  async getContentViolationsByOrder(orderId: string): Promise<ContentViolation[]> { return []; }
  async getContentViolationsByUser(userId: string): Promise<ContentViolation[]> { return []; }
  async createOrderGroup(group: InsertOrderGroup): Promise<OrderGroup> { throw new Error("Not implemented"); }
  async getOrderGroupById(id: string): Promise<OrderGroup | undefined> { return undefined; }
  async updateOrderGroup(id: string, updates: Partial<OrderGroup>): Promise<OrderGroup | undefined> { return undefined; }
  async getOrderGroupByOrder(orderId: string): Promise<OrderGroup | undefined> { return undefined; }
  async addGroupParticipant(participant: InsertGroupParticipant): Promise<GroupParticipant> { throw new Error("Not implemented"); }
  async getGroupParticipants(groupId: string): Promise<GroupParticipant[]> { return []; }
  async updateGroupParticipant(id: string, updates: Partial<GroupParticipant>): Promise<GroupParticipant | undefined> { return undefined; }
  async createGeofence(geofence: InsertGeofence): Promise<Geofence> { throw new Error("Not implemented"); }
  async getGeofences(): Promise<Geofence[]> { return []; }
  async getActiveGeofences(): Promise<Geofence[]> { return []; }
  async updateGeofence(id: string, updates: Partial<Geofence>): Promise<Geofence | undefined> { return undefined; }
  async deleteGeofence(id: string): Promise<boolean> { return false; }
  async checkPointInGeofences(latitude: number, longitude: number): Promise<any[]> { return []; }
  async createTimezoneRule(rule: InsertTimezoneRule): Promise<TimezoneRule> { throw new Error("Not implemented"); }
  async getTimezoneRules(): Promise<TimezoneRule[]> { return []; }
  async getActiveTimezoneRules(): Promise<TimezoneRule[]> { return []; }
  async updateTimezoneRule(id: string, updates: Partial<TimezoneRule>): Promise<TimezoneRule | undefined> { return undefined; }
  async deleteTimezoneRule(id: string): Promise<boolean> { return false; }
  async createLocationTimezone(locationTz: InsertLocationTimezone): Promise<LocationTimezone> {
    const [newLocationTz] = await db.insert(locationTimezones).values(locationTz).returning();
    return newLocationTz;
  }
  async getLocationTimezoneByOrder(orderId: string): Promise<LocationTimezone | undefined> { return undefined; }
  async updateLocationTimezone(id: string, updates: Partial<LocationTimezone>): Promise<LocationTimezone | undefined> { return undefined; }
}

// Use DatabaseStorage for production (PostgreSQL)
export const storage = new DatabaseStorage();
