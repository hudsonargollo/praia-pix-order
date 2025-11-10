import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CustomerInfoForm, { type CustomerInfo } from '../CustomerInfoForm';

describe('CustomerInfoForm', () => {
  const mockOnCustomerInfoChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer info form with required fields', () => {
    render(<CustomerInfoForm onCustomerInfoChange={mockOnCustomerInfoChange} />);
    
    expect(screen.getByText('Dados do Cliente')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome Completo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/WhatsApp/)).toBeInTheDocument();
    expect(screen.getByText('* Campos obrigatórios')).toBeInTheDocument();
  });

  it('validates required name field with empty input', () => {
    render(<CustomerInfoForm onCustomerInfoChange={mockOnCustomerInfoChange} />);
    
    // Initially shows error for empty name
    expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
  });

  it('validates phone number format (11 digits) with empty input', () => {
    render(<CustomerInfoForm onCustomerInfoChange={mockOnCustomerInfoChange} />);
    
    // Initially shows error for empty phone
    expect(screen.getByText('WhatsApp é obrigatório')).toBeInTheDocument();
  });

  it('validates phone number format with short input', () => {
    const shortPhone = '7399999999'; // 10 digits
    render(<CustomerInfoForm onCustomerInfoChange={mockOnCustomerInfoChange} initialData={{ name: 'Test', phone: shortPhone }} />);
    
    expect(screen.getByText('WhatsApp deve ter 11 dígitos (DDD + número)')).toBeInTheDocument();
  });

  it('validates DDD range with invalid DDD', () => {
    const invalidDDD = '10999999999'; // DDD 10 is invalid
    render(<CustomerInfoForm onCustomerInfoChange={mockOnCustomerInfoChange} initialData={{ name: 'Test', phone: invalidDDD }} />);
    
    expect(screen.getByText('DDD inválido')).toBeInTheDocument();
  });

  it('shows no errors with valid data', () => {
    const validData: CustomerInfo = {
      name: 'João Silva',
      phone: '73999999999'
    };
    
    render(<CustomerInfoForm onCustomerInfoChange={mockOnCustomerInfoChange} initialData={validData} />);
    
    expect(screen.queryByText('Nome é obrigatório')).not.toBeInTheDocument();
    expect(screen.queryByText('WhatsApp é obrigatório')).not.toBeInTheDocument();
    expect(screen.queryByText('DDD inválido')).not.toBeInTheDocument();
  });

  it('displays form validation status correctly', () => {
    render(<CustomerInfoForm onCustomerInfoChange={mockOnCustomerInfoChange} />);
    
    const validationStatus = screen.getByTestId('form-valid');
    
    // Initially invalid (empty fields)
    expect(validationStatus).toHaveValue('false');
  });

  it('initializes with provided initial data', () => {
    const initialData: CustomerInfo = {
      name: 'Maria Santos',
      phone: '11987654321'
    };
    
    render(
      <CustomerInfoForm 
        onCustomerInfoChange={mockOnCustomerInfoChange} 
        initialData={initialData}
      />
    );
    
    expect(screen.getByDisplayValue('Maria Santos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('11987654321')).toBeInTheDocument();
  });

  it('shows helpful text for phone input', () => {
    render(<CustomerInfoForm onCustomerInfoChange={mockOnCustomerInfoChange} />);
    
    expect(screen.getByPlaceholderText('73999999999')).toBeInTheDocument();
    expect(screen.getByText('* Campos obrigatórios')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <CustomerInfoForm 
        onCustomerInfoChange={mockOnCustomerInfoChange} 
        className="custom-class"
      />
    );
    
    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('phone input has correct attributes for numeric input', () => {
    render(<CustomerInfoForm onCustomerInfoChange={mockOnCustomerInfoChange} />);
    
    const phoneInput = screen.getByLabelText(/WhatsApp/);
    expect(phoneInput).toHaveAttribute('type', 'tel');
    expect(phoneInput).toHaveAttribute('maxLength', '11');
  });
});