/**
 * CommissionCards Component Tests
 * 
 * Tests the dual card display for confirmed and estimated commissions.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommissionCards } from '../CommissionCards';
import type { Order } from '@/types/commission';

describe('CommissionCards', () => {
  const mockOrders: Order[] = [
    {
      id: '1',
      created_at: '2024-01-01T10:00:00Z',
      total_amount: 100,
      status: 'paid',
      customer_name: 'Customer 1',
      customer_phone: '11999999999',
      waiter_id: 'waiter-1',
      table_number: 1,
      payment_method: 'pix',
      items: []
    },
    {
      id: '2',
      created_at: '2024-01-01T11:00:00Z',
      total_amount: 200,
      status: 'completed',
      customer_name: 'Customer 2',
      customer_phone: '11999999998',
      waiter_id: 'waiter-1',
      table_number: 2,
      payment_method: 'pix',
      items: []
    },
    {
      id: '3',
      created_at: '2024-01-01T12:00:00Z',
      total_amount: 150,
      status: 'pending',
      customer_name: 'Customer 3',
      customer_phone: '11999999997',
      waiter_id: 'waiter-1',
      table_number: 3,
      payment_method: 'pix',
      items: []
    },
    {
      id: '4',
      created_at: '2024-01-01T13:00:00Z',
      total_amount: 80,
      status: 'in_preparation',
      customer_name: 'Customer 4',
      customer_phone: '11999999996',
      waiter_id: 'waiter-1',
      table_number: 4,
      payment_method: 'pix',
      items: []
    }
  ];

  it('renders both commission cards', () => {
    render(<CommissionCards orders={mockOrders} />);
    
    expect(screen.getByText('Comissões Confirmadas')).toBeInTheDocument();
    expect(screen.getByText('Comissões Estimadas')).toBeInTheDocument();
  });

  it('displays correct confirmed commission amount', () => {
    render(<CommissionCards orders={mockOrders} />);
    
    // Confirmed: (100 + 200) * 0.1 = 30.00
    expect(screen.getByText('R$ 30,00')).toBeInTheDocument();
  });

  it('displays correct estimated commission amount', () => {
    render(<CommissionCards orders={mockOrders} />);
    
    // Estimated: (150 + 80) * 0.1 = 23.00
    expect(screen.getByText('R$ 23,00')).toBeInTheDocument();
  });

  it('displays correct order counts', () => {
    render(<CommissionCards orders={mockOrders} />);
    
    expect(screen.getByText('De 2 pedidos pagos')).toBeInTheDocument();
    expect(screen.getByText('De 2 pedidos pendentes')).toBeInTheDocument();
  });

  it('displays explanatory text for estimated commissions', () => {
    render(<CommissionCards orders={mockOrders} />);
    
    expect(screen.getByText('Aguardando confirmação de pagamento')).toBeInTheDocument();
  });

  it('handles empty orders array', () => {
    render(<CommissionCards orders={[]} />);
    
    expect(screen.getAllByText('R$ 0,00')).toHaveLength(2); // Both cards show R$ 0,00
    expect(screen.getByText('De 0 pedidos pagos')).toBeInTheDocument();
    expect(screen.getByText('De 0 pedidos pendentes')).toBeInTheDocument();
  });

  it('handles singular order count correctly', () => {
    const singleOrder: Order[] = [
      {
        id: '1',
        created_at: '2024-01-01T10:00:00Z',
        total_amount: 100,
        status: 'paid',
        customer_name: 'Customer 1',
        customer_phone: '11999999999',
        waiter_id: 'waiter-1',
        table_number: 1,
        payment_method: 'pix',
        items: []
      }
    ];
    
    render(<CommissionCards orders={singleOrder} />);
    
    expect(screen.getByText('De 1 pedido pago')).toBeInTheDocument();
  });

  it('excludes cancelled orders from calculations', () => {
    const ordersWithCancelled: Order[] = [
      ...mockOrders,
      {
        id: '5',
        created_at: '2024-01-01T14:00:00Z',
        total_amount: 500,
        status: 'cancelled',
        customer_name: 'Customer 5',
        customer_phone: '11999999995',
        waiter_id: 'waiter-1',
        table_number: 5,
        payment_method: 'pix',
        items: []
      }
    ];
    
    render(<CommissionCards orders={ordersWithCancelled} />);
    
    // Should still show same amounts as before (cancelled order excluded)
    expect(screen.getByText('R$ 30,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 23,00')).toBeInTheDocument();
  });
});
