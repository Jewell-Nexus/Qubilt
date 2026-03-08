import { useEffect, useMemo } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CharacterCount from '@tiptap/extension-character-count';
import { common, createLowlight } from 'lowlight';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuthStore } from '@/stores/auth.store';
import EditorToolbar from './EditorToolbar';
import { CalloutExtension } from './CalloutBlock';
import SlashMenu from './SlashMenu';

const lowlight = createLowlight(common);

const CURSOR_COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688',
  '#4CAF50', '#FF9800', '#FF5722', '#795548',
];

function randomColor() {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)] ?? '#2196F3';
}

interface WikiEditorProps {
  pageId: string;
  initialContent?: unknown;
  isLocked?: boolean;
}

export default function WikiEditor({ pageId, isLocked }: WikiEditorProps) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Create Y.js doc and provider per pageId
  const { ydoc, provider } = useMemo(() => {
    const doc = new Y.Doc();
    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:3001') + '/wiki-collab';
    const prov = new WebsocketProvider(wsUrl, pageId, doc, {
      params: { token: accessToken ?? '' },
      connect: true,
    });

    // Set user awareness
    prov.awareness.setLocalStateField('user', {
      name: user?.displayName ?? 'Anonymous',
      color: randomColor(),
    });

    return { ydoc: doc, provider: prov };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  // Cleanup on unmount or pageId change
  useEffect(() => {
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Collaboration handles undo/redo
        codeBlock: false, // We use CodeBlockLowlight instead
        heading: { levels: [1, 2, 3] },
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: user?.displayName ?? 'Anonymous',
          color: randomColor(),
        },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      CalloutExtension,
    ],
    editable: !isLocked,
    editorProps: {
      attributes: {
        class: 'outline-none prose prose-sm max-w-none',
      },
    },
    immediatelyRender: false,
  }, [pageId]);

  // Update editable state when lock changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isLocked);
    }
  }, [editor, isLocked]);

  if (!editor) return null;

  return (
    <div>
      {/* Fixed toolbar */}
      <EditorToolbar editor={editor} />

      {/* Bubble menu on text selection */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="flex items-center gap-0.5 bg-surface-overlay shadow-3 rounded-lg border border-border-default px-1 py-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            label="B"
            bold
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            label="I"
            italic
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            label="S"
            strike
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            label="<>"
          />
        </div>
      </BubbleMenu>

      {/* Slash command menu */}
      <SlashMenu editor={editor} />

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  bold,
  italic,
  strike,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
          : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'
      } ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''} ${strike ? 'line-through' : ''}`}
    >
      {label}
    </button>
  );
}
