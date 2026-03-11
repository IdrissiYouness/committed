import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import Button from '../../common/Button';
import Input  from '../../common/Input';
import { VALIDATION } from '../../../utils/constants';

/**
 * UserEditModal
 *
 * Modal dialog for editing a platform user's profile, role, and status.
 * Uses a native <dialog> element for accessibility (focus trap, Escape key,
 * backdrop click-to-close).
 *
 * Form fields:
 *   fullName   — text, min 2 chars
 *   email      — valid email
 *   systemRole — select: user / admin
 *   isActive   — checkbox toggle
 *
 * Only dirty fields are included in the submit payload — mirrors the backend's
 * AdminUpdateUserRequest which only applies non-null fields.
 *
 * Props:
 *   user      — AdminUserResponse | null  (null = modal closed)
 *   open      — boolean
 *   onClose   — () => void
 *   onSave    — (userId, patch) => Promise<void>
 */

// ─── Validation schema ────────────────────────────────────────────────────────

const editSchema = z.object({
  fullName:   z
    .string()
    .min(VALIDATION.FULL_NAME_MIN_LENGTH, `Full name must be at least ${VALIDATION.FULL_NAME_MIN_LENGTH} characters`)
    .max(VALIDATION.FULL_NAME_MAX_LENGTH, 'Full name is too long'),
  email:      z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(VALIDATION.EMAIL_MAX_LENGTH, 'Email is too long'),
  systemRole: z.enum(['user', 'admin'], { required_error: 'Role is required' }),
  isActive:   z.boolean(),
});

// ─── Default values helper ────────────────────────────────────────────────────

function toDefaults(user) {
  return {
    fullName:   user?.fullName   ?? '',
    email:      user?.email      ?? '',
    systemRole: user?.systemRole?.toLowerCase() ?? 'user',
    isActive:   user?.isActive   ?? true,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserEditModal({ user, open, onClose, onSave }) {
  const dialogRef = useRef(null);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: toDefaults(user),
  });

  // ── Sync form values whenever the target user changes ──────────────────────
  useEffect(() => {
    if (user) {
      reset(toDefaults(user));
      setServerError('');
    }
  }, [user, reset]);

  // ── Open / close the native <dialog> ──────────────────────────────────────
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // ── Escape key / native cancel → call onClose ─────────────────────────────
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e) => {
      e.preventDefault(); // prevent default close so we control it
      onClose?.();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  // ── Backdrop click → close ────────────────────────────────────────────────
  const handleDialogClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose?.();
    }
  };

  // ── Submit — only send dirty fields ───────────────────────────────────────
  const onSubmit = async (data) => {
    setServerError('');

    const patch = {};
    if (dirtyFields.fullName)   patch.fullName   = data.fullName;
    if (dirtyFields.email)      patch.email      = data.email;
    if (dirtyFields.systemRole) patch.systemRole = data.systemRole;
    if (dirtyFields.isActive)   patch.isActive   = data.isActive;

    // Nothing changed — just close
    if (Object.keys(patch).length === 0) {
      onClose?.();
      return;
    }

    try {
      await onSave?.(user.userId, patch);
      onClose?.();
    } catch (err) {
      setServerError(err?.message ?? 'Failed to save changes. Please try again.');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className={[
        'w-full max-w-lg rounded-2xl bg-white shadow-floating',
        'p-0 backdrop:bg-neutral-900/50 backdrop:backdrop-blur-sm',
        // Remove default <dialog> border/outline
        'border-0 outline-none',
        // Ensure the dialog is centred (most browsers default to centring, but explicit is safer)
        'm-auto',
      ].join(' ')}
      aria-labelledby="edit-modal-title"
      aria-modal="true"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
        <div>
          <h2
            id="edit-modal-title"
            className="font-display text-lg font-bold text-neutral-900"
          >
            Edit User
          </h2>
          {user && (
            <p className="mt-0.5 font-body text-xs text-neutral-500 truncate max-w-xs">
              {user.email}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className={[
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          ].join(' ')}
          aria-label="Close modal"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5 px-6 py-5"
      >
        {/* Server error banner */}
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-scale-in"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="font-body">{serverError}</span>
          </div>
        )}

        {/* Full name */}
        <Input
          label="Full name"
          type="text"
          autoComplete="name"
          required
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        {/* Email */}
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        {/* System role */}
        <div className="flex flex-col gap-1.5">
          <span className="font-body text-sm font-semibold text-neutral-700">
            Role <span className="ml-1 text-red-500" aria-hidden="true">*</span>
          </span>
          <div className="flex gap-6" role="radiogroup" aria-label="System role">

            {/* User */}
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="radio"
                value="user"
                className="h-4 w-4 border-neutral-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors duration-150"
                {...register('systemRole')}
              />
              <span className="font-body text-sm text-neutral-700">User</span>
            </label>

            {/* Admin */}
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <input
                type="radio"
                value="admin"
                className="h-4 w-4 border-neutral-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 transition-colors duration-150"
                {...register('systemRole')}
              />
              <span className="font-body text-sm text-neutral-700">Admin</span>
            </label>
          </div>
          {errors.systemRole && (
            <p role="alert" className="text-sm text-red-600 font-body">
              {errors.systemRole.message}
            </p>
          )}
        </div>

        {/* isActive toggle */}
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <div>
            <p className="font-body text-sm font-semibold text-neutral-800">
              Account active
            </p>
            <p className="font-body text-xs text-neutral-500">
              Inactive users cannot log in to the platform.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center" aria-label="Toggle account active state">
            <input
              type="checkbox"
              className="sr-only peer"
              {...register('isActive')}
            />
            <div className={[
              'h-6 w-11 rounded-full transition-colors duration-200',
              'bg-neutral-300',
              'peer-checked:bg-secondary-500',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-secondary-500 peer-focus-visible:ring-offset-1',
              "after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5",
              "after:rounded-full after:bg-white after:shadow after:transition-all after:duration-200",
              "peer-checked:after:translate-x-5",
            ].join(' ')} />
          </label>
        </div>

        {/* ── Footer buttons ────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}