const express = require("express");
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
  "/assignments",
  checkRole(["TRAINER", "HR"]),
  learnerController.createAssignment
);

router.get(
  "/assignments",
  checkRole(["TRAINER", "HR"]),
  learnerController.getAssignments
);

router.get(
  "/assignments/my",
  checkRole(["Intern"]),
  learnerController.getMyAssignments
);

router.post(
  "/assignment/submit",
  checkRole(["Intern"]),
  learnerController.submitAssignment
);

router.put(
  "/assignment/:assignmentId/grade/:submissionId",
  checkRole(["TRAINER"]),
  learnerController.gradeAssignment
);

/* =========================
   DOUBTS
========================= */

router.post(
  "/doubt/ask",
  checkRole(["Intern"]),
  learnerController.askDoubt
);

router.post(
  "/doubt/:doubtId/answer",
  checkRole(["TRAINER", "HR"]),
  learnerController.answerDoubt
);

router.get(
  "/doubts",
  checkRole(["TRAINER", "HR", "Intern"]),
  learnerController.getDoubts
);

/* =========================
   REPORTS
========================= */

router.get(
  "/report/batch/:id",
  checkRole(["HR"]),
  learnerController.getPerformanceReport
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
