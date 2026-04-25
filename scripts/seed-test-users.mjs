/**
 * Seed 5 test users for lobby smoke testing.
 * Run: node scripts/seed-test-users.mjs
 *
 * Uses the service role key — bypasses RLS so it can create auth users
 * and their profiles in one go.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dfqrdxreerytobsqvzbi.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXJkeHJlZXJ5dG9ic3F2emJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk1NDAwMCwiZXhwIjoyMDg0NTMwMDAwfQ.ath-lJK0QeRSWZXo-gWUfERXngqy9F3XoEXpTZ7CMXY';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  {
    email: 'alice.test@examprep.dev',
    password: 'TestPass123!',
    username: 'alice_cpa',
    full_name: 'Alice Chen',
    exam_type: 'CPA',
    industry: 'Finance',
    bio: 'CPA candidate, 3rd attempt. Let\'s go.',
    is_premium: true,   // Pro
  },
  {
    email: 'bob.test@examprep.dev',
    password: 'TestPass123!',
    username: 'bob_cfa',
    full_name: 'Bob Patel',
    exam_type: 'CFA',
    industry: 'Investment Banking',
    bio: 'Level II CFA. Grinding every day.',
    is_premium: false,  // Basic
  },
  {
    email: 'carol.test@examprep.dev',
    password: 'TestPass123!',
    username: 'carol_fe',
    full_name: 'Carol Nguyen',
    exam_type: 'FE',
    industry: 'Engineering',
    bio: 'Civil engineer prepping for FE exam.',
    is_premium: true,   // Pro
  },
  {
    email: 'david.test@examprep.dev',
    password: 'TestPass123!',
    username: 'david_cpa2',
    full_name: 'David Kim',
    exam_type: 'CPA',
    industry: 'Accounting',
    bio: 'Big 4 staff accountant, CPA or bust.',
    is_premium: false,  // Basic
  },
  {
    email: 'eva.test@examprep.dev',
    password: 'TestPass123!',
    username: 'eva_cfa2',
    full_name: 'Eva Martinez',
    exam_type: 'CFA',
    industry: 'Asset Management',
    bio: 'Level I CFA. Study group welcome!',
    is_premium: true,   // Pro
  },
];

async function seedUsers() {
  console.log('🌱 Seeding test users...\n');

  for (const user of TEST_USERS) {
    const plan = user.is_premium ? '🥇 Pro' : '⬜ Basic';
    process.stdout.write(`  Creating ${user.username} (${plan})... `);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,   // skip email verification
      user_metadata: { username: user.username, full_name: user.full_name },
    });

    let userId;

    if (authError) {
      if (authError.message.includes('already been registered')) {
        // Look up existing user via Auth REST API
        const res = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=100`,
          { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } }
        );
        const body = await res.json();
        const existing = body?.users?.find(u => u.email === user.email);
        if (!existing) { console.error('user not found after conflict'); continue; }
        userId = existing.id;
        process.stdout.write('(auth exists) ');
      } else {
        console.error(`FAILED — ${authError.message}`);
        continue;
      }
    } else {
      userId = authData.user.id;
    }

    // 2. Upsert user_profile (without is_premium — requires migration 003)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        username: user.username,
        full_name: user.full_name,
        exam_type: user.exam_type,
        industry: user.industry,
        bio: user.bio,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`auth ok but profile failed — ${profileError.message}`);
      continue;
    }

    console.log('done ✓');
  }

  console.log('\n✅ Seeding complete.\n');
  console.log('Test credentials (all passwords: TestPass123!):');
  console.log('─'.repeat(52));
  for (const u of TEST_USERS) {
    const badge = u.is_premium ? 'Pro  ' : 'Basic';
    console.log(`  [${badge}]  ${u.email}`);
  }
  console.log('─'.repeat(52));
}

seedUsers().catch(console.error);
