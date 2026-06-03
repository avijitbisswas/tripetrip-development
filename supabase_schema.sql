-- Tripetrip Supabase schema

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_slug ON vendor_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_listings_active_category_created ON listings(is_active, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_vendor_id ON listings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_availability_listing_date ON availability(listing_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_traveler_created ON bookings(traveler_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_created ON bookings(vendor_id, created_at DESC);

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
  invited_email TEXT,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
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
CREATE INDEX IF NOT EXISTS idx_vendor_audit_logs_org_created ON vendor_audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_recipient_status ON vendor_notifications(recipient_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_org_module ON vendor_documents(organization_id, module, created_at DESC);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
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
