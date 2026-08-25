'use client';

import { useState, useRef } from 'react';
import { LOBBY_CONFIG } from '@/lib/utils/lobbyConstants';
import { AttachmentButton } from './AttachmentButton';

interface MessageInputProps {
  onSend: (content: string) => Promise<boolean>;
  placeholder?: string;
  disabled?: boolean;
  /** Only set for room chat (not DMs) — shows the attachment button. */
  attachmentRoomId?: string;
  currentUserId?: string;
}

export function MessageInput({ onSend, placeholder = 'Type a message...', disabled, attachmentRoomId, currentUserId }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [sendError, setSendError] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled || sending) return;

    setSending(true);
    setSendError(false);
    const ok = await onSend(trimmed);
    setSending(false);

    if (ok) {
      setValue('');
    } else {
      setSendError(true);
      setTimeout(() => setSendError(false), 3000);
    }

    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 p-4 border-t border-neutral-200 bg-white">
      <div className="flex items-center gap-2">
        {attachmentRoomId && currentUserId && (
          <AttachmentButton roomId={attachmentRoomId} senderId={currentUserId} disabled={disabled} />
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value.slice(0, LOBBY_CONFIG.MAX_MESSAGE_LENGTH)); setSendError(false); }}
          placeholder={placeholder}
          disabled={disabled || sending}
          className={`flex-1 px-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            sendError ? 'border-red-400 bg-red-50' : 'border-neutral-300'
          }`}
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!value.trim() || disabled || sending}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-brand-green text-white rounded-full hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
          </svg>
        </button>
      </div>
      {sendError && (
        <p className="text-xs text-red-500 px-2">Failed to send. Please try again.</p>
      )}
    </form>
  );
}
