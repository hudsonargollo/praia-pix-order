/**
 * Direct test of list-waiters Edge Function
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testListWaiters() {
  console.log('🧪 Testing list-waiters Edge Function\n');

  // Login as admin
  console.log('1. Logging in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@cocoloko.com',
    password: '123456',
  });

  if (authError || !authData.session) {
    console.error('❌ Login failed:', authError?.message);
    return;
  }

  console.log('✅ Logged in as:', authData.user.email);
  console.log('   User metadata:', authData.user.user_metadata);
  console.log('   App metadata:', authData.user.app_metadata);

  // Call list-waiters
  console.log('\n2. Calling list-waiters Edge Function...');
  const { data, error } = await supabase.functions.invoke('list-waiters', {
    headers: {
      Authorization: `Bearer ${authData.session.access_token}`,
    },
  });

  if (error) {
    console.error('❌ Edge Function error:', error);
    console.error('   Error details:', JSON.stringify(error, null, 2));
    return;
  }

  console.log('✅ Success!');
  console.log('   Waiters:', data);

  // Logout
  await supabase.auth.signOut();
}

testListWaiters().catch(console.error);
