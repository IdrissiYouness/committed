import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { useAuth } from '../../../hooks/useAuth';
import Button from '../../common/Button';
import Input from '../../common/Input';
import { ROUTES, VALIDATION } from '../../../utils/constants';

// ─── Validation Schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`),
  rememberMe: z.boolean().optional(),
});

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * LoginForm
 *
 * Controlled form built with react-hook-form + zod.
 * Delegates API calls to useAuth().login() so the form
 * has no direct knowledge of the service or store.
 *
 * Features:
 *   - Client-side validation (email format, password length)
 *   - Remember Me checkbox (passed through to useAuth)
 *   - Loading state on submit button while request is in flight
 *   - Server-level error shown as an inline alert banner
 *   - Password visibility toggle (built into Input)
 *   - Link to registration page
 */
export default function LoginForm() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email:      '',
      password:   '',
      rememberMe: false,
    },
  });

  // ── Submit Handler ──────────────────────────────────────────────────────

  const onSubmit = async ({ email, password, rememberMe }) => {
    setServerError('');

    const result = await login(email, password, rememberMe);

    if (!result.success) {
      setServerError(result.error || 'Login failed. Please try again.');
      toast.error(result.error || 'Login failed. Please try again.');
    }
    // On success, useAuth navigates to /dashboard — nothing else needed here
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
      aria-label="Login form"
    >
      {/* Server-level error banner */}
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error animate-scale-in"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-body">{serverError}</span>
        </div>
      )}

      {/* Email */}
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Password */}
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        error={errors.password?.message}
        {...register('password')}
      />

      {/* Remember Me + Forgot Password row */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 select-none">
          <input
            type="checkbox"
            className={[
              'h-4 w-4 rounded-subtle',
              'border-neutral-300',
              'text-primary-500',
              'focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
              'transition-colors duration-150',
            ].join(' ')}
            {...register('rememberMe')}
          />
          <span className="font-body text-sm text-neutral-600">Remember me</span>
        </label>

        {/* Placeholder — wire up to a reset-password route in a future task */}
        <button
          type="button"
          className="font-body text-sm text-secondary-600 hover:text-secondary-700 hover:underline focus:outline-none focus:underline transition-colors duration-150"
          onClick={() => toast('Password reset coming soon!', { icon: '🔜' })}
        >
          Forgot password?
        </button>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isSubmitting}
        className="mt-1"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>

      {/* Register link */}
      <p className="text-center font-body text-sm text-neutral-500">
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="font-semibold text-secondary-600 hover:text-secondary-700 hover:underline transition-colors duration-150 focus:outline-none focus:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}