import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MenuItem, Category } from '@/types/menu-sorting';
import { SortableProductList } from './SortableProductList';
import { DraggableProductCard } from './DraggableProductCard';
import { useMenuSorting } from '@/hooks/useMenuSorting';

interface SortingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  items: MenuItem[];
  onSave: () => void;
}

export const SortingDialog = ({
  open,
  onOpenChange,
  category,
  items: initialItems,
  onSave
}: SortingDialogProps) => {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const { updateSortOrder, reorderItems, isSaving } = useMenuSorting();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleReorder = (startIndex: number, endIndex: number) => {
    const reordered = reorderItems(items, startIndex, endIndex);
    setItems(reordered);
  };

  const handleSave = async () => {
    const updates = items.map((item, index) => ({
      id: item.id,
      sort_order: index
    }));

    const success = await updateSortOrder(updates);
    if (success) {
      onSave();
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setItems(initialItems);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Organizar Ordem - {category.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Arraste os itens para reorganizar a ordem no cardápio
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <SortableProductList
            items={items}
            categoryId={category.id}
            onReorder={handleReorder}
          >
            <div className="space-y-3">
              {items.map((item) => (
                <DraggableProductCard
                  key={item.id}
                  item={item}
                  isSortingMode={true}
                >
                  <div className="bg-white rounded-lg p-4 shadow-sm border flex items-center gap-4">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-purple-600 font-bold">
                        R$ {item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </DraggableProductCard>
              ))}
            </div>
          </SortableProductList>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar Ordem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
