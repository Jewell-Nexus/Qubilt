import { useEffect, useRef } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div ref={containerRef} className="absolute bottom-full right-0 mb-2 z-50">
      <Picker
        data={data}
        onEmojiSelect={(emoji: { native: string }) => {
          onSelect(emoji.native);
          onClose();
        }}
        theme="auto"
        previewPosition="none"
        skinTonePosition="none"
        maxFrequentRows={1}
      />
    </div>
  );
}
