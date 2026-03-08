import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/cn';
import {
  Type, Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  Quote, Code, Minus, TableIcon, ImageIcon,
  AlertCircle, Lightbulb, AlertTriangle, ShieldAlert,
} from 'lucide-react';

interface SlashCommand {
  label: string;
  icon: React.ReactNode;
  group: string;
  aliases: string[];
  action: (editor: Editor) => void;
}

const COMMANDS: SlashCommand[] = [
  // Basic
  { label: 'Paragraph', icon: <Type size={15} />, group: 'Basic', aliases: ['text', 'paragraph'], action: (e) => e.chain().focus().setParagraph().run() },
  { label: 'Heading 1', icon: <Heading1 size={15} />, group: 'Basic', aliases: ['h1', 'heading'], action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: 'Heading 2', icon: <Heading2 size={15} />, group: 'Basic', aliases: ['h2'], action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: 'Heading 3', icon: <Heading3 size={15} />, group: 'Basic', aliases: ['h3'], action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  // Lists
  { label: 'Bulleted list', icon: <List size={15} />, group: 'Lists', aliases: ['bullet', 'ul'], action: (e) => e.chain().focus().toggleBulletList().run() },
  { label: 'Numbered list', icon: <ListOrdered size={15} />, group: 'Lists', aliases: ['number', 'ol', 'ordered'], action: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: 'Task list', icon: <ListChecks size={15} />, group: 'Lists', aliases: ['todo', 'check', 'task'], action: (e) => e.chain().focus().toggleTaskList().run() },
  // Content
  { label: 'Quote', icon: <Quote size={15} />, group: 'Content', aliases: ['blockquote', 'quote'], action: (e) => e.chain().focus().toggleBlockquote().run() },
  { label: 'Code block', icon: <Code size={15} />, group: 'Content', aliases: ['code', 'codeblock'], action: (e) => e.chain().focus().toggleCodeBlock().run() },
  { label: 'Divider', icon: <Minus size={15} />, group: 'Content', aliases: ['hr', 'line', 'separator'], action: (e) => e.chain().focus().setHorizontalRule().run() },
  { label: 'Table', icon: <TableIcon size={15} />, group: 'Content', aliases: ['table', 'grid'], action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  // Media
  { label: 'Image', icon: <ImageIcon size={15} />, group: 'Media', aliases: ['image', 'img', 'picture'], action: (e) => { const url = window.prompt('Image URL'); if (url) e.chain().focus().setImage({ src: url }).run(); } },
  // Callouts
  { label: 'Info callout', icon: <AlertCircle size={15} />, group: 'Callout', aliases: ['info', 'note'], action: (e) => e.chain().focus().insertContent({ type: 'callout', attrs: { type: 'info' }, content: [{ type: 'paragraph' }] }).run() },
  { label: 'Tip callout', icon: <Lightbulb size={15} />, group: 'Callout', aliases: ['tip', 'success'], action: (e) => e.chain().focus().insertContent({ type: 'callout', attrs: { type: 'tip' }, content: [{ type: 'paragraph' }] }).run() },
  { label: 'Warning callout', icon: <AlertTriangle size={15} />, group: 'Callout', aliases: ['warning', 'caution'], action: (e) => e.chain().focus().insertContent({ type: 'callout', attrs: { type: 'warning' }, content: [{ type: 'paragraph' }] }).run() },
  { label: 'Danger callout', icon: <ShieldAlert size={15} />, group: 'Callout', aliases: ['danger', 'error'], action: (e) => e.chain().focus().insertContent({ type: 'callout', attrs: { type: 'danger' }, content: [{ type: 'paragraph' }] }).run() },
];

interface SlashMenuProps {
  editor: Editor;
}

export default function SlashMenu({ editor }: SlashMenuProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter commands
  const filtered = query
    ? COMMANDS.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.aliases.some((a) => a.includes(query.toLowerCase())),
      )
    : COMMANDS;

  // Group filtered commands
  const groups = filtered.reduce<Record<string, SlashCommand[]>>((acc, cmd) => {
    (acc[cmd.group] ??= []).push(cmd);
    return acc;
  }, {});

  // Listen for "/" key in editor
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !open) {
        // Check if we're at the start of a line or after whitespace
        const { from } = editor.state.selection;
        const textBefore = editor.state.doc.textBetween(
          Math.max(0, from - 1), from, '\n',
        );

        if (from === 1 || textBefore === '' || textBefore === '\n' || textBefore === ' ') {
          // Get cursor position for menu placement
          const coords = editor.view.coordsAtPos(from);
          setPosition({
            top: coords.bottom + 4,
            left: coords.left,
          });
          setOpen(true);
          setQuery('');
          setSelectedIndex(0);
          // Don't prevent default — let "/" appear in editor, we'll delete it on command selection
        }
      }
    };

    const el = editor.view.dom;
    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [editor, open]);

  // Handle typing while menu is open
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const cmd = filtered[selectedIndex];
        if (cmd) {
          selectCommand(cmd);
        }
        return;
      }
      if (event.key === 'Backspace') {
        if (query.length === 0) {
          setOpen(false);
        } else {
          setQuery((q) => q.slice(0, -1));
          setSelectedIndex(0);
        }
        return;
      }
      if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
        setQuery((q) => q + event.key);
        setSelectedIndex(0);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, query, filtered, selectedIndex]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectCommand = useCallback((cmd: SlashCommand) => {
    // Delete the "/" and any typed query from the editor
    const { from } = editor.state.selection;
    const deleteFrom = from - query.length - 1; // -1 for "/"
    if (deleteFrom >= 0) {
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
    }
    cmd.action(editor);
    setOpen(false);
  }, [editor, query]);

  if (!open || filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-surface-overlay shadow-3 rounded-lg border border-border-default max-h-72 overflow-y-auto w-64 py-1"
      style={{ top: position.top, left: position.left }}
    >
      {Object.entries(groups).map(([group, cmds]) => (
        <div key={group}>
          <div className="px-3 py-1.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
            {group}
          </div>
          {cmds.map((cmd) => {
            const globalIndex = filtered.indexOf(cmd);
            return (
              <button
                key={cmd.label}
                onClick={() => selectCommand(cmd)}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-left transition-colors',
                  globalIndex === selectedIndex
                    ? 'bg-surface-sunken text-text-primary'
                    : 'text-text-secondary hover:bg-surface-sunken',
                )}
              >
                <span className="text-text-tertiary shrink-0">{cmd.icon}</span>
                {cmd.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
