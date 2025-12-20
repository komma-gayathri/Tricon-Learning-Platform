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
  createAssignment          
} = require('../controllers/learnerController');
const { auth, checkRole } = require('../middleware/auth');


router.use(auth);


router.post(
  '/assignments',
  checkRole(['TRAINER', 'HR']),
  createAssignment
);

router.post(
  '/assignment/submit',
  checkRole(['Intern']),
  submitAssignment
);

router.get(
  '/assignments',
  checkRole(['TRAINER', 'HR']),
  getAssignments
);

router.get(
  '/assignments/my',
  checkRole(['Intern']),
  getMyAssignments
);

router.put(
  '/assignment/:assignmentId/grade',
  checkRole(['TRAINER']),
  gradeAssignment
);

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

router.get(
  '/report/batch/:batchId',
  checkRole(['HR']),
  getPerformanceReport
);

module.exports = router;
