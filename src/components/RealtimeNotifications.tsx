import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Bell, CheckCircle, Clock, Package, AlertCircle } from 'lucide-react';

interface RealtimeNotificationsProps {
  enabled?: boolean;
  soundEnabled?: boolean;
  showToasts?: boolean;
}

export function RealtimeNotifications({
  enabled = true,
  soundEnabled = true,
  showToasts = true
}: RealtimeNotificationsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!enabled || !soundEnabled) return;

    // Create audio element for notifications
    audioRef.current = new Audio('/notif.mp3');
    audioRef.current.volume = 0.7;

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, [enabled, soundEnabled]);

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const showOrderNotification = (
    title: string,
    description: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info',
    icon?: React.ReactNode
  ) => {
    if (!showToasts) return;

    const toastOptions = {
      duration: 5000,
      icon,
    };

    switch (type) {
      case 'success':
        toast.success(title, { ...toastOptions, description });
        break;
      case 'warning':
        toast.warning(title, { ...toastOptions, description });
        break;
      case 'error':
        toast.error(title, { ...toastOptions, description });
        break;
      default:
        toast.info(title, { ...toastOptions, description });
    }

    playNotificationSound();
  };

  // Export notification functions for use by parent components
  useEffect(() => {
    // Attach notification functions to window for global access
    (window as any).realtimeNotifications = {
      showOrderNotification,
      playNotificationSound,
    };

    return () => {
      delete (window as any).realtimeNotifications;
    };
  }, [showToasts, soundEnabled]);

  return null; // This component doesn't render anything
}

// Utility functions for common notification types
export const notificationUtils = {
  newOrder: (orderNumber: number, customerName: string) => {
    const notification = (window as any).realtimeNotifications;
    if (notification) {
      notification.playNotificationSound();
      notification.showOrderNotification(
        'Novo Pedido',
        `Pedido #${orderNumber} - ${customerName}`,
        'info',
        <Bell className="h-4 w-4" />
      );
    }
  },

  paymentConfirmed: (orderNumber: number, customerName: string) => {
    const notification = (window as any).realtimeNotifications;
    if (notification) {
      notification.playNotificationSound();
      notification.showOrderNotification(
        'Pagamento Confirmado',
        `Pedido #${orderNumber} - ${customerName}`,
        'success',
        <CheckCircle className="h-4 w-4" />
      );
    }
  },

  orderInPreparation: (orderNumber: number, customerName: string) => {
    const notification = (window as any).realtimeNotifications;
    if (notification) {
      notification.showOrderNotification(
        'Pedido em Preparo',
        `Pedido #${orderNumber} - ${customerName}`,
        'info',
        <Clock className="h-4 w-4" />
      );
    }
  },

  orderReady: (orderNumber: number, customerName: string) => {
    const notification = (window as any).realtimeNotifications;
    if (notification) {
      notification.playNotificationSound();
      notification.showOrderNotification(
        'Pedido Pronto',
        `Pedido #${orderNumber} - ${customerName}`,
        'success',
        <Package className="h-4 w-4" />
      );
    }
  },

  orderCompleted: (orderNumber: number, customerName: string) => {
    const notification = (window as any).realtimeNotifications;
    if (notification) {
      notification.showOrderNotification(
        'Pedido Concluído',
        `Pedido #${orderNumber} - ${customerName}`,
        'success',
        <CheckCircle className="h-4 w-4" />
      );
    }
  },

  connectionLost: () => {
    const notification = (window as any).realtimeNotifications;
    if (notification) {
      notification.showOrderNotification(
        'Conexão Perdida',
        'Tentando reconectar...',
        'warning',
        <AlertCircle className="h-4 w-4" />
      );
    }
  },

  connectionRestored: () => {
    const notification = (window as any).realtimeNotifications;
    if (notification) {
      notification.showOrderNotification(
        'Conexão Restaurada',
        'Sistema online novamente',
        'success',
        <CheckCircle className="h-4 w-4" />
      );
    }
  },
};
