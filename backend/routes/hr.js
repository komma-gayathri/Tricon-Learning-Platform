const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");
const hrController = require("../controllers/hrController");

// All HR routes require authentication
router.use(auth);
router.use(checkRole(["HR"]));

/* =========================
   INTERN ROUTES
========================= */
router.get("/interns", hrController.getInterns);

/* =========================
   TRAINER ROUTES
========================= */
router.get("/trainers", hrController.getTrainers);

/* =========================
   USER PROFILE (INTERN / TRAINER)
========================= */
router.get("/users/:id", hrController.getUserProfile);

module.exports = router;
