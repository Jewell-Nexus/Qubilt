import type { ComponentType } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';

interface WidgetContainerProps {
  widgetId: string;
  moduleId: string;
  accentColor: string;
  title: string;
  component: ComponentType;
  gridPos: { col: number; row: number; colSpan: number; rowSpan: number };
}

export function WidgetContainer({
  widgetId,
  moduleId: _moduleId,
  accentColor,
  title,
  component: WidgetComponent,
  gridPos,
}: WidgetContainerProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widgetId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `${gridPos.col} / span ${gridPos.colSpan}`,
    gridRow: `${gridPos.row} / span ${gridPos.rowSpan}`,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-surface-raised shadow-[var(--shadow-1)] rounded-lg overflow-hidden border border-border-default"
    >
      <div
        className="h-0.5"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-default">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary"
        >
          <GripHorizontal size={14} />
        </button>
      </div>
      <div className="p-3">
        <WidgetComponent />
      </div>
    </div>
  );
}
