const express = require('express');
const router = express.Router();
const {
  createSchedule,
  updateSchedule,
  getScheduleByBatch,
} = require('../controllers/scheduleController');
const { auth, checkRole } = require('../middleware/auth');

router.use(auth);

router.post(
  '/create',
  checkRole(['HR']),       
  createSchedule           
);

router.put(
  '/:id',
  checkRole(['HR']),       
  updateSchedule           
);


router.get(
  '/batch/:batchId',
  checkRole(['HR', 'TRAINER', 'Intern']), 
  getScheduleByBatch                     
);

module.exports = router;
