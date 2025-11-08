import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notificationUtils } from './RealtimeNotifications';

interface ConnectionMonitorProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export function ConnectionMonitor({ onConnectionChange }: ConnectionMonitorProps) {
  const [isConnected, setIsConnected] = useState(true);
  const previousConnectionState = useRef(true);

  useEffect(() => {
    const handleConnectionChange = (connected: boolean) => {
      // Only trigger notifications and callbacks on actual state changes
      if (connected !== previousConnectionState.current) {
        setIsConnected(connected);
        onConnectionChange?.(connected);
        
        if (connected) {
          notificationUtils.connectionRestored();
        } else {
          notificationUtils.connectionLost();
        }
        
        previousConnectionState.current = connected;
      }
    };

    // Simple connection monitoring using channel subscription status
    let testChannel: any = null;
    
    const monitorConnection = () => {
      // Create a test channel to monitor connection
      testChannel = supabase
        .channel('connection-test')
        .subscribe((status) => {
          console.log('Connection status:', status);
          const connected = status === 'SUBSCRIBED';
          handleConnectionChange(connected);
        });
    };

    monitorConnection();

    return () => {
      if (testChannel) {
        supabase.removeChannel(testChannel);
      }
    };
  }, [onConnectionChange]);

  // This component doesn't render anything visible
  return null;
}

// Hook version for easier use in components
export function useConnectionMonitor() {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');

  useEffect(() => {
    let testChannel: any = null;
    
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    };

    // Monitor connection using a test channel
    const monitorConnection = () => {
      testChannel = supabase
        .channel('connection-monitor')
        .subscribe((status) => {
          console.log('Connection monitor status:', status);
          const connected = status === 'SUBSCRIBED';
          handleConnectionChange(connected);
        });
    };

    monitorConnection();

    return () => {
      if (testChannel) {
        supabase.removeChannel(testChannel);
      }
    };
  }, []);

  const reconnect = () => {
    setConnectionStatus('connecting');
    
    // Simple reconnection approach
    setTimeout(() => {
      // Force a page reload as a simple reconnection method
      window.location.reload();
    }, 1000);
  };

  return {
    isConnected,
    connectionStatus,
    reconnect
  };
}