const express = require("express");
const router = express.Router();

const {
  submitAssignment,
  gradeAssignment,
  createAssignment,
  getAssignments,
  getMyAssignments,
  askDoubt,
  answerDoubt,
  getDoubts,
  updateDoubt,
  deleteDoubt,
  getLearnerCourses,
  getLearnerCourseById,
  getMyCourses,
  getBatchPerformanceReport,
} = require("../controllers/learnerController");

const { auth, checkRole } = require("../middleware/auth");

router.use(auth);

/* =========================
   ASSIGNMENTS
========================= */
router.post("/assignments", checkRole(["TRAINER", "HR"]), createAssignment);
router.get("/assignments", checkRole(["TRAINER", "HR"]), getAssignments);
router.get("/assignments/my", checkRole(["Intern"]), getMyAssignments);
router.post("/assignment/submit", checkRole(["Intern"]), submitAssignment);
router.put(
  "/assignment/:assignmentId/grade/:submissionId",
  checkRole(["TRAINER"]),
  gradeAssignment
);

/* =========================
   DOUBTS
========================= */
router.post("/doubt/ask", checkRole(["Intern"]), askDoubt);
router.post("/doubt/:doubtId/answer", checkRole(["TRAINER", "HR"]), answerDoubt);
router.get("/doubts", checkRole(["Intern", "TRAINER", "HR"]), getDoubts);
router.put("/doubt/:id", checkRole(["Intern"]), updateDoubt);
router.delete("/doubt/:id", checkRole(["Intern"]), deleteDoubt);

/* =========================
   COURSES
========================= */
router.get("/courses/my", checkRole(["Intern"]), getMyCourses);
router.get("/courses", checkRole(["Intern", "TRAINER", "HR"]), getLearnerCourses);
router.get(
  "/courses/:courseId",
  checkRole(["Intern", "TRAINER", "HR"]),
  getLearnerCourseById
);

/* =========================
   HR / TRAINER PERFORMANCE REPORT
========================= */
router.get(
  "/report/batch/:batchId",
  checkRole(["HR", "TRAINER"]),
  getBatchPerformanceReport
);

module.exports = router;