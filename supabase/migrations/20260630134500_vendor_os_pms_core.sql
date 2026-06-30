CREATE TABLE IF NOT EXISTS vendor_pms_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  property_id UUID REFERENCES vendor_properties(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES vendor_rooms(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adults INTEGER DEFAULT 1 NOT NULL CHECK (adults > 0),
  children INTEGER DEFAULT 0 NOT NULL CHECK (children >= 0),
  status TEXT DEFAULT 'reserved' NOT NULL,
  payment_status TEXT DEFAULT 'pending' NOT NULL,
  total_amount NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (total_amount >= 0),
  source TEXT DEFAULT 'manual' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_folio_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  property_id UUID REFERENCES vendor_properties(id) ON DELETE CASCADE NOT NULL,
  reservation_id UUID REFERENCES vendor_pms_reservations(id) ON DELETE CASCADE,
  entry_type TEXT DEFAULT 'room_charge' NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  payment_state TEXT DEFAULT 'open' NOT NULL,
  notes TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vendor_pms_reservations_property_dates
  ON vendor_pms_reservations(property_id, check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_vendor_folio_entries_reservation_state
  ON vendor_folio_entries(reservation_id, payment_state, posted_at);
