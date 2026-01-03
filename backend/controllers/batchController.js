const Batch = require('../models/Batch');
const Assignment = require("../models/Assignment");
 
 
 
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
 
    const start = new Date(startDate);
    const end = new Date(endDate);
 
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid date format. Please use valid ISO dates (YYYY-MM-DD)'
      });
    }
 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return res.status(400).json({
        success: false,
        msg: 'Start date cannot be in the past'
      });
    }
 
    if (start >= end) {
      return res.status(400).json({
        success: false,
        msg: 'Start date must be before end date'
      });
    }
 
    const durationInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (durationInMonths > 24) {
      return res.status(400).json({
        success: false,
        msg: 'Batch duration cannot exceed 24 months'
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
      startDate: start,
      endDate: end
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
exports.getBatchDetails = async (req, res) => {
  try {
    const { id } = req.params;
 
    const batch = await Batch.findOne({
      $or: [{ _id: id }, { batchId: id }]
    })
      .populate("interns", "name email")
      .populate("trainers", "name email")  
      .lean();
 
    if (!batch) {
      return res.status(404).json({ message: `Batch not found for ID: ${id}` });
    }
 
    const courses = await Course.find({
      batchId: batch._id
    }).populate("trainerIds", "name email");  
 
    const assignments = await Assignment.find({
      batchId: batch._id
    }).populate("internId", "name email");
 
    res.json({
      batch,
      courses: courses.map(c => ({
        _id: c._id,
        title: c.title,
        trainerId: c.trainerIds?.[0],  
        videoPath: c.videoPath,
        videoFileName: c.videoFileName
      })),
      assignments
    });
  } catch (err) {
    console.error('getBatchDetails error:', err);
    res.status(500).json({ message: "Server error" });
  }
};
 