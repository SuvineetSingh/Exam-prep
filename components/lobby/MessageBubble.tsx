'use client';

import type { LobbyMessage } from '@/lib/types/lobby';

interface MessageBubbleProps {
  message: LobbyMessage;
  isOwnMessage: boolean;
  onClickUser?: (userId: string) => void;
}

export function MessageBubble({ message, isOwnMessage, onClickUser }: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const initial = message.sender?.username?.[0]?.toUpperCase() || '?';

  return (
    <div className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <button
        onClick={() => onClickUser?.(message.sender_id)}
        className="w-8 h-8 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold hover:opacity-80 transition-opacity"
      >
        {initial}
      </button>

      {/* Bubble */}
      <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Username + bot badge */}
        <div className={`flex items-center gap-1.5 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
          <button
            onClick={() => onClickUser?.(message.sender_id)}
            className="text-xs font-semibold text-gray-700 hover:text-primary-600 transition-colors"
          >
            {message.sender?.username || 'Unknown'}
          </button>
          {message.sender?.is_bot && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none">
              bot
            </span>
          )}
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>

        {/* Message content */}
        <div
          className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
            isOwnMessage
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
