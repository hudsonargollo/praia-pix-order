import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bell, MessageSquare, AlertCircle, CheckCircle, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { notificationTriggers } from '@/integrations/whatsapp';
import { whatsappClient } from '@/integrations/whatsapp/client';
import type { NotificationHistory } from '@/hooks/useNotificationHistory';

interface NotificationControlsProps {
  orderId: string;
  orderNumber: number;
  customerPhone: string;
  customerName: string;
  orderStatus: string;
  notificationHistory?: NotificationHistory;
  onNotificationSent?: () => void;
}

export function NotificationControls({
  orderId,
  orderNumber,
  customerPhone,
  customerName,
  orderStatus,
  notificationHistory,
  onNotificationSent,
}: NotificationControlsProps) {
  const [customMessage, setCustomMessage] = useState('');
  const [sendingCustom, setSendingCustom] = useState(false);
  const [sendingReady, setSendingReady] = useState(false);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);

  const lastNotification = notificationHistory?.lastNotification;
  const hasFailedNotifications = notificationHistory?.hasFailedNotifications || false;

  const handleSendReadyNotification = async () => {
    setSendingReady(true);
    try {
      await notificationTriggers.onOrderReady(orderId);
      toast.success('Notificação de pedido pronto enviada!');
      onNotificationSent?.();
    } catch (error) {
      console.error('Error sending ready notification:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setSendingReady(false);
    }
  };

  const handleSendCustomMessage = async () => {
    if (!customMessage.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    setSendingCustom(true);
    try {
      await whatsappClient.sendTextMessage(customerPhone, customMessage);
      toast.success('Mensagem personalizada enviada!');
      setCustomMessage('');
      setIsCustomDialogOpen(false);
      onNotificationSent?.();
    } catch (error) {
      console.error('Error sending custom message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingCustom(false);
    }
  };

  const getNotificationStatusBadge = () => {
    if (!lastNotification) {
      return (
        <Badge variant="outline" className="text-xs">
          <Clock className="mr-1 h-3 w-3" />
          Nenhuma notificação
        </Badge>
      );
    }

    if (lastNotification.status === 'sent') {
      return (
        <Badge variant="default" className="text-xs bg-green-500">
          <CheckCircle className="mr-1 h-3 w-3" />
          Enviada
        </Badge>
      );
    }

    if (lastNotification.status === 'failed') {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="mr-1 h-3 w-3" />
          Falhou
        </Badge>
      );
    }

    if (lastNotification.status === 'pending') {
      return (
        <Badge variant="secondary" className="text-xs">
          <Clock className="mr-1 h-3 w-3" />
          Pendente
        </Badge>
      );
    }

    return null;
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-2">
      {/* Notification Status */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Status da Notificação:</span>
        {getNotificationStatusBadge()}
      </div>

      {lastNotification && (
        <div className="text-xs text-muted-foreground space-y-1">
          {lastNotification.sent_at && (
            <p>Última enviada: {formatTimestamp(lastNotification.sent_at)}</p>
          )}
          {lastNotification.notification_type && (
            <p>Tipo: {lastNotification.notification_type}</p>
          )}
          {lastNotification.attempts > 1 && (
            <p>Tentativas: {lastNotification.attempts}</p>
          )}
          {lastNotification.error_message && (
            <p className="text-destructive">Erro: {lastNotification.error_message}</p>
          )}
        </div>
      )}

      {hasFailedNotifications && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span>Notificações falharam - requer atenção</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant={orderStatus === 'ready' ? 'default' : 'outline'}
          onClick={handleSendReadyNotification}
          disabled={sendingReady}
          className="flex-1"
        >
          <Bell className="mr-1 h-3 w-3" />
          {sendingReady ? 'Enviando...' : 'Notificar Pronto'}
        </Button>

        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <MessageSquare className="mr-1 h-3 w-3" />
              Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Mensagem Personalizada</DialogTitle>
              <DialogDescription>
                Envie uma mensagem WhatsApp personalizada para {customerName} ({customerPhone})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="custom-message">Mensagem</Label>
                <Textarea
                  id="custom-message"
                  placeholder="Digite sua mensagem aqui..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={5}
                  maxLength={4096}
                />
                <p className="text-xs text-muted-foreground">
                  {customMessage.length}/4096 caracteres
                </p>
              </div>
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium mb-1">Pré-visualização:</p>
                <p className="whitespace-pre-wrap">{customMessage || 'Sua mensagem aparecerá aqui...'}</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCustomDialogOpen(false)}
                disabled={sendingCustom}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendCustomMessage}
                disabled={sendingCustom || !customMessage.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                {sendingCustom ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
