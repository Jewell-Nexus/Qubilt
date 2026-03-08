import { contactInitials, hashColor } from '../lib/format';

interface ContactAvatarProps {
  contact: { id: string; firstName?: string | null; lastName?: string | null } | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-12 h-12 text-base',
};

export function ContactAvatar({ contact, size = 'md', className }: ContactAvatarProps) {
  const initials = contactInitials(contact);
  const bg = contact ? hashColor(contact.id) : '#9CA3AF';

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full text-white font-medium flex-shrink-0 ${SIZES[size]} ${className ?? ''}`}
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  );
}
