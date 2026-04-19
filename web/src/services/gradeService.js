import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Grade Service
 * 
 * Handles all API interactions related to grading submissions.
 */
const gradeService = {
  /**
   * Fetch the grade for a specific submission.
   * 
   * @param {number|string} submissionId - The submission ID
   * @returns {Promise<Object>} Grade details
   */
  getBySubmission: async (submissionId) => {
    return api.get(API_ENDPOINTS.SUBMISSIONS.GRADE(submissionId));
  },

  /**
   * Grade a submission (Professors/Admins only).
   * 
   * @param {number|string} submissionId - The submission ID
   * @param {Object} data - Grading data (pointsEarned, feedback)
   * @returns {Promise<Object>} The created grade
   */
  create: async (submissionId, data) => {
    return api.post(API_ENDPOINTS.SUBMISSIONS.GRADE(submissionId), data);
  },

  /**
   * Update an existing grade.
   * 
   * @param {number|string} gradeId - The grade ID
   * @param {Object} data - Updated grading data
   * @returns {Promise<Object>} The updated grade
   */
  update: async (gradeId, data) => {
    return api.put(API_ENDPOINTS.GRADES.DETAIL(gradeId), data);
  },

  /**
   * Fetch recently received grades for the authenticated student.
   * 
   * @returns {Promise<Array>} List of recent grades
   */
  getRecent: async () => {
    return api.get(API_ENDPOINTS.GRADES.RECENT);
  },

  validateAiGrade: async (gradeId) => {
    return api.post(API_ENDPOINTS.GRADES.VALIDATE(gradeId));
  },
};

export default gradeService;