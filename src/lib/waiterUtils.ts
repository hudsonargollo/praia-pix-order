import { supabase } from "@/integrations/supabase/client";

export interface WaiterInfo {
  id: string;
  full_name: string;
  email: string;
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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No session available to fetch waiter info');
      return null;
    }

    // Call the list-waiters edge function to get waiter details
    const { data, error } = await supabase.functions.invoke('list-waiters', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Error fetching waiter info:', error);
      return null;
    }

    // Find the specific waiter
    const waiter = data?.waiters?.find((w: WaiterInfo) => w.id === waiterId);
    
    if (waiter) {
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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No session available to fetch waiters');
      return [];
    }

    const { data, error } = await supabase.functions.invoke('list-waiters', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (error) {
      console.error('Error fetching waiters:', error);
      return [];
    }

    const waiters = data?.waiters || [];
    
    // Cache all waiters
    waiters.forEach((waiter: WaiterInfo) => {
      waiterCache.set(waiter.id, waiter);
    });

    return waiters;
  } catch (error) {
    console.error('Error fetching waiters:', error);
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
 */
export function getWaiterName(waiterId: string | null): string {
  if (!waiterId) {
    return 'Cliente';
  }

  const waiter = waiterCache.get(waiterId);
  return waiter?.full_name || 'Garçom';
}
