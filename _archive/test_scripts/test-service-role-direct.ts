/**
 * Test service role key directly (not through Edge Function)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sntxekdwdllwkszclpiq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudHhla2R3ZGxsd2tzemNscGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjIwNDU4OSwiZXhwIjoyMDc3NzgwNTg5fQ.I5R498LlD6rohVRHh2nyWzKQIgzvfPRdC1nfNRLwBn0';

async function testServiceRoleDirect() {
  console.log('🧪 Testing Service Role Key Directly\n');

  // Create admin client with service role
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('1. Listing all users...');
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError);
    return;
  }

  console.log(`✅ Successfully listed ${users.users.length} users`);
  
  // Show waiters
  const waiters = users.users.filter(u => 
    u.app_metadata?.role === 'waiter' || u.user_metadata?.role === 'waiter'
  );
  
  console.log(`\n📋 Found ${waiters.length} waiters:`);
  waiters.forEach(w => {
    console.log(`  - ${w.email} (${w.user_metadata?.full_name || 'N/A'})`);
  });

  // Show admin
  const admins = users.users.filter(u => 
    u.app_metadata?.role === 'admin' || u.user_metadata?.role === 'admin'
  );
  
  console.log(`\n👨‍💼 Found ${admins.length} admins:`);
  admins.forEach(a => {
    console.log(`  - ${a.email}`);
  });
}

testServiceRoleDirect().catch(console.error);
