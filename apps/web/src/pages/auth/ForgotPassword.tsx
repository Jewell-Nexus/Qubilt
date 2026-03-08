import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { post } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

const resetSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ForgotForm = z.infer<typeof forgotSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (token) {
    return <ResetPasswordForm token={token} />;
  }

  return <ForgotPasswordForm />;
}

function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle size={40} className="mx-auto text-[var(--color-success)]" />
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-text-primary">Check your email</h2>
          <p className="text-sm text-text-secondary">
            We sent a password reset link to your email address.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-accent-default hover:text-accent-hover
                     transition-colors duration-[var(--duration-fast)] font-medium"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-text-primary">Forgot password</h2>
        <p className="text-sm text-text-secondary">
          Enter your email and we&apos;ll send you a reset link.
        </p>
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
          Send reset link
        </Button>
      </form>

      <Link
        to="/login"
        className="inline-flex items-center gap-1 text-sm text-accent-default hover:text-accent-hover
                   transition-colors duration-[var(--duration-fast)] font-medium"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>
    </div>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    setLoading(true);
    try {
      await post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      toast.success('Password reset successful. Please sign in.');
      window.location.href = '/login';
    } catch {
      toast.error('Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-text-primary">Reset password</h2>
        <p className="text-sm text-text-secondary">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            className={errors.newPassword ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]/20' : ''}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="text-xs text-[var(--color-error)]">{errors.newPassword.message}</p>
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
          Reset password
        </Button>
      </form>
    </div>
  );
}
