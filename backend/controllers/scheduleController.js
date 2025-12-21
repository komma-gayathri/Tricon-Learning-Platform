const mongoose = require("mongoose");
const Schedule = require("../models/Schedule");
const Batch = require("../models/Batch");
const User = require("../models/User");
const Course = require("../models/Course");
 
// CREATE SCHEDULE (HR only)
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
 
    const populatedTimetable = await Promise.all(
      timetable.map(async (slot) => {
        const trainer = slot.trainerId && slot.trainerId !== ''
          ? await User.findOne({ name: slot.trainerId, role: 'TRAINER' }).select('_id')
          : null;
       
        const course = slot.courseId && slot.courseId !== ''
          ? await Course.findOne({ title: slot.courseId }).select('_id')
          : null;
 
        return {
          ...slot,
          trainerId: trainer?._id || null,
          courseId: course?._id || null
        };
      })
    );
 
    const schedule = new Schedule({
      batchId: batch._id,
      timetable: populatedTimetable
    });
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
 
// UPDATE SCHEDULE 
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
 
    const populatedTimetable = await Promise.all(
      timetable.map(async (slot) => {
        const trainer = slot.trainerId && slot.trainerId !== ''
          ? await User.findOne({ name: slot.trainerId, role: 'TRAINER' }).select('_id')
          : null;
       
        const course = slot.courseId && slot.courseId !== ''
          ? await Course.findOne({ title: slot.courseId }).select('_id')
          : null;
 
        return {
          ...slot,
          trainerId: trainer?._id || null,
          courseId: course?._id || null
        };
      })
    );
 
    const schedule = await Schedule.findByIdAndUpdate(
      id,
      { timetable: populatedTimetable, updatedAt: Date.now() },
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
 
// GET ALL SCHEDULES BY BATCH
exports.getScheduleByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
 
    // Find batch by its code
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        msg: "Batch not found with this batchId",
      });
    }
 
    // Fetch ALL schedules for this batch, newest first
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