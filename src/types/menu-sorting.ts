// Type definitions for menu product sorting feature

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  available: boolean;
  image_url: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
}

export interface DragItem {
  id: string;
  index: number;
  categoryId: string;
}

export interface SortOrderUpdate {
  id: string;
  sort_order: number;
}

export interface UseSortingModeReturn {
  isSortingMode: boolean;
  toggleSortingMode: () => void;
  enableSortingMode: () => void;
  disableSortingMode: () => void;
}
