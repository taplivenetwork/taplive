-- Add AI Summaries table
CREATE TABLE IF NOT EXISTS "ai_summaries" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" varchar NOT NULL UNIQUE REFERENCES "orders"("id"),
  "transcription" text NOT NULL,
  "ai_summary" text NOT NULL,
  "key_points" text[] NOT NULL,
  "trust_indicators" text[] NOT NULL,
  "risk_factors" text[] NOT NULL,
  "credibility_score" numeric(4, 2) NOT NULL,
  "recommendations" text[] NOT NULL,
  "recording_url" text,
  "generated_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_ai_summaries_order_id" ON "ai_summaries"("order_id");
