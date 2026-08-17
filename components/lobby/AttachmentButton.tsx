'use client';

import { useRef, useState } from 'react';
import { uploadRoomAttachment, sendRoomAttachment } from '@/lib/supabase/queries/roomQueries';

const MAX_SIZE = 25 * 1024 * 1024;
const ACCEPTED = 'image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';

interface AttachmentButtonProps {
  roomId: string;
  senderId: string;
  disabled?: boolean;
}

export function AttachmentButton({ roomId, senderId, disabled }: AttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setError('File must be under 25MB');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const attachment = await uploadRoomAttachment(roomId, file);
      await sendRoomAttachment(roomId, senderId, attachment);
    } catch (err) {
      console.error('Attachment upload failed:', err);
      setError('Upload failed — please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        title="Attach a file"
        className="p-2.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        )}
      </button>
      <input ref={inputRef} type="file" accept={ACCEPTED} onChange={handleChange} className="hidden" />
      {error && (
        <p className="absolute bottom-full mb-1 left-0 text-[11px] text-red-500 whitespace-nowrap bg-white px-2 py-1 rounded shadow-card">
          {error}
        </p>
      )}
    </div>
  );
}
