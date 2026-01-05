const express = require('express');
const router = express.Router();
const {
  submitAssignment,
  gradeAssignment,
  askDoubt,
  answerDoubt,
  getDoubts,
  updateDoubt,
  deleteDoubt,
  getAssignments,
  getMyAssignments,
  createAssignment,
  getBatchPerformanceReport   // ✅ CORRECT NAME
} = require('../controllers/learnerController');

const { auth, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// ✅ ASSIGNMENT ROUTES - PERFECT MATCH WITH FRONTEND
router.post('/assignments', checkRole(['TRAINER', 'HR']), createAssignment);
router.post('/assignment/submit', checkRole(['Intern']), submitAssignment);
router.get('/assignments', checkRole(['TRAINER', 'HR']), getAssignments);
router.get('/assignments/my', checkRole(['Intern']), getMyAssignments);
router.put('/assignment/:assignmentId/grade/:submissionId', checkRole(['TRAINER']), gradeAssignment);

// DOUBT ROUTES
router.post('/doubt/ask', checkRole(['Intern']), askDoubt);
router.get('/doubts', checkRole(['Intern', 'TRAINER', 'HR']), getDoubts);
router.post('/doubt/:doubtId/answer', checkRole(['Intern', 'TRAINER']), answerDoubt);
// UPDATE doubt
router.put(
  '/doubt/:id',
  checkRole(['Intern']),
  updateDoubt
);

// DELETE doubt
router.delete(
  '/doubt/:id',
  checkRole(['Intern']),
  deleteDoubt
);


// HR PERFORMANCE REPORTS
router.get('/report/batch/:batchId', checkRole(['HR']), getBatchPerformanceReport);

module.exports = router;
