import { Check, AlertCircle } from 'lucide-react';
import type { Notification as NotificationType } from '@/types/modul';

interface NotificationProps {
  notification: NotificationType | null;
}

export const NotificationToast = ({ notification }: NotificationProps) => {
  if (!notification) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-lg border-2 border-foreground shadow-brutal font-bold flex items-center gap-3 animate-slide-in-from-top ${
        notification.type === 'error'
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-success text-success-foreground'
      }`}
    >
      {notification.type === 'error' ? (
        <AlertCircle className="w-6 h-6" />
      ) : (
        <Check className="w-6 h-6" />
      )}
      {notification.message}
    </div>
  );
};
