import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Assignment Service
 * 
 * Handles all API interactions related to assignments.
 * Supports multipart/form-data for handling file attachments.
 */
const assignmentService = {
  /**
   * Fetch all assignments for a specific course.
   * 
   * @param {number|string} courseId - The ID of the course
   * @returns {Promise<Array>} List of assignments
   */
  getAllByCourse: async (courseId) => {
    return api.get(`/api/courses/${courseId}/assignments`);
  },

  /**
   * Fetch assignment details by ID.
   * 
   * @param {number|string} id - The assignment ID
   * @returns {Promise<Object>} Assignment details
   */
  getById: async (id) => {
    return api.get(API_ENDPOINTS.ASSIGNMENTS.DETAIL(id));
  },

  /**
   * Create a new assignment for a course (Professors/Admins only).
   * 
   * @param {number|string} courseId - The ID of the course
   * @param {FormData} formData - Assignment data including optional files
   * @returns {Promise<Object>} The created assignment
   */
  create: async (courseId, formData) => {
    return api.post(`/api/courses/${courseId}/assignments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Update an existing assignment.
   * 
   * @param {number|string} id - The assignment ID
   * @param {FormData|Object} data - Updated assignment data
   * @returns {Promise<Object>} The updated assignment
   */
  update: async (id, data) => {
    const isFormData = data instanceof FormData;
    return api.put(API_ENDPOINTS.ASSIGNMENTS.DETAIL(id), data, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
      },
    });
  },

  /**
   * Delete an assignment.
   * 
   * @param {number|string} id - The assignment ID
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    return api.delete(API_ENDPOINTS.ASSIGNMENTS.DETAIL(id));
  },

  /**
   * Fetch upcoming assignments across all enrolled courses.
   * Used primarily for the student dashboard.
   * 
   * @returns {Promise<Array>} List of upcoming assignments
   */
  getUpcoming: async () => {
    return api.get(API_ENDPOINTS.ASSIGNMENTS.UPCOMING);
  },
};

export default assignmentService;