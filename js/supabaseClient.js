import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';

let client = null;

function resolveCredentials() {
  const url = localStorage.getItem('sb_url') || SUPABASE_URL;
  const key = localStorage.getItem('sb_key') || SUPABASE_ANON_KEY;
  const valid = url && key && url !== 'TU_SUPABASE_URL_AQUI' && key !== 'TU_SUPABASE_ANON_KEY_AQUI';
  return valid ? { url, key } : null;
}

export function getSupabase() {
  if (client) return client;
  const credentials = resolveCredentials();
  if (!credentials) return null;

  client = createClient(credentials.url, credentials.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return client;
}

export function resetSupabase(url, key) {
  localStorage.setItem('sb_url', url);
  localStorage.setItem('sb_key', key);
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}

export function isConnected() {
  return !!getSupabase();
}
