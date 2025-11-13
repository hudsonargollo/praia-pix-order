import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MenuItem, SortOrderUpdate } from '@/types/menu-sorting';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useMenuSorting = () => {
  const [isSaving, setIsSaving] = useState(false);

  const updateSortOrder = useCallback(async (updates: SortOrderUpdate[], retryCount = 0): Promise<boolean> => {
    setIsSaving(true);
    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Sessão expirada. Por favor, faça login novamente.', {
          duration: 4000,
          action: {
            label: 'Login',
            onClick: () => window.location.href = '/auth'
          }
        });
        return false;
      }

      const { error } = await supabase.rpc('update_menu_items_sort_order', {
        item_updates: updates as any
      });

      if (error) {
        // Handle specific error types
        if (error.message?.includes('Only admins can update sort order')) {
          toast.error('Acesso negado. Apenas administradores podem reordenar produtos.', {
            duration: 4000,
          });
          return false;
        }
        
        if (error.message?.includes('JWT')) {
          toast.error('Sessão expirada. Por favor, faça login novamente.', {
            duration: 4000,
            action: {
              label: 'Login',
              onClick: () => window.location.href = '/auth'
            }
          });
          return false;
        }
        
        throw error;
      }

      toast.success('Ordem salva! ✓', {
        duration: 2000,
        style: {
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
        }
      });

      return true;
    } catch (error: any) {
      console.error('Error updating sort order:', error);
      
      // Check if it's a network error
      const isNetworkError = 
        error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.message?.includes('Failed to fetch') ||
        !navigator.onLine;

      if (isNetworkError && retryCount < MAX_RETRIES) {
        // Retry with exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        toast.loading(`Tentando novamente em ${delay / 1000}s... (${retryCount + 1}/${MAX_RETRIES})`, {
          duration: delay,
        });
        
        await sleep(delay);
        return updateSortOrder(updates, retryCount + 1);
      }

      if (isNetworkError) {
        toast.error('Erro de conexão. Verifique sua internet e tente novamente.', {
          duration: 4000,
          action: {
            label: 'Tentar novamente',
            onClick: () => updateSortOrder(updates, 0)
          }
        });
      } else {
        toast.error('Erro ao salvar ordem. Tente novamente.', {
          duration: 3000,
        });
      }
      
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const reorderItems = useCallback((
    items: MenuItem[],
    startIndex: number,
    endIndex: number
  ): MenuItem[] => {
    const result = Array.from(items);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    // Update sort_order for all items
    return result.map((item, index) => ({
      ...item,
      sort_order: index
    }));
  }, []);

  return {
    updateSortOrder,
    reorderItems,
    isSaving
  };
};
