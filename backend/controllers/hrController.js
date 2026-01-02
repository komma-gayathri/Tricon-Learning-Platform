// controllers/hrController.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Batch = require("../models/Batch");
const Assignment = require("../models/Assignment");
const QuizSubmission = require("../models/QuizSubmission");
const Course = require("../models/Course");

exports.createIntern = async (req, res) => {
  try {
    const { name, email, password, batchId } = req.body;

    if (req.user.role !== "HR") {
      return res.status(403).json({ msg: "Access denied" });
    }

    if (!name || !email || !password || !batchId) {
      return res.status(400).json({ msg: "All fields required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const intern = new User({
      name,
      email,
      password,
      role: "Intern",
      batchId,
    });

    await intern.save();

    await Batch.findByIdAndUpdate(batchId, {
      $addToSet: { interns: intern._id },
    });

    res.status(201).json({ msg: "Intern created successfully" });
  } catch (err) {
    console.error("Create intern error:", err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getInterns = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ success: false, msg: "Access denied" });
    }

    const interns = await User.find({ role: "Intern" })
      .select("name email batchId createdAt")
      .populate("batchId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: interns,
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};


exports.getInternProfile = async (req, res) => {
  try {
    const internId = req.params.id;

    const intern = await User.findById(internId)
      .populate("batchId", "name batchId") 
      .lean();

    if (!intern) {
      return res.status(404).json({ msg: "Intern not found" });
    }

    const Assignment = require("../models/Assignment");
    const assignments = await Assignment.find({
      "submissions.internId": internId,
    })
      .populate("courseId", "title")
      .populate("submissions.internId", "name")
      .lean();

    res.json({
      intern,
      batch: intern.batchId || null,
      assignments, 
    });
  } catch (error) {
    console.error("❌ getInternProfile error:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

exports.createTrainer = async (req, res) => {
  try {
    const { name, email, password, batchId } = req.body;

    if (batchId && !mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({
        msg: "Invalid batch selected",
      });
    }

    const trainer = new User({
      name,
      email,
      password,
      role: "TRAINER",
      batchId: batchId || null,
    });

    await trainer.save();

    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, {
        $addToSet: { trainers: trainer._id },
      });
    }

    res.status(201).json({
      success: true,
      msg: "Trainer created successfully",
    });
  } catch (err) {
    console.error("Create trainer error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.getTrainers = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ success: false, msg: "Access denied" });
    }

    const trainers = await User.find({ role: "TRAINER" })
      .select("name email batchId createdAt trainerBatches")  
      .populate("batchId", "name")
      .populate("trainerBatches", "name")  
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: trainers,
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};


exports.getTrainerProfile = async (req, res) => {
  try {
    const trainerId = req.params.id;

    const trainer = await User.findById(trainerId)
      .populate("batchId", "name batchId startDate endDate")
      .populate("trainerBatches", "name startDate endDate");  

    if (!trainer) {
      return res.status(404).json({ msg: "Trainer not found" });
    }

    const batches = await Batch.find({
      $or: [{ trainers: trainerId }, { _id: trainer.batchId }],
    });

    res.json({ trainer, batches });
  } catch (err) {
    console.error("❌ getTrainerProfile error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.getBatches = async (req, res) => {
  try {
    const batches = await Batch.find().select("name");
    res.json(batches);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.assignTrainerBatches = async (req, res) => {
  try {
    const { batchIds } = req.body;

    const trainer = await User.findById(req.params.id);
    if (!trainer || trainer.role !== "TRAINER") {
      return res.status(404).json({ msg: "Trainer not found" });
    }

    const validBatches = await Batch.find({ _id: { $in: batchIds } });
    if (validBatches.length !== batchIds.length) {
      return res.status(400).json({ msg: "One or more batches not found" });
    }

    const updatedTrainer = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { trainerBatches: batchIds } },
      { new: true, runValidators: true }
    ).populate("trainerBatches", "name startDate endDate batchId");

    res.json({
      trainer: updatedTrainer,
      message: `${batchIds.length} batches assigned successfully`,
      batchesAssigned: updatedTrainer.trainerBatches.length,
    });
  } catch (error) {
    console.error("Assign batches error:", error);
    res.status(400).json({ msg: error.message });
  }
};

exports.getBatchById = async (req, res) => {
  try {
    const batchId = req.params.id;

    const batch = await Batch.findById(batchId)
      .populate("interns", "name email createdAt batchId")
      .populate({
        path: "interns",
        populate: {
          path: "batchId",
          select: "name batchId",
          model: "Batch",
        },
      })
      .populate("trainers", "name email createdAt")
      .lean();

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const courses = await Course.find({ batchId })
      .populate("trainerId", "name email")
      .populate("quizzes")
      .lean();

    const assignments = await Assignment.find({ batchId })
      .populate("internId", "name email")
      .populate("submissions.internId", "name email")
      .lean();

    res.json({ batch, courses, assignments });
  } catch (err) {
    console.error("Get batch by ID error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

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
    console.error("❌ getAllUsers error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getBatchPerformanceReport = async (req, res) => {
  try {
    let batch;

    const { id } = req.params;

    batch = await Batch.findById(id).populate("interns", "name email").lean();

    if (!batch) {
      batch = await Batch.findOne({ batchId: id })
        .populate("interns", "name email")
        .lean();
    }

    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    console.log(`✅ Found batch: ${batch.name} (${batch.batchId})`);

    const Assignment = require("../models/Assignment");
    let assignments = [];

    try {
      assignments = await Assignment.find({ batchId: batch.batchId })
        .populate("submissions.internId", "name email")
        .lean();
    } catch (err1) {
      console.log("String batchId failed, trying ObjectId...");

      try {
        assignments = await Assignment.find({ batchId: batch._id })
          .populate("submissions.internId", "name email")
          .lean();
      } catch (err2) {
        console.log("ObjectId failed, trying batch reference...");

        try {
          assignments = await Assignment.find({ batch: batch._id })
            .populate("submissions.internId", "name email")
            .lean();
        } catch (err3) {
          console.log("All strategies failed for assignments");
        }
      }
    }

    console.log(`📊 Found ${assignments.length} assignments`);

    const performanceData = await Promise.all(
      batch.interns.map(async (intern) => {
        let quizSubmissions = [];
        try {
          const QuizSubmission = require("../models/QuizSubmission");
          quizSubmissions = await QuizSubmission.find({
            internId: intern._id,
          }).lean();
        } catch (quizErr) {
          console.log("QuizSubmission model not found, skipping quizzes");
        }

        let quizAvg = 0;
        if (quizSubmissions.length > 0) {
          const quizScores = quizSubmissions.map((q) => q.score || 0);
          quizAvg = Math.round(
            quizScores.reduce((a, b) => a + b, 0) / quizScores.length
          );
        }

        const internAssignments = assignments.filter((a) =>
          a.submissions?.some(
            (s) =>
              s.internId?._id?.toString() === intern._id.toString() ||
              s.internId?.toString() === intern._id.toString()
          )
        );

        const assignmentSubmissions = internAssignments.map((a) => {
          const submission = a.submissions?.find(
            (s) =>
              s.internId?._id?.toString() === intern._id.toString() ||
              s.internId?.toString() === intern._id.toString()
          );
          return {
            assignmentId: a._id,
            title: a.title || `Week ${a.week}`,
            week: a.week,
            grade: submission?.trainerGrade || submission?.grade || 0,
            submittedAt: submission?.submittedAt,
          };
        });

        const assignmentAvg =
          assignmentSubmissions.length > 0
            ? Math.round(
                assignmentSubmissions.reduce((sum, a) => sum + a.grade, 0) /
                  assignmentSubmissions.length
              )
            : 0;
        const totalAssignments = internAssignments.length;
        const completedAssignments = assignmentSubmissions.filter(
          (a) => a.submittedAt
        ).length;

        return {
          _id: intern._id,
          name: intern.name,
          email: intern.email,
          performance: {
            quizzes: quizSubmissions.map((q) => ({ score: q.score || 0 })),
            assignments: assignmentSubmissions.map((a) => ({
              score: a.grade || 0,
            })),
          },
          quizAvg,
          assignmentAvg,
          totalQuizzes: quizSubmissions.length,
          completedQuizzes: quizSubmissions.length,
          totalAssignments,
          completedAssignments,
        };
      })
    );

    const avgQuizScore =
      performanceData.length > 0
        ? Math.round(
            performanceData.reduce((sum, i) => sum + i.quizAvg, 0) /
              performanceData.length
          )
        : 0;

    const avgAssignmentScore =
      performanceData.length > 0
        ? Math.round(
            performanceData.reduce((sum, i) => sum + i.assignmentAvg, 0) /
              performanceData.length
          )
        : 0;

    console.log(
      `📈 Batch averages - Quiz: ${avgQuizScore}%, Assignments: ${avgAssignmentScore}%`
    );

    res.json({
      interns: performanceData,
      batch: {
        _id: batch._id,
        name: batch.name,
        batchId: batch.batchId,
      },
      totalInterns: batch.interns.length,
      averageQuizScore: avgQuizScore,
      averageAssignmentScore: avgAssignmentScore,
    });
  } catch (err) {
    console.error("🚨 Batch performance report error:", err);
    res.status(500).json({ msg: err.message });
  }
};
