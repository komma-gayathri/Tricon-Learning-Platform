const Schedule = require("../models/Schedule");
const Batch = require("../models/Batch");
const User = require("../models/User");
const Course = require("../models/Course");

/* =========================
   CREATE SCHEDULE (HR)
========================= */
exports.createSchedule = async (req, res) => {
  try {
    const { batchId, timetable } = req.body;

    if (!batchId || !Array.isArray(timetable) || timetable.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "batchId and timetable are required",
      });
    }

    let batch = await Batch.findOne({ batchId });

    // Fallback: If not found by string ID, check if it's a valid ObjectId (legacy support)
    if (!batch && require("mongoose").Types.ObjectId.isValid(batchId)) {
      batch = await Batch.findById(batchId);
    }
    if (!batch) {
      return res.status(404).json({
        success: false,
        msg: "Batch not found",
      });
    }

    const populatedTimetable = await Promise.all(
      timetable.map(async (slot) => {
        let trainer = null;
        if (slot.trainerId) {
          if (require("mongoose").Types.ObjectId.isValid(slot.trainerId)) {
            trainer = await User.findById(slot.trainerId).select("_id");
          } else {
            trainer = await User.findOne({ name: slot.trainerId, role: "TRAINER" }).select("_id");
          }
        }

        let course = null;
        if (slot.courseId) {
          if (require("mongoose").Types.ObjectId.isValid(slot.courseId)) {
            course = await Course.findById(slot.courseId).select("_id");
          } else {
            course = await Course.findOne({ title: slot.courseId }).select("_id");
          }
        }

        return {
          ...slot,
          trainerId: trainer?._id || null,
          courseId: course?._id || null,
        };
      })
    );

    const schedule = await Schedule.create({
      batchId: batch._id,
      timetable: populatedTimetable,
    });

    await Batch.findByIdAndUpdate(batch._id, {
      scheduleId: schedule._id,
    });

    res.status(201).json({
      success: true,
      msg: "Schedule created successfully",
      schedule,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/* =========================
   UPDATE SCHEDULE (HR)
========================= */
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { timetable } = req.body;

    if (!Array.isArray(timetable)) {
      return res.status(400).json({ msg: "Timetable array required" });
    }

    const populatedTimetable = await Promise.all(
      timetable.map(async (slot) => {
        let trainer = null;
        if (slot.trainerId) {
          if (require("mongoose").Types.ObjectId.isValid(slot.trainerId)) {
            trainer = await User.findById(slot.trainerId).select("_id");
          } else {
            trainer = await User.findOne({ name: slot.trainerId, role: "TRAINER" }).select("_id");
          }
        }

        let course = null;
        if (slot.courseId) {
          if (require("mongoose").Types.ObjectId.isValid(slot.courseId)) {
            course = await Course.findById(slot.courseId).select("_id");
          } else {
            course = await Course.findOne({ title: slot.courseId }).select("_id");
          }
        }

        return {
          ...slot,
          trainerId: trainer?._id || null,
          courseId: course?._id || null,
        };
      })
    );

    const schedule = await Schedule.findByIdAndUpdate(
      id,
      { timetable: populatedTimetable, updatedAt: Date.now() },
      { new: true }
    )
      .populate("timetable.trainerId", "name")
      .populate("timetable.courseId", "title");

    if (!schedule) {
      return res.status(404).json({ msg: "Schedule not found" });
    }

    return res.status(200).json({
      success: true,
      msg: "Schedule updated successfully",
      schedule,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/* =========================
   INTERN: MY BATCH SCHEDULE
========================= */
exports.getMyScheduleForIntern = async (req, res) => {
  try {
    // ROBUST FIX: Query Batch model directly
    const batches = await Batch.find({ interns: req.user.userId }).select("_id");

    if (!batches.length) {
      return res.json({ success: true, schedules: [] });
    }

    const batchIds = batches.map(b => b._id);

    const schedules = await Schedule.find({ batchId: { $in: batchIds } })
      .sort({ createdAt: -1 })
      .populate("timetable.trainerId", "name")
      .populate("timetable.courseId", "title");

    res.json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/* =========================
   TRAINER: MY SCHEDULES (SAFE FIX)
========================= */
exports.getMyScheduleForTrainer = async (req, res) => {
  try {
    const trainerId = req.user.userId;
    const trainer = await User.findById(trainerId);

    if (!trainer) {
      return res.status(404).json({ msg: "Trainer not found" });
    }

    // Fetch batches where trainer is assigned
    const batches = await Batch.find({ trainers: trainerId }).select("_id");
    const batchIds = batches.map(b => b._id);

    // const trainerData = await User.findById(trainerId).select("trainerBatches");

    // if (!trainerData || !trainerData.trainerBatches?.length) {
    //   // return res.json({ success: true, schedules: [] });
    // }

    /*
      IMPORTANT FIX:
      - Only show schedules from trainer-assigned batches
      - DO NOT depend on timetable.trainerId (old data may be inconsistent)
      - Prevents showing extra batches
      - Does not affect HR or Intern flows
    */
    const schedules = await Schedule.find({
      batchId: { $in: batchIds }
    })
      .sort({ createdAt: -1 })
      .populate("batchId", "batchId name")
      .populate("timetable.trainerId", "name")
      .populate("timetable.courseId", "title");

    res.json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/* =========================
   HR / TRAINER: BY BATCH
========================= */
exports.getScheduleByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    let batch = await Batch.findOne({ batchId });
    // Fallback: If not found by string ID, check if it's a valid ObjectId (legacy support)
    if (!batch && require("mongoose").Types.ObjectId.isValid(batchId)) {
      batch = await Batch.findById(batchId);
    }
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    const schedules = await Schedule.find({
      batchId: batch._id,
    })
      .sort({ createdAt: -1 })
      .populate("timetable.trainerId", "name")
      .populate("timetable.courseId", "title");

    res.json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
