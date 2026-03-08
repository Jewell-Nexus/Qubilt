import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/cn';
import { UserCircle, X } from 'lucide-react';
import type { User } from '../types/pm.types';

interface UserPickerProps {
  value: User | null;
  onChange: (user: User | null) => void;
  users: User[];
  placeholder?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserPicker({ value, onChange, users, placeholder = 'Unassigned' }: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return users;
    const lower = search.toLowerCase();
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower),
    );
  }, [users, search]);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(''); }}>
      <PopoverTrigger
        render={<button type="button" />}
        className="flex items-center gap-2 text-sm text-left min-w-0 hover:opacity-80 transition-opacity duration-[var(--duration-fast)]"
      >
        {value ? (
          <>
            <Avatar className="w-5 h-5 flex-shrink-0">
              {value.avatarUrl && <AvatarImage src={value.avatarUrl} alt={value.displayName} />}
              <AvatarFallback className="text-[9px] bg-accent-subtle text-accent-subtle-text">
                {getInitials(value.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-text-primary">{value.displayName}</span>
          </>
        ) : (
          <>
            <UserCircle size={16} className="text-text-tertiary flex-shrink-0" />
            <span className="text-text-tertiary">{placeholder}</span>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b border-border-default">
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {/* Unassigned option */}
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors duration-[var(--duration-fast)]',
              !value
                ? 'bg-accent-subtle text-accent-subtle-text'
                : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
            )}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            <X size={14} className="text-text-tertiary flex-shrink-0" />
            Unassigned
          </button>

          {filtered.map((user) => (
            <button
              key={user.id}
              type="button"
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors duration-[var(--duration-fast)]',
                value?.id === user.id
                  ? 'bg-accent-subtle text-accent-subtle-text'
                  : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
              )}
              onClick={() => {
                onChange(user);
                setOpen(false);
              }}
            >
              <Avatar className="w-5 h-5 flex-shrink-0">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
                <AvatarFallback className="text-[9px] bg-accent-subtle text-accent-subtle-text">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{user.displayName}</span>
            </button>
          ))}

          {filtered.length === 0 && (
            <p className="px-2 py-3 text-sm text-text-tertiary text-center">No members found</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
