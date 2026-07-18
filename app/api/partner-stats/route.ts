import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { computeStatsFromAnswers } from '@/lib/supabase/queries/userStats';

/**
 * GET /api/partner-stats?userId=<uuid>
 *
 * Stats for the shared study-partner view. exam_sessions/user_answers RLS is
 * owner-only, so a partner's stats can't be read client-side; this route
 * verifies the caller has an ACTIVE study partnership with the target (or is
 * the target) and then reads via the service client.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const targetId = request.nextUrl.searchParams.get('userId');
  if (!targetId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  if (targetId !== user.id) {
    // The server client runs under the caller's RLS, which only exposes the
    // caller's own friendship rows — so this lookup doubles as authorization.
    const { data: partnership } = await supabase
      .from('friendships')
      .select('id, partner_status')
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),` +
        `and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`
      )
      .maybeSingle();
    if (partnership?.partner_status !== 'active') {
      return NextResponse.json({ error: 'Not an active study partner' }, { status: 403 });
    }
  }

  const service = createServiceClient();
  const [{ data: answers, error: aErr }, { data: sessions, error: sErr }] = await Promise.all([
    service
      .from('user_answers')
      .select('is_correct, mode, created_at')
      .eq('user_id', targetId),
    service
      .from('exam_sessions')
      .select('id, exam_type, mode, percentage, total_questions, created_at')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);
  if (aErr || sErr) {
    console.error('partner-stats query failed:', aErr?.message ?? sErr?.message);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }

  return NextResponse.json({
    stats: computeStatsFromAnswers(answers ?? []),
    recentSessions: sessions ?? [],
  });
}
