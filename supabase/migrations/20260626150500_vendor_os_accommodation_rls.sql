CREATE OR REPLACE FUNCTION vendor_os_module_name_for_table(table_name TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT CASE table_name
    WHEN 'vendor_customers' THEN 'crm'
    WHEN 'vendor_leads' THEN 'crm'
    WHEN 'vendor_tasks' THEN 'team'
    WHEN 'vendor_calendar_events' THEN 'calendar'
    WHEN 'vendor_inventory_blocks' THEN 'calendar'
    WHEN 'vendor_conversations' THEN 'inbox'
    WHEN 'vendor_conversation_messages' THEN 'inbox'
    WHEN 'vendor_invoices' THEN 'accounting'
    WHEN 'vendor_expenses' THEN 'accounting'
    WHEN 'vendor_ledger_entries' THEN 'accounting'
    WHEN 'vendor_properties' THEN 'pms'
    WHEN 'vendor_room_types' THEN 'pms'
    WHEN 'vendor_rooms' THEN 'pms'
    WHEN 'vendor_housekeeping_tasks' THEN 'pms'
    WHEN 'vendor_tour_itineraries' THEN 'tours'
    WHEN 'vendor_tour_departures' THEN 'tours'
    WHEN 'vendor_activity_slots' THEN 'activities'
    WHEN 'vendor_equipment_items' THEN 'activities'
    WHEN 'vendor_safety_logs' THEN 'activities'
    WHEN 'vendor_vehicles' THEN 'fleet'
    WHEN 'vendor_drivers' THEN 'fleet'
    WHEN 'vendor_vehicle_assignments' THEN 'fleet'
    WHEN 'vendor_maintenance_logs' THEN 'fleet'
    WHEN 'vendor_marketplace_syncs' THEN 'marketplace'
    WHEN 'vendor_ai_insights' THEN 'ai_assistant'
    WHEN 'vendor_subscription_accounts' THEN 'subscriptions'
    WHEN 'vendor_analytics_snapshots' THEN 'analytics'
    ELSE table_name
  END;
$$;

CREATE OR REPLACE FUNCTION vendor_os_module_write_allowed(target_organization_id UUID, module_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  vendor_profile_id UUID;
  vendor_business_type TEXT;
  normalized_business_type TEXT;
  saved_access JSONB;
  override_value BOOLEAN;
BEGIN
  SELECT primary_vendor_profile_id
  INTO vendor_profile_id
  FROM vendor_organizations
  WHERE id = target_organization_id;

  IF vendor_profile_id IS NULL THEN
    RETURN TRUE;
  END IF;

  SELECT business_type
  INTO vendor_business_type
  FROM vendor_profiles
  WHERE id = vendor_profile_id;

  normalized_business_type := lower(replace(trim(coalesce(vendor_business_type, '')), '_', ' '));

  IF normalized_business_type NOT IN (
    'accommodation',
    'accommodations',
    'boutique stay',
    'guesthouse',
    'homestay',
    'hostel',
    'hotel',
    'hotels',
    'resort',
    'resorts',
    'serviced apartment',
    'stay',
    'stays',
    'villa',
    'villas'
  ) THEN
    RETURN TRUE;
  END IF;

  SELECT split_part(control.content, '__tripetrip_vendor_access__:', 2)::jsonb
  INTO saved_access
  FROM messages control
  WHERE control.content LIKE '__tripetrip_vendor_access__:%'
    AND split_part(control.content, '__tripetrip_vendor_access__:', 2)::jsonb->>'vendorProfileId' = vendor_profile_id::text
  ORDER BY control.created_at DESC
  LIMIT 1;

  IF saved_access IS NULL OR saved_access->>'enforcementMode' = 'open' THEN
    RETURN TRUE;
  END IF;

  IF saved_access->'moduleOverrides' ? module_name THEN
    override_value := (saved_access->'moduleOverrides'->>module_name)::BOOLEAN;
    RETURN coalesce(override_value, FALSE);
  END IF;

  RETURN module_name = ANY (ARRAY['dashboard', 'crm', 'calendar', 'inbox', 'accounting', 'team', 'pms', 'ai_assistant', 'marketplace', 'subscriptions', 'analytics', 'branches', 'documents', 'settings']);
END;
$$;

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
    EXECUTE format('DROP POLICY IF EXISTS "Managers write %s" ON %I', operational_table, operational_table);
    EXECUTE format(
      'CREATE POLICY "Managers write %s" ON %I FOR ALL TO authenticated USING (
        (
          organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
          OR organization_id IN (
            SELECT organization_id FROM vendor_team_members
            WHERE user_id = auth.uid() AND role IN (''owner'', ''admin'', ''manager'') AND is_active = true
          )
        )
        AND vendor_os_module_write_allowed(organization_id, vendor_os_module_name_for_table(''%s''))
      ) WITH CHECK (
        (
          organization_id IN (SELECT id FROM vendor_organizations WHERE owner_user_id = auth.uid())
          OR organization_id IN (
            SELECT organization_id FROM vendor_team_members
            WHERE user_id = auth.uid() AND role IN (''owner'', ''admin'', ''manager'') AND is_active = true
          )
        )
        AND vendor_os_module_write_allowed(organization_id, vendor_os_module_name_for_table(''%s''))
      )',
      operational_table,
      operational_table,
      operational_table,
      operational_table
    );
  END LOOP;
END $$;
