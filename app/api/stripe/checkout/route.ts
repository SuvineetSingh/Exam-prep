import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if already premium
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_premium, stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (profile?.is_premium) {
    return NextResponse.json({ error: 'Already premium' }, { status: 400 });
  }

  // Create or retrieve Stripe customer
  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from('user_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: customerId ? undefined : user.email,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Full Access Pass',
            description: 'Unlimited access to all CPA, CFA, and FE exam questions',
          },
          unit_amount: 5000, // $50.00
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${baseUrl}/courses?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/courses`,
    metadata: { supabase_user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
