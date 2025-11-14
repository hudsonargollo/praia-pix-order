/**
 * MobileOrderCard Component Tests
 * 
 * Tests the mobile-responsive card layout for displaying orders.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileOrderCard } from '../MobileOrderCard';
import type { Order } from '@/types/commission';

describe('MobileOrderCard', () => {
  const mockOrder: Order = {
    id: 'test-order-123',
    created_at: '2024-01-15T14:30:00Z',
    total_amount: 150.00,
    status: 'paid',
    customer_name: 'João Silva',
    customer_phone: '11999999999',
    waiter_id: 'waiter-1',
    table_number: 5,
    payment_method: 'pix',
    items: []
  };

  it('renders order header with order number and customer name', () => {
    render(<MobileOrderCard order={mockOrder} />);
    
    expect(screen.getByText('#test-ord')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('displays customer phone number', () => {
    render(<MobileOrderCard order={mockOrder} />);
    
    expect(screen.getByText('11999999999')).toBeInTheDocument();
  });

  it('displays order total amount', () => {
    render(<MobileOrderCard order={mockOrder} />);
    
    expect(screen.getByText('R$ 150,00')).toBeInTheDocument();
  });

  it('displays commission amount with correct status', () => {
    render(<MobileOrderCard order={mockOrder} />);
    
    // Commission should be 10% of 150 = R$ 15,00
    expect(screen.getByText('R$ 15,00')).toBeInTheDocument();
  });

  it('shows status badge', () => {
    render(<MobileOrderCard order={mockOrder} />);
    
    expect(screen.getByText('Pago')).toBeInTheDocument();
  });

  it('expands to show additional details when clicked', () => {
    render(<MobileOrderCard order={mockOrder} />);
    
    // Initially, detailed date should not be visible
    const expandButton = screen.getByLabelText('Expandir detalhes');
    
    // Click to expand
    fireEvent.click(expandButton);
    
    // Now detailed information should be visible
    expect(screen.getByText('Data do Pedido')).toBeInTheDocument();
    expect(screen.getByText('Horário')).toBeInTheDocument();
  });

  it('collapses details when expand button is clicked again', () => {
    render(<MobileOrderCard order={mockOrder} />);
    
    const expandButton = screen.getByLabelText('Expandir detalhes');
    
    // Expand
    fireEvent.click(expandButton);
    expect(screen.getByText('Data do Pedido')).toBeInTheDocument();
    
    // Collapse
    const collapseButton = screen.getByLabelText('Recolher detalhes');
    fireEvent.click(collapseButton);
    
    // Detailed info should not be visible
    expect(screen.queryByText('Data do Pedido')).not.toBeInTheDocument();
  });

  it('shows PIX generation button when canGeneratePIX is true', () => {
    const mockGeneratePIX = vi.fn();
    
    render(
      <MobileOrderCard 
        order={mockOrder} 
        onGeneratePIX={mockGeneratePIX}
        canGeneratePIX={true}
      />
    );
    
    // Expand to see the button
    const expandButton = screen.getByLabelText('Expandir detalhes');
    fireEvent.click(expandButton);
    
    const pixButton = screen.getByText('Gerar PIX');
    expect(pixButton).toBeInTheDocument();
    
    // Click PIX button
    fireEvent.click(pixButton);
    expect(mockGeneratePIX).toHaveBeenCalledWith(mockOrder);
  });

  it('does not show PIX button when canGeneratePIX is false', () => {
    render(
      <MobileOrderCard 
        order={mockOrder} 
        canGeneratePIX={false}
      />
    );
    
    // Expand to check
    const expandButton = screen.getByLabelText('Expandir detalhes');
    fireEvent.click(expandButton);
    
    expect(screen.queryByText('Gerar PIX')).not.toBeInTheDocument();
  });

  it('displays pending commission with yellow styling', () => {
    const pendingOrder: Order = {
      ...mockOrder,
      status: 'pending'
    };
    
    render(<MobileOrderCard order={pendingOrder} />);
    
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('displays cancelled order with strikethrough commission', () => {
    const cancelledOrder: Order = {
      ...mockOrder,
      status: 'cancelled'
    };
    
    render(<MobileOrderCard order={cancelledOrder} />);
    
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
    expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
  });

  it('handles missing customer name gracefully', () => {
    const orderWithoutName: Order = {
      ...mockOrder,
      customer_name: undefined
    };
    
    render(<MobileOrderCard order={orderWithoutName} />);
    
    expect(screen.getByText('Cliente não informado')).toBeInTheDocument();
  });

  it('has touch-friendly button sizes (min 44px)', () => {
    render(<MobileOrderCard order={mockOrder} />);
    
    const expandButton = screen.getByLabelText('Expandir detalhes');
    
    // Check that button has minimum touch target size
    expect(expandButton).toHaveClass('min-w-[44px]');
    expect(expandButton).toHaveClass('min-h-[44px]');
  });
});
