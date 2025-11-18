import { supabase } from "@/integrations/supabase/client";

export interface WaiterInfo {
  id: string;
  full_name: string;
  email: string;
  display_name?: string;
}

// Cache for waiter information to avoid repeated API calls
const waiterCache = new Map<string, WaiterInfo>();

/**
 * Fetch waiter information by ID
 * Uses caching to minimize API calls
 */
export async function fetchWaiterInfo(waiterId: string): Promise<WaiterInfo | null> {
  // Check cache first
  if (waiterCache.has(waiterId)) {
    return waiterCache.get(waiterId)!;
  }

  try {
    // Query profiles table directly for waiter information
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, display_name')
      .eq('id', waiterId)
      .eq('role', 'waiter')
      .single();

    if (error) {
      console.error('Error fetching waiter info:', error);
      return null;
    }

    if (data) {
      const waiter: WaiterInfo = {
        id: data.id,
        full_name: data.full_name || data.email,
        email: data.email,
        display_name: data.display_name
      };
      
      // Cache the result
      waiterCache.set(waiterId, waiter);
      return waiter;
    }

    return null;
  } catch (error) {
    console.error('Error fetching waiter info:', error);
    return null;
  }
}

/**
 * Fetch multiple waiters at once and cache them
 */
export async function fetchAllWaiters(): Promise<WaiterInfo[]> {
  try {
    // Query profiles table directly for all waiters
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, display_name')
      .eq('role', 'waiter')
      .order('full_name');

    if (error) {
      // Silently handle RLS permission errors - not critical for cashier functionality
      if (error.code !== 'PGRST301') {
        console.warn('Unable to fetch waiters list:', error.message);
      }
      return [];
    }

    const waiters: WaiterInfo[] = (data || []).map(w => ({
      id: w.id,
      full_name: w.full_name || w.email,
      email: w.email,
      display_name: w.display_name
    }));
    
    // Cache all waiters
    waiters.forEach((waiter: WaiterInfo) => {
      waiterCache.set(waiter.id, waiter);
    });

    return waiters;
  } catch (error) {
    // Silently handle errors - waiter list is optional for cashier
    return [];
  }
}

/**
 * Clear the waiter cache
 */
export function clearWaiterCache(): void {
  waiterCache.clear();
}

/**
 * Get waiter name from cache or return a placeholder
 * Prefers display_name over full_name for better identification
 */
export function getWaiterName(waiterId: string | null): string {
  if (!waiterId) {
    return 'Cliente';
  }

  const waiter = waiterCache.get(waiterId);
  // Fallback chain: display_name → full_name → 'Garçom'
  return waiter?.display_name || waiter?.full_name || 'Garçom';
}
