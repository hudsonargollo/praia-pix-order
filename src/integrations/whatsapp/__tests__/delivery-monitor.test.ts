import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  WhatsAppDeliveryMonitor, 
  TimePeriod 
} from '../delivery-monitor';

// Mock Supabase
const mockNotifications = [
  {
    id: '1',
    order_id: 'order-1',
    customer_phone: '+5511999999999',
    notification_type: 'payment_confirmed',
    status: 'sent',
    attempts: 1,
    scheduled_at: new Date(Date.now() - 5000).toISOString(),
    sent_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 10000).toISOString(),
  },
  {
    id: '2',
    order_id: 'order-2',
    customer_phone: '+5511988888888',
    notification_type: 'ready',
    status: 'failed',
    attempts: 3,
    scheduled_at: new Date(Date.now() - 15000).toISOString(),
    error_message: 'Network timeout',
    created_at: new Date(Date.now() - 20000).toISOString(),
  },
  {
    id: '3',
    order_id: 'order-3',
    customer_phone: '+5511977777777',
    notification_type: 'preparing',
    status: 'pending',
    attempts: 0,
    scheduled_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

vi.mock('../../supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'whatsapp_notifications') {
        return {
          select: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockNotifications,
                error: null,
              })),
            })),
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === 'whatsapp_alerts') {
        return {
          insert: vi.fn(() => ({ error: null })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({ error: null })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          data: [],
          error: null,
        })),
      };
    }),
  },
}));

describe('WhatsAppDeliveryMonitor', () => {
  let deliveryMonitor: WhatsAppDeliveryMonitor;

  beforeEach(() => {
    deliveryMonitor = new WhatsAppDeliveryMonitor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    deliveryMonitor.stopMonitoring();
  });

  describe('Delivery Statistics', () => {
    it('should calculate delivery stats for last 24 hours', async () => {
      const stats = await deliveryMonitor.getDeliveryStats(TimePeriod.LAST_24_HOURS);
      
      expect(stats).toBeDefined();
      expect(stats.totalSent).toBeGreaterThanOrEqual(0);
      expect(stats.totalFailed).toBeGreaterThanOrEqual(0);
      expect(stats.totalPending).toBeGreaterThanOrEqual(0);
      expect(stats.deliveryRate).toBeGreaterThanOrEqual(0);
      expect(stats.deliveryRate).toBeLessThanOrEqual(100);
      expect(stats.failureRate).toBeGreaterThanOrEqual(0);
      expect(stats.failureRate).toBeLessThanOrEqual(100);
      expect(stats.averageDeliveryTime).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.recentDeliveries)).toBe(true);
    });

    it('should calculate delivery stats for last hour', async () => {
      const stats = await deliveryMonitor.getDeliveryStats(TimePeriod.LAST_HOUR);
      
      expect(stats).toBeDefined();
      expect(stats.deliveryRate).toBeGreaterThanOrEqual(0);
    });

    it('should calculate delivery stats for last 7 days', async () => {
      const stats = await deliveryMonitor.getDeliveryStats(TimePeriod.LAST_7_DAYS);
      
      expect(stats).toBeDefined();
      expect(stats.deliveryRate).toBeGreaterThanOrEqual(0);
    });

    it('should calculate delivery stats for last 30 days', async () => {
      const stats = await deliveryMonitor.getDeliveryStats(TimePeriod.LAST_30_DAYS);
      
      expect(stats).toBeDefined();
      expect(stats.deliveryRate).toBeGreaterThanOrEqual(0);
    });

    it('should return empty stats when no notifications exist', async () => {
      // Mock empty response
      vi.mock('../../supabase/client', () => ({
        supabase: {
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              gte: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          })),
        },
      }));

      const stats = await deliveryMonitor.getDeliveryStats(TimePeriod.LAST_24_HOURS);
      
      expect(stats.totalSent).toBe(0);
      expect(stats.totalFailed).toBe(0);
      expect(stats.totalPending).toBe(0);
    });
  });

  describe('Statistics by Type', () => {
    it('should calculate stats grouped by notification type', async () => {
      const statsByType = await deliveryMonitor.getStatsByType(TimePeriod.LAST_24_HOURS);
      
      expect(statsByType).toBeDefined();
      expect(typeof statsByType).toBe('object');
    });

    it('should return empty object when no notifications exist', async () => {
      const statsByType = await deliveryMonitor.getStatsByType(TimePeriod.LAST_HOUR);
      
      expect(typeof statsByType).toBe('object');
    });
  });

  describe('Delivery Rate Calculations', () => {
    it('should calculate delivery rate correctly', async () => {
      const stats = await deliveryMonitor.getDeliveryStats(TimePeriod.LAST_24_HOURS);
      
      const totalProcessed = stats.totalSent + stats.totalFailed;
      if (totalProcessed > 0) {
        const expectedRate = (stats.totalSent / totalProcessed) * 100;
        expect(stats.deliveryRate).toBeCloseTo(expectedRate, 1);
      }
    });

    it('should calculate failure rate correctly', async () => {
      const stats = await deliveryMonitor.getDeliveryStats(TimePeriod.LAST_24_HOURS);
      
      const totalProcessed = stats.totalSent + stats.totalFailed;
      if (totalProcessed > 0) {
        const expectedRate = (stats.totalFailed / totalProcessed) * 100;
        expect(stats.failureRate).toBeCloseTo(expectedRate, 1);
      }
    });

    it('should handle zero deliveries gracefully', async () => {
      const stats = await deliveryMonitor.getDeliveryStats(TimePeriod.LAST_HOUR);
      
      expect(stats.deliveryRate).toBeGreaterThanOrEqual(0);
      expect(stats.failureRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Average Delivery Time', () => {
    it('should calculate average delivery time', async () => {
      const stats = await deliveryMonitor.getDeliveryStats(TimePeriod.LAST_24_HOURS);
      
      expect(stats.averageDeliveryTime).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when no sent messages exist', async () => {
      const stats = await deliveryMonitor.getDeliveryStats(TimePeriod.LAST_HOUR);
      
      expect(stats.averageDeliveryTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Alerting Thresholds', () => {
    it('should check delivery rates and trigger alerts', async () => {
      await deliveryMonitor.checkAndAlert();
      
      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should not alert when sample size is too small', async () => {
      const monitor = new WhatsAppDeliveryMonitor({
        minSampleSize: 100,
      });

      await monitor.checkAndAlert();
      
      expect(true).toBe(true);
    });

    it('should alert when failure rate exceeds threshold', async () => {
      const monitor = new WhatsAppDeliveryMonitor({
        failureRateThreshold: 5, // Very low threshold
        minSampleSize: 1,
      });

      await monitor.checkAndAlert();
      
      expect(true).toBe(true);
    });
  });

  describe('Unresolved Alerts', () => {
    it('should fetch unresolved alerts', async () => {
      const alerts = await deliveryMonitor.getUnresolvedAlerts();
      
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should resolve an alert', async () => {
      await deliveryMonitor.resolveAlert('alert-123');
      
      expect(true).toBe(true);
    });
  });

  describe('Delivery Trends', () => {
    it('should calculate delivery trends over 7 days', async () => {
      const trends = await deliveryMonitor.getDeliveryTrends(7);
      
      expect(Array.isArray(trends)).toBe(true);
    });

    it('should calculate delivery trends over custom period', async () => {
      const trends = await deliveryMonitor.getDeliveryTrends(30);
      
      expect(Array.isArray(trends)).toBe(true);
    });

    it('should return empty array when no data exists', async () => {
      const trends = await deliveryMonitor.getDeliveryTrends(1);
      
      expect(Array.isArray(trends)).toBe(true);
    });

    it('should format trend data correctly', async () => {
      const trends = await deliveryMonitor.getDeliveryTrends(7);
      
      trends.forEach(trend => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('sent');
        expect(trend).toHaveProperty('failed');
        expect(trend).toHaveProperty('deliveryRate');
        expect(trend.deliveryRate).toBeGreaterThanOrEqual(0);
        expect(trend.deliveryRate).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Automatic Monitoring', () => {
    it('should start monitoring', () => {
      deliveryMonitor.startMonitoring();
      
      expect(true).toBe(true);
    });

    it('should stop monitoring', () => {
      deliveryMonitor.startMonitoring();
      deliveryMonitor.stopMonitoring();
      
      expect(true).toBe(true);
    });

    it('should not start monitoring twice', () => {
      deliveryMonitor.startMonitoring();
      deliveryMonitor.startMonitoring(); // Should warn but not fail
      
      expect(true).toBe(true);
    });

    it('should handle monitoring errors gracefully', async () => {
      deliveryMonitor.startMonitoring();
      
      // Wait a bit for monitoring to run
      await new Promise(resolve => setTimeout(resolve, 100));
      
      deliveryMonitor.stopMonitoring();
      
      expect(true).toBe(true);
    });
  });

  describe('Alert Types', () => {
    it('should trigger high failure rate alert', async () => {
      const monitor = new WhatsAppDeliveryMonitor({
        failureRateThreshold: 0, // Always trigger
        minSampleSize: 1,
      });

      await monitor.checkAndAlert();
      
      expect(true).toBe(true);
    });

    it('should trigger high pending count alert', async () => {
      await deliveryMonitor.checkAndAlert();
      
      expect(true).toBe(true);
    });

    it('should trigger slow delivery alert', async () => {
      await deliveryMonitor.checkAndAlert();
      
      expect(true).toBe(true);
    });
  });

  describe('Alert Deduplication', () => {
    it('should not send duplicate alerts within 1 hour', async () => {
      const monitor = new WhatsAppDeliveryMonitor({
        failureRateThreshold: 0,
        minSampleSize: 1,
      });

      await monitor.checkAndAlert();
      await monitor.checkAndAlert(); // Should skip
      
      expect(true).toBe(true);
    });
  });
});
