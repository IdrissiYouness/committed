import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import courseService from '../../services/courseService';
import Button from '../../components/common/Button';
import { ROUTES } from '../../utils/constants';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function generateCourseCode() {
  return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

const courseSchema = z.object({
  courseCode: z.string().min(1, 'Course code is required'),
  courseName: z.string().min(1, 'Course name is required'),
  description: z.string().optional(),
  subject: z.string().optional(),
  section: z.string().optional(),
  term: z.string().optional(),
  isOpen: z.boolean().default(true),
});

import useBreadcrumbStore from '../../store/breadcrumbStore';

export default function CourseFormPage() {
  const { id } = useParams();
  const setBreadcrumbLabel = useBreadcrumbStore(state => state.setLabel);

  useEffect(() => {
    if (id) {
      courseService.getById(id)
        .then(course => {
          if (course?.courseName) {
            setBreadcrumbLabel(id, course.courseName);
          }
        })
        .catch(console.error);
    }
  }, [id, setBreadcrumbLabel]);
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, getValues } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseCode: !id ? generateCourseCode() : '',
      isOpen: true,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      courseService.getById(id)
        .then(res => reset(res))
        .catch(err => setError(err.message || 'Failed to load course details'));
    }
  }, [id, reset, isEditing]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      let savedCourse = null;

      if (isEditing) {
        savedCourse = await courseService.update(id, data);
        toast.success('Course updated successfully.');
      } else {
        savedCourse = await courseService.create(data);
        toast.success('Course created successfully.');
      }

      const nextCourseId =
        savedCourse?.id ||
        savedCourse?.courseId ||
        id;

      if (nextCourseId) {
        navigate(`${ROUTES.COURSES}/${nextCourseId}`);
      } else {
        navigate(ROUTES.COURSES);
      }
    } catch (err) {
      setError(err.message || 'Failed to save course.');
      toast.error(err.message || 'Failed to save course.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm ring-1 ring-neutral-900/5 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-neutral-900">{isEditing ? 'Edit Course' : 'Create Course'}</h1>
      
      {error && (
        <div className="mb-4 rounded-md bg-error-50 p-4 ring-1 ring-inset ring-error-600/20 text-sm text-error-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Course Code
              {!isEditing && <span className="ml-2 text-xs text-neutral-400 font-normal">Auto-generated</span>}
            </label>
            <input
              {...register('courseCode')}
              readOnly
              className="mt-1 block w-full rounded-md border-neutral-300 bg-neutral-50 shadow-sm text-neutral-500 cursor-default select-all font-mono tracking-widest"
            />
            {errors.courseCode && <p className="text-red-500 text-sm mt-1">{errors.courseCode.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Course Name</label>
            <input 
              {...register('courseName')} 
              className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" 
              placeholder="Introduction to Computer Science"
            />
            {errors.courseName && <p className="text-red-500 text-sm mt-1">{errors.courseName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Description</label>
          <textarea 
            rows={4}
            {...register('description')} 
            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" 
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Subject</label>
            <input 
              {...register('subject')} 
              className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Section</label>
            <input 
              {...register('section')} 
              className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Term</label>
            <input 
              {...register('term')} 
              className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" 
            />
          </div>
        </div>

        <div className="flex items-center">
          <input 
            type="checkbox" 
            {...register('isOpen')} 
            id="isOpen"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded" 
          />
          <label htmlFor="isOpen" className="ml-2 block text-sm text-neutral-900">
            Course is Open for Enrollment
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </form>
    </div>
  );
}
