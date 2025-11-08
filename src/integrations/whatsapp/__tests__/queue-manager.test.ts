import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationQueueManager } from '../queue-manager';

describe('NotificationQueueManager', () => {
  let manager: NotificationQueueManager;

  beforeEach(() => {
    manager = new NotificationQueueManager();
  });

  describe('Queue Management', () => {
    it('should create queue manager instance', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(NotificationQueueManager);
    });

    it('should have startAutoProcessing method', () => {
      expect(typeof manager.startAutoProcessing).toBe('function');
    });

    it('should have stopAutoProcessing method', () => {
      expect(typeof manager.stopAutoProcessing).toBe('function');
    });

    it('should have processPendingNotifications method', () => {
      expect(typeof manager.processPendingNotifications).toBe('function');
    });

    it('should have retryFailedNotifications method', () => {
      expect(typeof manager.retryFailedNotifications).toBe('function');
    });

    it('should have getQueueStats method', () => {
      expect(typeof manager.getQueueStats).toBe('function');
    });

    it('should have enqueue method', () => {
      expect(typeof manager.enqueue).toBe('function');
    });

    it('should have cancelNotification method', () => {
      expect(typeof manager.cancelNotification).toBe('function');
    });

    it('should have getOrderNotifications method', () => {
      expect(typeof manager.getOrderNotifications).toBe('function');
    });
  });

  describe('Auto Processing', () => {
    it('should start and stop auto processing without errors', () => {
      expect(() => {
        manager.startAutoProcessing();
        manager.stopAutoProcessing();
      }).not.toThrow();
    });

    it('should not throw when stopping without starting', () => {
      expect(() => {
        manager.stopAutoProcessing();
      }).not.toThrow();
    });
  });

  describe('Queue Stats', () => {
    it('should return queue stats structure', async () => {
      const stats = await manager.getQueueStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.pending).toBe('number');
      expect(typeof stats.sent).toBe('number');
      expect(typeof stats.failed).toBe('number');
      expect(typeof stats.totalToday).toBe('number');
      expect(typeof stats.deliveryRate).toBe('number');
    });

    it('should return valid delivery rate', async () => {
      const stats = await manager.getQueueStats();
      
      expect(stats.deliveryRate).toBeGreaterThanOrEqual(0);
      expect(stats.deliveryRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Notification Processing', () => {
    it('should return empty array when no notifications pending', async () => {
      const results = await manager.processPendingNotifications();
      
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle retry failed notifications gracefully', async () => {
      await expect(manager.retryFailedNotifications()).resolves.not.toThrow();
    });
  });

  describe('Order Notifications', () => {
    it('should return array for order notifications', async () => {
      const notifications = await manager.getOrderNotifications('test-order-id');
      
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should handle non-existent order gracefully', async () => {
      const notifications = await manager.getOrderNotifications('non-existent-order');
      
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications).toHaveLength(0);
    });
  });
});
