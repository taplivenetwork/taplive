ALTER TABLE "users" ALTER COLUMN "network_speed" SET DATA TYPE numeric(6, 2);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "device_performance" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_connected_account_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_visibility" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location_sharing" boolean DEFAULT true;