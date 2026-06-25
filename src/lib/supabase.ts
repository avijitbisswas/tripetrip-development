import { createClient } from '@supabase/supabase-js';

interface SupabaseEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

declare global {
  interface Window {
    __TRIPETRIP_CONFIG__?: SupabaseEnv;
  }
}

function getRuntimeSupabaseEnv(): SupabaseEnv {
  if (typeof window === 'undefined') return {};
  return window.__TRIPETRIP_CONFIG__ || {};
}

export function resolveSupabaseConfig(env: SupabaseEnv, runtimeEnv: SupabaseEnv = {}) {
  const config = env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY ? env : runtimeEnv;

  if (config.VITE_SUPABASE_URL && config.VITE_SUPABASE_ANON_KEY) {
    return {
      url: config.VITE_SUPABASE_URL,
      anonKey: config.VITE_SUPABASE_ANON_KEY,
      isConfigured: true,
    };
  }

  return {
    url: 'https://disabled.supabase.co',
    anonKey: 'disabled-anon-key',
    isConfigured: false,
  };
}

export const supabaseConfig = resolveSupabaseConfig({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
}, getRuntimeSupabaseEnv());

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
