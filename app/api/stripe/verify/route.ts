import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  // Verify the requesting user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Retrieve session from Stripe
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }

  // Validate this session belongs to this user
  if (
    session.metadata?.supabase_user_id !== user.id ||
    session.payment_status !== 'paid'
  ) {
    return NextResponse.json({ upgraded: false });
  }

  // Check if already upgraded (webhook may have already handled it)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_premium')
    .eq('id', user.id)
    .single();

  if (profile?.is_premium) {
    return NextResponse.json({ upgraded: true });
  }

  // Webhook missed it — upgrade now
  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from('user_profiles')
    .update({
      is_premium: true,
      premium_purchased_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Verify fallback: DB update failed', error);
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
  }

  return NextResponse.json({ upgraded: true });
}
