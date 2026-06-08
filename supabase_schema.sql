-- Tripetrip Supabase schema

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users upload vendor document objects" ON storage.objects;
CREATE POLICY "Authenticated users upload vendor document objects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vendor-documents');

DROP POLICY IF EXISTS "Owners read vendor document objects" ON storage.objects;
CREATE POLICY "Owners read vendor document objects"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vendor-documents' AND owner = auth.uid());

DROP POLICY IF EXISTS "Owners update vendor document objects" ON storage.objects;
CREATE POLICY "Owners update vendor document objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vendor-documents' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'vendor-documents' AND owner = auth.uid());

DROP POLICY IF EXISTS "Owners delete vendor document objects" ON storage.objects;
CREATE POLICY "Owners delete vendor document objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vendor-documents' AND owner = auth.uid());

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('traveler', 'vendor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE price_unit AS ENUM ('per_night', 'per_person', 'per_day', 'fixed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'escrowed', 'released', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'traveler' NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  business_email TEXT,
  business_phone TEXT,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  custom_website TEXT,
  logo_url TEXT,
  banner_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  verification_status verification_status DEFAULT 'pending' NOT NULL,
  trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  category TEXT NOT NULL,
  base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
  price_unit price_unit NOT NULL,
  max_capacity INTEGER CHECK (max_capacity IS NULL OR max_capacity > 0),
  images TEXT[] DEFAULT '{}' NOT NULL,
  amenities TEXT[] DEFAULT '{}' NOT NULL,
  location TEXT DEFAULT '' NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  specifics JSONB DEFAULT '{}'::jsonb NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  slots_available INTEGER DEFAULT 1 NOT NULL CHECK (slots_available >= 0),
  custom_price NUMERIC(12, 2) CHECK (custom_price IS NULL OR custom_price >= 0),
  UNIQUE(listing_id, date)
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) NOT NULL,
  traveler_id UUID REFERENCES profiles(id) NOT NULL,
  vendor_id UUID REFERENCES vendor_profiles(id) NOT NULL,
  traveler_name TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  guests INTEGER NOT NULL CHECK (guests > 0),
  total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
  status booking_status DEFAULT 'pending' NOT NULL,
  payment_status payment_status DEFAULT 'pending' NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  vendor_id UUID REFERENCES vendor_profiles(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified_booking BOOLEAN DEFAULT TRUE NOT NULL,
  vendor_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id) NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DO $$ BEGIN
  CREATE TYPE manual_payment_status AS ENUM ('awaiting_admin_approval', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE manual_admin_approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS manual_payment_intents (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'INR' NOT NULL CHECK (currency = 'INR'),
  method TEXT DEFAULT 'barcode_manual' NOT NULL CHECK (method = 'barcode_manual'),
  status manual_payment_status DEFAULT 'awaiting_admin_approval' NOT NULL,
  admin_approval_status manual_admin_approval_status DEFAULT 'pending' NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  barcode_payload TEXT NOT NULL,
  instructions TEXT NOT NULL,
  traveler_name TEXT,
  purpose TEXT,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_slug ON vendor_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_listings_active_category_created ON listings(is_active, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_vendor_id ON listings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_availability_listing_date ON availability(listing_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_traveler_created ON bookings(traveler_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_created ON bookings(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_payment_intents_status_created ON manual_payment_intents(status, created_at DESC);

DO $$ BEGIN
  CREATE TYPE vendor_business_category AS ENUM (
    'property_owner',
    'hotel',
    'resort',
    'homestay',
    'hostel',
    'travel_agent',
    'tour_operator',
    'dmc',
    'adventure_operator',
    'transport_provider'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vendor_os_role AS ENUM ('owner', 'admin', 'manager', 'operations', 'sales', 'accountant', 'staff', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vendor_team_member_status AS ENUM ('invited', 'active', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vendor_os_module AS ENUM (
    'dashboard',
    'crm',
    'calendar',
    'inbox',
    'accounting',
    'team',
    'pms',
    'tours',
    'activities',
    'fleet',
    'ai_assistant',
    'marketplace',
    'subscriptions',
    'analytics',
    'branches',
    'documents',
    'settings'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE permission_action AS ENUM ('view', 'create', 'update', 'delete', 'approve', 'export', 'manage');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_event_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('draft', 'active', 'expired', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS vendor_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  primary_vendor_profile_id UUID REFERENCES vendor_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  legal_name TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  default_currency TEXT DEFAULT 'INR' NOT NULL,
  timezone TEXT DEFAULT 'Asia/Kolkata' NOT NULL,
  categories vendor_business_category[] DEFAULT '{}' NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  branch_code TEXT,
  categories vendor_business_category[] DEFAULT '{}' NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India' NOT NULL,
  pincode TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  email TEXT,
  manager_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}'::jsonb NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role vendor_os_role NOT NULL,
  title TEXT,
  display_name TEXT,
  invited_email TEXT,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  status vendor_team_member_status DEFAULT 'invited' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, branch_id, user_id)
);

CREATE TABLE IF NOT EXISTS vendor_role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role vendor_os_role NOT NULL,
  module vendor_os_module NOT NULL,
  actions permission_action[] NOT NULL,
  UNIQUE(role, module)
);

CREATE TABLE IF NOT EXISTS vendor_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  module vendor_os_module NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  severity audit_event_severity DEFAULT 'info' NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  module vendor_os_module NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  status notification_status DEFAULT 'unread' NOT NULL,
  priority audit_event_severity DEFAULT 'info' NOT NULL,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  module vendor_os_module NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  status document_status DEFAULT 'active' NOT NULL,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_os_module_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE CASCADE,
  module vendor_os_module NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ,
  UNIQUE(organization_id, branch_id, module)
);

CREATE INDEX IF NOT EXISTS idx_vendor_organizations_owner ON vendor_organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_branches_organization ON vendor_branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_vendor_team_members_user ON vendor_team_members(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_team_members_org ON vendor_team_members(organization_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_vendor_team_members_org_status ON vendor_team_members(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_audit_logs_org_created ON vendor_audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_recipient_status ON vendor_notifications(recipient_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_org_module ON vendor_documents(organization_id, module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_module_settings_org_branch ON vendor_os_module_settings(organization_id, branch_id, module);

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_vendor_os_module_settings_updated_at ON vendor_os_module_settings;
CREATE TRIGGER set_vendor_os_module_settings_updated_at
  BEFORE UPDATE ON vendor_os_module_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_os_module_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON profiles;
CREATE POLICY "Profiles are readable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public vendors are readable" ON vendor_profiles;
CREATE POLICY "Public vendors are readable"
  ON vendor_profiles FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users manage own vendor profile" ON vendor_profiles;
CREATE POLICY "Users manage own vendor profile"
  ON vendor_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public listings are readable" ON listings;
CREATE POLICY "Public listings are readable"
  ON listings FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Vendors manage own listings" ON listings;
CREATE POLICY "Vendors manage own listings"
  ON listings FOR ALL TO authenticated
  USING (vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Public availability is readable" ON availability;
CREATE POLICY "Public availability is readable"
  ON availability FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vendors manage own availability" ON availability;
CREATE POLICY "Vendors manage own availability"
  ON availability FOR ALL TO authenticated
  USING (
    listing_id IN (
      SELECT listings.id
      FROM listings
      JOIN vendor_profiles ON vendor_profiles.id = listings.vendor_id
      WHERE vendor_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT listings.id
      FROM listings
      JOIN vendor_profiles ON vendor_profiles.id = listings.vendor_id
      WHERE vendor_profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Travelers and vendors read own bookings" ON bookings;
CREATE POLICY "Travelers and vendors read own bookings"
  ON bookings FOR SELECT TO authenticated
  USING (
    auth.uid() = traveler_id
    OR vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Travelers create own bookings" ON bookings;
CREATE POLICY "Travelers create own bookings"
  ON bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = traveler_id);

DROP POLICY IF EXISTS "Public reviews are readable" ON reviews;
CREATE POLICY "Public reviews are readable"
  ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create own reviews" ON reviews;
CREATE POLICY "Users create own reviews"
  ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users read own messages" ON messages;
CREATE POLICY "Users read own messages"
  ON messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users send own messages" ON messages;
CREATE POLICY "Users send own messages"
  ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Admins manage manual payment intents" ON manual_payment_intents;
CREATE POLICY "Admins manage manual payment intents"
  ON manual_payment_intents FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Members read own organizations" ON vendor_organizations;
CREATE POLICY "Members read own organizations"
  ON vendor_organizations FOR SELECT TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users create owned organizations" ON vendor_organizations;
CREATE POLICY "Users create owned organizations"
  ON vendor_organizations FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners manage organizations" ON vendor_organizations;
CREATE POLICY "Owners manage organizations"
  ON vendor_organizations FOR UPDATE TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Members read branches" ON vendor_branches;
CREATE POLICY "Members read branches"
  ON vendor_branches FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT id
      FROM vendor_organizations
      WHERE owner_user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Owners and admins manage branches" ON vendor_branches;
CREATE POLICY "Owners and admins manage branches"
  ON vendor_branches FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
    OR organization_id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
    OR organization_id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Members read team" ON vendor_team_members;
CREATE POLICY "Members read team"
  ON vendor_team_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
    OR organization_id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Owners and admins manage team" ON vendor_team_members;
CREATE POLICY "Owners and admins manage team"
  ON vendor_team_members FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
    OR organization_id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
    OR organization_id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users read role permissions" ON vendor_role_permissions;
CREATE POLICY "Authenticated users read role permissions"
  ON vendor_role_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Members read audit logs" ON vendor_audit_logs;
CREATE POLICY "Members read audit logs"
  ON vendor_audit_logs FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
    OR organization_id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager') AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Members create audit logs" ON vendor_audit_logs;
CREATE POLICY "Members create audit logs"
  ON vendor_audit_logs FOR INSERT TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid()
    AND (
      organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
      OR organization_id IN (
        SELECT organization_id
        FROM vendor_team_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

DROP POLICY IF EXISTS "Users read own notifications" ON vendor_notifications;
CREATE POLICY "Users read own notifications"
  ON vendor_notifications FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON vendor_notifications;
CREATE POLICY "Users update own notifications"
  ON vendor_notifications FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid()) WITH CHECK (recipient_user_id = auth.uid());

DROP POLICY IF EXISTS "Members read documents" ON vendor_documents;
CREATE POLICY "Members read documents"
  ON vendor_documents FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
    OR organization_id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Members create documents" ON vendor_documents;
CREATE POLICY "Members create documents"
  ON vendor_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
      OR organization_id IN (
        SELECT organization_id
        FROM vendor_team_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

DROP POLICY IF EXISTS "Members read module settings" ON vendor_os_module_settings;
CREATE POLICY "Members read module settings"
  ON vendor_os_module_settings FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
    OR organization_id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Owners and admins manage module settings" ON vendor_os_module_settings;
CREATE POLICY "Owners and admins manage module settings"
  ON vendor_os_module_settings FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
    OR organization_id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
    OR organization_id IN (
      SELECT organization_id
      FROM vendor_team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

INSERT INTO vendor_role_permissions (role, module, actions)
VALUES
  ('owner', 'dashboard', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'crm', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'calendar', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'inbox', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'accounting', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'team', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'pms', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'tours', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'activities', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'fleet', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'ai_assistant', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'marketplace', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'subscriptions', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'analytics', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'branches', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'documents', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[]),
  ('owner', 'settings', ARRAY['view','create','update','delete','approve','export','manage']::permission_action[])
ON CONFLICT (role, module) DO NOTHING;

CREATE TABLE IF NOT EXISTS vendor_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'tripetrip',
  preferences JSONB DEFAULT '{}'::jsonb NOT NULL,
  tags TEXT[] DEFAULT '{}' NOT NULL,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES vendor_customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  stage TEXT DEFAULT 'new' NOT NULL,
  source TEXT DEFAULT 'marketplace' NOT NULL,
  estimated_value NUMERIC(12, 2) DEFAULT 0 CHECK (estimated_value >= 0),
  travel_start DATE,
  travel_end DATE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  module vendor_os_module NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL,
  priority audit_event_severity DEFAULT 'info' NOT NULL,
  due_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  module vendor_os_module NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  capacity INTEGER CHECK (capacity IS NULL OR capacity >= 0),
  booked_count INTEGER DEFAULT 0 NOT NULL CHECK (booked_count >= 0),
  status TEXT DEFAULT 'scheduled' NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_inventory_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  module vendor_os_module NOT NULL,
  inventory_type TEXT NOT NULL,
  inventory_id UUID,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES vendor_customers(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  channel TEXT DEFAULT 'tripetrip' NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_conversation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES vendor_conversations(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  sender_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_label TEXT,
  body TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES vendor_customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  due_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ,
  UNIQUE(organization_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS vendor_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  module vendor_os_module NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'INR' NOT NULL,
  status TEXT DEFAULT 'submitted' NOT NULL,
  spent_at DATE NOT NULL,
  vendor_name TEXT,
  document_id UUID REFERENCES vendor_documents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL,
  description TEXT NOT NULL,
  debit NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (debit >= 0),
  credit NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (credit >= 0),
  currency TEXT DEFAULT 'INR' NOT NULL,
  posted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  property_type TEXT NOT NULL,
  address TEXT,
  check_in_time TIME DEFAULT '14:00',
  check_out_time TIME DEFAULT '11:00',
  settings JSONB DEFAULT '{}'::jsonb NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_room_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES vendor_properties(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  occupancy INTEGER NOT NULL CHECK (occupancy > 0),
  base_rate NUMERIC(12, 2) NOT NULL CHECK (base_rate >= 0),
  amenities TEXT[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES vendor_properties(id) ON DELETE CASCADE NOT NULL,
  room_type_id UUID REFERENCES vendor_room_types(id) ON DELETE SET NULL,
  room_number TEXT NOT NULL,
  floor TEXT,
  status TEXT DEFAULT 'available' NOT NULL,
  housekeeping_status TEXT DEFAULT 'clean' NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(property_id, room_number)
);

CREATE TABLE IF NOT EXISTS vendor_housekeeping_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES vendor_properties(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES vendor_rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_tour_itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  inclusions TEXT[] DEFAULT '{}' NOT NULL,
  itinerary JSONB DEFAULT '[]'::jsonb NOT NULL,
  base_price NUMERIC(12, 2) DEFAULT 0 CHECK (base_price >= 0),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_tour_departures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  itinerary_id UUID REFERENCES vendor_tour_itineraries(id) ON DELETE CASCADE NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  booked_count INTEGER DEFAULT 0 NOT NULL CHECK (booked_count >= 0),
  guide_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'scheduled' NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_activity_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  booked_count INTEGER DEFAULT 0 NOT NULL CHECK (booked_count >= 0),
  status TEXT DEFAULT 'open' NOT NULL,
  safety_required BOOLEAN DEFAULT TRUE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_equipment_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity >= 0),
  condition TEXT DEFAULT 'ready' NOT NULL,
  last_checked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_safety_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  activity_slot_id UUID REFERENCES vendor_activity_slots(id) ON DELETE SET NULL,
  checked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  checklist JSONB DEFAULT '[]'::jsonb NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  registration_number TEXT,
  vehicle_type TEXT NOT NULL,
  seats INTEGER CHECK (seats IS NULL OR seats > 0),
  status TEXT DEFAULT 'available' NOT NULL,
  odometer_km INTEGER DEFAULT 0 NOT NULL CHECK (odometer_km >= 0),
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  status TEXT DEFAULT 'available' NOT NULL,
  document_id UUID REFERENCES vendor_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_vehicle_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vendor_vehicles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES vendor_drivers(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status TEXT DEFAULT 'assigned' NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_maintenance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vendor_vehicles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' NOT NULL,
  due_at TIMESTAMPTZ,
  cost NUMERIC(12, 2) CHECK (cost IS NULL OR cost >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_marketplace_syncs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  module vendor_os_module NOT NULL,
  sync_status TEXT DEFAULT 'pending' NOT NULL,
  last_synced_at TIMESTAMPTZ,
  conversion_rate NUMERIC(6, 3) CHECK (conversion_rate IS NULL OR conversion_rate >= 0),
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  module vendor_os_module NOT NULL,
  title TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  confidence NUMERIC(5, 2) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
  status TEXT DEFAULT 'new' NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_subscription_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_code TEXT DEFAULT 'starter' NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly' NOT NULL,
  current_period_end TIMESTAMPTZ,
  usage JSONB DEFAULT '{}'::jsonb NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vendor_analytics_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES vendor_organizations(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES vendor_branches(id) ON DELETE SET NULL,
  module vendor_os_module NOT NULL,
  snapshot_date DATE NOT NULL,
  metrics JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, branch_id, module, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_vendor_customers_org ON vendor_customers(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_leads_org_stage ON vendor_leads(organization_id, stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_tasks_org_module_status ON vendor_tasks(organization_id, module, status, due_at);
CREATE INDEX IF NOT EXISTS idx_vendor_calendar_events_org_starts ON vendor_calendar_events(organization_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_vendor_inventory_blocks_org_dates ON vendor_inventory_blocks(organization_id, starts_on, ends_on);
CREATE INDEX IF NOT EXISTS idx_vendor_conversations_org_status ON vendor_conversations(organization_id, status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_conversation_messages_conversation ON vendor_conversation_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_org_status ON vendor_invoices(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_expenses_org_spent ON vendor_expenses(organization_id, spent_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_ledger_entries_org_posted ON vendor_ledger_entries(organization_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_properties_org ON vendor_properties(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_rooms_property_status ON vendor_rooms(property_id, status, housekeeping_status);
CREATE INDEX IF NOT EXISTS idx_vendor_housekeeping_tasks_property_status ON vendor_housekeeping_tasks(property_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_vendor_tour_departures_org_starts ON vendor_tour_departures(organization_id, starts_on);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_slots_org_starts ON vendor_activity_slots(organization_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_vendor_equipment_items_org_condition ON vendor_equipment_items(organization_id, condition);
CREATE INDEX IF NOT EXISTS idx_vendor_safety_logs_org_status ON vendor_safety_logs(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_vehicles_org_status ON vendor_vehicles(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_drivers_org_status ON vendor_drivers(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_vehicle_assignments_org_starts ON vendor_vehicle_assignments(organization_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_vendor_maintenance_logs_org_due ON vendor_maintenance_logs(organization_id, due_at);
CREATE INDEX IF NOT EXISTS idx_vendor_marketplace_syncs_org_status ON vendor_marketplace_syncs(organization_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_vendor_ai_insights_org_status ON vendor_ai_insights(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_analytics_snapshots_org_date ON vendor_analytics_snapshots(organization_id, snapshot_date DESC);

DO $$
DECLARE
  operational_table TEXT;
  operational_tables TEXT[] := ARRAY[
    'vendor_customers',
    'vendor_leads',
    'vendor_tasks',
    'vendor_calendar_events',
    'vendor_inventory_blocks',
    'vendor_conversations',
    'vendor_conversation_messages',
    'vendor_invoices',
    'vendor_expenses',
    'vendor_ledger_entries',
    'vendor_properties',
    'vendor_room_types',
    'vendor_rooms',
    'vendor_housekeeping_tasks',
    'vendor_tour_itineraries',
    'vendor_tour_departures',
    'vendor_activity_slots',
    'vendor_equipment_items',
    'vendor_safety_logs',
    'vendor_vehicles',
    'vendor_drivers',
    'vendor_vehicle_assignments',
    'vendor_maintenance_logs',
    'vendor_marketplace_syncs',
    'vendor_ai_insights',
    'vendor_subscription_accounts',
    'vendor_analytics_snapshots'
  ];
BEGIN
  FOREACH operational_table IN ARRAY operational_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', operational_table);
    EXECUTE format('DROP POLICY IF EXISTS "Members read %s" ON %I', operational_table, operational_table);
    EXECUTE format(
      'CREATE POLICY "Members read %s" ON %I FOR SELECT TO authenticated USING (
        organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
        OR organization_id IN (
          SELECT organization_id FROM vendor_team_members WHERE user_id = auth.uid() AND is_active = true
        )
      )',
      operational_table,
      operational_table
    );
    EXECUTE format('DROP POLICY IF EXISTS "Managers write %s" ON %I', operational_table, operational_table);
    EXECUTE format(
      'CREATE POLICY "Managers write %s" ON %I FOR ALL TO authenticated USING (
        organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
        OR organization_id IN (
          SELECT organization_id FROM vendor_team_members
          WHERE user_id = auth.uid() AND role IN (''owner'', ''admin'', ''manager'') AND is_active = true
        )
      ) WITH CHECK (
        organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
        OR organization_id IN (
          SELECT organization_id FROM vendor_team_members
          WHERE user_id = auth.uid() AND role IN (''owner'', ''admin'', ''manager'') AND is_active = true
        )
      )',
      operational_table,
      operational_table
    );
  END LOOP;
END $$;
