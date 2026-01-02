const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");

const {
  createIntern,
  createTrainer,
  getInterns,
  getTrainers,
  getTrainerProfile,
  getInternProfile,
  getBatches,
  getBatchById,
  getBatchPerformanceReport,
  assignTrainerBatches
} = require("../controllers/hrController");

router.post("/interns", auth, createIntern);
router.post("/trainers", auth, createTrainer);

router.get("/interns", auth, getInterns);
router.get("/interns/:id", auth, getInternProfile);

router.get("/trainers", auth, getTrainers);
router.get("/trainers/:id", auth, getTrainerProfile);

router.put('/trainers/:id/batches', auth, checkRole(['HR']), assignTrainerBatches);

router.get("/batches", auth, getBatches);
router.get("/batches/:id", auth, getBatchById);

router.get("/batches/:id/performance", auth, checkRole(["HR"]), getBatchPerformanceReport);

module.exports = router;
