import { useState, useCallback } from 'react';
import { UseSortingModeReturn } from '@/types/menu-sorting';

export const useSortingMode = (): UseSortingModeReturn => {
  const [isSortingMode, setIsSortingMode] = useState(false);

  const toggleSortingMode = useCallback(() => {
    setIsSortingMode(prev => !prev);
  }, []);

  const enableSortingMode = useCallback(() => {
    setIsSortingMode(true);
  }, []);

  const disableSortingMode = useCallback(() => {
    setIsSortingMode(false);
  }, []);

  return {
    isSortingMode,
    toggleSortingMode,
    enableSortingMode,
    disableSortingMode,
  };
};
