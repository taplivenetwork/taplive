import { type User, type InsertUser, type Order, type InsertOrder, type Rating, type InsertRating } from "@shared/schema";
import { type ProviderRanking, rankProvidersForOrder, updateUserDispatchScore } from "@shared/dispatch";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private orders: Map<string, Order>;
  private ratings: Map<string, Rating>;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.ratings = new Map();
    this.initializeTestData();
  }

  private initializeTestData(): void {
    // Create sample users
    const sampleUsers: User[] = [
      {
        id: randomUUID(),
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
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
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
        createdAt: new Date(),
      },
      // Additional provider samples with different metrics
      {
        id: randomUUID(),
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
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
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
        createdAt: new Date(),
      }
    ];

    sampleUsers.forEach(user => this.users.set(user.id, user));

    // Create sample orders
    const sampleOrders: Order[] = [
      {
        id: randomUUID(),
        title: "Central Park Concert Stream",
        description: "Looking for someone to stream the outdoor concert happening at Central Park this evening",
        type: "group",
        status: "open",
        latitude: "40.7589",
        longitude: "-73.9851",
        address: "Central Park, NYC",
        price: "45.00",
        maxParticipants: 5,
        currentParticipants: 3,
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        duration: 120,
        creatorId: sampleUsers[0].id,
        category: "music",
        tags: ["concert", "music", "central-park"],
        createdAt: new Date(),
        updatedAt: new Date(),
        liveUrl: null,
        replayUrl: null,
        providerId: null,
      },
      {
        id: randomUUID(),
        title: "Food Market Tour", 
        description: "Want someone to stream a guided tour of Pike Place Market, showcasing local vendors and food",
        type: "single",
        status: "open",
        latitude: "47.6097",
        longitude: "-122.3331",
        address: "Pike Place Market, Seattle",
        price: "30.00",
        maxParticipants: null,
        currentParticipants: 1,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 90,
        creatorId: sampleUsers[0].id,
        category: "food",
        tags: ["food", "market", "seattle"],
        createdAt: new Date(),
        updatedAt: new Date(),
        liveUrl: null,
        replayUrl: null,
        providerId: null,
      },
      {
        id: randomUUID(),
        title: "Beach Sunset Yoga",
        description: "Stream a peaceful sunset yoga session at Santa Monica Beach for wellness enthusiasts", 
        type: "group",
        status: "open",
        latitude: "34.0195",
        longitude: "-118.4912",
        address: "Santa Monica Beach, CA",
        price: "60.00",
        maxParticipants: 6,
        currentParticipants: 2,
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        duration: 60,
        creatorId: sampleUsers[0].id,
        category: "fitness",
        tags: ["yoga", "sunset", "beach"],
        createdAt: new Date(),
        updatedAt: new Date(),
        liveUrl: null,
        replayUrl: null,
        providerId: null,
      }
    ];

    sampleOrders.forEach(order => this.orders.set(order.id, order));
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
}

export const storage = new MemStorage();
