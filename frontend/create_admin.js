import { createClient } from '@supabase/supabase-js';

import ws from 'ws';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
});

async function createAdmin() {
  const email = 'cutsandofficial@gmail.com';
  const password = 'admin123';
  
  console.log('Signing up admin...');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Admin User'
      }
    }
  });

  if (error) {
    console.error('Error signing up admin:', error.message);
  } else {
    console.log('Admin user created successfully in auth.users:', data.user?.id);
  }
}

createAdmin();
