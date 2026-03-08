import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { WidgetContainer } from '@/pages/dashboard/WidgetContainer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface WidgetConfig {
  id: string;
  moduleId: string;
  accentColor: string;
  title: string;
  gridPos: { col: number; row: number; colSpan: number; rowSpan: number };
}

export function MyPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setWidgets((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  // Empty widget placeholder component
  function EmptyWidget() {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">My Page</h1>
          <p className="text-sm text-text-secondary">Your personal dashboard.</p>
        </div>
        <Button variant="outline" onClick={() => setPickerOpen(true)}>
          <Plus size={14} />
          Add Widget
        </Button>
      </div>

      {widgets.length === 0 ? (
        <div className="grid grid-cols-12 gap-4" style={{ gridAutoRows: '160px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="col-span-4 flex items-center justify-center rounded-lg border-2 border-dashed border-border-default text-text-tertiary hover:border-accent-default hover:text-accent-default transition-colors cursor-pointer"
              onClick={() => setPickerOpen(true)}
            >
              <div className="flex flex-col items-center gap-2">
                <Plus size={20} />
                <span className="text-sm">Add widget</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-12 gap-4" style={{ gridAutoRows: '160px' }}>
              {widgets.map((widget) => (
                <WidgetContainer
                  key={widget.id}
                  widgetId={widget.id}
                  moduleId={widget.moduleId}
                  accentColor={widget.accentColor}
                  title={widget.title}
                  component={EmptyWidget}
                  gridPos={widget.gridPos}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-text-secondary text-center">
              No widgets available yet. Widgets will be provided by enabled modules.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
