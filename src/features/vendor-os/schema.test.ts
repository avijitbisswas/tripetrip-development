import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const schema = readFileSync(resolve(process.cwd(), 'supabase_schema.sql'), 'utf8');

describe('Vendor OS database schema', () => {
  it('hardens module settings with uniqueness, lookup index, RLS, and updated_at trigger', () => {
    expect(schema).toContain('CREATE TABLE IF NOT EXISTS vendor_os_module_settings');
    expect(schema).toContain('UNIQUE(organization_id, branch_id, module)');
    expect(schema).toContain('CREATE INDEX IF NOT EXISTS idx_vendor_module_settings_org_branch');
    expect(schema).toContain('ALTER TABLE vendor_os_module_settings ENABLE ROW LEVEL SECURITY');
    expect(schema).toContain('CREATE TRIGGER set_vendor_os_module_settings_updated_at');
  });

  it('provisions a private storage bucket for uploaded vendor documents', () => {
    expect(schema).toContain("INSERT INTO storage.buckets (id, name, public)");
    expect(schema).toContain("'vendor-documents', 'vendor-documents', false");
    expect(schema).toContain('CREATE POLICY "Authenticated users upload vendor document objects"');
    expect(schema).toContain('CREATE POLICY "Owners read vendor document objects"');
    expect(schema).toContain('CREATE POLICY "Owners update vendor document objects"');
    expect(schema).toContain('CREATE POLICY "Owners delete vendor document objects"');
  });
});
