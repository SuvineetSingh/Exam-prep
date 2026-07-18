'use client';

import { useState, useRef } from 'react';
import { LOBBY_CONFIG } from '@/lib/utils/lobbyConstants';

interface MessageInputProps {
  onSend: (content: string) => Promise<boolean>;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({ onSend, placeholder = 'Type a message...', disabled }: MessageInputProps) {
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
          disabled={!value.trim() || disabled || sending}
          className="px-4 py-2.5 bg-brand-green text-white rounded-full text-sm font-medium hover:bg-brand-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
      {sendError && (
        <p className="text-xs text-red-500 px-2">Failed to send. Please try again.</p>
      )}
    </form>
  );
}
