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

    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        msg: "Batch not found",
      });
    }

    const populatedTimetable = await Promise.all(
      timetable.map(async (slot) => {
        const trainer = slot.trainerId
          ? await User.findOne({
              name: slot.trainerId,
              role: "TRAINER",
            }).select("_id")
          : null;

        const course = slot.courseId
          ? await Course.findOne({ title: slot.courseId }).select("_id")
          : null;

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
        const trainer = slot.trainerId
          ? await User.findOne({
              name: slot.trainerId,
              role: "TRAINER",
            }).select("_id")
          : null;

        const course = slot.courseId
          ? await Course.findOne({ title: slot.courseId }).select("_id")
          : null;

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

    res.json({
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
    const intern = await User.findById(req.user.userId).select("batchId");

    if (!intern?.batchId) {
      return res.status(400).json({ msg: "Intern not assigned to batch" });
    }

    const schedules = await Schedule.find({
      batchId: intern.batchId,
    })
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

    const trainer = await User.findById(trainerId).select("trainerBatches");

    if (!trainer || !trainer.trainerBatches?.length) {
      return res.json({ success: true, schedules: [] });
    }

    /*
      IMPORTANT FIX:
      - Only show schedules from trainer-assigned batches
      - DO NOT depend on timetable.trainerId (old data may be inconsistent)
      - Prevents showing extra batches
      - Does not affect HR or Intern flows
    */
    const schedules = await Schedule.find({
      batchId: { $in: trainer.trainerBatches },
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

    const batch = await Batch.findOne({ batchId });
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
