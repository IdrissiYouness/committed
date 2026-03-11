import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Admin Service
 *
 * Wraps the Gateway /api/admin/* endpoints.
 * The axios instance in api.js unwraps the { success, data, message } envelope,
 * so every function here receives the inner `data` object directly.
 *
 * All three methods map 1-to-1 to the AUTH-005 endpoints:
 *   GET    /api/admin/users         → listUsers
 *   PUT    /api/admin/users/:id     → updateUser
 *   DELETE /api/admin/users/:id     → deactivateUser
 *
 * PagedResponse shape (returned by listUsers):
 * {
 *   content:       AdminUserResponse[],
 *   page:          number,
 *   size:          number,
 *   totalElements: number,
 *   totalPages:    number,
 *   hasNext:       boolean,
 *   hasPrev:       boolean,
 * }
 *
 * AdminUserResponse shape:
 * {
 *   userId:     number,
 *   email:      string,
 *   fullName:   string,
 *   systemRole: 'user' | 'admin',
 *   isActive:   boolean,
 *   createdAt:  string (ISO-8601),
 * }
 */

/**
 * List users with optional filters, sorting, and pagination.
 *
 * All parameters are optional — the backend applies its own defaults
 * (page=0, size=10, sortBy=createdAt, sortDir=desc) when omitted.
 *
 * @param {object} opts
 * @param {number}  [opts.page]      — zero-based page number
 * @param {number}  [opts.size]      — items per page
 * @param {string}  [opts.sortBy]    — 'fullName' | 'email' | 'systemRole' | 'createdAt'
 * @param {string}  [opts.sortDir]   — 'asc' | 'desc'
 * @param {string}  [opts.role]      — filter by role: 'user' | 'admin'
 * @param {boolean} [opts.isActive]  — filter by active status
 * @param {string}  [opts.search]    — partial match on fullName / email
 * @returns {Promise<PagedResponse>}
 */
export const listUsers = async ({
  page,
  size,
  sortBy,
  sortDir,
  role,
  isActive,
  search,
} = {}) => {
  const params = new URLSearchParams();

  if (page     != null)  params.set('page',    page);
  if (size     != null)  params.set('size',    size);
  if (sortBy   != null && sortBy   !== '') params.set('sortBy',  sortBy);
  if (sortDir  != null && sortDir  !== '') params.set('sortDir', sortDir);
  if (role     != null && role     !== '') params.set('role',    role);
  if (isActive != null && isActive !== '') params.set('isActive', isActive);
  if (search   != null && search   !== '') params.set('search',  search);

  const qs = params.toString();
  return api.get(`${API_ENDPOINTS.ADMIN.USERS}${qs ? `?${qs}` : ''}`);
};

/**
 * Update a user's profile fields and/or role/status.
 *
 * Only the fields present in `patch` are sent — mirrors AdminUpdateUserRequest
 * on the backend which only applies non-null fields.
 *
 * @param {number} userId
 * @param {object} patch  — any subset of { fullName, email, systemRole, isActive }
 * @returns {Promise<AdminUserResponse>}
 */
export const updateUser = async (userId, patch) => {
  // Strip out undefined values; null values are intentional (backend ignores them
  // since we only include fields the caller explicitly wants to change).
  const body = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  );
  return api.put(API_ENDPOINTS.ADMIN.USER(userId), body);
};

/**
 * Deactivate (soft-delete) a user.
 * The backend sets isActive=false and returns the updated user record.
 *
 * @param {number} userId
 * @returns {Promise<AdminUserResponse>}
 */
export const deactivateUser = async (userId) => {
  return api.delete(API_ENDPOINTS.ADMIN.USER(userId));
};

const adminService = { listUsers, updateUser, deactivateUser };
export default adminService;