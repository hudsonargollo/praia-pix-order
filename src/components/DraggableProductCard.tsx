import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { MenuItem } from '@/types/menu-sorting';

interface DraggableProductCardProps {
  item: MenuItem;
  isSortingMode: boolean;
  children: React.ReactNode;
}

export const DraggableProductCard = ({
  item,
  isSortingMode,
  children
}: DraggableProductCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id: item.id,
    disabled: !isSortingMode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!isSortingMode) {
    return <>{children}</>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative transition-all duration-200
        ${isDragging ? 'z-50 opacity-60 scale-105 shadow-2xl ring-2 ring-purple-400' : ''}
        ${isOver && !isDragging ? 'ring-2 ring-purple-300 ring-offset-2' : ''}
      `}
    >
      {/* Drop indicator - shows where item will be placed */}
      {isOver && !isDragging && (
        <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
      )}
      
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing p-2 bg-white rounded-lg shadow-md hover:bg-purple-50 hover:shadow-lg transition-all duration-200 group"
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
      </div>
      
      {/* Product Card with disabled state */}
      <div className={`${isSortingMode ? 'pl-12' : ''} ${isDragging ? 'bg-purple-50' : ''}`}>
        {children}
      </div>
    </div>
  );
};
