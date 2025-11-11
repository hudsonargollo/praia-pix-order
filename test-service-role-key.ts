import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testServiceRole() {
  console.log('🧪 Testing Service Role Key Availability\n');

  const { data, error } = await supabase.functions.invoke('test-service-role');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Result:', data);
}

testServiceRole().catch(console.error);
