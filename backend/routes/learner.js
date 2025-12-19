const express = require('express');
const router = express.Router();
const {
  submitAssignment,
  gradeAssignment,
  getPerformanceReport,
  askDoubt,
  answerDoubt,
  getAssignments,
  getMyAssignments,
  getDoubts,
  createAssignment          // ← add this
} = require('../controllers/learnerController');
const { auth, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// ASSIGNMENT ROUTES

// Trainer/HR create assignment
router.post(
  '/assignments',
  checkRole(['TRAINER', 'HR']),
  createAssignment
);

// Intern submits assignment
router.post(
  '/assignment/submit',
  checkRole(['Intern']),
  submitAssignment
);

// Trainer/HR can list all assignments
router.get(
  '/assignments',
  checkRole(['TRAINER', 'HR']),
  getAssignments
);

// Intern sees assignments for their batch
router.get(
  '/assignments/my',
  checkRole(['Intern']),
  getMyAssignments
);

// Trainer grades assignment
router.put(
  '/assignment/:assignmentId/grade',
  checkRole(['TRAINER']),
  gradeAssignment
);

// DOUBT FORUM ROUTES

router.post(
  '/doubt/ask',
  checkRole(['Intern']),
  askDoubt
);

router.get(
  '/doubts',
  checkRole(['Intern', 'TRAINER', 'HR']),
  getDoubts
);

router.post(
  '/doubt/:doubtId/answer',
  checkRole(['Intern', 'TRAINER']),
  answerDoubt
);

// HR PERFORMANCE REPORTS

router.get(
  '/report/batch/:batchId',
  checkRole(['HR']),
  getPerformanceReport
);

module.exports = router;
