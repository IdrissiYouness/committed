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

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(VALIDATION.FULL_NAME_MIN_LENGTH, `Full name must be at least ${VALIDATION.FULL_NAME_MIN_LENGTH} characters`)
      .max(VALIDATION.FULL_NAME_MAX_LENGTH, `Full name cannot exceed ${VALIDATION.FULL_NAME_MAX_LENGTH} characters`)
      .trim(),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .max(VALIDATION.EMAIL_MAX_LENGTH, `Email cannot exceed ${VALIDATION.EMAIL_MAX_LENGTH} characters`),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─── Password Strength Indicator ─────────────────────────────────────────────

function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak',   color: 'bg-error' };
  if (score <= 2) return { level: 2, label: 'Fair',   color: 'bg-warning' };
  if (score <= 3) return { level: 3, label: 'Good',   color: 'bg-info' };
  return           { level: 4, label: 'Strong', color: 'bg-success' };
}

function PasswordStrength({ password }) {
  const { level, label, color } = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="flex flex-col gap-1.5" aria-live="polite" aria-label={`Password strength: ${label}`}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={[
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= level ? color : 'bg-neutral-200',
            ].join(' ')}
          />
        ))}
      </div>
      <p className={`text-xs font-body font-medium ${level <= 1 ? 'text-error' : level === 2 ? 'text-warning' : level === 3 ? 'text-info' : 'text-success'}`}>
        {label} password
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * RegisterForm
 *
 * Controlled registration form built with react-hook-form + zod.
 * Delegates API calls to useAuth().register().
 *
 * Features:
 *   - Client-side validation (fullName length, email format, password min, confirmPassword match)
 *   - Password strength indicator (visual bar)
 *   - Loading state on submit button while request is in flight
 *   - Server-level error shown as an inline alert banner
 *     (handles 409 Conflict — email already registered)
 *   - Password visibility toggle (built into Input)
 *   - Link back to login page
 *   - Auto-login after successful registration (Gateway returns tokens immediately)
 */
export default function RegisterForm() {
  const { register: handleRegister } = useAuth();
  const [serverError, setServerError] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName:        '',
      email:           '',
      password:        '',
      confirmPassword: '',
    },
  });

  // Watch password in real-time for strength indicator
  const watchedPassword = watch('password', '');

  // ── Submit Handler ──────────────────────────────────────────────────────

  const onSubmit = async ({ email, fullName, password }) => {
    setServerError('');

    const toastId = toast.loading('Creating your account…');

    const result = await handleRegister(email, fullName, password);

    if (result.success) {
      toast.success('Account created! Welcome to Committed 🎉', { id: toastId });
      // useAuth navigates to /dashboard — nothing else needed here
    } else {
      toast.dismiss(toastId);

      // Give a friendlier message for the most common error (duplicate email)
      const message =
        result.error?.toLowerCase().includes('already')
          ? `An account with this email already exists. Try logging in instead.`
          : result.error || 'Registration failed. Please try again.';

      setServerError(message);
      toast.error(message);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
      aria-label="Registration form"
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

      {/* Full Name */}
      <Input
        label="Full name"
        type="text"
        placeholder="Alice Dupont"
        autoComplete="name"
        required
        error={errors.fullName?.message}
        {...register('fullName')}
      />

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

      {/* Password + strength indicator */}
      <div className="flex flex-col gap-2">
        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          required
          error={errors.password?.message}
          helperText={!errors.password?.message ? 'Use a mix of letters, numbers and symbols for a strong password' : undefined}
          {...register('password')}
        />
        <PasswordStrength password={watchedPassword} />
      </div>

      {/* Confirm Password */}
      <Input
        label="Confirm password"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        required
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      {/* Terms notice */}
      <p className="text-xs text-neutral-500 font-body leading-relaxed">
        By creating an account you agree to our{' '}
        <button
          type="button"
          className="text-secondary-600 hover:underline focus:outline-none focus:underline"
          onClick={() => toast('Terms & Privacy coming soon!', { icon: '📄' })}
        >
          Terms of Service
        </button>{' '}
        and{' '}
        <button
          type="button"
          className="text-secondary-600 hover:underline focus:outline-none focus:underline"
          onClick={() => toast('Terms & Privacy coming soon!', { icon: '🔒' })}
        >
          Privacy Policy
        </button>
        .
      </p>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isSubmitting}
        className="mt-1"
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>

      {/* Login link */}
      <p className="text-center font-body text-sm text-neutral-500">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-semibold text-secondary-600 hover:text-secondary-700 hover:underline transition-colors duration-150 focus:outline-none focus:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}