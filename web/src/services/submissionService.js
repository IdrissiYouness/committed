import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Submission Service
 * 
 * Handles all API interactions related to student submissions.
 */
const submissionService = {
  /**
   * Fetch all submissions for a specific assignment.
   * Professors will see all submissions; students will only see their own.
   * 
   * @param {number|string} assignmentId - The assignment ID
   * @returns {Promise<Array>} List of submissions
   */
  getAllByAssignment: async (assignmentId) => {
    return api.get(API_ENDPOINTS.ASSIGNMENTS.SUBMISSIONS(assignmentId));
  },

  /**
   * Fetch submission details by ID.
   * 
   * @param {number|string} id - The submission ID
   * @returns {Promise<Object>} Submission details
   */
  getById: async (id) => {
    return api.get(API_ENDPOINTS.SUBMISSIONS.DETAIL(id));
  },

  /**
   * Create a new submission for an assignment.
   * Supports file uploads via FormData.
   * 
   * @param {number|string} assignmentId - The assignment ID
   * @param {FormData|Object} data - Submission data (files, githubUrl, etc.)
   * @returns {Promise<Object>} The created submission
   */
  create: async (assignmentId, data) => {
    const isFormData = data instanceof FormData;
    return api.post(API_ENDPOINTS.ASSIGNMENTS.SUBMISSIONS(assignmentId), data, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
      },
    });
  },

  /**
   * Update an existing submission.
   * Supports file uploads via FormData.
   * 
   * @param {number|string} id - The submission ID
   * @param {FormData|Object} data - Updated submission data
   * @returns {Promise<Object>} The updated submission
   */
  update: async (id, data) => {
    const isFormData = data instanceof FormData;
    return api.put(API_ENDPOINTS.SUBMISSIONS.DETAIL(id), data, {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
      },
    });
  },
};

export default submissionService;