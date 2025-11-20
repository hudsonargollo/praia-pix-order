import { useState, useEffect, useRef } from 'react';
import { useOrderChat, UnifiedMessage } from '@/hooks/useOrderChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OrderChatPanelProps {
  orderId: string;
  customerPhone: string;
}

/**
 * OrderChatPanel - Displays a WhatsApp-style chat interface for order communication
 * 
 * Features:
 * - Unified timeline of system notifications and chat messages
 * - Visual distinction between message types
 * - Real-time message updates
 * - Audio notifications for incoming messages
 * - Message status indicators
 * - Auto-scroll to bottom
 */
export function OrderChatPanel({ orderId, customerPhone }: OrderChatPanelProps) {
  const { messages, loading, error, sendMessage, hasUnreadMessages } = useOrderChat(orderId, customerPhone);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousMessageCountRef = useRef(0);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /**
   * Play audio notification for new inbound messages
   */
  useEffect(() => {
    // Skip on initial load
    if (previousMessageCountRef.current === 0) {
      previousMessageCountRef.current = messages.length;
      return;
    }

    // Check if there's a new inbound message
    if (messages.length > previousMessageCountRef.current) {
      const newMessages = messages.slice(previousMessageCountRef.current);
      const hasNewInbound = newMessages.some(
        msg => msg.type === 'chat' && msg.direction === 'inbound'
      );

      if (hasNewInbound) {
        playNotificationSound();
      }
    }

    previousMessageCountRef.current = messages.length;
  }, [messages]);

  /**
   * Initialize audio element
   */
  useEffect(() => {
    // Create a simple notification sound using Web Audio API
    // This is a fallback since we don't have an audio file yet
    audioRef.current = new Audio();
    
    // You can replace this with an actual audio file path later
    // audioRef.current.src = '/notification.mp3';
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /**
   * Play notification sound
   */
  const playNotificationSound = () => {
    try {
      // Simple beep using Web Audio API as fallback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  };

  /**
   * Handle message submission
   */
  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending) {
      return;
    }

    try {
      setSending(true);
      await sendMessage(messageInput);
      setMessageInput('');
      toast.success('Mensagem enviada!');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Render a single message
   */
  const renderMessage = (message: UnifiedMessage) => {
    // System notification (centered, gray, italicized)
    if (message.type === 'system') {
      return (
        <div key={message.id} className="flex justify-center my-3">
          <div className="bg-gray-100 text-gray-600 text-sm italic px-4 py-2 rounded-full max-w-[80%] text-center">
            {message.content}
          </div>
        </div>
      );
    }

    // Chat message (left for inbound, right for outbound)
    const isInbound = message.direction === 'inbound';
    
    return (
      <div
        key={message.id}
        className={cn(
          'flex mb-3',
          isInbound ? 'justify-start' : 'justify-end'
        )}
      >
        <div
          className={cn(
            'max-w-[75%] rounded-2xl px-4 py-2 shadow-sm',
            isInbound
              ? 'bg-white text-gray-900 rounded-tl-none'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          <div
            className={cn(
              'flex items-center gap-2 mt-1 text-xs',
              isInbound ? 'text-gray-500' : 'text-purple-100'
            )}
          >
            <span>
              {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {!isInbound && message.status && (
              <span className="flex items-center gap-1">
                {message.status === 'pending' && '⏳'}
                {message.status === 'sent' && '✓'}
                {message.status === 'delivered' && '✓✓'}
                {message.status === 'read' && '✓✓'}
                {message.status === 'failed' && '❌'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-white rounded-xl border-2 border-purple-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 rounded-t-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          💬 Conversa com Cliente
          {hasUnreadMessages && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Novo
            </span>
          )}
        </h3>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm">Carregando mensagens...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">Erro ao carregar mensagens</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm text-center">
              Nenhuma mensagem ainda.
              <br />
              Envie uma mensagem para iniciar a conversa!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t-2 border-purple-100 p-4 bg-white rounded-b-xl">
        <div className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={sending}
            className="flex-1 border-2 border-purple-200 focus:border-purple-400 rounded-full px-4"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sending}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-full px-6"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
