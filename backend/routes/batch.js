const express = require('express');
const router = express.Router();
const { createBatch, listBatches, getMyBatches, getBatchDetails, addInternToBatch, addTrainerToBatch, removeInternFromBatch, removeTrainerFromBatch, removeCourseFromBatch } = require('../controllers/batchController');
const { auth, checkRole } = require('../middleware/auth');


router.use(auth);

// Basic Routes
router.post('/create', checkRole(['HR']), createBatch);
router.get('/', listBatches);
router.get('/my', checkRole(['TRAINER', 'INTERN']), getMyBatches);
router.get('/:id', getBatchDetails);

// Allocation
router.post('/:id/add-intern', checkRole(['HR']), addInternToBatch);
router.post('/:id/add-trainer', checkRole(['HR']), addTrainerToBatch);

// Routes to REMOVE members
router.post("/:id/remove-intern", checkRole(['HR']), removeInternFromBatch);
router.post("/:id/remove-trainer", checkRole(['HR']), removeTrainerFromBatch);
router.post("/:id/remove-course", checkRole(['HR']), removeCourseFromBatch);

module.exports = router;
