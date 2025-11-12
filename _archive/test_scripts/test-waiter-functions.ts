// Test script to debug waiter management functions
import { supabase } from "./src/integrations/supabase/client";

async function testWaiterFunctions() {
  console.log("=== Testing Waiter Management Functions ===\n");

  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error("❌ No active session:", sessionError);
    return;
  }

  console.log("✅ Session found:");
  console.log("  User ID:", session.user.id);
  console.log("  Email:", session.user.email);
  console.log("  User Metadata:", session.user.user_metadata);
  console.log("  App Metadata:", session.user.app_metadata);
  console.log("\n");

  // Test list-waiters function
  console.log("📋 Testing list-waiters function...");
  try {
    const { data, error } = await supabase.functions.invoke('list-waiters', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (error) {
      console.error("❌ list-waiters error:", error);
      console.error("   Error message:", error.message);
      console.error("   Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("✅ list-waiters success:");
      console.log("   Waiters found:", data?.waiters?.length || 0);
      console.log("   Data:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
  
  console.log("\n");

  // Test create-waiter function
  console.log("➕ Testing create-waiter function...");
  const testWaiter = {
    email: `test-waiter-${Date.now()}@example.com`,
    password: "test123456",
    full_name: "Test Waiter"
  };
  
  try {
    const { data, error } = await supabase.functions.invoke('create-waiter', {
      body: testWaiter,
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (error) {
      console.error("❌ create-waiter error:", error);
      console.error("   Error message:", error.message);
      console.error("   Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("✅ create-waiter success:");
      console.log("   Data:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

// Run the test
testWaiterFunctions().catch(console.error);
