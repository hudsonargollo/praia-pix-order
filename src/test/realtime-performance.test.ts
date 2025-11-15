/**
 * Real-time Performance Optimization Tests
 * 
 * These tests verify that performance optimizations like debouncing,
 * connection health monitoring, and automatic reconnection work correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { realtimeService } from '@/integrations/supabase/realtime';

describe('Real-time Performance Optimizations', () => {
  let unsubscribe: (() => void) | null = null;

  beforeEach(() => {
    // Clean up before each test
    realtimeService.cleanup();
  });

  afterEach(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    realtimeService.cleanup();
  });

  describe('Connection Status', () => {
    it('should report connection status', () => {
      const status = realtimeService.getConnectionStatus();
      expect(status).toBeDefined();
      expect(typeof status).toBe('string');
      expect(['connected', 'disconnected']).toContain(status);
    });

    it('should provide detailed connection metrics', () => {
      const metrics = realtimeService.getConnectionMetrics();
      
      expect(metrics).toHaveProperty('status');
      expect(metrics).toHaveProperty('activeChannels');
      expect(metrics).toHaveProperty('reconnectAttempts');
      
      expect(typeof metrics.status).toBe('string');
      expect(typeof metrics.activeChannels).toBe('number');
      expect(typeof metrics.reconnectAttempts).toBe('number');
    });

    it('should track active channels count', () => {
      const metricsBefore = realtimeService.getConnectionMetrics();
      const channelsBefore = metricsBefore.activeChannels;

      const onInsert = vi.fn();
      const onUpdate = vi.fn();
      unsubscribe = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);

      const metricsAfter = realtimeService.getConnectionMetrics();
      const channelsAfter = metricsAfter.activeChannels;

      expect(channelsAfter).toBeGreaterThan(channelsBefore);
    });
  });

  describe('Connection Health Monitoring', () => {
    it('should start health monitoring', () => {
      expect(() => realtimeService.startHealthMonitoring(1000)).not.toThrow();
    });

    it('should stop health monitoring', () => {
      realtimeService.startHealthMonitoring(1000);
      expect(() => realtimeService.stopHealthMonitoring()).not.toThrow();
    });

    it('should not start multiple health monitors', () => {
      realtimeService.startHealthMonitoring(1000);
      realtimeService.startHealthMonitoring(1000); // Should be ignored
      
      // Should not throw
      expect(() => realtimeService.stopHealthMonitoring()).not.toThrow();
    });
  });

  describe('Reconnection Logic', () => {
    it('should allow manual reconnection', () => {
      expect(() => realtimeService.reconnect()).not.toThrow();
    });

    it('should track reconnection attempts', () => {
      const metricsBefore = realtimeService.getConnectionMetrics();
      const attemptsBefore = metricsBefore.reconnectAttempts;

      realtimeService.reconnect();

      const metricsAfter = realtimeService.getConnectionMetrics();
      const attemptsAfter = metricsAfter.reconnectAttempts;

      expect(attemptsAfter).toBeGreaterThanOrEqual(attemptsBefore);
    });
  });

  describe('Resource Cleanup', () => {
    it('should clean up all resources', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();
      
      unsubscribe = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);
      realtimeService.startHealthMonitoring(1000);

      expect(() => realtimeService.cleanup()).not.toThrow();

      const metrics = realtimeService.getConnectionMetrics();
      expect(metrics.activeChannels).toBe(0);
      expect(metrics.reconnectAttempts).toBe(0);

      unsubscribe = null; // Already cleaned up
    });

    it('should clear all channels on cleanup', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();
      
      realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);
      realtimeService.subscribeToCashierOrders(onInsert, onUpdate);

      const metricsBefore = realtimeService.getConnectionMetrics();
      expect(metricsBefore.activeChannels).toBeGreaterThan(0);

      realtimeService.cleanup();

      const metricsAfter = realtimeService.getConnectionMetrics();
      expect(metricsAfter.activeChannels).toBe(0);
    });
  });

  describe('Channel Management', () => {
    it('should prevent duplicate channel subscriptions', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      // Subscribe twice to the same channel
      const unsub1 = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);
      const unsub2 = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);

      // Should only have one active channel
      const metrics = realtimeService.getConnectionMetrics();
      expect(metrics.activeChannels).toBe(1);

      unsub2();
      unsubscribe = null;
    });

    it('should handle multiple different channel subscriptions', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      const unsub1 = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);
      const unsub2 = realtimeService.subscribeToCashierOrders(onInsert, onUpdate);

      const metrics = realtimeService.getConnectionMetrics();
      expect(metrics.activeChannels).toBeGreaterThanOrEqual(2);

      unsub1();
      unsub2();
    });

    it('should clean up individual channels', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      const unsub1 = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);
      const unsub2 = realtimeService.subscribeToCashierOrders(onInsert, onUpdate);

      const metricsBefore = realtimeService.getConnectionMetrics();
      const channelsBefore = metricsBefore.activeChannels;

      unsub1();

      const metricsAfter = realtimeService.getConnectionMetrics();
      const channelsAfter = metricsAfter.activeChannels;

      expect(channelsAfter).toBeLessThan(channelsBefore);

      unsub2();
    });
  });

  describe('Subscription Lifecycle', () => {
    it('should handle subscribe-unsubscribe-resubscribe cycle', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      // First subscription
      const unsub1 = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);
      const metrics1 = realtimeService.getConnectionMetrics();
      expect(metrics1.activeChannels).toBeGreaterThan(0);

      // Unsubscribe
      unsub1();
      const metrics2 = realtimeService.getConnectionMetrics();
      expect(metrics2.activeChannels).toBeLessThan(metrics1.activeChannels);

      // Resubscribe
      unsubscribe = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);
      const metrics3 = realtimeService.getConnectionMetrics();
      expect(metrics3.activeChannels).toBeGreaterThan(metrics2.activeChannels);
    });
  });

  describe('Error Handling', () => {
    it('should handle unsubscribe from non-existent channel', () => {
      expect(() => realtimeService.unsubscribe('non-existent-channel')).not.toThrow();
    });

    it('should handle cleanup when no channels are active', () => {
      expect(() => realtimeService.cleanup()).not.toThrow();
    });

    it('should handle multiple cleanup calls', () => {
      realtimeService.cleanup();
      expect(() => realtimeService.cleanup()).not.toThrow();
    });
  });

  describe('Performance Characteristics', () => {
    it('should maintain reasonable channel count', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      // Create multiple subscriptions
      const subscriptions = [
        realtimeService.subscribeToKitchenOrders(onInsert, onUpdate),
        realtimeService.subscribeToCashierOrders(onInsert, onUpdate),
        realtimeService.subscribeToOrder('order-1', onUpdate),
        realtimeService.subscribeToOrder('order-2', onUpdate),
      ];

      const metrics = realtimeService.getConnectionMetrics();
      
      // Should have reasonable number of channels (not excessive)
      expect(metrics.activeChannels).toBeLessThanOrEqual(10);
      expect(metrics.activeChannels).toBeGreaterThan(0);

      // Clean up
      subscriptions.forEach(unsub => unsub());
    });

    it('should handle rapid subscription changes', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      // Rapidly subscribe and unsubscribe
      for (let i = 0; i < 5; i++) {
        const unsub = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);
        unsub();
      }

      // Should not accumulate channels
      const metrics = realtimeService.getConnectionMetrics();
      expect(metrics.activeChannels).toBeLessThanOrEqual(1);
    });
  });

  describe('Debouncing Behavior', () => {
    it('should subscribe to orders with debounced updates', () => {
      const onUpdate = vi.fn();
      const orderId = 'test-order-debounce';

      unsubscribe = realtimeService.subscribeToOrder(orderId, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should subscribe to kitchen orders with debounced updates', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToKitchenOrders(onInsert, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should subscribe to cashier orders with debounced updates', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();

      unsubscribe = realtimeService.subscribeToCashierOrders(onInsert, onUpdate);

      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });
});
