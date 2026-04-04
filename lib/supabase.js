import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function createSupabase(key) {
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return createSupabase(supabaseAnonKey);
}

export function getSupabaseServerClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return createSupabase(supabaseServiceRoleKey || supabaseAnonKey);
}

export function isUsingServiceRole() {
  return Boolean(supabaseServiceRoleKey);
}
