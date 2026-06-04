'use client';

import { useEffect, useState } from 'react';
import type { XPToastEntry } from '@/hooks/useGamification';

interface XPToastProps {
  toasts: XPToastEntry[];
}

export function XPToast({ toasts }: XPToastProps) {
  return (
    <div className="fixed bottom-24 right-6 z-[300] flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: XPToastEntry }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-full font-extrabold text-sm shadow-lg transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <span className="text-brand-amber">⚡</span>
      <span>{toast.label}</span>
    </div>
  );
}
