import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const orderStatusEnum = pgEnum('order_status', ['pending', 'open', 'accepted', 'live', 'completed', 'awaiting_approval', 'disputed', 'under_review', 'done', 'cancelled']);
export const orderTypeEnum = pgEnum('order_type', ['single', 'group']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed', 'refunded']);
export const paymentMethodEnum = pgEnum('payment_method', ['stripe', 'paypal', 'usdt_trc20', 'usdt_erc20', 'bitcoin', 'ethereum']);
export const transactionTypeEnum = pgEnum('transaction_type', ['payment', 'payout', 'refund', 'commission']);
export const currencyEnum = pgEnum('currency', ['USD', 'USDT', 'BTC', 'ETH']);
export const disputeStatusEnum = pgEnum('dispute_status', ['submitted', 'ai_review', 'human_review', 'resolved_approved', 'resolved_rejected']);
export const disputeTypeEnum = pgEnum('dispute_type', ['quality_issue', 'content_mismatch', 'technical_issue', 'service_incomplete', 'other']);
export const riskLevelEnum = pgEnum('risk_level', ['safe', 'low', 'medium', 'high', 'extreme', 'forbidden']);
export const weatherAlertEnum = pgEnum('weather_alert', ['clear', 'watch', 'warning', 'emergency']);
export const orderGroupTypeEnum = pgEnum('order_group_type', ['single', 'aa_split', 'group_booking']);
export const violationTypeEnum = pgEnum('violation_type', ['keyword_detected', 'illegal_content', 'prohibited_area', 'weather_risk', 'voice_violation']);

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
  
  // Dispatch algorithm fields
  networkSpeed: decimal("network_speed", { precision: 5, scale: 2 }).default('0.00'), // Mbps
  devicePerformance: decimal("device_performance", { precision: 3, scale: 2 }).default('0.00'), // 0-100 score
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 7 }), // Current location
  currentLongitude: decimal("current_longitude", { precision: 10, scale: 7 }), // Current location
  availability: boolean("availability").default(true), // Available for orders
  lastActive: timestamp("last_active").defaultNow(), // Last activity timestamp
  dispatchScore: decimal("dispatch_score", { precision: 5, scale: 2 }).default('0.00'), // Overall dispatch ranking
  
  // Financial fields
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).default('0.00'), // Total lifetime earnings
  walletAddress: text("wallet_address"), // Crypto wallet address for payouts
  preferredPaymentMethod: paymentMethodEnum("preferred_payment_method"), // Preferred payout method
  
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
  currency: currencyEnum("currency").notNull().default('USD'),
  platformFee: decimal("platform_fee", { precision: 5, scale: 2 }).default('10.00'), // Percentage (default 10%)
  providerEarnings: decimal("provider_earnings", { precision: 10, scale: 2 }).default('0.00'), // Calculated provider earnings
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
  
  // Payment status
  isPaid: boolean("is_paid").default(false),
  isPayoutProcessed: boolean("is_payout_processed").default(false),
  
  // AA Split and Group features
  groupType: orderGroupTypeEnum("group_type").default('single'),
  groupId: varchar("group_id"), // For AA split orders
  splitAmount: decimal("split_amount", { precision: 10, scale: 2 }), // Individual amount in AA split
  minParticipants: integer("min_participants").default(1),
  
  // Geographic and Safety features
  riskLevel: riskLevelEnum("risk_level").default('safe'),
  weatherAlert: weatherAlertEnum("weather_alert").default('clear'),
  geoFenceStatus: text("geo_fence_status"), // JSON with fence checks
  isHighRiskArea: boolean("is_high_risk_area").default(false),
  isMilitaryZone: boolean("is_military_zone").default(false),
  weatherConditions: text("weather_conditions"), // JSON weather data
  
  // Content Safety
  contentFlags: text("content_flags").array(), // Detected issues
  keywordViolations: text("keyword_violations").array(), // Flagged keywords
  voiceAlerts: integer("voice_alerts").default(0), // Voice violation count
  
  // Replay and Recording
  recordingUrl: text("recording_url"),
  replayAvailable: boolean("replay_available").default(false),
  recordingDuration: integer("recording_duration"), // in seconds
  
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

// Payment Processing Tables
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  payerId: varchar("payer_id").notNull().references(() => users.id), // Who is paying
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  
  // External payment provider data
  externalPaymentId: text("external_payment_id"), // Stripe/PayPal payment ID
  externalTransactionHash: text("external_transaction_hash"), // Crypto transaction hash
  paymentGatewayResponse: text("payment_gateway_response"), // JSON response from gateway
  
  // Metadata
  paymentMetadata: text("payment_metadata"), // JSON metadata
  failureReason: text("failure_reason"), // Reason for failed payments
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  paymentId: varchar("payment_id").notNull().references(() => payments.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id), // Provider receiving payout
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Provider's earnings (90%)
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(), // Platform's fee (10%)
  currency: currencyEnum("currency").notNull(),
  payoutMethod: paymentMethodEnum("payout_method").notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  
  // Payout destination
  recipientWallet: text("recipient_wallet"), // Crypto wallet or payment account
  
  // External payout data
  externalPayoutId: text("external_payout_id"), // Stripe/PayPal payout ID
  externalTransactionHash: text("external_transaction_hash"), // Crypto transaction hash
  payoutGatewayResponse: text("payout_gateway_response"), // JSON response from gateway
  
  // Metadata
  payoutMetadata: text("payout_metadata"), // JSON metadata
  failureReason: text("failure_reason"), // Reason for failed payouts
  
  processedAt: timestamp("processed_at"), // When payout was processed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderId: varchar("order_id").references(() => orders.id), // Optional, some transactions might not be order-related
  paymentId: varchar("payment_id").references(() => payments.id), // Link to payment
  payoutId: varchar("payout_id").references(() => payouts.id), // Link to payout
  
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull(),
  
  description: text("description").notNull(), // Human readable description
  metadata: text("metadata"), // JSON metadata
  
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
}).extend({
  scheduledAt: z.string().transform((val) => new Date(val)),
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  externalPaymentId: true,
  externalTransactionHash: true,
  paymentGatewayResponse: true,
  failureReason: true,
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  status: true,
  externalPayoutId: true,
  externalTransactionHash: true,
  payoutGatewayResponse: true,
  failureReason: true,
  processedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
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

// Payment validation schemas
export const paymentValidationSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'USDT', 'BTC', 'ETH']),
  paymentMethod: z.enum(['stripe', 'paypal', 'usdt_trc20', 'usdt_erc20', 'bitcoin', 'ethereum']),
  paymentMetadata: z.object({}).optional(),
});

export const cryptoPaymentSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  currency: z.enum(['USDT', 'BTC', 'ETH']),
  paymentMethod: z.enum(['usdt_trc20', 'usdt_erc20', 'bitcoin', 'ethereum']),
  senderWallet: z.string(),
  transactionHash: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type RatingValidation = z.infer<typeof ratingValidationSchema>;

// Payment types
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type Payout = typeof payouts.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type PaymentValidation = z.infer<typeof paymentValidationSchema>;
export type CryptoPaymentValidation = z.infer<typeof cryptoPaymentSchema>;

// Dispute handling table
export const disputes = pgTable("disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  customerId: varchar("customer_id").notNull().references(() => users.id), // Customer who submitted dispute
  providerId: varchar("provider_id").notNull().references(() => users.id), // Service provider
  disputeType: disputeTypeEnum("dispute_type").notNull(),
  status: disputeStatusEnum("status").notNull().default('submitted'),
  title: text("title").notNull(),
  description: text("description").notNull(),
  evidence: text("evidence").array(), // URLs to evidence files/images
  aiReviewResult: text("ai_review_result"), // AI review decision and reasoning
  humanReviewResult: text("human_review_result"), // Human review decision
  resolution: text("resolution"), // Final resolution details
  resolvedAt: timestamp("resolved_at"),
  reviewerNotes: text("reviewer_notes"), // Internal notes from reviewer
  escalatedAt: timestamp("escalated_at"), // When escalated to human review
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order approval requests
export const orderApprovals = pgTable("order_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  providerId: varchar("provider_id").notNull().references(() => users.id),
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'disputed'
  deliveryNote: text("delivery_note"), // Provider's delivery note
  customerRating: integer("customer_rating"), // 1-5 stars for satisfaction
  customerFeedback: text("customer_feedback"), // Customer's feedback
  approvedAt: timestamp("approved_at"),
  requestedAt: timestamp("requested_at").defaultNow(),
});

// Insert schemas for new tables
export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  submittedAt: true,
  updatedAt: true,
});

export const insertOrderApprovalSchema = createInsertSchema(orderApprovals).omit({
  id: true,
  requestedAt: true,
});

// Validation schemas
export const disputeSubmissionSchema = z.object({
  orderId: z.string(),
  disputeType: z.enum(['quality_issue', 'content_mismatch', 'technical_issue', 'service_incomplete', 'other']),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  evidence: z.array(z.string().url()).optional(),
});

export const orderApprovalSchema = z.object({
  orderId: z.string(),
  deliveryNote: z.string().optional(),
  customerRating: z.number().min(1).max(5).optional(),
  customerFeedback: z.string().optional(),
});

// Export types
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;
export type InsertOrderApproval = z.infer<typeof insertOrderApprovalSchema>;
export type OrderApproval = typeof orderApprovals.$inferSelect;
export type DisputeSubmission = z.infer<typeof disputeSubmissionSchema>;
export type OrderApprovalValidation = z.infer<typeof orderApprovalSchema>;

// Geographic Risk Management
export const geoRiskZones = pgTable("geo_risk_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'military', 'extreme_weather', 'no_service', 'high_crime'
  riskLevel: riskLevelEnum("risk_level").notNull(),
  coordinates: text("coordinates").notNull(), // GeoJSON polygon
  restrictions: text("restrictions"), // JSON with specific restrictions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weather Alerts
export const weatherAlerts = pgTable("weather_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  radius: decimal("radius", { precision: 8, scale: 2 }).notNull(), // in kilometers
  alertType: weatherAlertEnum("alert_type").notNull(),
  weatherCondition: text("weather_condition").notNull(), // 'storm', 'flood', 'earthquake', etc.
  severity: text("severity").notNull(), // 'minor', 'moderate', 'severe', 'extreme'
  message: text("message").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").default(true),
  source: text("source").default('weather_api'), // 'weather_api', 'emergency_service', 'manual'
  createdAt: timestamp("created_at").defaultNow(),
});

// Content Moderation
export const contentViolations = pgTable("content_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  violationType: violationTypeEnum("violation_type").notNull(),
  content: text("content"), // The flagged content
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // AI confidence score
  isConfirmed: boolean("is_confirmed").default(false), // Human review result
  action: text("action"), // 'warning', 'order_cancelled', 'user_suspended'
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AA Split Group Management
export const orderGroups = pgTable("order_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalOrderId: varchar("original_order_id").notNull().references(() => orders.id),
  groupType: orderGroupTypeEnum("group_type").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  splitAmount: decimal("split_amount", { precision: 10, scale: 2 }).notNull(),
  maxParticipants: integer("max_participants").notNull(),
  currentParticipants: integer("current_participants").default(1),
  isComplete: boolean("is_complete").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group Participants
export const groupParticipants = pgTable("group_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => orderGroups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Geofence Management
export const geofences = pgTable("geofences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'polygon', 'circle', 'rectangle'
  coordinates: text("coordinates").notNull(), // JSON string of coordinates
  action: varchar("action", { length: 50 }).notNull(), // 'block', 'warn', 'allow', 'restrict_time'
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher priority rules take precedence
  timeRestrictions: text("time_restrictions"), // JSON string of time-based rules
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Timezone Rules Management
export const timezoneRules = pgTable("timezone_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  region: varchar("region", { length: 255 }).notNull(), // Country/region code
  timezone: varchar("timezone", { length: 100 }).notNull(), // IANA timezone identifier
  allowedHours: text("allowed_hours").notNull(), // JSON string of allowed hours [start, end]
  restrictedDays: text("restricted_days"), // JSON string of restricted day indices (0=Sunday)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Location Timezone Detection
export const locationTimezone = pgTable("location_timezone", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  detectedTimezone: varchar("detected_timezone", { length: 100 }).notNull(),
  localTime: timestamp("local_time").notNull(),
  utcOffset: integer("utc_offset").notNull(), // Offset in minutes
  isDst: boolean("is_dst").default(false), // Daylight saving time
  timeRestrictionApplied: boolean("time_restriction_applied").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for new tables
export const insertGeoRiskZoneSchema = createInsertSchema(geoRiskZones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeatherAlertSchema = createInsertSchema(weatherAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertContentViolationSchema = createInsertSchema(contentViolations).omit({
  id: true,
  createdAt: true,
});

export const insertOrderGroupSchema = createInsertSchema(orderGroups).omit({
  id: true,
  createdAt: true,
});

export const insertGroupParticipantSchema = createInsertSchema(groupParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertGeofenceSchema = createInsertSchema(geofences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimezoneRuleSchema = createInsertSchema(timezoneRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationTimezoneSchema = createInsertSchema(locationTimezone).omit({
  id: true,
  createdAt: true,
});

// Validation schemas
export const geoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const aaGroupCreationSchema = z.object({
  orderId: z.string(),
  maxParticipants: z.number().min(2).max(50),
  expirationHours: z.number().min(1).max(168), // Max 1 week
});

export const geofenceCreationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['polygon', 'circle', 'rectangle']),
  coordinates: z.union([
    z.array(z.object({ lat: z.number(), lng: z.number() })), // polygon
    z.object({ center: z.object({ lat: z.number(), lng: z.number() }), radius: z.number() }), // circle
    z.object({ 
      topLeft: z.object({ lat: z.number(), lng: z.number() }),
      bottomRight: z.object({ lat: z.number(), lng: z.number() })
    }) // rectangle
  ]),
  action: z.enum(['block', 'warn', 'allow', 'restrict_time']),
  priority: z.number().default(0),
  timeRestrictions: z.object({
    allowedHours: z.array(z.object({ start: z.number(), end: z.number() })).optional(),
    restrictedDays: z.array(z.number().min(0).max(6)).optional(),
    timezone: z.string().optional(),
  }).optional(),
});

export const timezoneCheckSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timestamp: z.string().optional(),
});

// Export types for new tables
export type GeoRiskZone = typeof geoRiskZones.$inferSelect;
export type InsertGeoRiskZone = z.infer<typeof insertGeoRiskZoneSchema>;
export type WeatherAlert = typeof weatherAlerts.$inferSelect;
export type InsertWeatherAlert = z.infer<typeof insertWeatherAlertSchema>;
export type ContentViolation = typeof contentViolations.$inferSelect;
export type InsertContentViolation = z.infer<typeof insertContentViolationSchema>;
export type OrderGroup = typeof orderGroups.$inferSelect;
export type InsertOrderGroup = z.infer<typeof insertOrderGroupSchema>;
export type GroupParticipant = typeof groupParticipants.$inferSelect;
export type InsertGroupParticipant = z.infer<typeof insertGroupParticipantSchema>;
export type Geofence = typeof geofences.$inferSelect;
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;
export type TimezoneRule = typeof timezoneRules.$inferSelect;
export type InsertTimezoneRule = z.infer<typeof insertTimezoneRuleSchema>;
export type LocationTimezone = typeof locationTimezone.$inferSelect;
export type InsertLocationTimezone = z.infer<typeof insertLocationTimezoneSchema>;
