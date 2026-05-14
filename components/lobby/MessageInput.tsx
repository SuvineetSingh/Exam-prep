'use client';

import { useState, useRef, useEffect } from 'react';
import { LOBBY_CONFIG } from '@/lib/utils/lobbyConstants';

interface MessageInputProps {
  onSend: (content: string) => Promise<boolean>;
  placeholder?: string;
  disabled?: boolean;
}

const EMOJI_GROUPS = [
  { label: 'Smileys', emojis: ['😀','😂','🥲','😊','😍','🤩','😎','🤔','😅','🙃','🥳','😤','😭','😱','🤯','🥸','🤓','😇','🫡','🙏'] },
  { label: 'Gestures', emojis: ['👍','👎','👏','🤝','✌️','🤞','💪','🫶','❤️','🔥','⭐','✅','❌','💯','🎉','🚀','💡','📚','📝','⏰'] },
  { label: 'Study', emojis: ['📖','📊','📈','📉','🖊️','🗂️','💼','🏆','🎓','📐','🔬','⚙️','💻','🧠','💬','📣','🗣️','👀','💰','🤑'] },
];

export function MessageInput({ onSend, placeholder = 'Type a message...', disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [sendError, setSendError] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmoji) return;
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showEmoji]);

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) {
      setValue(v => (v + emoji).slice(0, LOBBY_CONFIG.MAX_MESSAGE_LENGTH));
      return;
    }
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const next = (value.slice(0, start) + emoji + value.slice(end)).slice(0, LOBBY_CONFIG.MAX_MESSAGE_LENGTH);
    setValue(next);
    // Restore cursor after React re-render
    setTimeout(() => {
      input.focus();
      const pos = start + emoji.length;
      input.setSelectionRange(pos, pos);
    }, 0);
  };

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 p-4 border-t border-gray-200 bg-white relative">
      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div
          ref={emojiRef}
          className="absolute bottom-full left-4 mb-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50"
        >
          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            {EMOJI_GROUPS.map((g, i) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setEmojiTab(i)}
                className={`flex-1 py-2 text-[11px] font-semibold transition-colors ${
                  emojiTab === i ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-10 gap-0.5 p-2">
            {EMOJI_GROUPS[emojiTab]?.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { insertEmoji(emoji); setShowEmoji(false); }}
                className="w-7 h-7 flex items-center justify-center text-lg rounded hover:bg-gray-100 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Emoji toggle button */}
        <button
          type="button"
          onClick={() => setShowEmoji(v => !v)}
          disabled={disabled}
          title="Insert emoji"
          className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-lg transition-colors disabled:opacity-40 ${
            showEmoji ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'
          }`}
        >
          😊
        </button>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value.slice(0, LOBBY_CONFIG.MAX_MESSAGE_LENGTH)); setSendError(false); }}
          placeholder={placeholder}
          disabled={disabled || sending}
          className={`flex-1 px-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            sendError ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled || sending}
          className="px-4 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? '…' : 'Send'}
        </button>
      </div>
      {sendError && (
        <p className="text-xs text-red-500 px-2">Failed to send. Please try again.</p>
      )}
    </form>
  );
}
