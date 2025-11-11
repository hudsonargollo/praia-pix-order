import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sntxekdwdllwkszclpiq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudHhla2R3ZGxsd2tzemNscGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDQ1ODksImV4cCI6MjA3Nzc4MDU4OX0.aPQeASkYkf7jl3Sl-1GFHH7B8VU-pOtn5sYJKMs9u8I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEdgeFunctions() {
  console.log('🔐 Testing Edge Functions Deployment\n');

  // First, we need to sign in as an admin user
  console.log('Step 1: Authenticating as admin...');
  
  // Default admin credentials - update these if needed
  const email = process.argv[2] || 'admin@cocoloko.com.br';
  const password = process.argv[3] || 'admin123';

  console.log(`   Using email: ${email}`);
  console.log(`   (To use different credentials: npx tsx test-edge-functions.ts <email> <password>)\n`);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.session) {
    console.error('❌ Authentication failed:', authError?.message);
    process.exit(1);
  }

  console.log('✅ Authenticated successfully');
  console.log(`   User ID: ${authData.user.id}`);
  console.log(`   Email: ${authData.user.email}\n`);

  const session = authData.session;

  // Test 1: List Waiters
  console.log('Test 1: Testing list-waiters function...');
  try {
    const { data: listData, error: listError } = await supabase.functions.invoke('list-waiters', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (listError) {
      console.error('❌ list-waiters failed:', listError);
    } else {
      console.log('✅ list-waiters succeeded');
      console.log(`   Found ${listData.waiters?.length || 0} waiters`);
      if (listData.waiters && listData.waiters.length > 0) {
        console.log('   Sample waiter:', listData.waiters[0]);
      }
    }
  } catch (error) {
    console.error('❌ list-waiters exception:', error);
  }
  console.log('');

  // Test 2: Create Waiter
  console.log('Test 2: Testing create-waiter function...');
  const testWaiterEmail = `test-waiter-${Date.now()}@example.com`;
  let createdWaiterId: string | null = null;

  try {
    const { data: createData, error: createError } = await supabase.functions.invoke('create-waiter', {
      body: {
        email: testWaiterEmail,
        password: 'TestPassword123!',
        full_name: 'Test Waiter',
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (createError) {
      console.error('❌ create-waiter failed:', createError);
    } else {
      console.log('✅ create-waiter succeeded');
      console.log(`   Created waiter ID: ${createData.userId}`);
      console.log(`   Email: ${testWaiterEmail}`);
      createdWaiterId = createData.userId;
    }
  } catch (error) {
    console.error('❌ create-waiter exception:', error);
  }
  console.log('');

  // Test 3: Delete Waiter (if we created one)
  if (createdWaiterId) {
    console.log('Test 3: Testing delete-waiter function...');
    try {
      const { data: deleteData, error: deleteError } = await supabase.functions.invoke('delete-waiter', {
        body: {
          waiterId: createdWaiterId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (deleteError) {
        console.error('❌ delete-waiter failed:', deleteError);
      } else {
        console.log('✅ delete-waiter succeeded');
        console.log(`   Deleted waiter ID: ${deleteData.userId}`);
      }
    } catch (error) {
      console.error('❌ delete-waiter exception:', error);
    }
    console.log('');
  }

  // Test 4: Test with invalid inputs
  console.log('Test 4: Testing error handling with invalid inputs...');
  try {
    const { data: invalidData, error: invalidError } = await supabase.functions.invoke('create-waiter', {
      body: {
        email: 'invalid-email',
        password: '123',
        full_name: '',
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (invalidError) {
      console.log('✅ Correctly rejected invalid input');
      console.log(`   Error: ${invalidError.message}`);
    } else {
      console.log('⚠️  Warning: Invalid input was accepted (should have been rejected)');
    }
  } catch (error) {
    console.log('✅ Correctly rejected invalid input with exception');
  }
  console.log('');

  // Test 5: Test without authentication
  console.log('Test 5: Testing authentication requirement...');
  await supabase.auth.signOut();
  
  try {
    const { data: unauthData, error: unauthError } = await supabase.functions.invoke('list-waiters', {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    if (unauthError) {
      console.log('✅ Correctly rejected unauthenticated request');
      console.log(`   Error: ${unauthError.message}`);
    } else {
      console.log('⚠️  Warning: Unauthenticated request was accepted (security issue!)');
    }
  } catch (error) {
    console.log('✅ Correctly rejected unauthenticated request with exception');
  }
  console.log('');

  console.log('🎉 Edge Function testing complete!');
}

testEdgeFunctions().catch(console.error);
