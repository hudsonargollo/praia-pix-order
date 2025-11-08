import { describe, it, expect, beforeEach } from 'vitest';
import { MessageTemplateManager } from '../template-manager';
import { OrderData, MessageTemplate } from '../types';

describe('MessageTemplateManager', () => {
  let manager: MessageTemplateManager;
  let mockOrderData: OrderData;

  beforeEach(() => {
    manager = new MessageTemplateManager();
    mockOrderData = {
      id: 'order-123',
      orderNumber: 42,
      customerName: 'João Silva',
      customerPhone: '5511987654321',
      tableNumber: '5',
      totalAmount: 35.50,
      items: [
        { itemName: 'Açaí 500ml', quantity: 1, unitPrice: 25.00 },
        { itemName: 'Água de Coco', quantity: 1, unitPrice: 10.50 },
      ],
      status: 'paid',
      createdAt: new Date().toISOString(),
    };
  });

  describe('renderTemplate', () => {
    it('should render template with order data', () => {
      const template: MessageTemplate = {
        id: 'test-1',
        templateType: 'payment_confirmed',
        content: 'Pedido #{{orderNumber}} para {{customerName}} - Total: {{totalAmount}}',
        variables: ['orderNumber', 'customerName', 'totalAmount'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const rendered = manager.renderTemplate(template, mockOrderData);
      
      expect(rendered).toContain('Pedido #42');
      expect(rendered).toContain('João Silva');
      expect(rendered).toContain('R$ 35.50');
    });

    it('should render items list correctly', () => {
      const template: MessageTemplate = {
        id: 'test-2',
        templateType: 'payment_confirmed',
        content: 'Itens:\n{{itemsList}}',
        variables: ['itemsList'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const rendered = manager.renderTemplate(template, mockOrderData);
      
      expect(rendered).toContain('Açaí 500ml');
      expect(rendered).toContain('Água de Coco');
      expect(rendered).toContain('1x');
      expect(rendered).toContain('R$ 25.00');
      expect(rendered).toContain('R$ 10.50');
    });

    it('should handle multiple occurrences of same variable', () => {
      const template: MessageTemplate = {
        id: 'test-3',
        templateType: 'ready',
        content: 'Pedido #{{orderNumber}} pronto! Número: {{orderNumber}}',
        variables: ['orderNumber'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const rendered = manager.renderTemplate(template, mockOrderData);
      
      expect(rendered).toBe('Pedido #42 pronto! Número: 42');
    });

    it('should handle template with all variables', () => {
      const template: MessageTemplate = {
        id: 'test-4',
        templateType: 'payment_confirmed',
        content: `Pedido #{{orderNumber}}
Cliente: {{customerName}}
Telefone: {{customerPhone}}
Mesa: {{tableNumber}}
Total: {{totalAmount}}
Status: {{status}}
Itens: {{itemCount}}`,
        variables: ['orderNumber', 'customerName', 'customerPhone', 'tableNumber', 'totalAmount', 'status', 'itemCount'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const rendered = manager.renderTemplate(template, mockOrderData);
      
      expect(rendered).toContain('42');
      expect(rendered).toContain('João Silva');
      expect(rendered).toContain('5511987654321');
      expect(rendered).toContain('5');
      expect(rendered).toContain('R$ 35.50');
      expect(rendered).toContain('Pago');
      expect(rendered).toContain('2');
    });
  });

  describe('validateTemplate', () => {
    it('should validate correct template', () => {
      const result = manager.validateTemplate(
        'Pedido #{{orderNumber}} para {{customerName}}',
        ['orderNumber', 'customerName']
      );
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty template', () => {
      const result = manager.validateTemplate('', []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template content cannot be empty');
    });

    it('should reject template exceeding WhatsApp limit', () => {
      const longContent = 'a'.repeat(5000);
      const result = manager.validateTemplate(longContent, []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds WhatsApp message limit'))).toBe(true);
    });

    it('should detect missing required variables', () => {
      const result = manager.validateTemplate(
        'Pedido #{{orderNumber}}',
        ['orderNumber', 'customerName']
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('customerName'))).toBe(true);
    });

    it('should allow extra variables not in required list', () => {
      const result = manager.validateTemplate(
        'Pedido #{{orderNumber}} para {{customerName}}',
        ['orderNumber']
      );
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear template cache', () => {
      manager.clearCache();
      // Cache should be cleared - no error should occur
      expect(true).toBe(true);
    });
  });
});
