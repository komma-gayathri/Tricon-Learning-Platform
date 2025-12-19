const mongoose = require("mongoose");
const Schedule = require("../models/Schedule");
const Batch = require("../models/Batch");

exports.createSchedule = async (req, res) => {
  try {
    const { batchId, timetable } = req.body;

    if (!batchId || !Array.isArray(timetable) || timetable.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Please provide batchId and valid timetable array",
      });
    }

    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        msg: "Batch not found with this batchId",
      });
    }

    const schedule = new Schedule({ batchId: batch._id, timetable });
    await schedule.save();

    await Batch.findByIdAndUpdate(batch._id, { scheduleId: schedule._id });

    return res.status(201).json({
      success: true,
      msg: "Schedule created successfully",
      schedule,
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return res.status(500).json({
      success: false,
      msg: "Error creating schedule: " + error.message,
    });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { timetable } = req.body;

    if (!timetable || !Array.isArray(timetable)) {
      return res.status(400).json({
        success: false,
        msg: "Valid timetable array is required",
      });
    }

    const schedule = await Schedule.findByIdAndUpdate(
      id,
      { timetable, updatedAt: Date.now() },
      { new: true }
    )
      .populate("timetable.trainerId", "name email")
      .populate("timetable.courseId", "title");

    if (!schedule) {
      return res.status(404).json({
        success: false,
        msg: "Schedule not found",
      });
    }

    return res.json({
      success: true,
      msg: "Schedule updated successfully",
      schedule,
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return res.status(500).json({
      success: false,
      msg: "Error updating schedule: " + error.message,
    });
  }
};


exports.getScheduleByBatch = async (req, res) => {
  try {
    const { batchId } = req.params; 

    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        msg: "Batch not found with this batchId",
      });
    }

    const schedules = await Schedule.find({ batchId: batch._id })
      .sort({ createdAt: -1 })
      .populate("timetable.trainerId", "name email")
      .populate("timetable.courseId", "title description");

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "No schedules found for this batch",
        schedules: [],
      });
    }

    return res.json({
      success: true,
      msg: "Schedules retrieved successfully",
      total: schedules.length,
      schedules,
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({
      success: false,
      msg: "Error fetching schedules: " + error.message,
    });
  }
};
