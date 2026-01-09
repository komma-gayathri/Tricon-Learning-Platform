const express = require("express");
const router = express.Router();

const { auth, checkRole } = require("../middleware/auth");

// ✅ IMPORT CONTROLLERS (NAMES MUST MATCH EXACTLY)
const {
  createIntern,
  getInterns,
  getInternProfile,
  createTrainer,
  getTrainers,
  getTrainerProfile,
  getBatches,
  getBatchById,
  assignMembersToBatch,
  assignTrainerBatches,
  getAllUsers,
  getBatchPerformanceReport,
  getQuizSubmissions,
} = require("../controllers/hrController");

/* =====================================================
   INTERN ROUTES
===================================================== */

router.post(
  "/interns",
  auth,
  checkRole(["HR"]),
  createIntern
);

router.get(
  "/interns",
  auth,
  checkRole(["HR"]),
  getInterns
);

router.get(
  "/interns/:id",
  auth,
  getInternProfile
);

/* =====================================================
   TRAINER ROUTES
===================================================== */

router.post(
  "/trainers",
  auth,
  checkRole(["HR"]),
  createTrainer
);

router.get(
  "/trainers",
  auth,
  checkRole(["HR"]),
  getTrainers
);

router.get(
  "/trainers/:id",
  auth,
  getTrainerProfile
);

router.put(
  "/trainers/:id/batches",
  auth,
  checkRole(["HR"]),
  assignTrainerBatches
);

/* =====================================================
   BATCH ROUTES
===================================================== */

router.get(
  "/batches",
  auth,
  checkRole(["HR"]),
  getBatches
);

router.get(
  "/batches/:id",
  auth,
  checkRole(["HR"]),
  getBatchById
);

router.put(
  "/batches/:id/assign",
  auth,
  checkRole(["HR"]),
  assignMembersToBatch
);

router.get(
  "/batches/:id/performance",
  auth,
  checkRole(["HR"]),
  getBatchPerformanceReport
);

router.get(
  "/batches/:id/quiz-submissions",
  auth,
  checkRole(["HR"]),
  getQuizSubmissions
);

/* =====================================================
   USERS
===================================================== */

router.get(
  "/users",
  auth,
  checkRole(["HR"]),
  getAllUsers
);

module.exports = router;
