import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, Lock, Mail, Calendar, ShieldCheck, Users, Pencil, X, Check } from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import UserAvatar from '../../components/common/UserAvatar';
import api from '../../services/api';
import { API_ENDPOINTS, VALIDATION } from '../../utils/constants';

/**
 * ProfilePage
 *
 * Displays the authenticated user's profile info.
 * Allows editing fullName / email inline and changing password.
 *
 * Full photo upload and email verification deferred to WEB-008.
 *
 * Sections:
 *   1. Profile card  — avatar, name, email, role, member since
 *   2. Edit profile  — inline form for fullName + email
 *   3. Change password — separate collapsible form
 */

// ─── Validation schemas ───────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z
    .string()
    .min(VALIDATION.FULL_NAME_MIN_LENGTH, `Name must be at least ${VALIDATION.FULL_NAME_MIN_LENGTH} characters`)
    .max(VALIDATION.FULL_NAME_MAX_LENGTH, `Name cannot exceed ${VALIDATION.FULL_NAME_MAX_LENGTH} characters`)
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(VALIDATION.EMAIL_MAX_LENGTH, `Email cannot exceed ${VALIDATION.EMAIL_MAX_LENGTH} characters`),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH, `New password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─── Edit Profile Form ────────────────────────────────────────────────────────

function EditProfileForm({ user, onCancel, onSuccess }) {
  const updateUser   = useAuthStore((s) => s.updateUser);
  const updateTokens = useAuthStore((s) => s.updateTokens);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      email:    user?.email    ?? '',
    },
  });

  const onSubmit = async ({ fullName, email }) => {
    try {
      const result = await api.put(API_ENDPOINTS.USERS.PROFILE, { fullName, email });

      // result may contain { profile, tokens }
      const profile = result?.profile ?? result;
      updateUser(profile);

      if (result?.tokens) {
        updateTokens(result.tokens.accessToken, result.tokens.refreshToken);
      }

      toast.success('Profile updated successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 mt-4">
      <Input
        label="Full name"
        type="text"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <div className="flex gap-3 pt-1">
        <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
          <Check className="h-4 w-4" aria-hidden="true" />
          Save changes
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Change Password Form ─────────────────────────────────────────────────────

function ChangePasswordForm({ onCancel }) {
  const updateTokens = useAuthStore((s) => s.updateTokens);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      const result = await api.post(API_ENDPOINTS.USERS.CHANGE_PASSWORD, { currentPassword, newPassword });
      // Backend bumps token version — swap in the new tokens so this session stays valid
      if (result?.accessToken && result?.refreshToken) {
        updateTokens(result.accessToken, result.refreshToken);
      }
      toast.success('Password changed successfully!');
      reset();
      onCancel();
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 mt-4">
      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        helperText="Minimum 8 characters"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <div className="flex gap-3 pt-1">
        <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
          <Check className="h-4 w-4" aria-hidden="true" />
          Change password
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const user    = useAuthStore((s) => s.user);
  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';

  const [editingProfile,  setEditingProfile]  = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* ── Page heading ───────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900 tracking-tight">
          My Profile
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Manage your account information and security settings.
        </p>
      </div>

      {/* ── Profile card ───────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl border border-neutral-200 bg-white shadow-elegant overflow-hidden"
        aria-labelledby="profile-section-heading"
      >
        {/* Header strip */}
        <div className="bg-gradient-to-r from-primary-800 to-secondary-800 h-20" aria-hidden="true" />

        <div className="px-6 pb-6">
          {/* Avatar — pulled up over the strip */}
          <div className="-mt-8 mb-4 flex items-end justify-between">
            <UserAvatar
              fullName={user?.fullName}
              systemRole={user?.systemRole}
              size="xl"
              className="ring-4 ring-white shadow-elevated"
            />

            {/* Edit button */}
            {!editingProfile && (
              <button
                onClick={() => { setEditingProfile(true); setChangingPassword(false); }}
                className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 font-body text-sm font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-primary-700 transition-colors duration-150 shadow-elegant focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Edit
              </button>
            )}
          </div>

          {/* Info rows */}
          {!editingProfile ? (
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  id="profile-section-heading"
                  className="font-display text-xl font-bold text-neutral-900"
                >
                  {user?.fullName ?? '—'}
                </h2>
                <span className={[
                  'mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
                  'font-body text-xs font-semibold border',
                  isAdmin
                    ? 'bg-primary-50 text-primary-700 border-primary-100'
                    : 'bg-secondary-50 text-secondary-700 border-secondary-100',
                ].join(' ')}>
                  {isAdmin
                    ? <><ShieldCheck className="h-3 w-3" aria-hidden="true" /> Admin</>
                    : <><Users className="h-3 w-3" aria-hidden="true" /> Member</>
                  }
                </span>
              </div>

              <dl className="grid gap-3">
                <div className="flex items-center gap-3">
                  <dt className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <Mail className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                  </dt>
                  <dd className="font-body text-sm text-neutral-700">{user?.email ?? '—'}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <User className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                  </dt>
                  <dd className="font-body text-sm text-neutral-700">
                    User ID: <span className="font-mono text-neutral-500">{user?.userId ?? '—'}</span>
                  </dd>
                </div>
                {user?.createdAt && (
                  <div className="flex items-center gap-3">
                    <dt className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                      <Calendar className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                    </dt>
                    <dd className="font-body text-sm text-neutral-700">
                      Member since{' '}
                      {new Date(user.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <EditProfileForm
              user={user}
              onCancel={() => setEditingProfile(false)}
              onSuccess={() => setEditingProfile(false)}
            />
          )}
        </div>
      </section>

      {/* ── Change password card ───────────────────────────────────────────── */}
      <section
        className="rounded-2xl border border-neutral-200 bg-white shadow-elegant px-6 py-5"
        aria-labelledby="password-section-heading"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
              <Lock className="h-4 w-4 text-neutral-500" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="password-section-heading"
                className="font-display text-base font-bold text-neutral-900"
              >
                Password
              </h2>
              <p className="font-body text-xs text-neutral-500">
                Change your account password
              </p>
            </div>
          </div>

          {!changingPassword && (
            <button
              onClick={() => { setChangingPassword(true); setEditingProfile(false); }}
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 font-body text-sm font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-primary-700 transition-colors duration-150 shadow-elegant focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Change
            </button>
          )}
        </div>

        {changingPassword && (
          <ChangePasswordForm onCancel={() => setChangingPassword(false)} />
        )}
      </section>

      {/* ── Deferred features notice ───────────────────────────────────────── */}
      <p className="font-body text-xs text-neutral-400 text-center pb-2">
        Profile photo upload and email verification will be available in a future update.
      </p>

    </div>
  );
}