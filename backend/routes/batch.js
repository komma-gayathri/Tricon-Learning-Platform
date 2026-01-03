const express = require('express');
const router = express.Router();
const { createBatch, listBatches } = require('../controllers/batchController');
const { auth, checkRole } = require('../middleware/auth');
 
 
router.use(auth);
 
router.post('/create', checkRole(['HR']), createBatch);
 
router.get('/', listBatches);
 
module.exports = router;