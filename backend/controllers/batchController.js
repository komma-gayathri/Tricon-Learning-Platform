const Batch = require('../models/Batch');
 
 
exports.createBatch = async (req, res) => {
     console.log('createBatch called by role:', req.user.role);
  try {
    const { batchId, name, startDate, endDate } = req.body;
 
    if (!batchId || !name || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide batchId, name, startDate, and endDate'
      });
    }
 
    const existing = await Batch.findOne({ batchId });
    if (existing) {
      return res.status(400).json({
        success: false,
        msg: 'Batch with this batchId already exists'
      });
    }
 
    const batch = new Batch({
      batchId,
      name,
      startDate,
      endDate
    });
 
    await batch.save();
 
    return res.status(201).json({
      success: true,
      msg: 'Batch created successfully',
      batch
    });
 
  } catch (error) {
    console.error('Error creating batch:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error creating batch: ' + error.message
    });
  }
};
 
exports.listBatches = async (req, res) => {
  try {
    const batches = await Batch.find().sort({ startDate: 1 });
 
    return res.json({
      success: true,
      total: batches.length,
      batches
    });
  } catch (error) {
    console.error('Error listing batches:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error listing batches: ' + error.message
    });
  }
};
 
 