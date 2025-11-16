import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export interface CustomerInfo {
  name: string;
  phone: string;
}

interface CustomerInfoFormProps {
  onCustomerInfoChange: (info: CustomerInfo) => void;
  initialData?: CustomerInfo;
  className?: string;
}

const CustomerInfoForm = ({ onCustomerInfoChange, initialData, className }: CustomerInfoFormProps) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: initialData?.name || "",
    phone: initialData?.phone || ""
  });

  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});

  // Validate name
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return "Nome é obrigatório";
    }
    if (name.trim().length < 2) {
      return "Nome deve ter pelo menos 2 caracteres";
    }
    return undefined;
  };

  // Validate phone number (11 digits with DDD)
  const validatePhone = (phone: string): string | undefined => {
    const phoneDigits = phone.replace(/\D/g, '');
    
    if (!phoneDigits) {
      return "WhatsApp é obrigatório";
    }
    
    if (phoneDigits.length !== 11) {
      return "WhatsApp deve ter 11 dígitos (DDD + número)";
    }
    
    // Basic DDD validation (11-99)
    const ddd = phoneDigits.substring(0, 2);
    const dddNumber = parseInt(ddd);
    if (dddNumber < 11 || dddNumber > 99) {
      return "DDD inválido";
    }
    
    return undefined;
  };

  // Update customer info and validate
  const updateCustomerInfo = (field: keyof CustomerInfo, value: string) => {
    const updatedInfo = { ...customerInfo, [field]: value };
    setCustomerInfo(updatedInfo);

    // Validate the specific field
    const newErrors = { ...errors };
    
    if (field === 'name') {
      const nameError = validateName(value);
      if (nameError) {
        newErrors.name = nameError;
      } else {
        delete newErrors.name;
      }
    }
    
    if (field === 'phone') {
      const phoneError = validatePhone(value);
      if (phoneError) {
        newErrors.phone = phoneError;
      } else {
        delete newErrors.phone;
      }
    }
    
    setErrors(newErrors);
    
    // Call parent callback with updated info and validation status
    onCustomerInfoChange(updatedInfo);
  };

  // Handle phone input formatting (only numbers)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    updateCustomerInfo('phone', value);
  };

  // Validate all fields and update parent on mount and when initialData changes
  useEffect(() => {
    const nameError = validateName(customerInfo.name);
    const phoneError = validatePhone(customerInfo.phone);
    
    setErrors({
      ...(nameError && { name: nameError }),
      ...(phoneError && { phone: phoneError })
    });
    
    onCustomerInfoChange(customerInfo);
  }, [customerInfo, onCustomerInfoChange]);

  // Check if form is valid
  const isValid = !errors.name && !errors.phone && customerInfo.name.trim() && customerInfo.phone.trim();

  return (
    <Card className={`p-6 shadow-lg border-2 border-cyan-100 rounded-2xl ${className || ''}`}>
      <h2 className="font-bold text-xl mb-2 text-purple-900">Informe seu nome e telefone</h2>
      <p className="text-sm text-muted-foreground mb-4">💬 Atualizações via WhatsApp</p>
      
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-3 top-3 text-xl leading-none flex items-center h-10">
            👤
          </div>
          <Input
            id="customer-name"
            type="text"
            placeholder="Digite seu nome"
            value={customerInfo.name}
            onChange={(e) => updateCustomerInfo('name', e.target.value)}
            className={`pl-12 h-10 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            aria-label="Nome"
          />
          {errors.name && (
            <p id="name-error" className="text-sm font-medium text-red-600 mt-1">
              {errors.name}
            </p>
          )}
        </div>

        <div className="relative">
          <div className="absolute left-3 top-3 text-xl leading-none flex items-center h-10">
            📱
          </div>
          <Input
            id="customer-phone"
            type="tel"
            placeholder="DDD + Telefone"
            value={customerInfo.phone}
            onChange={handlePhoneChange}
            maxLength={11}
            className={`pl-12 h-10 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            aria-label="WhatsApp"
          />
          {errors.phone && (
            <p id="phone-error" className="text-sm font-medium text-red-600 mt-1">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Validation status indicator (hidden, for programmatic access) */}
        <input
          type="hidden"
          data-testid="form-valid"
          value={isValid ? "true" : "false"}
          readOnly
        />
      </div>
    </Card>
  );
};

export default CustomerInfoForm;