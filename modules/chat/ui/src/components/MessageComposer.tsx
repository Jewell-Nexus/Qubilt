import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import {
  Bold,
  Italic,
  Code,
  Link,
  List,
  ListOrdered,
  FileCode2,
  Paperclip,
  SendHorizontal,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth.store';
import { getChatSocket } from '../lib/chat-socket';
import { useSendTyping, useStopTyping } from '../hooks/use-chat-socket';
import { useChatStore } from '../hooks/use-chat-store';
import type { ChatMessage, TypingUser } from '../types/chat.types';

interface MessageComposerProps {
  channelId: string;
  channelName: string;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  threadId?: string;
  placeholder?: string;
}

export default function MessageComposer({
  channelId,
  channelName,
  editingMessage,
  onCancelEdit,
  threadId,
  placeholder,
}: MessageComposerProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const sendTyping = useSendTyping(channelId);
  const stopTyping = useStopTyping(channelId);
  const typingUsers = useChatStore((s) => s.typingUsers[channelId] ?? []);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: placeholder ?? `Message #${channelName}`,
      }),
      Mention.configure({
        HTMLAttributes: { class: 'text-accent-default font-medium' },
        suggestion: {
          char: '@',
          items: (_opts: { query: string }) => {
            // TODO: Wire up workspace member search
            return Promise.resolve([]);
          },
          render: () => ({
            onStart: () => {},
            onUpdate: () => {},
            onKeyDown: () => false,
            onExit: () => {},
          }),
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[40px] max-h-[200px] overflow-y-auto px-3 py-2 text-sm text-text-primary',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSend();
          return true;
        }
        return false;
      },
    },
    onUpdate: () => {
      sendTyping();
    },
  });

  // Set content when editing
  useEffect(() => {
    if (editingMessage && editor) {
      if (editingMessage.content && typeof editingMessage.content === 'object') {
        editor.commands.setContent(editingMessage.content as Record<string, unknown>);
      } else {
        editor.commands.setContent(editingMessage.textContent);
      }
      editor.commands.focus('end');
    }
  }, [editingMessage, editor]);

  // Handle arrow up on empty editor to edit last own message
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' && editor.isEmpty) {
        // TODO: Find last own message and trigger edit
      }
    };

    const dom = editor.view.dom;
    dom.addEventListener('keydown', handleKeyDown);
    return () => dom.removeEventListener('keydown', handleKeyDown);
  }, [editor, userId]);

  const handleSend = useCallback(() => {
    if (!editor || editor.isEmpty) return;

    const socket = getChatSocket();
    if (!socket?.connected) return;

    const content = editor.getJSON();
    const textContent = editor.getText();

    if (editingMessage) {
      socket.emit('message:edit', {
        messageId: editingMessage.id,
        content,
        textContent,
      });
      onCancelEdit?.();
    } else {
      socket.emit('message:send', {
        channelId,
        content,
        textContent,
        threadId,
      });
    }

    editor.commands.clearContent();
    stopTyping();
  }, [editor, channelId, threadId, editingMessage, onCancelEdit, stopTyping]);

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const isEmpty = !editor || editor.isEmpty;

  return (
    <div className="border-t border-border-default px-4 pb-3 pt-2">
      {/* Edit banner */}
      {editingMessage && (
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1 px-1">
          <span>Editing message</span>
          <button onClick={onCancelEdit} className="hover:text-text-primary">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-surface-raised border border-border-default rounded px-2 py-1 text-xs text-text-secondary"
            >
              <span className="truncate max-w-[120px]">{file.name}</span>
              <button onClick={() => removeAttachment(i)} className="hover:text-text-primary">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="border border-border-default rounded-lg bg-surface-default focus-within:border-accent-default transition-colors">
        <EditorContent editor={editor} />

        {/* Toolbar */}
        <div className="flex items-center justify-between border-t border-border-subtle px-2 py-1">
          <div className="flex items-center gap-0.5">
            <ToolbarButton
              icon={Bold}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive('bold')}
            />
            <ToolbarButton
              icon={Italic}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive('italic')}
            />
            <ToolbarButton
              icon={Code}
              onClick={() => editor?.chain().focus().toggleCode().run()}
              active={editor?.isActive('code')}
            />
            <ToolbarButton
              icon={Link}
              onClick={() => {
                const url = window.prompt('URL');
                if (url) editor?.chain().focus().setMark('link', { href: url }).run();
              }}
            />
            <div className="w-px h-4 bg-border-default mx-1" />
            <ToolbarButton
              icon={List}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive('bulletList')}
            />
            <ToolbarButton
              icon={ListOrdered}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive('orderedList')}
            />
            <ToolbarButton
              icon={FileCode2}
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              active={editor?.isActive('codeBlock')}
            />
            <div className="w-px h-4 bg-border-default mx-1" />
            <ToolbarButton icon={Paperclip} onClick={handleAttachFile} />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={isEmpty}
            className={cn(
              'p-1.5 rounded transition-colors',
              isEmpty
                ? 'text-text-tertiary cursor-not-allowed'
                : 'text-white bg-[color:var(--module-chat-accent,#10B981)] hover:opacity-90',
            )}
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Typing indicator */}
      <TypingIndicator users={typingUsers} />
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover',
        active && 'text-accent-default bg-accent-subtle',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function TypingIndicator({ users }: { users: TypingUser[] }) {
  if (users.length === 0) return <div className="h-5" />;

  let text: string;
  if (users.length === 1) {
    text = `${users[0]!.name} is typing...`;
  } else if (users.length === 2) {
    text = `${users[0]!.name} and ${users[1]!.name} are typing...`;
  } else {
    text = `${users[0]!.name} and ${users.length - 1} others are typing...`;
  }

  return (
    <div className="h-5 flex items-center px-1">
      <span className="text-xs text-text-tertiary animate-pulse">{text}</span>
    </div>
  );
}
