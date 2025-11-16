/**
 * PaymentMethodSelector Component Tests
 * 
 * Tests the payment method selector for switching between PIX and credit card payments.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentMethodSelector from '../PaymentMethodSelector';
import type { PaymentMethod } from '../PaymentMethodSelector';

describe('PaymentMethodSelector', () => {
  const mockOnMethodChange = vi.fn();

  beforeEach(() => {
    mockOnMethodChange.mockClear();
  });

  it('renders both payment method options', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
      />
    );

    expect(screen.getByText('PIX')).toBeInTheDocument();
    expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
  });

  it('displays PIX as selected when selectedMethod is pix', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
      />
    );

    const pixButton = screen.getByRole('radio', { name: /pagar com pix/i });
    const cardButton = screen.getByRole('radio', { name: /pagar com cartão de crédito/i });

    expect(pixButton).toHaveAttribute('aria-checked', 'true');
    expect(cardButton).toHaveAttribute('aria-checked', 'false');
  });

  it('displays credit card as selected when selectedMethod is credit_card', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="credit_card"
        onMethodChange={mockOnMethodChange}
      />
    );

    const pixButton = screen.getByRole('radio', { name: /pagar com pix/i });
    const cardButton = screen.getByRole('radio', { name: /pagar com cartão de crédito/i });

    expect(pixButton).toHaveAttribute('aria-checked', 'false');
    expect(cardButton).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onMethodChange with credit_card when credit card button is clicked', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
      />
    );

    const cardButton = screen.getByRole('radio', { name: /pagar com cartão de crédito/i });
    fireEvent.click(cardButton);

    expect(mockOnMethodChange).toHaveBeenCalledWith('credit_card');
    expect(mockOnMethodChange).toHaveBeenCalledTimes(1);
  });

  it('calls onMethodChange with pix when PIX button is clicked', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="credit_card"
        onMethodChange={mockOnMethodChange}
      />
    );

    const pixButton = screen.getByRole('radio', { name: /pagar com pix/i });
    fireEvent.click(pixButton);

    expect(mockOnMethodChange).toHaveBeenCalledWith('pix');
    expect(mockOnMethodChange).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard navigation with Enter key', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
      />
    );

    const cardButton = screen.getByRole('radio', { name: /pagar com cartão de crédito/i });
    fireEvent.keyDown(cardButton, { key: 'Enter' });

    expect(mockOnMethodChange).toHaveBeenCalledWith('credit_card');
  });

  it('supports keyboard navigation with Space key', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
      />
    );

    const cardButton = screen.getByRole('radio', { name: /pagar com cartão de crédito/i });
    fireEvent.keyDown(cardButton, { key: ' ' });

    expect(mockOnMethodChange).toHaveBeenCalledWith('credit_card');
  });

  it('does not call onMethodChange when disabled', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
        disabled={true}
      />
    );

    const cardButton = screen.getByRole('radio', { name: /pagar com cartão de crédito/i });
    fireEvent.click(cardButton);

    expect(mockOnMethodChange).not.toHaveBeenCalled();
  });

  it('disables both buttons when disabled prop is true', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
        disabled={true}
      />
    );

    const pixButton = screen.getByRole('radio', { name: /pagar com pix/i });
    const cardButton = screen.getByRole('radio', { name: /pagar com cartão de crédito/i });

    expect(pixButton).toBeDisabled();
    expect(cardButton).toBeDisabled();
  });

  it('does not respond to keyboard events when disabled', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
        disabled={true}
      />
    );

    const cardButton = screen.getByRole('radio', { name: /pagar com cartão de crédito/i });
    fireEvent.keyDown(cardButton, { key: 'Enter' });

    expect(mockOnMethodChange).not.toHaveBeenCalled();
  });

  it('has proper ARIA radiogroup role', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
      />
    );

    const radioGroup = screen.getByRole('radiogroup', { name: /selecione o método de pagamento/i });
    expect(radioGroup).toBeInTheDocument();
  });

  it('renders icons for both payment methods', () => {
    const { container } = render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
      />
    );

    // Check that SVG icons are present (Lucide icons render as SVGs)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('applies correct styling classes to selected button', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
      />
    );

    const pixButton = screen.getByRole('radio', { name: /pagar com pix/i });
    
    // Selected button should have primary background
    expect(pixButton).toHaveClass('bg-primary');
    expect(pixButton).toHaveClass('text-primary-foreground');
  });

  it('applies correct styling classes to unselected button', () => {
    render(
      <PaymentMethodSelector
        selectedMethod="pix"
        onMethodChange={mockOnMethodChange}
      />
    );

    const cardButton = screen.getByRole('radio', { name: /pagar com cartão de crédito/i });
    
    // Unselected button should have transparent background
    expect(cardButton).toHaveClass('bg-transparent');
    expect(cardButton).toHaveClass('text-muted-foreground');
  });
});
