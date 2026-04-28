import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const VALID_COURSES = ['CPA', 'CFA', 'FE'] as const;
type CourseName = typeof VALID_COURSES[number];

const COURSE_LABELS: Record<CourseName, string> = {
  CPA: 'CPA (Certified Public Accountant)',
  CFA: 'CFA (Chartered Financial Analyst)',
  FE: 'FE (Fundamentals of Engineering)',
};

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let course: CourseName;
    try {
      const body = await request.json();
      if (!VALID_COURSES.includes(body.course)) {
        return NextResponse.json({ error: 'Invalid course' }, { status: 400 });
      }
      course = body.course as CourseName;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Check if user already has this course
    const { data: existingSub } = await supabase
      .from('course_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('course', course)
      .maybeSingle();

    if (existingSub) {
      return NextResponse.json({ error: 'Already subscribed to this course' }, { status: 400 });
    }

    // Create or retrieve Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

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
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${course} Pro Access`,
              description: `Unlimited access to all ${COURSE_LABELS[course]} exam questions`,
            },
            unit_amount: 5000, // $50.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/courses?success=true&session_id={CHECKOUT_SESSION_ID}&course=${course}`,
      cancel_url: `${baseUrl}/courses`,
      metadata: { supabase_user_id: user.id, course },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
