const Batch = require('../models/Batch');

// HR creates a batch
exports.createBatch = async (req, res) => {
     console.log('createBatch called by role:', req.user.role);
  try {
    const { batchId, name, startDate, endDate } = req.body;

    if (!batchId || !name || !startDate || !endDate || startDate > endDate ) {
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