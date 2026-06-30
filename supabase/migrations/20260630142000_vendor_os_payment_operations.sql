CREATE TABLE IF NOT EXISTS vendor_payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES vendor_pms_reservations(id) ON DELETE SET NULL,
  folio_entry_id UUID REFERENCES vendor_folio_entries(id) ON DELETE SET NULL,
  manual_payment_intent_id TEXT REFERENCES manual_payment_intents(id) ON DELETE SET NULL,
  payment_method TEXT DEFAULT 'cash' NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status TEXT DEFAULT 'initiated' NOT NULL,
  reference_number TEXT,
  collected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  collected_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vendor_payment_records_reservation_status
  ON vendor_payment_records(reservation_id, status, collected_at);
