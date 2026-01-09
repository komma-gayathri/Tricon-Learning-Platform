const mongoose = require("mongoose");
const Batch = require("../models/Batch");
const User = require("../models/User");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");

/* =========================
   CREATE BATCH
========================= */
exports.createBatch = async (req, res) => {
  try {
    const { batchId, name, startDate, endDate } = req.body;

    if (!batchId || !name || !startDate || !endDate) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ msg: "Invalid date format" });
    }

    if (start >= end) {
      return res.status(400).json({
        msg: "Start date must be before end date",
      });
    }

    const existing = await Batch.findOne({ batchId });
    if (existing) {
      return res.status(400).json({ msg: "Batch ID already exists" });
    }

    const batch = await Batch.create({
      batchId,
      name,
      startDate: start,
      endDate: end,
      interns: [],
      trainers: [],
    });

    res.status(201).json({ success: true, batch });
  } catch (err) {
    console.error("createBatch error:", err);
    res.status(500).json({ msg: "Failed to create batch" });
  }
};

/* =========================
   LIST BATCHES
========================= */
exports.listBatches = async (req, res) => {
  try {
    const batches = await Batch.find()
      .sort({ createdAt: -1 })
      .populate("interns", "name email")
      .populate("trainers", "name email");

    res.json({ success: true, batches });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch batches" });
  }
};

/* =========================
   GET BATCH DETAILS
========================= */
exports.getBatchDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { batchId: id }] }
      : { batchId: id };

    const batch = await Batch.findOne(query)
      .populate("interns", "name email")
      .populate("trainers", "name email");

    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    /* ===== AUTO COURSE SYNC FOR TRAINERS ===== */
    if (batch.trainers?.length) {
      const trainerIds = batch.trainers.map((t) => t._id || t);

      await Course.updateMany(
        {
          trainerIds: { $in: trainerIds },
          removedFromBatches: { $ne: batch._id },
        },
        { $set: { batchId: batch._id } }
      );
    }

    const courses = await Course.find({ batchId: batch._id }).populate(
      "trainerIds",
      "name email"
    );

    const assignments = await Assignment.find({
      batchId: batch._id,
    }).populate("submissions.internId", "name email");

    res.json({
      batch,
      courses,
      assignments,
    });
  } catch (err) {
    console.error("getBatchDetails error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   GET MY BATCHES
========================= */
exports.getMyBatches = async (req, res) => {
  try {
    const role = req.user.role?.toUpperCase();

    if (role === "TRAINER") {
      const batches = await Batch.find({
        trainers: req.user.userId,
      }).select("name batchId");

      return res.json({ success: true, batches });
    }

    const batches = await Batch.find({
      interns: req.user.userId,
    }).select("name batchId");

    res.json({ success: true, batches });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   ADD INTERN TO BATCH
========================= */
exports.addInternToBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { internId } = req.body;

    const batch = await Batch.findById(id);
    const intern = await User.findById(internId);

    if (!batch || !intern || intern.role !== "INTERN") {
      return res.status(400).json({ msg: "Invalid intern or batch" });
    }

    await Batch.updateMany(
      { interns: internId },
      { $pull: { interns: internId } }
    );

    await Batch.findByIdAndUpdate(id, {
      $addToSet: { interns: internId },
    });

    intern.batches = [id];
    await intern.save();

    res.json({ success: true, msg: "Intern allocated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   ADD TRAINER TO BATCH
========================= */
exports.addTrainerToBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.body;

    const batch = await Batch.findById(id);
    const trainer = await User.findById(trainerId);

    if (!batch || !trainer || trainer.role !== "TRAINER") {
      return res.status(400).json({ msg: "Invalid trainer or batch" });
    }

    await Batch.findByIdAndUpdate(id, {
      $addToSet: { trainers: trainerId },
    });

    await User.findByIdAndUpdate(trainerId, {
      $addToSet: { batches: id },
    });

    /* ===== AUTO COURSE SYNC ===== */
    await Course.updateMany(
      {
        trainerIds: trainerId,
        removedFromBatches: { $ne: id },
      },
      { $set: { batchId: id } }
    );

    res.json({ success: true, msg: "Trainer allocated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   REMOVE INTERN FROM BATCH
========================= */
exports.removeInternFromBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { internId } = req.body;

    await Batch.findByIdAndUpdate(id, {
      $pull: { interns: internId },
    });

    await User.findByIdAndUpdate(internId, {
      $pull: { batches: id },
    });

    res.json({ success: true, msg: "Intern removed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

/* =========================
   REMOVE TRAINER FROM BATCH
========================= */
exports.removeTrainerFromBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.body;

    await Batch.findByIdAndUpdate(id, {
      $pull: { trainers: trainerId },
    });

    await User.findByIdAndUpdate(trainerId, {
      $pull: { batches: id },
    });

    res.json({ success: true, msg: "Trainer removed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
exports.removeCourseFromBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseId } = req.body;

    await Course.findByIdAndUpdate(courseId, {
      $unset: { batchId: "" },
      $addToSet: { removedFromBatches: id }
    });

    res.json({ success: true, msg: "Course removed from batch successfully" });
  } catch (err) {
    console.error("removeCourseFromBatch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
