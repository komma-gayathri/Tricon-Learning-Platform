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
  createAssignment,
  getLearnerCourses,
  getLearnerCourseById,
  getMyCourses        
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

// COURSES (ROLE-BASED)
router.get(
  "/courses/my",
  checkRole(["Intern"]),
  getMyCourses
);

router.get(
  '/courses',
  checkRole(['Intern', 'TRAINER', 'HR']),
  getLearnerCourses
);

router.get(
  '/courses/:courseId',
  checkRole(['Intern', 'TRAINER', 'HR']),
  getLearnerCourseById
);


module.exports = router;
