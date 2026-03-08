import { Node, mergeAttributes } from '@tiptap/react';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { cn } from '@/lib/cn';
import { Info, AlertTriangle, Lightbulb, ShieldAlert } from 'lucide-react';

const CALLOUT_STYLES = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-l-blue-500',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-l-amber-500',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  tip: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-l-green-500',
    icon: Lightbulb,
    iconColor: 'text-green-500',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-l-red-500',
    icon: ShieldAlert,
    iconColor: 'text-red-500',
  },
} as const;

type CalloutType = keyof typeof CALLOUT_STYLES;
const TYPES: CalloutType[] = ['info', 'warning', 'tip', 'danger'];

function CalloutComponent(props: any) {
  const { node, updateAttributes } = props;
  const type: CalloutType = node.attrs.type || 'info';
  const style = CALLOUT_STYLES[type] ?? CALLOUT_STYLES.info;
  const IconComponent = style.icon;

  const cycleType = () => {
    const currentIndex = TYPES.indexOf(type);
    const nextType = TYPES[(currentIndex + 1) % TYPES.length] ?? 'info';
    updateAttributes({ type: nextType });
  };

  return (
    <NodeViewWrapper>
      <div className={cn('border-l-4 rounded-r-md px-4 py-3 my-3 relative', style.bg, style.border)}>
        <div className="flex items-start gap-3">
          <button
            onClick={cycleType}
            className={cn('shrink-0 mt-0.5', style.iconColor)}
            contentEditable={false}
            title="Change callout type"
          >
            <IconComponent size={16} />
          </button>
          <NodeViewContent className="flex-1 min-w-0" />
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const CalloutExtension = Node.create({
  name: 'callout',
  group: 'block',
  content: 'paragraph+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-callout-type') || 'info',
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-callout-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout-type]' }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'callout' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },
});
