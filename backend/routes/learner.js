const express = require('express');
const router = express.Router();
const {
  submitAssignment,
  gradeAssignment,
  getPerformanceReport,
  askDoubt,
  answerDoubt,
  editDoubt,
  deleteDoubt,
  getAssignments,
  getMyAssignments,
  getDoubts,
  createAssignment          
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
router.put('/doubt/:doubtId', checkRole(['Intern', 'TRAINER', 'HR']), editDoubt);
router.delete('/doubt/:doubtId', checkRole(['Intern', 'TRAINER', 'HR']), deleteDoubt);
router.put('/doubt/answer/:doubtId', checkRole(['Intern', 'TRAINER', 'HR']), editDoubt);
router.delete('/doubt/answer/:doubtId', checkRole(['Intern', 'TRAINER', 'HR']), deleteDoubt);

// HR PERFORMANCE REPORTS
router.get('/report/batch/:batchId', checkRole(['HR']), getPerformanceReport);

module.exports = router;
