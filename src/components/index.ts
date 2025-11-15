// Waiter Panel Components
export { default as CustomerInfoForm } from './CustomerInfoForm';
export { default as OrderNotesInput } from './OrderNotesInput';
export { default as PIXQRGenerator } from './PIXQRGenerator';
export { default as AdminWaiterReports } from './AdminWaiterReports';
export type { CustomerInfo } from './CustomerInfoForm';

// Commission Components
export { CommissionDisplay } from './CommissionDisplay';
export { CommissionCards } from './CommissionCards';
export { CommissionToggle } from './CommissionToggle';
export { MobileOrderCard } from './MobileOrderCard';
export { OrderEditModal } from './OrderEditModal';
export { OrderItemRow } from './OrderItemRow';
export type { OrderItem } from './OrderItemRow';

// Status Components
export { StatusBadge, getOrderStatusLabel, getPaymentStatusLabel } from './StatusBadge';
export type { OrderStatus, PaymentStatus } from './StatusBadge';

// Header Components
export { UniformHeader } from './UniformHeader';

// Existing components
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as OrderDetailsDialog } from './OrderDetailsDialog';
export { default as OrderEditDialog } from './OrderEditDialog';
export { default as RealtimeNotifications } from './RealtimeNotifications';
export { default as NotificationControls } from './NotificationControls';
export { default as ProductionMonitoring } from './ProductionMonitoring';
export { default as ConnectionMonitor } from './ConnectionMonitor';