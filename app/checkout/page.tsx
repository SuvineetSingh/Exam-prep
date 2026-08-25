import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { CheckoutClient } from '@/components/subscription/CheckoutClient';
import { COURSE_CATALOG } from '@/lib/utils/constants';
import type { CourseName } from '@/lib/types';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: subsData } = await supabase
    .from('course_subscriptions')
    .select('course')
    .eq('user_id', user.id);

  const purchasedCourses: CourseName[] = (subsData ?? []).map((row) => row.course as CourseName);

  return (
    <AppShell user={user}>
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-1">Checkout</h1>
        <p className="text-neutral-500 text-sm">Review your order before paying.</p>
      </div>

      <CheckoutClient courses={COURSE_CATALOG} purchasedCourses={purchasedCourses} />
    </AppShell>
  );
}
