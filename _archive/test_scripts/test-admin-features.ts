/**
 * Test script for admin features
 * Run with: npx tsx test-admin-features.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminFeatures() {
  console.log('🧪 Testing Admin Features\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Check session
    console.log('\n📋 Test 1: Check Session');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('⚠️  No active session. Please login first.');
      console.log('   Run this script after logging in through the app.');
      return;
    }
    
    console.log('✅ Session active');
    console.log(`   User: ${session.user.email}`);
    console.log(`   Role: ${session.user.user_metadata?.role || session.user.app_metadata?.role || 'unknown'}`);

    // Test 2: List Waiters Edge Function
    console.log('\n📋 Test 2: List Waiters Edge Function');
    try {
      const { data, error } = await supabase.functions.invoke('list-waiters', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.log('❌ Edge Function error:', error.message);
        console.log('   Status:', error.status);
        console.log('   This might be why waiters aren\'t loading');
      } else {
        console.log('✅ Edge Function working');
        console.log(`   Found ${data?.waiters?.length || 0} waiters`);
      }
    } catch (err: any) {
      console.log('❌ Exception:', err.message);
    }

    // Test 3: Read Menu Items
    console.log('\n📋 Test 3: Read Menu Items');
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .limit(5);

      if (error) {
        console.log('❌ Error reading menu items:', error.message);
      } else {
        console.log('✅ Can read menu items');
        console.log(`   Found ${data?.length || 0} items`);
      }
    } catch (err: any) {
      console.log('❌ Exception:', err.message);
    }

    // Test 4: Update Menu Item (if we have one)
    console.log('\n📋 Test 4: Update Menu Item Permission');
    try {
      const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, price')
        .limit(1)
        .single();

      if (items) {
        // Try to update (but revert immediately)
        const originalPrice = items.price;
        const testPrice = originalPrice + 0.01;

        const { error: updateError } = await supabase
          .from('menu_items')
          .update({ price: testPrice })
          .eq('id', items.id);

        if (updateError) {
          console.log('❌ Cannot update menu items:', updateError.message);
          console.log('   This is why product edit might not work');
        } else {
          // Revert the change
          await supabase
            .from('menu_items')
            .update({ price: originalPrice })
            .eq('id', items.id);
          
          console.log('✅ Can update menu items');
        }
      } else {
        console.log('⚠️  No menu items to test with');
      }
    } catch (err: any) {
      console.log('❌ Exception:', err.message);
    }

    // Test 5: Read Orders
    console.log('\n📋 Test 5: Read Orders');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .limit(5);

      if (error) {
        console.log('❌ Error reading orders:', error.message);
      } else {
        console.log('✅ Can read orders');
        console.log(`   Found ${data?.length || 0} orders`);
      }
    } catch (err: any) {
      console.log('❌ Exception:', err.message);
    }

    // Test 6: Update Order (if we have one)
    console.log('\n📋 Test 6: Update Order Permission');
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status')
        .limit(1)
        .single();

      if (orders) {
        const originalStatus = orders.status;

        // Try to update status (but revert immediately)
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: originalStatus }) // Same value, just testing permission
          .eq('id', orders.id);

        if (updateError) {
          console.log('❌ Cannot update orders:', updateError.message);
          console.log('   This is why order edit might not work');
        } else {
          console.log('✅ Can update orders');
        }
      } else {
        console.log('⚠️  No orders to test with');
      }
    } catch (err: any) {
      console.log('❌ Exception:', err.message);
    }

    // Test 7: Read Order Items
    console.log('\n📋 Test 7: Read Order Items');
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .limit(5);

      if (error) {
        console.log('❌ Error reading order items:', error.message);
      } else {
        console.log('✅ Can read order items');
        console.log(`   Found ${data?.length || 0} items`);
      }
    } catch (err: any) {
      console.log('❌ Exception:', err.message);
    }

    // Test 8: Update Order Item (if we have one)
    console.log('\n📋 Test 8: Update Order Item Permission');
    try {
      const { data: items } = await supabase
        .from('order_items')
        .select('id, quantity')
        .limit(1)
        .single();

      if (items) {
        const originalQty = items.quantity;

        // Try to update (but revert immediately)
        const { error: updateError } = await supabase
          .from('order_items')
          .update({ quantity: originalQty }) // Same value, just testing permission
          .eq('id', items.id);

        if (updateError) {
          console.log('❌ Cannot update order items:', updateError.message);
          console.log('   This is why order edit might not work');
        } else {
          console.log('✅ Can update order items');
        }
      } else {
        console.log('⚠️  No order items to test with');
      }
    } catch (err: any) {
      console.log('❌ Exception:', err.message);
    }

  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Complete\n');
}

testAdminFeatures().catch(console.error);
