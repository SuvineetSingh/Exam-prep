import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function usePurchasedCourses(userId: string | undefined) {
  const [purchasedCourses, setPurchasedCourses] = useState<string[]>([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from('course_subscriptions')
      .select('course')
      .eq('user_id', userId)
      .then(({ data }) => {
        setPurchasedCourses((data ?? []).map((r) => r.course as string));
        setCoursesLoaded(true);
      });
  }, [userId]);

  return { purchasedCourses, coursesLoaded };
}
