/**
 * CommissionToggle Component Tests
 * 
 * Tests the toggle interface for switching between received and pending commissions.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommissionToggle } from '../CommissionToggle';
import type { Order } from '@/types/commission';

describe('CommissionToggle', () => {
  const mockOrders: Order[] = [
    {
      id: '1',
      created_at: '2024-01-01T10:00:00Z',
      total_amount: 100,
      status: 'paid',
      customer_name: 'Customer 1',
      customer_phone: '11999999999',
      table_number: '1',
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
      id: '2',
      created_at: '2024-01-01T11:00:00Z',
      total_amount: 200,
      status: 'completed',
      customer_name: 'Customer 2',
      customer_phone: '11999999998',
      table_number: '2',
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
      id: '3',
      created_at: '2024-01-01T12:00:00Z',
      total_amount: 150,
      status: 'pending',
      customer_name: 'Customer 3',
      customer_phone: '11999999997',
      table_number: '3',
      order_number: 3,
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
      id: '4',
      created_at: '2024-01-01T13:00:00Z',
      total_amount: 80,
      status: 'in_preparation',
      customer_name: 'Customer 4',
      customer_phone: '11999999996',
      table_number: '4',
      order_number: 4,
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

  it('renders commission toggle with title', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    expect(screen.getByText('Comissões')).toBeInTheDocument();
  });

  it('renders both toggle buttons', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    expect(screen.getByText('Recebidas')).toBeInTheDocument();
    expect(screen.getByText('A Receber')).toBeInTheDocument();
  });

  it('displays received commissions by default', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    // Confirmed: (100 + 200) * 0.1 = 30.00
    expect(screen.getByText('R$ 30,00')).toBeInTheDocument();
    expect(screen.getByText('De 2 pedidos pagos')).toBeInTheDocument();
  });

  it('displays total geral combining both commission types', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    // Total: (100 + 200 + 150 + 80) * 0.1 = 53.00
    expect(screen.getByText('R$ 53,00')).toBeInTheDocument();
    expect(screen.getByText('Total Geral')).toBeInTheDocument();
    expect(screen.getByText('Recebidas + A Receber')).toBeInTheDocument();
  });

  it('switches to pending view when A Receber is clicked', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    const pendingButton = screen.getByText('A Receber');
    fireEvent.click(pendingButton);
    
    // Estimated: (150 + 80) * 0.1 = 23.00
    expect(screen.getByText('R$ 23,00')).toBeInTheDocument();
    expect(screen.getByText('De 2 pedidos pendentes')).toBeInTheDocument();
    expect(screen.getByText('Aguardando confirmação de pagamento')).toBeInTheDocument();
  });

  it('switches back to received view when Recebidas is clicked', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    // Switch to pending
    const pendingButton = screen.getByText('A Receber');
    fireEvent.click(pendingButton);
    
    // Switch back to received
    const receivedButton = screen.getByText('Recebidas');
    fireEvent.click(receivedButton);
    
    expect(screen.getByText('R$ 30,00')).toBeInTheDocument();
    expect(screen.getByText('De 2 pedidos pagos')).toBeInTheDocument();
  });

  it('calls onViewChange callback when toggling', () => {
    const onViewChange = vi.fn();
    render(<CommissionToggle orders={mockOrders} onViewChange={onViewChange} />);
    
    const pendingButton = screen.getByText('A Receber');
    fireEvent.click(pendingButton);
    
    expect(onViewChange).toHaveBeenCalledWith('pending');
    
    const receivedButton = screen.getByText('Recebidas');
    fireEvent.click(receivedButton);
    
    expect(onViewChange).toHaveBeenCalledWith('received');
  });

  it('handles empty orders array', () => {
    render(<CommissionToggle orders={[]} />);
    
    expect(screen.getAllByText('R$ 0,00')).toHaveLength(2); // Both selected and total show R$ 0,00
    expect(screen.getByText('De 0 pedidos pagos')).toBeInTheDocument();
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
        table_number: '1',
        order_number: 1,
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
    
    render(<CommissionToggle orders={singleOrder} />);
    
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
        table_number: '5',
        order_number: 5,
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
    
    render(<CommissionToggle orders={ordersWithCancelled} />);
    
    // Should still show same amounts as before (cancelled order excluded)
    expect(screen.getByText('R$ 30,00')).toBeInTheDocument();
    // Total should also remain the same
    expect(screen.getByText('R$ 53,00')).toBeInTheDocument();
  });

  it('applies correct aria-pressed attribute to active button', () => {
    render(<CommissionToggle orders={mockOrders} />);
    
    const receivedButton = screen.getByText('Recebidas').closest('button');
    const pendingButton = screen.getByText('A Receber').closest('button');
    
    expect(receivedButton).toHaveAttribute('aria-pressed', 'true');
    expect(pendingButton).toHaveAttribute('aria-pressed', 'false');
    
    fireEvent.click(pendingButton!);
    
    expect(receivedButton).toHaveAttribute('aria-pressed', 'false');
    expect(pendingButton).toHaveAttribute('aria-pressed', 'true');
  });
});
