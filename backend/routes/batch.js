const express = require('express');
const router = express.Router();
const { createBatch, listBatches } = require('../controllers/batchController');
const { auth, checkRole } = require('../middleware/auth');

// All batch routes require auth
router.use(auth);

// HR creates batch
router.post('/create', checkRole(['HR']), createBatch);

module.exports = router;
