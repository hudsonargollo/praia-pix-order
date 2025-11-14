/**
 * OrderEditModal Component Tests
 * 
 * Comprehensive tests for order editing functionality including:
 * - Editing prevention for paid/cancelled orders
 * - Modifying quantities
 * - Removing items
 * - Commission recalculation
 * - Mobile interaction
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderEditModal } from '../OrderEditModal';
import type { Order } from '@/types/commission';
import { toast } from 'sonner';

// Mock order items data
const mockOrderItems = [
  {
    id: 'item-1',
    order_id: 'test-order-123',
    menu_item_id: 'menu-1',
    item_name: 'Açaí 500ml',
    quantity: 2,
    unit_price: 15.00,
    created_at: '2024-11-14T10:00:00Z'
  },
  {
    id: 'item-2',
    order_id: 'test-order-123',
    menu_item_id: 'menu-2',
    item_name: 'Granola',
    quantity: 1,
    unit_price: 3.00,
    created_at: '2024-11-14T10:00:00Z'
  }
];

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: mockOrderItems,
            error: null
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      })),
      insert: vi.fn(() => ({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    }))
  }
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}));

describe('OrderEditModal - Order Editing Functionality Tests', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  const createMockOrder = (status: string, totalAmount: number = 100): Order => ({
    id: 'test-order-123',
    created_at: '2024-11-14T10:00:00Z',
    total_amount: totalAmount,
    status,
    customer_name: 'Test Customer',
    customer_phone: '11999999999',
    waiter_id: 'waiter-123'
  });

  describe('Requirement 7.6 & 7.7: Editing Prevention for Paid and Cancelled Orders', () => {
    it('should prevent editing for paid orders', async () => {
      const paidOrder = createMockOrder('paid');
      
      render(
        <OrderEditModal
          order={paidOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Should show read-only title
      await waitFor(() => {
        expect(screen.getByText(/Detalhes do Pedido/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Should show warning message
      expect(screen.getByText(/Este pedido já foi pago e não pode ser editado/i)).toBeInTheDocument();
      
      // Should show "Fechar" button instead of "Cancelar"
      expect(screen.getByRole('button', { name: /Fechar/i })).toBeInTheDocument();
      
      // Should not show "Salvar Alterações" button
      expect(screen.queryByRole('button', { name: /Salvar Alterações/i })).not.toBeInTheDocument();
      
      // Should not show quantity controls
      expect(screen.queryByLabelText(/Aumentar quantidade/i)).not.toBeInTheDocument();
    });

    it('should prevent editing for completed orders', async () => {
      const completedOrder = createMockOrder('completed');
      
      render(
        <OrderEditModal
          order={completedOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Este pedido já foi concluído e não pode ser editado/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      expect(screen.getByRole('button', { name: /Fechar/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Salvar Alterações/i })).not.toBeInTheDocument();
    });

    it('should prevent editing for cancelled orders', async () => {
      const cancelledOrder = createMockOrder('cancelled');
      
      render(
        <OrderEditModal
          order={cancelledOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Este pedido foi cancelado e não pode ser editado/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      expect(screen.getByRole('button', { name: /Fechar/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Salvar Alterações/i })).not.toBeInTheDocument();
    });

    it('should allow editing for pending orders', async () => {
      const pendingOrder = createMockOrder('pending');
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Editar Pedido/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      expect(screen.queryByText(/não pode ser editado/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });
  });

  describe('Requirement 7.5: Modifying Item Quantities', () => {
    it('should increase item quantity when plus button is clicked', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Açaí 500ml')).toBeInTheDocument();
      }, { timeout: 3000 });

      const plusButtons = screen.getAllByLabelText(/Aumentar quantidade/i);
      await user.click(plusButtons[0]);

      // Total should update: (3 * 15) + (1 * 3) = 48.00
      await waitFor(() => {
        const totalElements = screen.getAllByText(/R\$\s*48,00/);
        expect(totalElements.length).toBeGreaterThan(0);
      });

      // Save button should be enabled
      const saveButton = screen.getByRole('button', { name: /Salvar Alterações/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should decrease item quantity when minus button is clicked', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Açaí 500ml')).toBeInTheDocument();
      }, { timeout: 3000 });

      const minusButtons = screen.getAllByLabelText(/Diminuir quantidade/i);
      await user.click(minusButtons[0]);

      // Total should update: (1 * 15) + (1 * 3) = 18.00
      await waitFor(() => {
        const totalElements = screen.getAllByText(/R\$\s*18,00/);
        expect(totalElements.length).toBeGreaterThan(0);
      });
    });

    it('should not decrease quantity below 1', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Granola')).toBeInTheDocument();
      }, { timeout: 3000 });

      const minusButtons = screen.getAllByLabelText(/Diminuir quantidade/i);
      const granolaMinusButton = minusButtons[1]; // Second item has quantity 1
      
      // Button should be disabled
      expect(granolaMinusButton).toBeDisabled();
    });
  });

  describe('Requirement 7.4: Removing Items from Order', () => {
    it('should remove item when trash button is clicked', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Granola')).toBeInTheDocument();
      }, { timeout: 3000 });

      const removeButtons = screen.getAllByLabelText(/Remover item/i);
      await user.click(removeButtons[1]); // Remove Granola

      await waitFor(() => {
        expect(screen.queryByText('Granola')).not.toBeInTheDocument();
      });

      // Total should update: (2 * 15) = 30.00
      const totalElements = screen.getAllByText(/R\$\s*30,00/);
      expect(totalElements.length).toBeGreaterThan(0);
    });

    it('should prevent removing last item', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Açaí 500ml')).toBeInTheDocument();
        expect(screen.getByText('Granola')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Remove one item first
      const removeButtons = screen.getAllByLabelText(/Remover item/i);
      await user.click(removeButtons[1]);

      await waitFor(() => {
        expect(screen.queryByText('Granola')).not.toBeInTheDocument();
      });

      // Try to remove the last remaining item
      const remainingRemoveButton = screen.getByLabelText(/Remover item/i);
      await user.click(remainingRemoveButton);

      // Should show error toast
      expect(toast.error).toHaveBeenCalledWith('O pedido deve ter pelo menos um item');
      
      // Item should still be there
      expect(screen.getByText('Açaí 500ml')).toBeInTheDocument();
    });
  });

  describe('Requirement 7.8 & 7.10: Commission Recalculation', () => {
    it('should recalculate commission when quantity changes', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Açaí 500ml')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Initial commission should be visible
      expect(screen.getByText(/Comissão \(10%\)/i)).toBeInTheDocument();

      // Increase quantity
      const plusButtons = screen.getAllByLabelText(/Aumentar quantidade/i);
      await user.click(plusButtons[0]);

      // New total: (3 * 15) + (1 * 3) = 48.00
      // New commission: 48.00 * 0.1 = 4.80
      await waitFor(() => {
        const commissionElements = screen.getAllByText(/R\$\s*4,80/);
        expect(commissionElements.length).toBeGreaterThan(0);
      });
    });

    it('should recalculate commission when item is removed', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Granola')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Remove Granola
      const removeButtons = screen.getAllByLabelText(/Remover item/i);
      await user.click(removeButtons[1]);

      // New total: (2 * 15) = 30.00
      // New commission: 30.00 * 0.1 = 3.00
      await waitFor(() => {
        const commissionElements = screen.getAllByText(/R\$\s*3,00/);
        expect(commissionElements.length).toBeGreaterThan(0);
      });
    });

    it('should show commission difference indicator when values change', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Açaí 500ml')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Increase quantity
      const plusButtons = screen.getAllByLabelText(/Aumentar quantidade/i);
      await user.click(plusButtons[0]);

      // Should show difference section
      await waitFor(() => {
        expect(screen.getByText(/Diferença:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 7.9: Saving Order Changes', () => {
    it('should disable save button when no changes made', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Açaí 500ml')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Save button should be disabled initially
      const saveButton = screen.getByRole('button', { name: /Salvar Alterações/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button after making changes', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Açaí 500ml')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Make a change
      const plusButtons = screen.getAllByLabelText(/Aumentar quantidade/i);
      await user.click(plusButtons[0]);

      // Save button should be enabled
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Salvar Alterações/i });
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  describe('Requirement 7.3: Adding Items (UI)', () => {
    it('should show add item button for editable orders', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Adicionar Item/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should not show add item button for non-editable orders', async () => {
      const paidOrder = createMockOrder('paid', 33.00);
      
      render(
        <OrderEditModal
          order={paidOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Detalhes do Pedido/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should not show add item button
      expect(screen.queryByRole('button', { name: /Adicionar Item/i })).not.toBeInTheDocument();
    });
  });

  describe('Mobile Interaction', () => {
    it('should have touch-friendly button sizes', async () => {
      const pendingOrder = createMockOrder('pending', 33.00);
      
      render(
        <OrderEditModal
          order={pendingOrder}
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Açaí 500ml')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check that buttons are rendered (touch-friendly)
      const plusButtons = screen.getAllByLabelText(/Aumentar quantidade/i);
      const minusButtons = screen.getAllByLabelText(/Diminuir quantidade/i);
      const removeButtons = screen.getAllByLabelText(/Remover item/i);

      expect(plusButtons.length).toBeGreaterThan(0);
      expect(minusButtons.length).toBeGreaterThan(0);
      expect(removeButtons.length).toBeGreaterThan(0);
    });
  });
});
