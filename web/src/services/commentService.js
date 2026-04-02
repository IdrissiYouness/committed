import api from './api';

function normalizePaginated(payload) {
  if (!payload) return { items: [], meta: null };

  if (Array.isArray(payload)) {
    return { items: payload, meta: null };
  }

  // Gateway/Core comments payload shape
  // { data: [...], meta: { total, page, limit, totalPages } }
  if (Array.isArray(payload.data)) {
    return {
      items: payload.data,
      meta: payload.meta ?? null,
    };
  }

  // Alternate paged shape used in other endpoints
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

const commentService = {
  /**
   * Returns a compatibility shape:
   * { data: Comment[], content: Comment[], meta }
   * so UI consumers can read either `.data` or `.content`.
   */
  getAll: async (courseId, announcementId, { page = 0, size = 20, raw = false } = {}) => {
    const payload = await api.get(
      `/api/courses/${courseId}/announcements/${announcementId}/comments`,
      { params: { page, size } }
    );

    if (raw) return payload;

    const { items, meta } = normalizePaginated(payload);
    return { data: items, content: items, meta };
  },

  create: (courseId, announcementId, data) =>
    api.post(
      `/api/courses/${courseId}/announcements/${announcementId}/comments`,
      data
    ),

  update: (courseId, announcementId, id, data) =>
    api.put(
      `/api/courses/${courseId}/announcements/${announcementId}/comments/${id}`,
      data
    ),

  delete: (courseId, announcementId, id) =>
    api.delete(
      `/api/courses/${courseId}/announcements/${announcementId}/comments/${id}`
    ),
};

export default commentService;