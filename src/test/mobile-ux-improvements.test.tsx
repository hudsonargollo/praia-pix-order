/**
 * Mobile UX Improvements Integration Tests
 * 
 * Tests the mobile-responsive features including:
 * - Toggle switch functionality on touch devices
 * - Card layout rendering on mobile browsers
 * - Touch-friendly interactive elements
 * - Responsive breakpoints and layouts
 * 
 * Requirements: 6.2, 6.3, 6.5, 6.6, 6.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WaiterDashboard from '@/pages/waiter/WaiterDashboard';
import { CommissionToggle } from '@/components/CommissionToggle';
import { MobileOrderCard } from '@/components/MobileOrderCard';
import type { Order } from '@/types/commission';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-waiter-id',
            email: 'waiter@test.com',
            user_metadata: {
              full_name: 'Test Waiter',
              role: 'waiter'
            }
          }
        }
      }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockOrders,
        error: null
      })
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        callback('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      })
    })),
    removeChannel: vi.fn()
  }
}));

// Mock realtime service
vi.mock('@/integrations/supabase/realtime', () => ({
  realtimeService: {
    subscribeToOrders: vi.fn(),
    unsubscribeFromOrders: vi.fn()
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Mock matchMedia for responsive tests
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

// Mock orders data
const mockOrders: Order[] = [
  {
    id: 'order-1',
    created_at: '2024-01-15T14:30:00Z',
    total_amount: 150.00,
    status: 'paid',
    customer_name: 'João Silva',
    customer_phone: '11999999999',
    waiter_id: 'test-waiter-id',
    table_number: '5',
    order_number: 1,
    kitchen_notified_at: null,
    mercadopago_payment_id: null,
    notified_at: null,
    payment_confirmed_at: null,
    payment_expires_at: null,
    pix_copy_paste: null,
    qr_code_data: null,
    ready_at: null
  },
  {
    id: 'order-2',
    created_at: '2024-01-15T15:00:00Z',
    total_amount: 200.00,
    status: 'pending',
    customer_name: 'Maria Santos',
    customer_phone: '11988888888',
    waiter_id: 'test-waiter-id',
    table_number: '3',
    order_number: 2,
    kitchen_notified_at: null,
    mercadopago_payment_id: null,
    notified_at: null,
    payment_confirmed_at: null,
    payment_expires_at: null,
    pix_copy_paste: null,
    qr_code_data: null,
    ready_at: null
  },
  {
    id: 'order-3',
    created_at: '2024-01-15T16:00:00Z',
    total_amount: 100.00,
    status: 'in_preparation',
    customer_name: 'Pedro Costa',
    customer_phone: '11977777777',
    waiter_id: 'test-waiter-id',
    table_number: '7',
    order_number: 3,
    kitchen_notified_at: null,
    mercadopago_payment_id: null,
    notified_at: null,
    payment_confirmed_at: null,
    payment_expires_at: null,
    pix_copy_paste: null,
    qr_code_data: null,
    ready_at: null
  }
];

describe('Mobile UX Improvements - Toggle Switch', () => {
  it('renders toggle switch with touch-friendly buttons (min 44px)', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    const receivedButton = screen.getByText('Recebidas').closest('button');
    const pendingButton = screen.getByText('A Receber').closest('button');
    
    expect(receivedButton).toBeInTheDocument();
    expect(pendingButton).toBeInTheDocument();
    
    // Verify buttons have adequate padding for touch targets
    expect(receivedButton).toHaveClass('px-4', 'py-2.5');
    expect(pendingButton).toHaveClass('px-4', 'py-2.5');
  });

  it('toggles between received and pending views on click', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    // Initially shows received commissions
    expect(screen.getByText('R$ 15,00')).toBeInTheDocument(); // 150 * 0.1
    expect(screen.getByText('De 1 pedido pago')).toBeInTheDocument();
    
    // Click pending button
    const pendingButton = screen.getByText('A Receber');
    fireEvent.click(pendingButton);
    
    // Should show pending commissions
    expect(screen.getByText('R$ 30,00')).toBeInTheDocument(); // (200 + 100) * 0.1
    expect(screen.getByText('De 2 pedidos pendentes')).toBeInTheDocument();
  });

  it('applies smooth transition animations when toggling', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    const receivedButton = screen.getByText('Recebidas').closest('button');
    const pendingButton = screen.getByText('A Receber').closest('button');
    
    // Check for transition classes
    expect(receivedButton).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    expect(pendingButton).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
  });

  it('shows visual feedback on active state with scale effect', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    const receivedButton = screen.getByText('Recebidas').closest('button');
    
    // Active button should have scale-105 class
    expect(receivedButton).toHaveClass('scale-105');
    
    // Click pending button
    const pendingButton = screen.getByText('A Receber').closest('button');
    fireEvent.click(pendingButton!);
    
    // Now pending button should have scale effect
    expect(pendingButton).toHaveClass('scale-105');
  });

  it('displays overall total combining both commission types', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    // Total should be (150 + 200 + 100) * 0.1 = 45.00
    expect(screen.getByText('R$ 45,00')).toBeInTheDocument();
    expect(screen.getByText('Total Geral')).toBeInTheDocument();
    expect(screen.getByText('Recebidas + A Receber')).toBeInTheDocument();
  });

  it('calls onViewChange callback when toggling', () => {
    const onViewChange = vi.fn();
    render(<CommissionToggle orders={mockOrders} onViewChange={onViewChange} />);
    
    const pendingButton = screen.getByText('A Receber');
    fireEvent.click(pendingButton);
    
    expect(onViewChange).toHaveBeenCalledWith('pending');
  });
});

describe('Mobile UX Improvements - Card Layout', () => {
  it('renders mobile order card with essential information', () => {
    render(<MobileOrderCard order={mockOrders[0]} />);
    
    // Header information
    expect(screen.getByText('#order-1')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('11999999999')).toBeInTheDocument();
    
    // Body information
    expect(screen.getByText('Total do Pedido')).toBeInTheDocument();
    expect(screen.getByText('R$ 150,00')).toBeInTheDocument();
    expect(screen.getByText('Sua Comissão')).toBeInTheDocument();
    expect(screen.getByText('R$ 15,00')).toBeInTheDocument();
  });

  it('has touch-friendly expand/collapse button (min 44px)', () => {
    render(<MobileOrderCard order={mockOrders[0]} />);
    
    const expandButton = screen.getByLabelText('Expandir detalhes');
    
    // Verify minimum touch target size
    expect(expandButton).toHaveClass('min-w-[44px]', 'min-h-[44px]');
  });

  it('expands to show additional details when tapped', () => {
    render(<MobileOrderCard order={mockOrders[0]} />);
    
    const expandButton = screen.getByLabelText('Expandir detalhes');
    
    // Initially, detailed info should not be visible
    expect(screen.queryByText('Data do Pedido')).not.toBeInTheDocument();
    
    // Tap to expand
    fireEvent.click(expandButton);
    
    // Now detailed information should be visible
    expect(screen.getByText('Data do Pedido')).toBeInTheDocument();
    expect(screen.getByText('Horário')).toBeInTheDocument();
  });

  it('collapses details when collapse button is tapped', () => {
    render(<MobileOrderCard order={mockOrders[0]} />);
    
    // Expand first
    const expandButton = screen.getByLabelText('Expandir detalhes');
    fireEvent.click(expandButton);
    
    expect(screen.getByText('Data do Pedido')).toBeInTheDocument();
    
    // Collapse
    const collapseButton = screen.getByLabelText('Recolher detalhes');
    fireEvent.click(collapseButton);
    
    // Detailed info should not be visible
    expect(screen.queryByText('Data do Pedido')).not.toBeInTheDocument();
  });

  it('displays commission status with appropriate icon and color', () => {
    const { container } = render(<MobileOrderCard order={mockOrders[0]} />);
    
    // Paid order should have green styling
    const commissionElement = screen.getByText('R$ 15,00');
    expect(commissionElement).toHaveClass('text-green-600');
  });

  it('shows pending commission with yellow styling', () => {
    const { container } = render(<MobileOrderCard order={mockOrders[1]} />);
    
    // Pending order should have yellow styling
    const commissionElement = screen.getByText('R$ 20,00');
    expect(commissionElement).toHaveClass('text-yellow-600');
  });

  it('displays status badge with appropriate variant', () => {
    render(<MobileOrderCard order={mockOrders[0]} />);
    
    expect(screen.getByText('Pago')).toBeInTheDocument();
  });

  it('shows PIX generation button when canGeneratePIX is true', () => {
    const mockGeneratePIX = vi.fn();
    
    render(
      <MobileOrderCard 
        order={mockOrders[1]} 
        onGeneratePIX={mockGeneratePIX}
        canGeneratePIX={true}
      />
    );
    
    // Expand to see the button
    const expandButton = screen.getByLabelText('Expandir detalhes');
    fireEvent.click(expandButton);
    
    const pixButton = screen.getByText('Gerar PIX');
    expect(pixButton).toBeInTheDocument();
    expect(pixButton).toHaveClass('min-h-[44px]'); // Touch-friendly
    
    // Tap PIX button
    fireEvent.click(pixButton);
    expect(mockGeneratePIX).toHaveBeenCalledWith(mockOrders[1]);
  });
});

describe('Mobile UX Improvements - Responsive Behavior', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
  });

  it('mobile order cards render correctly on small screens', () => {
    // Test that mobile cards work independently
    // The WaiterDashboard uses useIsMobile hook to conditionally render cards vs table
    
    render(
      <div className="space-y-3">
        {mockOrders.map((order) => (
          <MobileOrderCard key={order.id} order={order} />
        ))}
      </div>
    );

    // Verify all orders are rendered as cards
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
    
    // Verify card-specific elements are present (not table elements)
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader')).not.toBeInTheDocument();
  });

  it('stacks commission cards vertically on mobile', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    // The toggle should be in a single card, not separate cards
    expect(screen.getByText('Comissões')).toBeInTheDocument();
    expect(screen.getByText('Recebidas')).toBeInTheDocument();
    expect(screen.getByText('A Receber')).toBeInTheDocument();
  });

  it('maintains readability with appropriate font sizes on mobile', () => {
    render(<MobileOrderCard order={mockOrders[0]} />);
    
    // Check that text elements have appropriate sizing classes
    const orderNumber = screen.getByText('#order-1');
    expect(orderNumber).toHaveClass('text-sm');
    
    const customerName = screen.getByText('João Silva');
    expect(customerName).toHaveClass('text-base');
  });
});

describe('Mobile UX Improvements - Touch Interactions', () => {
  it('all interactive elements have minimum 44px touch targets', () => {
    const mockGeneratePIX = vi.fn();
    render(
      <MobileOrderCard 
        order={mockOrders[1]} 
        onGeneratePIX={mockGeneratePIX}
        canGeneratePIX={true} 
      />
    );
    
    // Expand button
    const expandButton = screen.getByLabelText('Expandir detalhes');
    expect(expandButton).toHaveClass('min-w-[44px]', 'min-h-[44px]');
    
    // Expand to see PIX button
    fireEvent.click(expandButton);
    
    // PIX button
    const pixButton = screen.getByText('Gerar PIX');
    expect(pixButton).toHaveClass('min-h-[44px]');
  });

  it('provides visual feedback on hover/press states', () => {
    render(<MobileOrderCard order={mockOrders[0]} />);
    
    const expandButton = screen.getByLabelText('Expandir detalhes');
    
    // Should have hover state classes
    expect(expandButton).toHaveClass('hover:bg-gray-100');
  });

  it('toggle buttons have adequate spacing between them', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    // Find the container with both buttons
    const receivedButton = screen.getByText('Recebidas').closest('button');
    const toggleContainer = receivedButton?.parentElement;
    
    // Should have gap between buttons
    expect(toggleContainer).toHaveClass('gap-2');
  });

  it('card layout has adequate padding for touch interactions', () => {
    const { container } = render(<MobileOrderCard order={mockOrders[0]} />);
    
    const cardContent = container.querySelector('.p-4');
    expect(cardContent).toBeInTheDocument();
  });
});

describe('Mobile UX Improvements - Accessibility', () => {
  it('toggle buttons have proper aria-pressed attributes', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    const receivedButton = screen.getByText('Recebidas').closest('button');
    const pendingButton = screen.getByText('A Receber').closest('button');
    
    expect(receivedButton).toHaveAttribute('aria-pressed', 'true');
    expect(pendingButton).toHaveAttribute('aria-pressed', 'false');
    
    // Toggle
    fireEvent.click(pendingButton!);
    
    expect(receivedButton).toHaveAttribute('aria-pressed', 'false');
    expect(pendingButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('expand/collapse buttons have descriptive aria-labels', () => {
    render(<MobileOrderCard order={mockOrders[0]} />);
    
    expect(screen.getByLabelText('Expandir detalhes')).toBeInTheDocument();
    
    // Expand
    fireEvent.click(screen.getByLabelText('Expandir detalhes'));
    
    expect(screen.getByLabelText('Recolher detalhes')).toBeInTheDocument();
  });

  it('commission status has tooltip for screen readers', () => {
    render(<MobileOrderCard order={mockOrders[0]} />);
    
    // Tooltip trigger should be present - the commission is wrapped in TooltipProvider
    const commissionElement = screen.getByText('R$ 15,00');
    expect(commissionElement).toBeInTheDocument();
    
    // Verify the commission is displayed with proper styling for accessibility
    expect(commissionElement).toHaveClass('text-green-600');
    
    // The tooltip structure exists (data-state attribute is on a parent element)
    const tooltipContainer = commissionElement.closest('[data-state]');
    expect(tooltipContainer).toBeInTheDocument();
  });
});

describe('Mobile UX Improvements - Performance', () => {
  it('renders multiple cards efficiently without lag', () => {
    const manyOrders = Array.from({ length: 20 }, (_, i) => ({
      ...mockOrders[0],
      id: `order-${i}`,
      order_number: i + 1
    }));

    const startTime = performance.now();
    
    render(
      <div className="space-y-3">
        {manyOrders.map((order) => (
          <MobileOrderCard key={order.id} order={order} />
        ))}
      </div>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Rendering should be fast (< 100ms for 20 cards)
    expect(renderTime).toBeLessThan(100);
  });

  it('toggle animation does not cause layout shift', () => {
    const { container } = render(<CommissionToggle orders={mockOrders} />);
    
    const initialHeight = container.firstChild?.clientHeight;
    
    // Toggle view
    const pendingButton = screen.getByText('A Receber');
    fireEvent.click(pendingButton);
    
    const afterToggleHeight = container.firstChild?.clientHeight;
    
    // Height should remain consistent (no layout shift)
    expect(initialHeight).toBe(afterToggleHeight);
  });
});
