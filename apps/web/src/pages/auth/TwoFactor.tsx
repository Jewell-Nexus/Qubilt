import { useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { post } from '@/lib/api';
import { useAuthStore, type User } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function TwoFactor() {
  const location = useLocation();
  const navigate = useNavigate();
  const tempToken = (location.state as { tempToken?: string })?.tempToken;

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [useBackup, setUseBackup] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no tempToken
  if (!tempToken) {
    navigate('/login', { replace: true });
    return null;
  }

  const submitCode = useCallback(
    async (code: string) => {
      setLoading(true);
      try {
        const data = await post<{
          accessToken: string;
          refreshToken: string;
          user: User;
        }>('/auth/2fa/verify', { token: code, tempToken });

        // Complete login
        useAuthStore.setState({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          isAuthenticated: true,
        });
        navigate('/dashboard');
      } catch {
        toast.error('Invalid code. Please try again.');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    },
    [tempToken, navigate],
  );

  const handleDigitChange = (index: number, value: string) => {
    // Handle paste
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...digits];
      pasted.forEach((d, i) => {
        if (index + i < 6) newDigits[index + i] = d;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      if (newDigits.every((d) => d !== '')) {
        submitCode(newDigits.join(''));
      }
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== '')) {
      submitCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleBackupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (backupCode.trim()) {
      submitCode(backupCode.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <ShieldCheck size={32} className="mx-auto text-accent-default" />
        <h2 className="text-xl font-semibold text-text-primary">Two-factor authentication</h2>
        <p className="text-sm text-text-secondary">
          {useBackup ? 'Enter a backup code' : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </div>

      {useBackup ? (
        <form onSubmit={handleBackupSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup">Backup code</Label>
            <Input
              id="backup"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              placeholder="xxxx-xxxx"
              className="text-center"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !backupCode.trim()}>
            {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
            Verify
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 h-12 text-center text-lg font-medium rounded-md
                           border border-border-default bg-surface-base text-text-primary
                           focus:border-border-focus focus:ring-2 focus:ring-accent-subtle
                           transition-colors duration-[var(--duration-fast)] outline-none"
                disabled={loading}
              />
            ))}
          </div>
          {loading && (
            <div className="flex justify-center">
              <Loader2 size={20} className="animate-spin text-accent-default" />
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setUseBackup(!useBackup);
          setBackupCode('');
          setDigits(['', '', '', '', '', '']);
        }}
        className="w-full text-sm text-accent-default hover:text-accent-hover
                   transition-colors duration-[var(--duration-fast)] text-center"
      >
        {useBackup ? 'Use authenticator code instead' : 'Use a backup code'}
      </button>
    </div>
  );
}
