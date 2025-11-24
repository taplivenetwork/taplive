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
import { eq, and, isNotNull } from "drizzle-orm";

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
    this.initializeTestData();
  }

  private initializeTestData(): void {
    // Create sample users
    const sampleUsers: User[] = [
      {
        id: "user-sarah-chen",
        username: "sarah_chen",
        password: "hashed_password",
        email: "sarah@example.com",
        name: "Sarah Chen",
        avatar: "https://pixabay.com/get/g21614bd3823a762ba03923929667a272b114dcafc0552a50f5d76427db7aee6d3ea1b14f612df2bf94afc17baa7e901cc9feeb0e3a4826d0b0706dab24266a26_1280.jpg",
        role: "creator",
        rating: "4.8",
        totalRatings: 24,
        completedOrders: 15,
        responseTime: 12,
        trustScore: "4.7",
        // Dispatch fields
        networkSpeed: "45.50",
        devicePerformance: "85.00",
        currentLatitude: "40.7580",
        currentLongitude: "-73.9855",
        availability: true,
        lastActive: new Date(),
        dispatchScore: "78.45",
        // Financial fields
        totalEarnings: "0.00",
        walletAddress: null,
        preferredPaymentMethod: null,
        createdAt: new Date(),
      },
      {
        id: "user-mike-rodriguez",
        username: "mike_rodriguez",
        password: "hashed_password", 
        email: "mike@example.com",
        name: "Mike Rodriguez",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
        role: "provider",
        rating: "4.6",
        totalRatings: 18,
        completedOrders: 22,
        responseTime: 8,
        trustScore: "4.5",
        // Dispatch fields
        networkSpeed: "52.30",
        devicePerformance: "92.00",
        currentLatitude: "40.7614",
        currentLongitude: "-73.9776",
        availability: true,
        lastActive: new Date(),
        dispatchScore: "82.60",
        // Financial fields
        totalEarnings: "0.00",
        walletAddress: null,
        preferredPaymentMethod: null,
        createdAt: new Date(),
      },
      // Additional provider samples with different metrics
      {
        id: "user-alex-kim",
        username: "alex_kim",
        password: "hashed_password",
        email: "alex@example.com",
        name: "Alex Kim",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
        role: "provider",
        rating: "4.9",
        totalRatings: 35,
        completedOrders: 45,
        responseTime: 5,
        trustScore: "4.8",
        // Dispatch fields - high performance provider
        networkSpeed: "75.20",
        devicePerformance: "95.00",
        currentLatitude: "40.7505",
        currentLongitude: "-73.9934",
        availability: true,
        lastActive: new Date(),
        dispatchScore: "88.20",
        // Financial fields
        totalEarnings: "0.00",
        walletAddress: null,
        preferredPaymentMethod: null,
        createdAt: new Date(),
      },
      {
        id: "user-emma-wilson",
        username: "emma_wilson",
        password: "hashed_password",
        email: "emma@example.com",
        name: "Emma Wilson",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
        role: "provider",
        rating: "4.2",
        totalRatings: 12,
        completedOrders: 8,
        responseTime: 15,
        trustScore: "4.1",
        // Dispatch fields - lower performance provider
        networkSpeed: "25.80",
        devicePerformance: "65.00",
        currentLatitude: "40.7830",
        currentLongitude: "-73.9712",
        availability: true,
        lastActive: new Date(),
        dispatchScore: "65.30",
        // Financial fields
        totalEarnings: "0.00",
        walletAddress: null,
        preferredPaymentMethod: null,
        createdAt: new Date(),
      }
    ];

    sampleUsers.forEach(user => this.users.set(user.id, user));

    // Create sample orders - Global landmarks live streaming
    const sampleOrders: Order[] = [
      // Live streaming orders for demonstration
      {
        id: "eiffel-tower-stream",
        title: "Eiffel Tower Sunset Stream",
        description: "Live streaming of the iconic Eiffel Tower during sunset, showcasing the romantic Parisian evening atmosphere",
        type: "group",
        status: "live",
        latitude: "48.8584",
        longitude: "2.2945",
        address: "Eiffel Tower, Paris, France",
        price: "35.00",
        currency: "USD" as const,
        platformFee: "7.00",
        providerEarnings: "28.00",
        maxParticipants: 8,
        currentParticipants: 5,
        scheduledAt: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
        duration: 90,
        creatorId: sampleUsers[0].id,
        category: "travel",
        tags: ["paris", "eiffel-tower", "sunset", "landmarks"],
        isPaid: true,
        isPayoutProcessed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        liveUrl: "wss://stream.taplive.com/live/eiffel-sunset",
        replayUrl: null,
        providerId: sampleUsers[1].id,
        // Required new fields
        groupType: "group_booking",
        groupId: null,
        splitAmount: null,
        minParticipants: 3,
        riskLevel: "safe",
        weatherAlert: "clear",
        geoFenceStatus: null,
        isHighRiskArea: false,
        isMilitaryZone: false,
        weatherConditions: null,
        // Content Safety
        contentFlags: [],
        keywordViolations: [],
        voiceAlerts: 0,
        // Recording
        recordingUrl: null,
        replayAvailable: false,
        recordingDuration: null,
      },
      {
        id: "mount-fuji-stream",
        title: "Mount Fuji Cherry Blossom Stream",
        description: "Beautiful cherry blossoms around Mount Fuji in Japan, experiencing the most beautiful natural scenery of spring",
        type: "single",
        status: "live",
        latitude: "35.3606",
        longitude: "138.7274",
        address: "Mount Fuji, Shizuoka, Japan",
        price: "45.00",
        currency: "USD" as const,
        platformFee: "9.00",
        providerEarnings: "36.00",
        maxParticipants: null,
        currentParticipants: 1,
        scheduledAt: new Date(Date.now() - 15 * 60 * 1000), // Started 15 minutes ago
        duration: 120,
        creatorId: sampleUsers[0].id,
        category: "nature",
        tags: ["japan", "mount-fuji", "cherry-blossoms", "spring"],
        isPaid: true,
        isPayoutProcessed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        liveUrl: "wss://stream.taplive.com/live/fuji-sakura",
        replayUrl: null,
        providerId: sampleUsers[2].id,
        // Required new fields
        groupType: "single",
        groupId: null,
        splitAmount: null,
        minParticipants: 1,
        riskLevel: "safe",
        weatherAlert: "clear",
        geoFenceStatus: null,
        isHighRiskArea: false,
        isMilitaryZone: false,
        weatherConditions: null,
        // Content Safety
        contentFlags: [],
        keywordViolations: [],
        voiceAlerts: 0,
        // Recording
        recordingUrl: null,
        replayAvailable: false,
        recordingDuration: null,
      },
      {
        id: "pyramids-stream",
        title: "Pyramids Sunset Exploration",
        description: "Exploring the Great Pyramids of Giza during sunset, discovering the mysterious charm of ancient civilization",
        type: "group",
        status: "live",
        latitude: "29.9792",
        longitude: "31.1342",
        address: "Giza Pyramids, Cairo, Egypt",
        price: "50.00",
        currency: "USD" as const,
        platformFee: "10.00",
        providerEarnings: "40.00",
        maxParticipants: 6,
        currentParticipants: 4,
        scheduledAt: new Date(Date.now() - 45 * 60 * 1000), // Started 45 minutes ago
        duration: 100,
        creatorId: sampleUsers[0].id,
        category: "history",
        tags: ["egypt", "pyramids", "ancient", "history"],
        isPaid: true,
        isPayoutProcessed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        liveUrl: "wss://stream.taplive.com/live/giza-pyramids",
        replayUrl: null,
        providerId: sampleUsers[3].id,
        // Required new fields
        groupType: "group_booking",
        groupId: null,
        splitAmount: null,
        minParticipants: 2,
        riskLevel: "safe",
        weatherAlert: "clear",
        geoFenceStatus: null,
        isHighRiskArea: false,
        isMilitaryZone: false,
        weatherConditions: null,
        // Content Safety
        contentFlags: [],
        keywordViolations: [],
        voiceAlerts: 0,
        // Recording
        recordingUrl: null,
        replayAvailable: false,
        recordingDuration: null,
      },
      // Upcoming streams
      {
        id: "taj-mahal-stream",
        title: "Taj Mahal Moonlight Night",
        description: "The stunning beauty of the Taj Mahal in Agra, India under moonlight, feeling the eternal power of love",
        type: "group",
        status: "open",
        latitude: "27.1751",
        longitude: "78.0421",
        address: "Taj Mahal, Agra, India",
        price: "40.00",
        currency: "USD" as const,
        platformFee: "8.00",
        providerEarnings: "0.00",
        maxParticipants: 10,
        currentParticipants: 3,
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        duration: 80,
        creatorId: sampleUsers[0].id,
        category: "culture",
        tags: ["india", "taj-mahal", "moonlight", "architecture"],
        isPaid: false,
        isPayoutProcessed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        liveUrl: null,
        replayUrl: null,
        providerId: null,
        // Required new fields
        groupType: "group_booking",
        groupId: null,
        splitAmount: null,
        minParticipants: 3,
        riskLevel: "safe",
        weatherAlert: "clear",
        geoFenceStatus: null,
        isHighRiskArea: false,
        isMilitaryZone: false,
        weatherConditions: null,
        // Content Safety
        contentFlags: [],
        keywordViolations: [],
        voiceAlerts: 0,
        // Recording
        recordingUrl: null,
        replayAvailable: false,
        recordingDuration: null,
      },
      {
        id: "machu-picchu-stream",
        title: "Machu Picchu Sunrise Above Clouds",
        description: "Spectacular sunrise at the ancient ruins of Machu Picchu in Peru, mysterious ancient city surrounded by sea of clouds",
        type: "single",
        status: "open",
        latitude: "-13.1631",
        longitude: "-72.5450",
        address: "Machu Picchu, Cusco, Peru",
        price: "55.00",
        currency: "USD" as const,
        platformFee: "11.00",
        providerEarnings: "0.00",
        maxParticipants: null,
        currentParticipants: 1,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 90,
        creatorId: sampleUsers[0].id,
        category: "adventure",
        tags: ["peru", "machu-picchu", "sunrise", "ancient"],
        isPaid: false,
        isPayoutProcessed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        liveUrl: null,
        replayUrl: null,
        providerId: null,
        // Required new fields
        groupType: "single",
        groupId: null,
        splitAmount: null,
        minParticipants: 1,
        riskLevel: "safe",
        weatherAlert: "clear",
        geoFenceStatus: null,
        isHighRiskArea: false,
        isMilitaryZone: false,
        weatherConditions: null,
        // Content Safety
        contentFlags: [],
        keywordViolations: [],
        voiceAlerts: 0,
        // Recording
        recordingUrl: null,
        replayAvailable: false,
        recordingDuration: null,
      },
      {
        id: "sydney-opera-stream",
        title: "Sydney Opera House Night View",
        description: "Brilliant light show of Sydney Opera House in Australia during the night, showcasing the beauty of modern architecture",
        type: "group",
        status: "open",
        latitude: "-33.8568",
        longitude: "151.2153",
        address: "Sydney Opera House, Sydney, Australia",
        price: "38.00",
        currency: "USD" as const,
        platformFee: "7.60",
        providerEarnings: "0.00",
        maxParticipants: 7,
        currentParticipants: 2,
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        duration: 75,
        creatorId: sampleUsers[0].id,
        category: "architecture",
        tags: ["australia", "sydney", "opera-house", "night"],
        isPaid: false,
        isPayoutProcessed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        liveUrl: null,
        replayUrl: null,
        providerId: null,
        // Required new fields
        groupType: "group_booking",
        groupId: null,
        splitAmount: null,
        minParticipants: 2,
        riskLevel: "safe",
        weatherAlert: "clear",
        geoFenceStatus: null,
        isHighRiskArea: false,
        isMilitaryZone: false,
        weatherConditions: null,
        // Content Safety
        contentFlags: [],
        keywordViolations: [],
        voiceAlerts: 0,
        // Recording
        recordingUrl: null,
        replayAvailable: false,
        recordingDuration: null,
      }
    ];

    sampleOrders.forEach(order => this.orders.set(order.id, order));
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
    return Array.from(this.users.values()).filter(user => 
      user.role === 'provider' && 
      user.availability &&
      user.currentLatitude &&
      user.currentLongitude
    );
  }

  async getRankedProvidersForOrder(orderId: string): Promise<ProviderRanking[]> {
    const order = await this.getOrderById(orderId);
    if (!order) return [];

    const availableProviders = await this.getAvailableProviders();
    return rankProvidersForOrder(order, availableProviders);
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
    const [user] = await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, id)).returning();
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

  // Dispatch operations
  async getAvailableProviders(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.availability, true));
  }

  async getRankedProvidersForOrder(orderId: string): Promise<ProviderRanking[]> {
    // Implementation for provider ranking
    return [];
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

export const storage = new MemStorage();
