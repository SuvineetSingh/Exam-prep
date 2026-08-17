'use client';

import { useEffect, useState } from 'react';
import { getAttachmentSignedUrl } from '@/lib/supabase/queries/roomQueries';
import type { LobbyMessage } from '@/lib/types/lobby';

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageAttachment({ message }: { message: LobbyMessage }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!message.attachment_path) return;
    let cancelled = false;
    getAttachmentSignedUrl(message.attachment_path)
      .then((signedUrl) => { if (!cancelled) setUrl(signedUrl); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [message.attachment_path]);

  if (!message.attachment_path) return null;

  if (!url) {
    return <p className="mt-1.5 text-xs text-neutral-400">Loading attachment…</p>;
  }

  if (message.attachment_type === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={message.attachment_name || 'attachment'}
        className="mt-1.5 max-w-[240px] max-h-[240px] rounded-lg object-cover"
      />
    );
  }

  if (message.attachment_type === 'video') {
    return <video src={url} controls className="mt-1.5 max-w-[280px] rounded-lg" />;
  }

  if (message.attachment_type === 'audio') {
    return <audio src={url} controls className="mt-1.5 max-w-[240px]" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 border border-neutral-200 hover:bg-white transition-colors max-w-[240px]"
    >
      <svg className="w-5 h-5 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-neutral-700 truncate">{message.attachment_name}</span>
        <span className="block text-[10px] text-neutral-400">{formatSize(message.attachment_size)}</span>
      </span>
    </a>
  );
}
