const Assignment = require("../models/Assignment");
const Doubt = require("../models/Doubt");
const User = require("../models/User");
const Batch = require("../models/Batch");

/* =========================
   ASSIGNMENTS
========================= */

exports.createAssignment = async (req, res) => {
  try {
    const { week, batchId, title, description } = req.body;

    if (!week || !batchId || !title) {
      return res.status(400).json({
        msg: "week, batchId and title are required",
      });
    }

    const assignment = await Assignment.create({
      week,
      batchId,
      title,
      description,
    });

    res.status(201).json({
      msg: "Assignment created successfully",
      assignment,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, githubRepo } = req.body;
    const internId = req.user.userId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ msg: "Assignment not found" });
    }

    assignment.submissions.push({
      internId,
      githubRepo,
      submittedAt: new Date(),
    });

    await assignment.save();

    res.status(201).json({
      msg: "Assignment submitted successfully",
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.gradeAssignment = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { trainerGrade, trainerComments } = req.body;

    const assignment = await Assignment.findOneAndUpdate(
      { _id: assignmentId, "submissions._id": submissionId },
      {
        $set: {
          "submissions.$.trainerGrade": trainerGrade,
          "submissions.$.trainerComments": trainerComments,
        },
      },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ msg: "Submission not found" });
    }

    res.json({ msg: "Grade submitted successfully" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const trainer = await User.findById(req.user.userId).populate("batchId");

    if (!trainer?.batchId) {
      return res.json([]);
    }

    const assignments = await Assignment.find({
      batchId: trainer.batchId._id,
    })
      .populate("batchId", "name")
      .populate("submissions.internId", "name email")
      .lean();

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const intern = await User.findById(req.user.userId);

    const assignments = await Assignment.find({
      batchId: intern.batchId,
    })
      .populate("batchId", "name")
      .lean();

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/* =========================
   DOUBTS
========================= */

exports.askDoubt = async (req, res) => {
  try {
    const { question, batchId } = req.body;

    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    const doubt = await Doubt.create({
      question,
      batchId: batch._id,
      askedBy: req.user.userId,
    });

    res.status(201).json({
      msg: "Doubt posted successfully",
      doubt,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.answerDoubt = async (req, res) => {
  try {
    const { doubtId } = req.params;
    const { answer } = req.body;

    const doubt = await Doubt.findByIdAndUpdate(
      doubtId,
      { $push: { answers: { answeredBy: req.user.userId, answer } } },
      { new: true }
    )
      .populate("batchId", "name")
      .populate("askedBy", "name")
      .populate("answers.answeredBy", "name");

    res.json({ msg: "Answer added successfully", doubt });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

exports.getDoubts = async (req, res) => {
  try {
    const doubts = await Doubt.find()
      .populate("batchId", "name batchId")
      .populate("askedBy", "name email")
      .populate("answers.answeredBy", "name")
      .sort({ createdAt: -1 });

    res.json({ doubts });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/* =========================
   REPORTS
========================= */

exports.getPerformanceReport = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    const interns = await User.find({
      role: "Intern",
      batchId: batch._id,
    }).select("name email performance");

    res.json({ batch, interns });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
