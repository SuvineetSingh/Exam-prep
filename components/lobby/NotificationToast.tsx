import { X } from 'lucide-react';
import type { NotificationToast } from '@/lib/types/lobby';

interface NotificationToastProps {
  toast: NotificationToast;
  index: number;
  onClose: (id: string) => void;
  onClick?: (toast: NotificationToast) => void;
}

export function NotificationToast({ toast, index, onClose, onClick }: NotificationToastProps) {
  return (
    <div
      style={{ top: `${index * 80}px` }}
      className="bg-white border border-neutral-200 rounded-lg shadow-xl p-4 w-80
                 animate-slide-in cursor-pointer hover:shadow-2xl transition-all
                 flex items-start gap-3"
      onClick={() => onClick?.(toast)}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-neutral-200 flex-shrink-0 overflow-hidden">
        {toast.senderAvatar ? (
          <img
            src={toast.senderAvatar}
            alt={toast.senderName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500 font-bold">
            {toast.senderName[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-neutral-900 text-sm">{toast.senderName}</span>
          {toast.type === 'room' && toast.roomName && (
            <span className="text-xs text-neutral-500">in {toast.roomName}</span>
          )}
        </div>
        <p className="text-neutral-600 text-sm truncate">{toast.message}</p>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose(toast.id);
        }}
        className="text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
