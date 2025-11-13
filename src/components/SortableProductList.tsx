import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragCancelEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { MenuItem } from '@/types/menu-sorting';

interface SortableProductListProps {
  items: MenuItem[];
  categoryId: string;
  onReorder: (startIndex: number, endIndex: number) => void;
  children: React.ReactNode;
}

export const SortableProductList = ({
  items,
  categoryId,
  onReorder,
  children
}: SortableProductListProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const item = items.find(i => i.id === active.id);
    const position = items.findIndex(i => i.id === active.id) + 1;
    
    if (item) {
      setAnnouncement(`Arrastando ${item.name}, posição ${position} de ${items.length}`);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeIndex = items.findIndex(i => i.id === active.id);
      const overIndex = items.findIndex(i => i.id === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        setAnnouncement(`Movendo para posição ${overIndex + 1} de ${items.length}`);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      setAnnouncement('Arrasto cancelado');
      return;
    }

    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);

    const item = items[oldIndex];
    if (item) {
      setAnnouncement(`${item.name} movido para posição ${newIndex + 1}`);
    }

    onReorder(oldIndex, newIndex);
    setActiveId(null);
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    setActiveId(null);
    setAnnouncement('Arrasto cancelado');
  };

  const activeItem = activeId ? items.find(item => item.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{
        announcements: {
          onDragStart: () => announcement,
          onDragOver: () => announcement,
          onDragEnd: () => announcement,
          onDragCancel: () => announcement,
        },
      }}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div role="list" aria-label="Lista de produtos ordenável">
          {children}
        </div>
      </SortableContext>
      
      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </DndContext>
  );
};
