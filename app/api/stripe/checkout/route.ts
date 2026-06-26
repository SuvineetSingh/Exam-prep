import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { COURSE_PRICES_CENTS } from '@/lib/utils/constants';

const VALID_COURSES = ['CMA', 'CFA', 'FE'] as const;
type CourseName = typeof VALID_COURSES[number];

const COURSE_LABELS: Record<CourseName, string> = {
  CMA: 'CMA (Certified Management Accountant)',
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

    let requestedCourses: CourseName[];
    try {
      const body = await request.json();
      const raw: unknown[] = Array.isArray(body.courses) ? body.courses : [];
      requestedCourses = raw.filter((c): c is CourseName => VALID_COURSES.includes(c as CourseName));
      if (requestedCourses.length === 0) {
        return NextResponse.json({ error: 'No valid courses provided' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Drop any course the user already owns rather than failing the whole request
    const { data: existingSubs } = await supabase
      .from('course_subscriptions')
      .select('course')
      .eq('user_id', user.id)
      .in('course', requestedCourses);

    const alreadyOwned = new Set((existingSubs ?? []).map((s) => s.course));
    const courses = requestedCourses.filter((c) => !alreadyOwned.has(c));

    if (courses.length === 0) {
      return NextResponse.json({ error: 'Already subscribed to all selected courses' }, { status: 400 });
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
      line_items: courses.map((course) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${course} Pro Access`,
            description: `Unlimited access to all ${COURSE_LABELS[course]} exam questions`,
          },
          unit_amount: COURSE_PRICES_CENTS[course] ?? 4900,
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `${baseUrl}/courses?success=true&session_id={CHECKOUT_SESSION_ID}&courses=${courses.join(',')}`,
      cancel_url: `${baseUrl}/checkout`,
      metadata: { supabase_user_id: user.id, courses: courses.join(',') },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
