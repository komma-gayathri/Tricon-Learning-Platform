const mongoose = require("mongoose");
const User = require("../models/User");
const Batch = require("../models/Batch");
const Assignment = require("../models/Assignment");
const QuizSubmission = require("../models/QuizSubmission");
const Course = require("../models/Course");
 
/* ======================================================
   INTERN
====================================================== */
 
// CREATE INTERN (NO BATCH AT CREATION)
exports.createIntern = async (req, res) => {
  try {
    const { name, email, password } = req.body;
 
    if (req.user.role !== "HR") {
      return res.status(403).json({ msg: "Access denied" });
    }
 
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }
 
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Email already exists" });
    }
 
    const intern = await User.create({
      name,
      email,
      password,
      role: "INTERN",
      batches: [], // assigned later
    });
 
    res.status(201).json({
      success: true,
      msg: "Intern created successfully",
      intern,
    });
  } catch (err) {
    console.error("Create intern error:", err);
    res.status(500).json({ msg: err.message });
  }
};
 
// GET INTERNS
exports.getInterns = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ msg: "Access denied" });
    }
 
    const interns = await User.find({ role: "INTERN" })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .lean();
 
    // Dynamically fetch actual batches from Batch collection
    const internsWithBatches = await Promise.all(
      interns.map(async (i) => {
        const userBatches = await Batch.find({ interns: i._id })
          .select("name batchId")
          .lean();
        return {
          ...i,
          batches: userBatches
        };
      })
    );
 
    res.json({ success: true, users: internsWithBatches });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
 
// INTERN PROFILE
exports.getInternProfile = async (req, res) => {
  try {
    const intern = await User.findById(req.params.id)
      .select("-password")
      .lean();
 
    if (!intern) {
      return res.status(404).json({ msg: "Intern not found" });
    }
 
    // Single source of truth: query Batch collection
    const batches = await Batch.find({ interns: intern._id })
      .select("name batchId startDate endDate")
      .lean();
 
    const assignments = await Assignment.find({
      batchId: { $in: batches.map(b => b._id) }
    })
      .populate("submissions.internId", "name")
      .lean();
 
    // Attach batches to intern object for frontend compatibility
    intern.batches = batches;
 
    res.json({
      intern,
      assignments,
    });
  } catch (error) {
    console.error("getInternProfile error:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
 
/* ======================================================
   TRAINER
====================================================== */
 
// CREATE TRAINER (NO BATCH AT CREATION)
exports.createTrainer = async (req, res) => {
  try {
    const { name, email, password } = req.body;
 
    const trainer = await User.create({
      name,
      email,
      password,
      role: "TRAINER",
      batches: [],
    });
 
    res.status(201).json({
      success: true,
      msg: "Trainer created successfully",
      trainer,
    });
  } catch (err) {
    console.error("Create trainer error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
 
// GET TRAINERS
exports.getTrainers = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ msg: "Access denied" });
    }
 
    const trainers = await User.find({ role: "TRAINER" })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .lean();
 
    // Dynamically fetch batches for each trainer to ensure accuracy
    const trainersWithBatches = await Promise.all(
      trainers.map(async (t) => {
        const userBatches = await Batch.find({ trainers: t._id })
          .select("name batchId")
          .lean();
        return {
          ...t,
          batches: userBatches
        };
      })
    );
 
    res.json({ success: true, users: trainersWithBatches });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
 
// TRAINER PROFILE (SHOW ALLOCATED BATCHES)
exports.getTrainerProfile = async (req, res) => {
  try {
    const trainer = await User.findById(req.params.id)
      .select("-password")
      .lean();
 
    if (!trainer) {
      return res.status(404).json({ msg: "Trainer not found" });
    }
 
    // Single source of truth: query Batch collection
    const batches = await Batch.find({ trainers: trainer._id })
      .select("name batchId startDate endDate")
      .lean();
 
    res.json({
      trainer,
      batches,
    });
  } catch (err) {
    console.error("getTrainerProfile error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
 
/* ======================================================
   BATCH
====================================================== */
 
// GET ALL BATCHES
exports.getBatches = async (req, res) => {
  try {
    const batches = await Batch.find().select("name");
    res.json(batches);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
 
// ASSIGN TRAINERS & INTERNS TO BATCH
exports.assignMembersToBatch = async (req, res) => {
  try {
    const { trainerIds = [], internIds = [] } = req.body;
    const { id } = req.params;
 
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }
 
    batch.trainers = trainerIds;
    batch.interns = internIds;
    await batch.save();
 
    await User.updateMany(
      { _id: { $in: [...trainerIds, ...internIds] } },
      { $addToSet: { batches: batch._id } }
    );
 
    res.json({ success: true, msg: "Members assigned successfully" });
  } catch (err) {
    console.error("assignMembersToBatch error:", err);
    res.status(500).json({ msg: err.message });
  }
};
 
// GET BATCH BY ID (DETAIL VIEW)
exports.getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate("interns", "name email createdAt")
      .populate("trainers", "name email createdAt")
      .lean();
 
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
 
    const courses = await Course.find({ batchId: batch._id })
      .populate("trainerIds", "name email")
      .populate("quizzes")
      .lean();
 
    const assignments = await Assignment.find({ batchId: batch._id })
      .populate("submissions.internId", "name email")
      .lean();
 
    res.json({ batch, courses, assignments });
  } catch (err) {
    console.error("getBatchById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
 
/* ======================================================
   USERS
====================================================== */
 
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ msg: "Access denied" });
    }
 
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 });
 
    res.json({ success: true, users });
  } catch (err) {
    console.error("getAllUsers error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
 
/* ======================================================
   BATCH PERFORMANCE (UNCHANGED CORE LOGIC)
====================================================== */
 
exports.getBatchPerformanceReport = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate("interns", "name email")
      .lean();
 
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }
 
    const assignments = await Assignment.find({ batchId: batch._id })
      .populate("submissions.internId", "name email")
      .lean();
 
    const performanceData = await Promise.all(
      batch.interns.map(async (intern) => {
        const quizSubmissions = await QuizSubmission.find({
          internId: intern._id,
        }).lean();
 
        const quizAvg =
          quizSubmissions.length > 0
            ? Math.round(
              quizSubmissions.reduce((s, q) => s + (q.score || 0), 0) /
              quizSubmissions.length
            )
            : 0;
 
        const internAssignments = assignments.filter((a) =>
          a.submissions?.some(
            (s) => s.internId?.toString() === intern._id.toString()
          )
        );
 
        const assignmentAvg =
          internAssignments.length > 0
            ? Math.round(
              internAssignments.reduce(
                (s, a) => s + (a.grade || 0),
                0
              ) / internAssignments.length
            )
            : 0;
 
        return {
          _id: intern._id,
          name: intern.name,
          email: intern.email,
          quizAvg,
          assignmentAvg,
        };
      })
    );
 
    res.json({
      batch: {
        _id: batch._id,
        name: batch.name,
      },
      interns: performanceData,
    });
  } catch (err) {
    console.error("Batch performance error:", err);
    res.status(500).json({ msg: err.message });
  }
};
 
 