CREATE TYPE "public"."currency" AS ENUM('USD', 'USDT', 'BTC', 'ETH');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('submitted', 'ai_review', 'human_review', 'resolved_approved', 'resolved_rejected');--> statement-breakpoint
CREATE TYPE "public"."dispute_type" AS ENUM('quality_issue', 'content_mismatch', 'technical_issue', 'service_incomplete', 'other');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('order_dispatch', 'order_accepted', 'order_completed', 'payment_received', 'rating_received', 'system_alert');--> statement-breakpoint
CREATE TYPE "public"."order_group_type" AS ENUM('single', 'aa_split', 'group_booking');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'open', 'accepted', 'live', 'completed', 'awaiting_approval', 'disputed', 'under_review', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('single', 'group');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('stripe', 'paypal', 'usdt_trc20', 'usdt_erc20', 'bitcoin', 'ethereum');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('safe', 'low', 'medium', 'high', 'extreme', 'forbidden');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('payment', 'payout', 'refund', 'commission');--> statement-breakpoint
CREATE TYPE "public"."violation_type" AS ENUM('keyword_detected', 'illegal_content', 'prohibited_area', 'weather_risk', 'voice_violation');--> statement-breakpoint
CREATE TYPE "public"."weather_alert" AS ENUM('clear', 'watch', 'warning', 'emergency');--> statement-breakpoint
CREATE TABLE "content_violations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"violation_type" "violation_type" NOT NULL,
	"content" text,
	"confidence" numeric(3, 2),
	"is_confirmed" boolean DEFAULT false,
	"action" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"provider_id" varchar NOT NULL,
	"dispute_type" "dispute_type" NOT NULL,
	"status" "dispute_status" DEFAULT 'submitted' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"evidence" text[],
	"ai_review_result" text,
	"human_review_result" text,
	"resolution" text,
	"resolved_at" timestamp,
	"reviewer_notes" text,
	"escalated_at" timestamp,
	"submitted_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "geo_risk_zones" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"risk_level" "risk_level" NOT NULL,
	"coordinates" text NOT NULL,
	"restrictions" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "geofences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"coordinates" text NOT NULL,
	"action" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"time_restrictions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"is_paid" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "location_timezone" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"detected_timezone" varchar(100) NOT NULL,
	"local_time" timestamp NOT NULL,
	"utc_offset" integer NOT NULL,
	"is_dst" boolean DEFAULT false,
	"time_restriction_applied" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"order_id" varchar,
	"metadata" text,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"provider_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"delivery_note" text,
	"customer_rating" integer,
	"customer_feedback" text,
	"approved_at" timestamp,
	"requested_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_order_id" varchar NOT NULL,
	"group_type" "order_group_type" NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"split_amount" numeric(10, 2) NOT NULL,
	"max_participants" integer NOT NULL,
	"current_participants" integer DEFAULT 1,
	"is_complete" boolean DEFAULT false,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" "order_type" NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"address" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" "currency" DEFAULT 'USD' NOT NULL,
	"platform_fee" numeric(5, 2) DEFAULT '10.00',
	"provider_earnings" numeric(10, 2) DEFAULT '0.00',
	"max_participants" integer,
	"current_participants" integer DEFAULT 1,
	"scheduled_at" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"live_url" text,
	"replay_url" text,
	"creator_id" varchar,
	"provider_id" varchar,
	"tags" text[],
	"category" text NOT NULL,
	"is_paid" boolean DEFAULT false,
	"is_payout_processed" boolean DEFAULT false,
	"group_type" "order_group_type" DEFAULT 'single',
	"group_id" varchar,
	"split_amount" numeric(10, 2),
	"min_participants" integer DEFAULT 1,
	"risk_level" "risk_level" DEFAULT 'safe',
	"weather_alert" "weather_alert" DEFAULT 'clear',
	"geo_fence_status" text,
	"is_high_risk_area" boolean DEFAULT false,
	"is_military_zone" boolean DEFAULT false,
	"weather_conditions" text,
	"content_flags" text[],
	"keyword_violations" text[],
	"voice_alerts" integer DEFAULT 0,
	"recording_url" text,
	"replay_available" boolean DEFAULT false,
	"recording_duration" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"payer_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"external_payment_id" text,
	"external_transaction_hash" text,
	"payment_gateway_response" text,
	"payment_metadata" text,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"payment_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"platform_fee" numeric(10, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"payout_method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"recipient_wallet" text,
	"external_payout_id" text,
	"external_transaction_hash" text,
	"payout_gateway_response" text,
	"payout_metadata" text,
	"failure_reason" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"reviewer_id" varchar NOT NULL,
	"reviewee_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"review_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timezone_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region" varchar(255) NOT NULL,
	"timezone" varchar(100) NOT NULL,
	"allowed_hours" text NOT NULL,
	"restricted_days" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"order_id" varchar,
	"payment_id" varchar,
	"payout_id" varchar,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"description" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"bio" text,
	"role" text DEFAULT 'customer',
	"rating" numeric(3, 2) DEFAULT '0.00',
	"total_ratings" integer DEFAULT 0,
	"completed_orders" integer DEFAULT 0,
	"avg_response_time" integer DEFAULT 0,
	"trust_score" numeric(3, 2) DEFAULT '0.00',
	"network_speed" numeric(5, 2) DEFAULT '0.00',
	"device_performance" numeric(3, 2) DEFAULT '0.00',
	"device_name" text,
	"current_latitude" numeric(10, 7),
	"current_longitude" numeric(10, 7),
	"available_radius" integer DEFAULT 10,
	"availability" boolean DEFAULT true,
	"last_active" timestamp DEFAULT now(),
	"dispatch_score" numeric(5, 2) DEFAULT '0.00',
	"total_earnings" numeric(12, 2) DEFAULT '0.00',
	"wallet_address" text,
	"preferred_payment_method" "payment_method",
	"timezone" text DEFAULT 'America/New_York',
	"notify_new_orders" boolean DEFAULT true,
	"notify_messages" boolean DEFAULT true,
	"notify_updates" boolean DEFAULT true,
	"notify_promotions" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weather_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"radius" numeric(8, 2) NOT NULL,
	"alert_type" "weather_alert" NOT NULL,
	"weather_condition" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"is_active" boolean DEFAULT true,
	"source" text DEFAULT 'weather_api',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "content_violations" ADD CONSTRAINT "content_violations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_violations" ADD CONSTRAINT "content_violations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_violations" ADD CONSTRAINT "content_violations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_group_id_order_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."order_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_timezone" ADD CONSTRAINT "location_timezone_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_groups" ADD CONSTRAINT "order_groups_original_order_id_orders_id_fk" FOREIGN KEY ("original_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_provider_id_users_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_id_users_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_reviewee_id_users_id_fk" FOREIGN KEY ("reviewee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE no action ON UPDATE no action;