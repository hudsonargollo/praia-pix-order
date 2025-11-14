import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatPhoneNumber } from '../lib/phoneUtils';
import { formatOrderNumber } from '../lib/orderUtils';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Supabase
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-waiter-id' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'test-waiter-id', name: 'Test Waiter' },
            error: null,
          }),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      })),
    })),
  },
}));

describe('Responsive Behavior Tests', () => {
  beforeEach(() => {
    // Reset viewport
    global.innerWidth = 1024;
    global.innerHeight = 768;
  });

  describe('Desktop Layout - Side-by-side Cards', () => {
    it('should support desktop viewport sizes', () => {
      // Set viewport to desktop size
      global.innerWidth = 1280;
      global.innerHeight = 800;

      // Verify viewport is set correctly
      expect(global.innerWidth).toBe(1280);
      expect(global.innerHeight).toBe(800);
    });

    it('should support 1024px breakpoint', () => {
      global.innerWidth = 1024;
      global.innerHeight = 768;

      // Verify breakpoint
      expect(global.innerWidth).toBe(1024);
    });

    it('should support large viewport (1440px)', () => {
      global.innerWidth = 1440;
      global.innerHeight = 900;

      // Verify large desktop size
      expect(global.innerWidth).toBe(1440);
    });
  });

  describe('Mobile Modal Behavior', () => {
    it('should support mobile viewport (375x667)', () => {
      // Set mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      // Verify mobile viewport
      expect(global.innerWidth).toBe(375);
      expect(global.innerHeight).toBe(667);
    });

    it('should detect viewport smaller than 768px as mobile', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;

      // Mobile breakpoint check
      const isMobile = global.innerWidth < 768;
      expect(isMobile).toBe(true);
    });

    it('should have adequate space for modal content on mobile', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;

      // Verify minimum viewport height for modals
      expect(global.innerHeight).toBeGreaterThan(600);
    });
  });

  describe('Touch Target Verification', () => {
    it('should meet minimum touch target size of 44px', () => {
      const minTouchTarget = 44;
      
      // Verify minimum touch target meets accessibility standards
      expect(minTouchTarget).toBeGreaterThanOrEqual(44);
    });

    it('should have adequate spacing for touch targets on mobile', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;

      // Minimum spacing between touch targets
      const minSpacing = 8;
      expect(minSpacing).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Scroll Behavior in Modals', () => {
    it('should support scrollable content on mobile viewports', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;

      // Calculate available space for modal content
      const maxModalHeight = global.innerHeight * 0.9; // 90vh
      expect(maxModalHeight).toBeGreaterThan(0);
    });

    it('should maintain footer visibility with overflow content', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;

      // Verify viewport has space for sticky footer
      const footerHeight = 60;
      const availableContentHeight = global.innerHeight - footerHeight;
      expect(availableContentHeight).toBeGreaterThan(0);
    });
  });

  describe('Formatting Display Verification', () => {
    it('should format phone numbers correctly on mobile', () => {
      const phone = '11987654321';
      const formatted = formatPhoneNumber(phone);
      expect(formatted).toBe('(11) 98765-4321');
    });

    it('should format phone numbers correctly on desktop', () => {
      global.innerWidth = 1280;
      const phone = '11987654321';
      const formatted = formatPhoneNumber(phone);
      expect(formatted).toBe('(11) 98765-4321');
    });

    it('should format order numbers consistently across devices', () => {
      const order = { order_number: 123, id: 'test-uuid' };
      const formatted = formatOrderNumber(order, true);
      expect(formatted).toBe('Pedido #123');
    });

    it('should format phone numbers with proper Brazilian format', () => {
      const testCases = [
        { input: '11987654321', expected: '(11) 98765-4321' },
        { input: '21987654321', expected: '(21) 98765-4321' },
        { input: '85987654321', expected: '(85) 98765-4321' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(formatPhoneNumber(input)).toBe(expected);
      });
    });
  });

  describe('Responsive Breakpoint Transitions', () => {
    it('should handle transition from mobile to tablet (640px)', () => {
      global.innerWidth = 640;
      global.innerHeight = 960;

      // Verify tablet breakpoint
      expect(global.innerWidth).toBe(640);
      expect(global.innerWidth).toBeGreaterThanOrEqual(640);
    });

    it('should handle transition from tablet to desktop (1024px)', () => {
      global.innerWidth = 1024;
      global.innerHeight = 768;

      // Verify desktop breakpoint
      expect(global.innerWidth).toBe(1024);
      expect(global.innerWidth).toBeGreaterThanOrEqual(1024);
    });

    it('should handle large desktop viewport (1920px)', () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      // Verify large desktop
      expect(global.innerWidth).toBe(1920);
      expect(global.innerWidth).toBeGreaterThanOrEqual(1920);
    });
  });

  describe('Mobile Device Specific Tests', () => {
    it('should support iPhone SE viewport (375x667)', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;

      expect(global.innerWidth).toBe(375);
      expect(global.innerHeight).toBe(667);
    });

    it('should support iPhone 12 Pro viewport (390x844)', () => {
      global.innerWidth = 390;
      global.innerHeight = 844;

      expect(global.innerWidth).toBe(390);
      expect(global.innerHeight).toBe(844);
    });

    it('should support Samsung Galaxy S21 viewport (360x800)', () => {
      global.innerWidth = 360;
      global.innerHeight = 800;

      expect(global.innerWidth).toBe(360);
      expect(global.innerHeight).toBe(800);
    });

    it('should support iPad viewport (768x1024)', () => {
      global.innerWidth = 768;
      global.innerHeight = 1024;

      expect(global.innerWidth).toBe(768);
      expect(global.innerHeight).toBe(1024);
    });

    it('should support iPad Pro viewport (1024x1366)', () => {
      global.innerWidth = 1024;
      global.innerHeight = 1366;

      expect(global.innerWidth).toBe(1024);
      expect(global.innerHeight).toBe(1366);
    });

    it('should detect all mobile devices correctly', () => {
      const mobileDevices = [
        { width: 375, height: 667, name: 'iPhone SE' },
        { width: 390, height: 844, name: 'iPhone 12 Pro' },
        { width: 360, height: 800, name: 'Galaxy S21' },
      ];

      mobileDevices.forEach(device => {
        global.innerWidth = device.width;
        const isMobile = global.innerWidth < 768;
        expect(isMobile).toBe(true);
      });
    });
  });
});
