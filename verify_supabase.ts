import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function verify() {
  console.log('--- Supabase Connectivity Audit ---');
  console.log('URL Source:', process.env.SUPABASE_URL ? 'SUPABASE_URL' : (process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : 'MISSING'));
  console.log('Key Source:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SUPABASE_SERVICE_ROLE_KEY' : (process.env.SUPABASE_KEY ? 'SUPABASE_KEY' : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : 'MISSING')));

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ ERROR: Missing Supabase credentials.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const tables = [
    'profiles',
    'developer_profiles',
    'recruiter_profiles',
    'projects',
    'applications',
    'invites',
    'chats',
    'messages',
    'notifications',
    'disputes',
    'escrow_transactions',
    'reviews',
    'admin_logs'
  ];

  console.log('\nChecking Tables:');
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table.padEnd(20)}: Error (${error.code}) - ${error.message}`);
    } else {
      console.log(`✅ ${table.padEnd(20)}: Exists`);
    }
  }

  // Check disputes schema
  console.log('\nChecking Specific Columns:');
  const { data: disputeCols, error: disputeErr } = await supabase.from('disputes').select('verdict_rationale, split_ratio').limit(1);
  if (disputeErr) {
    console.log(`❌ disputes: Missing specific columns or table error - ${disputeErr.message}`);
  } else {
    console.log(`✅ disputes: Required columns exist`);
  }
}

verify().catch(console.error);
