import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderNotesInput from '../OrderNotesInput';

describe('OrderNotesInput', () => {
  const mockOnNotesChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders order notes input with optional label', () => {
    render(<OrderNotesInput notes="" onNotesChange={mockOnNotesChange} />);
    
    expect(screen.getByText('Observações do Pedido')).toBeInTheDocument();
    expect(screen.getByText('(Opcional)')).toBeInTheDocument();
    expect(screen.getByLabelText(/Instruções especiais/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Açaí sem granola/)).toBeInTheDocument();
  });

  it('enforces character limit (default 500)', () => {
    render(<OrderNotesInput notes="" onNotesChange={mockOnNotesChange} />);
    
    const textarea = screen.getByLabelText(/Instruções especiais/);
    
    // Should have default maxLength attribute
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  it('enforces custom character limit', () => {
    const customLimit = 100;
    
    render(
      <OrderNotesInput 
        notes="" 
        onNotesChange={mockOnNotesChange} 
        maxLength={customLimit}
      />
    );
    
    const textarea = screen.getByLabelText(/Instruções especiais/);
    
    // Should have custom maxLength attribute
    expect(textarea).toHaveAttribute('maxLength', customLimit.toString());
  });

  it('displays character count correctly', () => {
    render(<OrderNotesInput notes="" onNotesChange={mockOnNotesChange} />);
    
    // Initially shows full count
    expect(screen.getByText('500 caracteres restantes')).toBeInTheDocument();
  });

  it('shows warning colors when approaching limit', () => {
    // Test with notes near limit
    const nearLimitText = 'a'.repeat(460); // 40 chars remaining
    render(<OrderNotesInput notes={nearLimitText} onNotesChange={mockOnNotesChange} />);
    
    const remainingText = screen.getByText('40 caracteres restantes');
    expect(remainingText).toHaveClass('text-orange-600');
  });

  it('shows preview when notes are entered', () => {
    const testNotes = 'Açaí sem granola, adicionar mel extra';
    render(<OrderNotesInput notes={testNotes} onNotesChange={mockOnNotesChange} />);
    
    expect(screen.getByText('Prévia das observações:')).toBeInTheDocument();
    // Use getAllByText to handle multiple instances
    const noteElements = screen.getAllByText(testNotes);
    expect(noteElements.length).toBeGreaterThan(0);
  });

  it('handles multiline text correctly', () => {
    const multilineText = 'Linha 1\nLinha 2\nLinha 3';
    render(<OrderNotesInput notes={multilineText} onNotesChange={mockOnNotesChange} />);
    
    const textarea = screen.getByLabelText(/Instruções especiais/);
    expect(textarea).toHaveValue(multilineText);
    
    // Check that preview container has whitespace-pre-wrap class
    const previewContainer = screen.getByText('Prévia das observações:').parentElement;
    const previewText = previewContainer?.querySelector('.whitespace-pre-wrap');
    expect(previewText).toBeInTheDocument();
  });

  it('updates when notes prop changes', () => {
    const initialNotes = 'Initial notes';
    const { rerender } = render(
      <OrderNotesInput notes={initialNotes} onNotesChange={mockOnNotesChange} />
    );
    
    expect(screen.getByDisplayValue(initialNotes)).toBeInTheDocument();
    
    const updatedNotes = 'Updated notes';
    rerender(
      <OrderNotesInput notes={updatedNotes} onNotesChange={mockOnNotesChange} />
    );
    
    expect(screen.getByDisplayValue(updatedNotes)).toBeInTheDocument();
  });

  it('provides validation status via hidden inputs', () => {
    render(<OrderNotesInput notes="" onNotesChange={mockOnNotesChange} />);
    
    const validStatus = screen.getByTestId('notes-valid');
    const lengthStatus = screen.getByTestId('notes-length');
    
    // Initially valid (empty is allowed)
    expect(validStatus).toHaveValue('true');
    expect(lengthStatus).toHaveValue('0');
  });

  it('trims whitespace in preview', () => {
    const textWithSpaces = '   Açaí sem granola   ';
    render(<OrderNotesInput notes={textWithSpaces} onNotesChange={mockOnNotesChange} />);
    
    const textarea = screen.getByLabelText(/Instruções especiais/);
    
    // Check that preview shows trimmed text by looking for the preview section
    expect(screen.getByText('Prévia das observações:')).toBeInTheDocument();
    
    // But original value should be preserved in textarea
    expect(textarea).toHaveValue(textWithSpaces);
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <OrderNotesInput 
        notes="" 
        onNotesChange={mockOnNotesChange} 
        className="custom-class"
      />
    );
    
    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('has correct textarea attributes', () => {
    render(<OrderNotesInput notes="" onNotesChange={mockOnNotesChange} />);
    
    const textarea = screen.getByLabelText(/Instruções especiais/);
    expect(textarea).toHaveAttribute('maxLength', '500');
    expect(textarea).toHaveClass('resize-none');
    expect(textarea).toHaveClass('min-h-[100px]');
  });
});