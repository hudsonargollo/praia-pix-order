// Custom hook for payment status polling with real-time fallback
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentPollingService } from '@/integrations/mercadopago/polling';
import { usePaymentUpdates } from '@/hooks/useRealtimeOrders';
import { toast } from 'sonner';

interface UsePaymentPollingProps {
  paymentId: string | null;
  orderId: string | null;
  isActive: boolean;
  onStatusChange?: (status: string) => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
}

export function usePaymentPolling({
  paymentId,
  orderId,
  isActive,
  onStatusChange,
  onSuccess,
  onError,
  onTimeout
}: UsePaymentPollingProps) {
  const navigate = useNavigate();

  const handleSuccess = useCallback(() => {
    toast.success('Pagamento aprovado! Redirecionando...');
    onSuccess?.();
    
    // Default behavior: redirect to order status
    if (orderId) {
      setTimeout(() => {
        navigate(`/order-status/${orderId}`);
      }, 2000);
    }
  }, [onSuccess, orderId, navigate]);

  // Real-time payment confirmation handler
  const handleRealtimePaymentConfirmed = useCallback((order: any) => {
    if (order.id === orderId) {
      console.log('Payment confirmed via real-time subscription:', order);
      handleSuccess();
      // Stop polling since payment was confirmed
      if (paymentId) {
        paymentPollingService.stopPolling(paymentId);
      }
    }
  }, [orderId, handleSuccess, paymentId]);

  const handleError = useCallback((error: Error) => {
    console.error('Payment error:', error);
    toast.error('Erro no pagamento. Tente novamente.');
    onError?.(error);
  }, [onError]);

  const handleTimeout = useCallback(() => {
    toast.error('Pagamento expirado. Gere um novo pagamento.');
    onTimeout?.();
  }, [onTimeout]);

  const handleStatusChange = useCallback((status: string) => {
    console.log('Payment status changed:', status);
    onStatusChange?.(status);
  }, [onStatusChange]);

  // Set up real-time payment updates as a fallback
  usePaymentUpdates({
    onPaymentConfirmed: handleRealtimePaymentConfirmed,
    enabled: isActive && !!orderId
  });

  useEffect(() => {
    if (!paymentId || !orderId || !isActive) {
      return;
    }

    // Start polling
    paymentPollingService.startPolling({
      paymentId,
      orderId,
      onStatusChange: handleStatusChange,
      onSuccess: handleSuccess,
      onError: handleError,
      onTimeout: handleTimeout
    });

    // Cleanup on unmount or when dependencies change
    return () => {
      paymentPollingService.stopPolling(paymentId);
    };
  }, [paymentId, orderId, isActive, handleStatusChange, handleSuccess, handleError, handleTimeout]);

  // Provide control functions
  const stopPolling = useCallback(() => {
    if (paymentId) {
      paymentPollingService.stopPolling(paymentId);
    }
  }, [paymentId]);

  const isPolling = useCallback(() => {
    return paymentId ? paymentPollingService.isPolling(paymentId) : false;
  }, [paymentId]);

  return {
    stopPolling,
    isPolling
  };
}