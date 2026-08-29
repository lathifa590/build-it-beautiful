import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data: userResp } = await supabase.auth.signInWithPassword({
    email: 'admin@lovable.dev', // Assuming this or some test user
    password: 'password' // or whatever
  });
  
  // We'll just try to insert without auth if RLS allows or we can just see the schema error
  const { data, error } = await supabase.from('workspaces').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    subject: 'Test',
    grade: 'X',
    phase: 'E',
    academic_year: '2024/2025',
    jp_duration_minutes: 45
  });
  
  console.log('Error:', error);
}

test();
