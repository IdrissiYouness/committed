import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../common/Button';
import Input from '../../common/Input';
import courseService from '../../../services/courseService';

const enrollSchema = z.object({
  courseCode: z
    .string()
    .min(1, 'Course code is required')
    .max(50, 'Course code is too long'),
});

export default function EnrollmentModal({ isOpen, onClose, onSuccess }) {
  const [globalError, setGlobalError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(enrollSchema),
    defaultValues: {
      courseCode: '',
    },
  });

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      reset();
      setGlobalError(null);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    setGlobalError(null);
    try {
      await courseService.enroll(data.courseCode);
      toast.success('Successfully enrolled in course!');
      onSuccess?.();
      onClose();
    } catch (err) {
      // Typically enrollment errors are global (e.g. "Course not found", "Already enrolled")
      setGlobalError(
        err.message || 'Failed to enroll. Please check the code and try again.'
      );
    }
  };

  return (
    <div
      className="relative z-50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-center justify-between mb-5">
              <h3
                id="modal-title"
                className="text-xl font-semibold leading-6 text-neutral-900"
              >
                Enroll in a Course
              </h3>
              <button
                type="button"
                className="rounded-md bg-white text-neutral-400 hover:bg-neutral-100 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 p-1 transition-colors"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {globalError && (
                <div className="rounded-md bg-error-50 p-3 text-sm text-error-700 ring-1 ring-inset ring-error-600/20">
                  {globalError}
                </div>
              )}

              <Input
                label="Course Code"
                id="courseCode"
                placeholder="Enter the course access code"
                error={errors.courseCode?.message}
                {...register('courseCode')}
              />

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  Enroll
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}