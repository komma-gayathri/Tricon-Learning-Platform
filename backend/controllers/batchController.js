const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");



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
    const batches = await Batch.find().sort({ createdAt: -1 });

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

    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { batchId: id }] };
    } else {
      query = { batchId: id };
    }

    const batch = await Batch.findOne(query)
      .populate("interns", "name email")
      .populate("trainers", "name email")
      .lean();

    if (!batch) {
      return res.status(404).json({ message: `Batch not found for ID: ${id}` });
    }

    // --- AUTOMATIC SYNC START ---
    // User Requirement: if trainer assigned to batch means automatically courses of that trainer should add to that batch.
    // We synchronize existing courses for all trainers in this batch.
    if (batch.trainers && batch.trainers.length > 0) {
      const trainerIds = batch.trainers.map(t => t._id || t);
      console.log(`[getBatchDetails] Syncing courses for trainers in batch ${batch._id}`);
      await Course.updateMany(
        {
          trainerIds: { $in: trainerIds },
          removedFromBatches: { $ne: batch._id } // Do not sync if explicitly removed
        },
        { $set: { batchId: batch._id } }
      );
    }
    // --- AUTOMATIC SYNC END ---

    const courses = await Course.find({
      batchId: batch._id
    }).populate("trainerIds", "name email");

    const assignments = await Assignment.find({
      batchId: batch._id
    }).populate("submissions.internId", "name email");

    res.json({
      batch,
      courses: courses.map(c => ({
        _id: c._id,
        title: c.title,
        trainers: c.trainerIds,
        trainerId: c.trainerIds?.[0], // backward compatibility
        videoPath: c.videoPath,
        videoFileName: c.videoFileName
      })),
      assignments
    });

  } catch (err) {
    console.error('getBatchDetails error:', err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

exports.getMyBatches = async (req, res) => {
  try {
    const User = require("../models/User");
    console.log(`[getMyBatches] finding user ${req.user.userId}`);
    const userRole = req.user.role?.toUpperCase();
    if (userRole === "TRAINER") {
      const batches = await Batch.find({ trainers: req.user.userId }).select("name batchId");
      console.log(`[getMyBatches] Trainer ${req.user.userId} found in batches: ${batches.length}`);
      return res.json({
        success: true,
        batches
      });

    } else {
      // For Interns, rely on the user.batches array (since they are exclusive to batches usually)
      const user = await User.findById(req.user.userId).populate('batches', 'name batchId');
      if (!user) {
        return res.status(404).json({ success: false, msg: "User not found" });
      }
      return res.json({
        success: true,
        batches: user.batches || []
      });
    }
  } catch (err) {
    console.error('getMyBatches error:', err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

/* =========================
   ALLOCATION CONTROLLERS
========================= */

// Add Intern to Batch
exports.addInternToBatch = async (req, res) => {
  try {
    const { id } = req.params; // Batch ID
    const { internId } = req.body;

    if (!internId) {
      return res.status(400).json({ success: false, msg: "Intern ID is required" });
    }

    // 1. Check if Batch exists
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, msg: "Batch not found" });
    }

    // 2. Check if Intern exists
    const User = require("../models/User");
    const intern = await User.findById(internId);
    if (!intern || intern.role !== "INTERN") {
      return res.status(400).json({ success: false, msg: "Valid Intern not found" });
    }

    // 3. REMOVE Intern from ALL other batches (One-to-One Rule)
    await Batch.updateMany(
      { interns: internId },
      { $pull: { interns: internId } }
    );

    // 4. Add Intern to New Batch (ensure unique in array)
    await Batch.findByIdAndUpdate(id, { $addToSet: { interns: internId } });

    // 5. Update Intern's 'batches' array to contain ONLY the new batch
    intern.batches = [id];
    await intern.save();
    console.log(`[addInternToBatch] Updated intern ${intern._id} batches to:`, intern.batches);

    return res.json({
      success: true,
      msg: "Intern allocated to batch successfully",
      batch
    });

  } catch (err) {
    console.error("addInternToBatch error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Add Trainer to Batch
exports.addTrainerToBatch = async (req, res) => {
  try {
    const { id } = req.params; // Batch ID
    const { trainerId } = req.body;

    if (!trainerId) {
      return res.status(400).json({ success: false, msg: "Trainer ID is required" });
    }

    // 1. Check if Batch exists
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, msg: "Batch not found" });
    }

    // 2. Check if Trainer exists
    const User = require("../models/User");
    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== "TRAINER") {
      return res.status(400).json({ success: false, msg: "Valid Trainer not found" });
    }

    // 3. Add Trainer to Batch
    if (!batch.trainers) batch.trainers = [];
    const isTrainerAlreadyInBatch = batch.trainers.some(t => t.toString() === trainerId.toString());

    if (!isTrainerAlreadyInBatch) {
      batch.trainers.push(trainerId);
      await batch.save();

      // 3.1 AUTOMATIC COURSE ASSIGNMENT:
      console.log(`[addTrainerToBatch] Attempting auto-sync courses for trainer ${trainerId} to batch ${id}`);
      try {
        const trainerObjectId = new mongoose.Types.ObjectId(trainerId);
        const batchObjectId = new mongoose.Types.ObjectId(id);

        const updateResult = await Course.updateMany(
          {
            trainerIds: trainerObjectId,
            removedFromBatches: { $ne: batchObjectId }
          },
          { $set: { batchId: batchObjectId } }
        );
        console.log(`[addTrainerToBatch] Auto-sync success: Updated ${updateResult.modifiedCount} courses`);
      } catch (syncErr) {
        console.error("[addTrainerToBatch] Course sync failed (non-critical):", syncErr);
        // We continue anyway as the main allocation is done
      }
    }

    // 4. Add Batch to Trainer
    if (!trainer.batches) trainer.batches = [];
    const isBatchAlreadyInTrainer = trainer.batches.some(b => b.toString() === id.toString());

    if (!isBatchAlreadyInTrainer) {
      trainer.batches.push(id);
      await trainer.save();
      console.log(`[addTrainerToBatch] Updated trainer ${trainerId} batches array`);
    }

    return res.json({
      success: true,
      msg: "Trainer allocated to batch successfully",
      batch
    });

  } catch (err) {
    console.error("addTrainerToBatch error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error while assigning trainer: " + err.message
    });
  }
};

// Remove Intern from Batch
exports.removeInternFromBatch = async (req, res) => {
  try {
    const { id } = req.params; // Batch ID
    const { internId } = req.body;

    if (!internId) {
      return res.status(400).json({ success: false, msg: "Intern ID is required" });
    }

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, msg: "Batch not found" });
    }

    // Remove from Batch
    await Batch.findByIdAndUpdate(id, { $pull: { interns: internId } });

    // Remove from User
    const User = require("../models/User");
    await User.findByIdAndUpdate(internId, { $pull: { batches: id } });

    return res.json({
      success: true,
      msg: "Intern removed from batch successfully"
    });
  } catch (err) {
    console.error("removeInternFromBatch error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Remove Trainer from Batch
exports.removeTrainerFromBatch = async (req, res) => {
  try {
    const { id } = req.params; // Batch ID
    const { trainerId } = req.body;

    if (!trainerId) {
      return res.status(400).json({ success: false, msg: "Trainer ID is required" });
    }

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ success: false, msg: "Batch not found" });
    }

    // Remove from Batch
    await Batch.findByIdAndUpdate(id, { $pull: { trainers: trainerId } });

    // Remove from User
    const User = require("../models/User");
    await User.findByIdAndUpdate(trainerId, { $pull: { batches: id } });

    return res.json({
      success: true,
      msg: "Trainer removed from batch successfully"
    });
  } catch (err) {
    console.error("removeTrainerFromBatch error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Remove Course from Batch
exports.removeCourseFromBatch = async (req, res) => {
  try {
    const { id } = req.params; // Batch ID
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, msg: "Course ID is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, msg: "Course not found" });
    }

    // 1. Unlink batch
    course.batchId = null;

    // 2. Add to removedFromBatches to prevent auto-sync from pulling it back
    if (!course.removedFromBatches.includes(id)) {
      course.removedFromBatches.push(id);
    }

    await course.save();

    return res.json({
      success: true,
      msg: "Course removed from batch successfully"
    });
  } catch (err) {
    console.error("removeCourseFromBatch error:", err);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};
