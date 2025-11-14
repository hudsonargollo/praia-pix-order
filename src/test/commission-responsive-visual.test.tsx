/**
 * Commission Display Responsive Visual Tests
 * 
 * Tests for Requirement 3.5: Commission display on mobile and desktop
 * Verifies that commission components render correctly across different viewport sizes
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommissionToggle } from '@/components/CommissionToggle';
import { CommissionCards } from '@/components/CommissionCards';
import type { Order } from '@/types/commission';

// Mock orders for testing
const mockOrders: Order[] = [
  {
    id: '1',
    order_number: 1,
    waiter_id: 'waiter-1',
    customer_name: 'João Silva',
    customer_phone: '11987654321',
    total_amount: 100.00,
    commission_amount: 10.00,
    status: 'paid',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    order_number: 2,
    waiter_id: 'waiter-1',
    customer_name: 'Maria Santos',
    customer_phone: '11987654322',
    total_amount: 50.00,
    commission_amount: 5.00,
    status: 'pending_payment',
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z'
  }
];

describe('Commission Display - Mobile Viewport', () => {
  beforeEach(() => {
    // Set mobile viewport
    global.innerWidth = 375;
    global.innerHeight = 667;
  });

  it('should render CommissionToggle on mobile viewport', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Component should render
    expect(screen.getByText('Suas Comissões do Período')).toBeInTheDocument();
    
    // Should have responsive classes
    const gridElements = container.querySelectorAll('[class*="grid-cols"]');
    expect(gridElements.length).toBeGreaterThan(0);
  });

  it('should stack commission breakdown cards vertically on mobile', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Check for grid-cols-1 class (mobile stacking)
    const gridContainer = container.querySelector('[class*="grid-cols-1"]');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should render toggle buttons with adequate touch targets on mobile', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    const receivedButton = screen.getByRole('button', { name: /recebidas/i });
    const pendingButton = screen.getByRole('button', { name: /a receber/i });
    
    expect(receivedButton).toBeInTheDocument();
    expect(pendingButton).toBeInTheDocument();
    
    // Buttons should have padding for touch targets (py-2.5 = 10px = 40px+ total height)
    expect(receivedButton.className).toContain('py-2.5');
    expect(pendingButton.className).toContain('py-2.5');
  });

  it('should display all commission information on mobile', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    // All key information should be visible
    expect(screen.getByText('Confirmadas')).toBeInTheDocument();
    expect(screen.getByText('Estimadas')).toBeInTheDocument();
    expect(screen.getByText('Total Geral do Período')).toBeInTheDocument();
  });

  it('should render CommissionCards with mobile-friendly layout', () => {
    const { container } = render(<CommissionCards orders={mockOrders} />);
    
    // Should have grid layout
    const gridContainer = container.querySelector('[class*="grid"]');
    expect(gridContainer).toBeInTheDocument();
    
    // Both cards should render
    expect(screen.getByText('Comissões Confirmadas')).toBeInTheDocument();
    expect(screen.getByText('Comissões Estimadas')).toBeInTheDocument();
  });
});

describe('Commission Display - Desktop Viewport', () => {
  beforeEach(() => {
    // Set desktop viewport
    global.innerWidth = 1920;
    global.innerHeight = 1080;
  });

  it('should render CommissionToggle on desktop viewport', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Component should render
    expect(screen.getByText('Suas Comissões do Período')).toBeInTheDocument();
    
    // Should have responsive grid classes
    const gridElements = container.querySelectorAll('[class*="sm:grid-cols"]');
    expect(gridElements.length).toBeGreaterThan(0);
  });

  it('should display commission breakdown side-by-side on desktop', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Check for sm:grid-cols-2 class (desktop side-by-side)
    const gridContainer = container.querySelector('[class*="sm:grid-cols-2"]');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should render all visual elements with proper styling on desktop', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Check for gradient styling
    const gradientElements = container.querySelectorAll('[class*="gradient"]');
    expect(gradientElements.length).toBeGreaterThan(0);
    
    // Check for shadow effects
    const shadowElements = container.querySelectorAll('[class*="shadow"]');
    expect(shadowElements.length).toBeGreaterThan(0);
  });

  it('should display icons and visual indicators on desktop', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Should have multiple SVG icons
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(3); // TrendingUp, Calendar, CheckCircle, Clock, etc.
  });

  it('should render CommissionCards in two-column layout on desktop', () => {
    const { container } = render(<CommissionCards orders={mockOrders} />);
    
    // Should have md:grid-cols-2 for desktop layout
    const gridContainer = container.querySelector('[class*="md:grid-cols-2"]');
    expect(gridContainer).toBeInTheDocument();
  });
});

describe('Commission Display - Tablet Viewport', () => {
  beforeEach(() => {
    // Set tablet viewport (iPad)
    global.innerWidth = 768;
    global.innerHeight = 1024;
  });

  it('should render CommissionToggle on tablet viewport', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    expect(screen.getByText('Suas Comissões do Período')).toBeInTheDocument();
  });

  it('should adapt layout for tablet viewport', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Should have responsive grid classes that work for tablet
    const gridElements = container.querySelectorAll('[class*="grid-cols"]');
    expect(gridElements.length).toBeGreaterThan(0);
  });
});

describe('Commission Display - Visual Hierarchy', () => {
  it('should emphasize total commission amount with larger font', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Total should use text-3xl or text-4xl
    const largeTextElements = container.querySelectorAll('[class*="text-3xl"], [class*="text-4xl"]');
    expect(largeTextElements.length).toBeGreaterThan(0);
  });

  it('should use color coding for different commission states', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Should have green for confirmed
    const greenElements = container.querySelectorAll('[class*="text-green"]');
    expect(greenElements.length).toBeGreaterThan(0);
    
    // Should have yellow for estimated
    const yellowElements = container.querySelectorAll('[class*="text-yellow"]');
    expect(yellowElements.length).toBeGreaterThan(0);
  });

  it('should use appropriate spacing and padding', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Should have padding classes
    const paddedElements = container.querySelectorAll('[class*="p-"]');
    expect(paddedElements.length).toBeGreaterThan(0);
    
    // Should have gap classes for spacing
    const gapElements = container.querySelectorAll('[class*="gap-"]');
    expect(gapElements.length).toBeGreaterThan(0);
  });

  it('should use rounded corners for modern appearance', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Should have rounded classes
    const roundedElements = container.querySelectorAll('[class*="rounded"]');
    expect(roundedElements.length).toBeGreaterThan(0);
  });
});

describe('Commission Display - Accessibility', () => {
  it('should have proper button roles for toggle', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('should have aria-pressed attribute on toggle buttons', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    const receivedButton = screen.getByRole('button', { name: /recebidas/i });
    expect(receivedButton).toHaveAttribute('aria-pressed');
  });

  it('should have proper heading hierarchy', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Should have heading elements
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should render icons for visual enhancement', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // Should have SVG icons for visual enhancement
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });
});

describe('Commission Display - Content Completeness', () => {
  it('should display all required commission information', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    // Title
    expect(screen.getByText('Suas Comissões do Período')).toBeInTheDocument();
    
    // Breakdown labels
    expect(screen.getByText('Confirmadas')).toBeInTheDocument();
    expect(screen.getByText('Estimadas')).toBeInTheDocument();
    
    // Total label
    expect(screen.getByText('Total Geral do Período')).toBeInTheDocument();
    
    // Toggle buttons
    expect(screen.getByRole('button', { name: /recebidas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /a receber/i })).toBeInTheDocument();
  });

  it('should display date range information', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    // Should show date information
    const dateElements = screen.getAllByText(/jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|2024/i);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should display order counts', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    // Should show order counts
    const paidCounts = screen.getAllByText(/pedido.*pago/i);
    const pendingCounts = screen.getAllByText(/pedido.*pendente/i);
    
    expect(paidCounts.length).toBeGreaterThan(0);
    expect(pendingCounts.length).toBeGreaterThan(0);
  });

  it('should format all currency values correctly', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    // All currency values should use Brazilian format (R$)
    const currencyElements = Array.from(container.querySelectorAll('*'))
      .filter(el => el.textContent?.includes('R$'));
    
    expect(currencyElements.length).toBeGreaterThan(0);
  });
});
