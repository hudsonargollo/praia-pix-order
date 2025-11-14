/**
 * Formats order number for display
 * @param order - Order object with order_number or id
 * @param includeLabel - Whether to include "Pedido" label
 * @returns Formatted order number string
 */
export function formatOrderNumber(
  order: { order_number?: number; id: string }, 
  includeLabel: boolean = true
): string {
  // Use order_number if available, otherwise fallback to short UUID
  const number = order.order_number ? order.order_number.toString() : order.id.substring(0, 8);
  return includeLabel ? `Pedido #${number}` : `#${number}`;
}
/**
 * Determines if an order can be edited by a waiter
 * @param order - Order object with status
 * @returns True if order can be edited, false otherwise
 */
export function canEditOrder(order: { status: string }): boolean {
  // Allow editing for pending and in_preparation orders only
  const editableStatuses = ['pending', 'in_preparation'];
  return editableStatuses.includes(order.status.toLowerCase());
}
