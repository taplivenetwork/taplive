import { type User, type InsertUser, type Order, type InsertOrder } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Order operations
  getAllOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getOrdersByLocation(lat: number, lng: number, radiusKm: number): Promise<Order[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private orders: Map<string, Order>;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
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
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
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
      currentParticipants: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      liveUrl: null,
      replayUrl: null,
      providerId: null,
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
}

export const storage = new MemStorage();
