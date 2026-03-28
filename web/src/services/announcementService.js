import api from './api';

const ANNOUNCEMENTS_PAGE_SIZE = 100;

function normalizePaginated(payload) {
  if (!payload) return { items: [], meta: null };

  if (Array.isArray(payload)) {
    return { items: payload, meta: null };
  }

  // Gateway announcement/comment style
  if (Array.isArray(payload.data)) {
    return { items: payload.data, meta: payload.meta ?? null };
  }

  // Other paged wrappers used elsewhere
  if (Array.isArray(payload.content)) {
    return {
      items: payload.content,
      meta: {
        total: payload.totalElements ?? payload.total ?? payload.content.length,
        page: payload.page ?? 0,
        limit: payload.size ?? payload.limit ?? payload.content.length,
        totalPages: payload.totalPages ?? 1,
      },
    };
  }

  return { items: [], meta: payload.meta ?? null };
}

function isMissingEndpointError(error) {
  const status = error?.status ?? error?.response?.status;
  const message = (error?.message || '').toLowerCase();
  return (
    status === 404 ||
    status === 405 ||
    message.includes('not found') ||
    message.includes('no handler')
  );
}

const announcementService = {
  /**
   * Returns a compatibility shape:
   * { data: Announcement[], content: Announcement[], meta }
   * so legacy pages reading either `data` or `content` keep working.
   */
  getAll: async (courseId, { page = 0, size = 20, raw = false } = {}) => {
    const payload = await api.get(`/api/courses/${courseId}/announcements`, {
      params: { page, size },
    });

    if (raw) return payload;

    const { items, meta } = normalizePaginated(payload);
    return { data: items, content: items, meta };
  },

  /**
   * Resolve announcement by scanning the course paginated list.
   * This avoids relying on a direct GET-by-id endpoint that may not be exposed by Gateway.
   */
  getById: async (courseId, id) => {
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
      const payload = await announcementService.getAll(courseId, {
        page,
        size: ANNOUNCEMENTS_PAGE_SIZE,
        raw: true,
      });

      const { items, meta } = normalizePaginated(payload);
      const found = items.find(
        (a) => String(a.announcementId ?? a.id) === String(id)
      );

      if (found) return found;

      totalPages = Number(meta?.totalPages ?? page + 1);
      page += 1;
    }

    throw new Error('Announcement not found in this course');
  },

  create: (courseId, data) =>
    api.post(`/api/courses/${courseId}/announcements`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (courseId, id, data) =>
    api.put(`/api/courses/${courseId}/announcements/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (courseId, id) =>
    api.delete(`/api/courses/${courseId}/announcements/${id}`),
};

export default announcementService;