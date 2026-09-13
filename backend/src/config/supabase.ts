import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from './env';

// Public Supabase client using Anon key
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: WebSocket as any,
  },
});

// Admin Supabase client using Service Role key (for backend admin operations)
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transport: WebSocket as any,
    },
  }
);
