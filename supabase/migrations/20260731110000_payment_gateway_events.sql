CREATE TABLE IF NOT EXISTS payment_gateway_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT DEFAULT 'razorpay' NOT NULL,
  event_id TEXT,
  event_type TEXT NOT NULL,
  order_id TEXT,
  payment_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb NOT NULL,
  processing_status TEXT DEFAULT 'received' NOT NULL,
  error_message TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_gateway_events_provider_event_id
  ON payment_gateway_events(provider, event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_gateway_events_payment_lookup
  ON payment_gateway_events(provider, order_id, payment_id, received_at);
