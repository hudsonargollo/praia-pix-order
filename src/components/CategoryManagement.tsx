import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  display_order: number;
}

interface CategoryManagementProps {
  categories: Category[];
  onCategoriesChange: () => void;
}

export function CategoryManagement({ categories, onCategoriesChange }: CategoryManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_order: 0,
  });

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        display_order: category.display_order,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        display_order: categories.length,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', display_order: 0 });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('menu_categories')
          .update({
            name: formData.name.trim(),
            display_order: formData.display_order,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Categoria atualizada com sucesso!');
      } else {
        // Create new category with automatic reordering
        const newOrder = formData.display_order;
        
        // Check if there's already a category with this order number
        const conflictingCategories = categories.filter(
          cat => cat.display_order >= newOrder
        );

        if (conflictingCategories.length > 0) {
          // Shift all categories with order >= newOrder by 1
          for (const cat of conflictingCategories) {
            await supabase
              .from('menu_categories')
              .update({ display_order: cat.display_order + 1 })
              .eq('id', cat.id);
          }
        }

        // Insert the new category
        const { error } = await supabase
          .from('menu_categories')
          .insert({
            name: formData.name.trim(),
            display_order: newOrder,
          });

        if (error) throw error;
        toast.success('Categoria criada com sucesso!');
      }

      handleCloseDialog();
      onCategoriesChange();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      // Check if category has products
      const { data: products, error: checkError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('category_id', deletingCategory.id)
        .limit(1);

      if (checkError) throw checkError;

      if (products && products.length > 0) {
        toast.error('Não é possível excluir categoria com produtos. Mova os produtos primeiro.');
        setDeletingCategory(null);
        return;
      }

      // Delete category
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', deletingCategory.id);

      if (error) throw error;

      toast.success('Categoria excluída com sucesso!');
      setDeletingCategory(null);
      onCategoriesChange();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gerenciar Categorias</h3>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">Ordem: {category.display_order}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(category)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingCategory(category)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Açaí, Bebidas, Lanches"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Ordem de Exibição</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Categorias com menor número aparecem primeiro
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{deletingCategory?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
