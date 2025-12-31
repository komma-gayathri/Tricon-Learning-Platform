const express = require("express");
const router = express.Router();

const learnerController = require("../controllers/learnerController");
const { auth, checkRole } = require("../middleware/auth");

router.use(auth);

/* =========================
   ASSIGNMENTS
========================= */

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

module.exports = router;
