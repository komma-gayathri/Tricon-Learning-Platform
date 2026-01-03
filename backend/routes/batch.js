const express = require('express');
const router = express.Router();

const {
  createBatch,
  listBatches,
  getBatchDetails,
  getUnassignedUsers,
  assignUsersToBatch,
  removeUserFromBatch
} = require('../controllers/batchController');

const { auth, checkRole } = require('../middleware/auth');

// All batch routes require auth
router.use(auth);

// ⚠️ STATIC routes FIRST
router.get('/unassigned-users', checkRole(['HR']), getUnassignedUsers);

// Create batch
router.post('/create', checkRole(['HR']), createBatch);

// List all batches
router.get('/', checkRole(['HR']), listBatches);

// ⚠️ DYNAMIC routes LAST
router.get('/:id', checkRole(['HR']), getBatchDetails);

// Assign interns & trainers
router.post('/:batchId/assign', checkRole(['HR']), assignUsersToBatch);
router.post('/:batchId/remove', checkRole(['HR']), removeUserFromBatch);


module.exports = router;
