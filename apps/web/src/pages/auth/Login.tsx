import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      // Check for 2FA requirement
      if (typeof err === 'object' && err !== null && 'requiresTwoFactor' in err) {
        const twoFaErr = err as unknown as { tempToken: string };
        navigate('/2fa', { state: { tempToken: twoFaErr.tempToken } });
        return;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-text-primary">Sign in</h2>
        <p className="text-sm text-text-secondary">Enter your credentials to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className={errors.email ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]/20' : ''}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-[var(--color-error)]">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-accent-default hover:text-accent-hover transition-colors duration-[var(--duration-fast)]"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className={errors.password ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]/20' : ''}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-[var(--color-error)]">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
          Sign in
        </Button>
      </form>

      <p className="text-sm text-text-secondary text-center">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="text-accent-default hover:text-accent-hover transition-colors duration-[var(--duration-fast)] font-medium"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
