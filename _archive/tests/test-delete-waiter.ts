import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeleteWaiter() {
  console.log('🔵 Testing delete-waiter function...\n');

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
  console.log('   Token length:', session.access_token.length);

  // Test with a fake UUID to see the error handling
  const fakeWaiterId = '00000000-0000-0000-0000-000000000000';
  
  console.log('\nStep 2: Testing delete-waiter with fake UUID...');
  console.log('   Waiter ID:', fakeWaiterId);

  const { data, error } = await supabase.functions.invoke('delete-waiter', {
    body: { waiterId: fakeWaiterId },
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  if (error) {
    console.log('\n❌ Function returned error (expected for fake UUID):');
    console.log('   Error:', error);
  } else {
    console.log('\n✅ Function response:');
    console.log('   Data:', data);
  }

  console.log('\n🔵 Test complete!');
}

testDeleteWaiter().catch(console.error);
