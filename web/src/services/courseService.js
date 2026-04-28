import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Course Service
 * 
 * Handles all API interactions related to courses.
 * Relies on the configured api.js for auth interceptors and unwrapping responses.
 */
const courseService = {
  /**
   * Fetch all courses.
   * Based on the user's role, the backend (Gateway) will return:
   * - Students: Enrolled courses
   * - Professors: Teaching courses
   * - Admins: All courses
   * 
   * @returns {Promise<Array>} List of courses
   */
  getAll: async () => {
    return api.get(API_ENDPOINTS.COURSES.LIST);
  },

  /**
   * Fetch course details by ID.
   * 
   * @param {number|string} id - The course ID
   * @returns {Promise<Object>} Course details
   */
  getById: async (id) => {
    return api.get(API_ENDPOINTS.COURSES.DETAIL(id));
  },

  /**
   * Create a new course (Professors/Admins only).
   * 
   * @param {Object} data - Course creation data (courseCode, courseName, etc.)
   * @returns {Promise<Object>} The created course
   */
  create: async (data) => {
    return api.post(API_ENDPOINTS.COURSES.LIST, data);
  },

  /**
   * Update an existing course (Professors/Admins only).
   * 
   * @param {number|string} id - The course ID
   * @param {Object} data - Updated course data
   * @returns {Promise<Object>} The updated course
   */
  update: async (id, data) => {
    return api.put(API_ENDPOINTS.COURSES.DETAIL(id), data);
  },

  /**
   * Delete a course (Admins only / or course owner).
   * 
   * @param {number|string} id - The course ID
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    return api.delete(API_ENDPOINTS.COURSES.DETAIL(id));
  },

  /**
   * Enroll a student in a course using a course code.
   * 
   * @param {string} courseCode - The unique access code for the course
   * @returns {Promise<Object>} Enrollment confirmation/details
   */
  enroll: async (courseCode) => {
    return api.post(API_ENDPOINTS.COURSES.ENROLL, { courseCode });
  },

  /**
   * Unenroll a student from a course.
   * 
   * @param {number|string} id - The course ID
   * @returns {Promise<void>}
   */
  unenroll: async (id) => {
    return api.delete(`${API_ENDPOINTS.COURSES.DETAIL(id)}/enroll`);
  },

  /**
   * Fetch all students enrolled in a specific course.
   * 
   * @param {number|string} id - The course ID
   * @returns {Promise<Array>} List of students
   */
  getStudents: async (id) => {
    return api.get(`${API_ENDPOINTS.COURSES.DETAIL(id)}/students`);
  },

  /**
   * Fetch statistics for a specific course (e.g., total enrolled).
   * 
   * @param {number|string} id - The course ID
   * @returns {Promise<Object>} Course statistics
   */
  getStats: async (id) => {
    return api.get(`${API_ENDPOINTS.COURSES.DETAIL(id)}/stats`);
  },
};

export default courseService;