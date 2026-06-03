import { describe, expect, it } from 'vitest';
import { resolveSupabaseConfig } from './supabase';

describe('resolveSupabaseConfig', () => {
  it('uses a safe disabled fallback when env values are missing', () => {
    expect(resolveSupabaseConfig({})).toEqual({
      url: 'https://disabled.supabase.co',
      anonKey: 'disabled-anon-key',
      isConfigured: false,
    });
  });

  it('uses provided Supabase env values', () => {
    expect(resolveSupabaseConfig({
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon-key',
    })).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
      isConfigured: true,
    });
  });
});
