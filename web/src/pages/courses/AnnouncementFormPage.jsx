import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import announcementService from '../../services/announcementService';
import Button from '../../components/common/Button';
import { ROUTES } from '../../utils/constants';

export default function AnnouncementFormPage() {
  const { courseId, id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      announcementService.getById(courseId, id)
        .then(res => reset(res.data || res))
        .catch(console.error);
    }
  }, [id, courseId, reset, isEditing]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      if (data.file && data.file[0]) formData.append('attachments', data.file[0]);

      if (isEditing) {
        await announcementService.update(courseId, id, formData);
      } else {
        await announcementService.create(courseId, formData);
      }
      navigate(`${ROUTES.COURSES}/${courseId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm ring-1 ring-neutral-900/5 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-neutral-900">{isEditing ? 'Edit Announcement' : 'Create Announcement'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Title</label>
          <input 
            {...register('title', { required: 'Title is required' })} 
            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" 
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-neutral-700">Content</label>
          <textarea 
            rows={5}
            {...register('content', { required: 'Content is required' })} 
            className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" 
          />
          {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Attachment (Optional)</label>
          <input 
            type="file" 
            {...register('file')} 
            className="mt-1 block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" 
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? 'Update Announcement' : 'Create Announcement'}
          </Button>
        </div>
      </form>
    </div>
  );
}
