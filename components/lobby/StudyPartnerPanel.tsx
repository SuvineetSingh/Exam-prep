'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  fetchPartnership,
  inviteStudyPartner,
  respondToPartnerInvite,
  fetchStudySessions,
  proposeStudySession,
  updateStudySessionStatus,
  type PartnershipRow,
  type StudySession,
} from '@/lib/supabase/queries/partnerQueries';
import { logActivityEvent } from '@/lib/supabase/queries/activityQueries';
import type { UserStats } from '@/lib/types';

interface StudyPartnerPanelProps {
  currentUserId: string;
  partnerId: string;
  partnerUsername: string;
  /**
   * Bumped by LobbyView whenever a friendships row of mine changes. The panel
   * must not subscribe to friendships itself: a second postgres_changes
   * binding on the same table+event from this socket collides with
   * LobbyView's and one of them silently receives nothing.
   */
  friendshipsVersion?: number;
}

interface PartnerStatsResponse {
  stats: UserStats;
  recentSessions: { id: string; exam_type: string; mode: string; percentage: number; created_at: string }[];
}

function StatBlock({ label, stats }: { label: string; stats: UserStats | null }) {
  return (
    <div className="flex-1 min-w-0 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
      <p className="text-[11px] font-bold text-neutral-500 truncate mb-1">{label}</p>
      {stats ? (
        <div className="flex items-center gap-3 text-xs text-neutral-700">
          <span title="Study streak">🔥 {stats.study_streak}d</span>
          <span title="Accuracy">🎯 {stats.accuracy_rate}%</span>
          <span title="Questions answered">📝 {stats.total_answered}</span>
        </div>
      ) : (
        <p className="text-xs text-neutral-400">Loading…</p>
      )}
    </div>
  );
}

export function StudyPartnerPanel({
  currentUserId,
  partnerId,
  partnerUsername,
  friendshipsVersion = 0,
}: StudyPartnerPanelProps) {
  const [partnership, setPartnership] = useState<PartnershipRow | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [partnerStats, setPartnerStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [proposedAt, setProposedAt] = useState('');

  const reload = useCallback(() => {
    fetchPartnership(currentUserId, partnerId)
      .then(setPartnership)
      .catch(() => setPartnership(null))
      .finally(() => setLoaded(true));
  }, [currentUserId, partnerId]);

  useEffect(() => {
    setLoaded(false);
    setExpanded(false);
    reload();
  }, [reload]);

  // Refetch when LobbyView's friendships subscription reports a change
  // (invite sent/accepted/declined on the other end).
  useEffect(() => {
    if (friendshipsVersion > 0) reload();
  }, [friendshipsVersion, reload]);

  // Live-sync the session list (sole subscriber of study_sessions — no
  // binding overlap with other channels on this socket).
  useEffect(() => {
    if (!partnership?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`partnership:${partnership.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_sessions', filter: `friendship_id=eq.${partnership.id}` },
        () => {
          fetchStudySessions(partnership.id).then(setSessions).catch(() => {});
        }
      )
      .subscribe((status, err) => {
        // postgres_changes bindings fail silently without this; surface it
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Study partner realtime subscription failed:', status, err?.message);
        }
      });
    return () => {
      channel.unsubscribe();
    };
  }, [partnership?.id]);

  const isActive = partnership?.partner_status === 'active';

  // Load the shared view once the partnership is active and the panel opens
  useEffect(() => {
    if (!isActive || !expanded || !partnership) return;
    fetch(`/api/partner-stats?userId=${currentUserId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b: PartnerStatsResponse | null) => b && setMyStats(b.stats))
      .catch(() => {});
    fetch(`/api/partner-stats?userId=${partnerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b: PartnerStatsResponse | null) => b && setPartnerStats(b.stats))
      .catch(() => {});
    fetchStudySessions(partnership.id).then(setSessions).catch(() => {});
  }, [isActive, expanded, partnership, currentUserId, partnerId]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      reload();
    } catch (err) {
      console.warn('Study partner action failed:', err);
    } finally {
      setBusy(false);
    }
  };

  // Friendship not accepted (or still loading) — the DM gate means this
  // barely happens, but render nothing rather than a broken invite.
  if (!loaded || !partnership || partnership.status !== 'accepted') return null;

  // ── Invite / pending states ──
  if (!isActive) {
    if (partnership.partner_status === 'pending') {
      if (partnership.partner_invited_by === currentUserId) {
        return (
          <div className="px-4 py-2 border-b border-neutral-200 bg-green-50 text-xs text-neutral-600">
            🤝 Study partner invite sent — waiting for {partnerUsername} to accept
          </div>
        );
      }
      return (
        <div className="px-4 py-2.5 border-b border-neutral-200 bg-green-50 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-neutral-700 font-medium">
            🤝 <span className="font-bold">{partnerUsername}</span> invited you to be study partners
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => run(() => respondToPartnerInvite(partnership.id, true))}
              disabled={busy}
              className="text-xs font-bold px-3 py-1.5 bg-brand-green text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => run(() => respondToPartnerInvite(partnership.id, false))}
              disabled={busy}
              className="text-xs font-bold px-3 py-1.5 bg-white border border-neutral-300 text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 py-2 border-b border-neutral-200 bg-white">
        <button
          onClick={() => run(() => inviteStudyPartner(currentUserId, partnerId))}
          disabled={busy}
          className="text-xs font-bold text-brand-green hover:underline disabled:opacity-50"
        >
          🤝 Invite as study partner
        </button>
      </div>
    );
  }

  // ── Active partnership: shared view ──
  return (
    <div className="border-b border-neutral-200 bg-white">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-2 flex items-center justify-between text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
      >
        <span>🤝 Study Partners</span>
        <span className="text-neutral-400">{expanded ? 'Hide' : 'Show'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          <div className="flex gap-2">
            <StatBlock label="You" stats={myStats} />
            <StatBlock label={partnerUsername} stats={partnerStats} />
          </div>

          <div>
            <p className="text-[11px] font-bold text-neutral-500 mb-1.5">Study sessions</p>
            {sessions.length === 0 && (
              <p className="text-xs text-neutral-400 mb-2">Nothing scheduled yet.</p>
            )}
            <div className="space-y-1.5">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs"
                >
                  <span className="text-neutral-700 truncate">
                    {new Date(s.scheduled_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    <span
                      className={`ml-2 font-semibold ${
                        s.status === 'confirmed'
                          ? 'text-brand-green'
                          : s.status === 'done'
                            ? 'text-neutral-400'
                            : s.status === 'cancelled'
                              ? 'text-red-400 line-through'
                              : 'text-amber-600'
                      }`}
                    >
                      {s.status}
                    </span>
                  </span>
                  <span className="flex gap-1.5 flex-shrink-0">
                    {s.status === 'proposed' && s.proposed_by !== currentUserId && (
                      <button
                        onClick={() => run(() => updateStudySessionStatus(s.id, 'confirmed'))}
                        disabled={busy}
                        className="font-bold text-brand-green hover:underline disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    )}
                    {s.status === 'confirmed' && (
                      <button
                        onClick={() =>
                          run(async () => {
                            await updateStudySessionStatus(s.id, 'done');
                            await logActivityEvent(currentUserId, 'study_session_started', {
                              friendship_id: partnership.id,
                              session_id: s.id,
                              partner_id: partnerId,
                            });
                          })
                        }
                        disabled={busy}
                        className="font-bold text-brand-green hover:underline disabled:opacity-50"
                      >
                        Start
                      </button>
                    )}
                    {(s.status === 'proposed' || s.status === 'confirmed') && (
                      <button
                        onClick={() => run(() => updateStudySessionStatus(s.id, 'cancelled'))}
                        disabled={busy}
                        className="text-neutral-400 hover:text-red-500 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={proposedAt}
              onChange={(e) => setProposedAt(e.target.value)}
              disabled={busy}
              className="input flex-1 !py-1.5 text-xs"
              aria-label="Proposed session time"
            />
            <button
              onClick={() =>
                run(async () => {
                  if (!proposedAt) return;
                  await proposeStudySession(
                    partnership.id,
                    currentUserId,
                    new Date(proposedAt).toISOString()
                  );
                  setProposedAt('');
                })
              }
              disabled={busy || !proposedAt}
              className="text-xs font-bold px-3 py-1.5 bg-brand-green text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Propose
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
