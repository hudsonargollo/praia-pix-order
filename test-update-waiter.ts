import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdateWaiter() {
  console.log('🔵 Testing update-waiter function...\n');

  // First, get an admin session
  console.log('Step 1: Getting admin session...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error('❌ No active session. Please login first.');
    console.log('   Run: npm run dev');
    console.log('   Then login as admin at http://localhost:8080/auth');
    return;
  }

  console.log('✅ Session found for user:', session.user.email);

  // Get list of waiters first
  console.log('\nStep 2: Fetching waiters...');
  const { data: waitersData, error: listError } = await supabase.functions.invoke('list-waiters', {
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  if (listError || !waitersData?.waiters?.length) {
    console.error('❌ No waiters found. Create a waiter first.');
    return;
  }

  const testWaiter = waitersData.waiters[0];
  console.log('✅ Found waiter to test:', testWaiter.full_name, `(${testWaiter.email})`);

  // Test update without password
  console.log('\nStep 3: Testing update without password change...');
  const { data: updateData1, error: updateError1 } = await supabase.functions.invoke('update-waiter', {
    body: { 
      waiterId: testWaiter.id,
      email: testWaiter.email,
      full_name: testWaiter.full_name + ' (Updated)'
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  if (updateError1) {
    console.log('❌ Update failed:', updateError1);
  } else {
    console.log('✅ Update successful:', updateData1);
  }

  // Revert the change
  console.log('\nStep 4: Reverting changes...');
  const { data: updateData2, error: updateError2 } = await supabase.functions.invoke('update-waiter', {
    body: { 
      waiterId: testWaiter.id,
      email: testWaiter.email,
      full_name: testWaiter.full_name
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  if (updateError2) {
    console.log('❌ Revert failed:', updateError2);
  } else {
    console.log('✅ Reverted successfully');
  }

  console.log('\n🔵 Test complete!');
}

testUpdateWaiter().catch(console.error);
