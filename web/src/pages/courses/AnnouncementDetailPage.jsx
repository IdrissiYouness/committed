import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Megaphone,
  Clock,
  FileText,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import announcementService from '../../services/announcementService';
import courseService from '../../services/courseService';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../utils/constants';

import Button from '../../components/common/Button';
import AnnouncementComments from '../../components/features/courses/AnnouncementComments';

export default function AnnouncementDetailPage() {
  const { courseId, announcementId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [course, setCourse] = useState(null);
  const [announcement, setAnnouncement] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';
  const isTeacher = Number(course?.teacher?.userId) === Number(user?.userId);

  const canManageAnnouncement = useMemo(
    () => isAdmin || isTeacher,
    [isAdmin, isTeacher]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [courseData, announcementData] = await Promise.all([
        courseService.getById(courseId),
        announcementService.getById(courseId, announcementId),
      ]);

      setCourse(courseData);
      setAnnouncement(announcementData);
    } catch (err) {
      setError(err.message || 'Failed to load announcement details.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, announcementId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this announcement?')) return;

    setIsDeleting(true);
    try {
      await announcementService.delete(courseId, announcementId);
      toast.success('Announcement deleted.');
      navigate(`${ROUTES.COURSES}/${courseId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete announcement.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <AnnouncementDetailSkeleton />;
  }

  if (error || !announcement) {
    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full mt-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`${ROUTES.COURSES}/${courseId}`)}
          className="self-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>

        <div className="rounded-md bg-error-50 p-4 ring-1 ring-inset ring-error-600/20">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-error-400" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-error-800">Error</h3>
              <div className="mt-2 text-sm text-error-700">
                <p>{error || 'Announcement not found.'}</p>
              </div>
              <div className="mt-4">
                <Button variant="secondary" onClick={fetchData}>
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const normalizedAnnouncementId = announcement.announcementId || announcement.id;
  const attachments = announcement.attachments || [];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          to={`${ROUTES.COURSES}/${courseId}`}
          className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-700 transition-colors self-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-neutral-200 pb-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary-600">
              {course?.courseName || 'Course'}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              {announcement.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-neutral-500">
              <Clock className="h-4 w-4" />
              {new Date(
                announcement.postedAt || announcement.createdAt || Date.now()
              ).toLocaleString()}
              {announcement.postedBy?.fullName && (
                <span>• by {announcement.postedBy.fullName}</span>
              )}
            </div>
          </div>

          {canManageAnnouncement && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() =>
                  navigate(
                    `${ROUTES.COURSES}/${courseId}/announcements/${normalizedAnnouncementId}/edit`
                  )
                }
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <section className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-neutral-900/5">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-neutral-400" />
          Class Thread
        </h2>

        <p className="text-neutral-700 whitespace-pre-wrap">{announcement.content}</p>

        {attachments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              Pinned Resources
            </h3>
            <ul className="space-y-2">
              {attachments.map((att, idx) => {
                const attachmentId = att.attachmentId || att.id;
                return (
                  <li key={attachmentId || idx}>
                    <a
                      href={`/api/courses/${courseId}/announcements/${normalizedAnnouncementId}/attachments/${attachmentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-between gap-3 p-3 rounded-lg border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors text-sm text-primary-700"
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{att.fileName || `Attachment #${idx + 1}`}</span>
                      </span>
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-primary-700 ring-1 ring-primary-200">
                        Pinned
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">
            Thread Discussion
          </h3>
          <AnnouncementComments
            courseId={courseId}
            announcementId={normalizedAnnouncementId}
          />
        </div>
      </section>
    </div>
  );
}

function AnnouncementDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full pb-12 animate-pulse">
      <div className="h-4 w-32 bg-neutral-200 rounded mb-2" />
      <div className="border-b border-neutral-200 pb-6">
        <div className="h-4 w-24 bg-neutral-100 rounded mb-3" />
        <div className="h-8 w-72 bg-neutral-200 rounded mb-3" />
        <div className="h-4 w-52 bg-neutral-100 rounded" />
      </div>
      <div className="bg-white rounded-2xl p-6 ring-1 ring-neutral-900/5">
        <div className="h-6 w-40 bg-neutral-200 rounded mb-6" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-neutral-100 rounded" />
          <div className="h-4 w-full bg-neutral-100 rounded" />
          <div className="h-4 w-3/4 bg-neutral-100 rounded" />
        </div>
      </div>
    </div>
  );
}