const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createIntern,
  createTrainer,
  getInterns,
  getTrainers
} = require('../controllers/hrController');
 
router.post('/interns', auth, createIntern);
router.post('/trainers', auth, createTrainer);
router.get('/interns', auth, getInterns);
router.get('/trainers', auth, getTrainers);
 
module.exports = router;