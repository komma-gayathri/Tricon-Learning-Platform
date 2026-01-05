const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const {
  createSchedule,
  updateSchedule,
  getScheduleByBatch,
  getMyScheduleForIntern,
  getMyScheduleForTrainer
} = require("../controllers/scheduleController");
 
router.use(auth);
 
// HR
router.post("/create", checkRole(["HR"]), createSchedule);
router.put("/:id", checkRole(["HR"]), updateSchedule);
router.get("/intern/my", checkRole(["Intern"]), getMyScheduleForIntern);
router.get("/trainer/my", checkRole(["TRAINER"]), getMyScheduleForTrainer);
router.get("/batch/:batchId", checkRole(["HR", "TRAINER"]), getScheduleByBatch);
 
 
module.exports = router;
 
 