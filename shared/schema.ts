import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const orderStatusEnum = pgEnum('order_status', ['pending', 'open', 'accepted', 'live', 'done', 'cancelled']);
export const orderTypeEnum = pgEnum('order_type', ['single', 'group']);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  role: text("role").default('user'),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0.00'), // Average rating (0.00-5.00)
  totalRatings: integer("total_ratings").default(0), // Total number of ratings received
  completedOrders: integer("completed_orders").default(0), // Total completed orders
  responseTime: integer("avg_response_time").default(0), // Average response time in minutes
  trustScore: decimal("trust_score", { precision: 3, scale: 2 }).default('0.00'), // Overall trust score
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: orderTypeEnum("type").notNull(),
  status: orderStatusEnum("status").notNull().default('pending'),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  address: text("address"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(1),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // in minutes
  liveUrl: text("live_url"),
  replayUrl: text("replay_url"),
  creatorId: varchar("creator_id").references(() => users.id),
  providerId: varchar("provider_id").references(() => users.id),
  tags: text("tags").array(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id), // Who gave the rating
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id), // Who received the rating
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  reviewType: text("review_type").notNull(), // 'creator_to_provider' or 'provider_to_creator'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  avatar: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  status: true,
  currentParticipants: true,
  createdAt: true,
  updatedAt: true,
  liveUrl: true,
  replayUrl: true,
  providerId: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const ratingValidationSchema = z.object({
  orderId: z.string(),
  revieweeId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  reviewType: z.enum(['creator_to_provider', 'provider_to_creator']),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type RatingValidation = z.infer<typeof ratingValidationSchema>;
