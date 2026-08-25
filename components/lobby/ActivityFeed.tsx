'use client';

import { useRef } from 'react';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { formatEventText } from '@/lib/activity/feed';
import { countryFlag } from '@/lib/utils/countries';
import { OnlineDot } from './OnlineDot';

interface ActivityFeedProps {
  currentUserId: string;
  onClickUser: (userId: string, position?: { top: number; left: number }) => void;
  onMessageUser?: (userId: string, position?: { top: number; left: number }) => void;
  onlineUserIds?: Set<string>;
}

const PROFILE_CARD_WIDTH = 256;
const PROFILE_CARD_GAP = 8;

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ActivityFeed({ currentUserId, onClickUser, onMessageUser, onlineUserIds }: ActivityFeedProps) {
  const { events, loading, loadingMore, nextCursor, loadMore } = useActivityFeed(currentUserId);
  const scrollRef = useRef<HTMLDivElement>(null);
  useInfiniteScroll(scrollRef, loadMore, !!nextCursor, loadingMore);

  const cardPositionFor = (row: HTMLElement) => {
    const rect = row.getBoundingClientRect();
    return { top: rect.top, left: rect.left - PROFILE_CARD_WIDTH - PROFILE_CARD_GAP };
  };

  return (
    <div className="h-full flex flex-col border-t border-neutral-200">
      <h3 className="flex-shrink-0 px-4 pt-3 pb-2 text-xs font-bold text-neutral-900 uppercase tracking-wider">
        Recent Activity
      </h3>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-neutral-400 px-3 py-4 text-center">
          Be the first to start studying today
        </p>
      ) : (
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-0.5">
          {events.map((event) => {
            const isCurrentUser = event.user_id === currentUserId;
            const initial = event.user.username[0]?.toUpperCase() || '?';
            const flag = countryFlag(event.user.country_code);

            return (
              <div
                key={event.id}
                data-feed-row
                role="button"
                tabIndex={isCurrentUser ? -1 : 0}
                onClick={(e) => {
                  if (isCurrentUser) return;
                  if (window.innerWidth < 768) {
                    onClickUser(event.user_id);
                    return;
                  }
                  onClickUser(event.user_id, cardPositionFor(e.currentTarget));
                }}
                className={`group w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                  isCurrentUser ? 'cursor-default' : 'cursor-pointer hover:bg-neutral-100'
                }`}
              >
                <div className="relative flex-shrink-0">
                  {event.user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote Supabase avatars aren't in next.config images.domains; plain <img> matches NotificationToast
                    <img
                      src={event.user.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center text-white text-xs font-semibold">
                      {initial}
                    </div>
                  )}
                  <OnlineDot show={onlineUserIds?.has(event.user_id) ?? false} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-neutral-700 leading-snug">
                    <span className="font-semibold text-neutral-900">
                      {event.user.username}
                      {isCurrentUser && <span className="text-neutral-400 font-normal"> (you)</span>}
                    </span>
                    {flag && <span className="ml-1">{flag}</span>}{' '}
                    {formatEventText(event)}
                  </p>
                  <span className="text-[10px] text-neutral-400">
                    {formatRelativeTime(event.created_at)}
                  </span>
                </div>

                {/* No Message shortcut for bots — friends-only DMs and bots can't accept requests */}
                {!isCurrentUser && !event.user.is_bot && onMessageUser && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const row = e.currentTarget.closest('[data-feed-row]') as HTMLElement;
                      onMessageUser(
                        event.user_id,
                        window.innerWidth < 768 ? undefined : cardPositionFor(row)
                      );
                    }}
                    title={`Message ${event.user.username}`}
                    aria-label={`Message ${event.user.username}`}
                    className="flex-shrink-0 p-1.5 rounded-lg text-neutral-300 hover:text-brand-green hover:bg-green-50 transition-colors md:opacity-0 md:group-hover:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
          {loadingMore && (
            <div className="flex justify-center py-3">
              <div className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
