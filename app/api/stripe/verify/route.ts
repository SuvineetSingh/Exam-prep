import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
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

  const courses = session.metadata?.courses?.split(',').filter(Boolean) ?? [];
  const serviceClient = createServiceClient();

  if (courses.length > 0) {
    // Check which courses the webhook already inserted
    const { data: existingSubs } = await serviceClient
      .from('course_subscriptions')
      .select('course')
      .eq('user_id', user.id)
      .in('course', courses);

    const alreadyInserted = new Set((existingSubs ?? []).map((s) => s.course));
    const missing = courses.filter((c) => !alreadyInserted.has(c));

    if (missing.length > 0) {
      // Webhook missed these — insert now
      const { error: subError } = await serviceClient
        .from('course_subscriptions')
        .upsert(
          missing.map((course) => ({ user_id: user.id, course, stripe_session_id: session.id })),
          { onConflict: 'user_id,course', ignoreDuplicates: true }
        );

      if (subError) {
        console.error('Verify fallback: course_subscriptions insert failed', subError);
        return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
      }
    }
  }

  // Ensure is_premium flag is set
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_premium')
    .eq('id', user.id)
    .single();

  if (!profile?.is_premium) {
    const { error } = await serviceClient
      .from('user_profiles')
      .update({
        is_premium: true,
        premium_purchased_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Verify fallback: profile update failed', error);
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ upgraded: true, courses });
}
