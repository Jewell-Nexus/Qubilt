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

const registerSchema = z
  .object({
    displayName: z.string().min(1, 'Display name is required'),
    email: z.string().email('Enter a valid email'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be 50 characters or fewer')
      .regex(
        /^[a-z0-9_-]+$/,
        'Only lowercase letters, numbers, hyphens, and underscores',
      ),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const registerUser = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-text-primary">Create account</h2>
        <p className="text-sm text-text-secondary">Get started with Qubilt</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            placeholder="Jane Doe"
            className={errors.displayName ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]/20' : ''}
            {...register('displayName')}
          />
          {errors.displayName && (
            <p className="text-xs text-[var(--color-error)]">{errors.displayName.message}</p>
          )}
        </div>

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
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="janedoe"
            className={errors.username ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]/20' : ''}
            {...register('username')}
          />
          {errors.username && (
            <p className="text-xs text-[var(--color-error)]">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            className={errors.confirmPassword ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]/20' : ''}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-[var(--color-error)]">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="text-sm text-text-secondary text-center">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-accent-default hover:text-accent-hover transition-colors duration-[var(--duration-fast)] font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
