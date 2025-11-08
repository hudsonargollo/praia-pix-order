// Re-export all Supabase integrations
export { supabase } from './client';
export type { Database } from './types';
export { 
  realtimeService, 
  RealtimeService,
  type Order,
  type OrderItem,
  type OrderStatusType,
  type OrderUpdateCallback,
  type OrderInsertCallback,
  type OrderDeleteCallback
} from './realtime';