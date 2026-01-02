const Assignment = require("../models/Assignment");
const Doubt = require("../models/Doubt");
const User = require("../models/User");
const Batch = require("../models/Batch");
const Course = require("../models/Course");

/* =========================
   MOCK AI ANALYSIS
========================= */
async function analyzeGithubRepo(repoUrl) {
  return {
    report: `AI analysis of ${repoUrl}: Code structure is good.`,
    score: 85
  };
}

/* =========================
   ASSIGNMENTS
========================= */
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, githubRepo } = req.body;
    const internId = req.user.userId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ msg: "Assignment not found" });
    }

    const { report, score } = await analyzeGithubRepo(githubRepo);

    assignment.submissions.push({
      internId,
      githubRepo,
      aiReport: report,
      aiScore: score
    });

    await assignment.save();

    res.json({
      success: true,
      msg: "Assignment submitted successfully"
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const gradeAssignment = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { trainerGrade, trainerComments } = req.body;

    const assignment = await Assignment.findOneAndUpdate(
      { _id: assignmentId, "submissions._id": submissionId },
      {
        $set: {
          "submissions.$.trainerGrade": trainerGrade,
          "submissions.$.trainerComments": trainerComments
        }
      },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ msg: "Submission not found" });
    }

    res.json({ success: true, msg: "Assignment graded" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { week, batchId, title, description } = req.body;

    const assignment = new Assignment({
      week,
      batchId,
      title,
      description
    });

    await assignment.save();
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("batchId", "name")
      .populate("submissions.internId", "name email");

    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getMyAssignments = async (req, res) => {
  try {
    const internId = req.user.userId;
    const intern = await User.findById(internId).select("batchId");

    const assignments = await Assignment.find({
      batchId: intern.batchId
    }).populate("batchId", "name");

    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   DOUBTS
========================= */
const askDoubt = async (req, res) => {
  try {
    const { question, batchId } = req.body;

    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    const doubt = new Doubt({
      question,
      batchId: batch._id,
      askedBy: req.user.userId
    });

    await doubt.save();
    res.status(201).json({ success: true, doubt });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const answerDoubt = async (req, res) => {
  try {
    const { doubtId } = req.params;
    const { answer } = req.body;

    const doubt = await Doubt.findByIdAndUpdate(
      doubtId,
      {
        $push: {
          answers: {
            answeredBy: req.user.userId,
            answer
          }
        }
      },
      { new: true }
    );

    res.json({ success: true, doubt });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getDoubts = async (req, res) => {
  try {
    const { role, userId } = req.user;

    let query = {};

    // TRAINER: only doubts from batches trainer is assigned to
    if (role === "TRAINER") {
      const trainer = await User.findById(userId).select("batchId");
      if (trainer?.batchId) {
        query.batchId = trainer.batchId;
      }
    }

    // INTERN: only own batch doubts
    if (role === "Intern") {
      const intern = await User.findById(userId).select("batchId");
      query.batchId = intern.batchId;
    }

    const doubts = await Doubt.find(query)
      .populate("batchId", "name batchId")   // 🔴 THIS WAS MISSING
      .populate("askedBy", "name email")
      .populate("answers.answeredBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, doubts });
  } catch (err) {
    console.error("Error fetching doubts:", err);
    res.status(500).json({ msg: err.message });
  }
};


/* =========================
   COURSES (ROLE-BASED)
========================= */
const getLearnerCourses = async (req, res) => {
  const { role, userId } = req.user;

  if (role === "Intern") {
    const intern = await User.findById(userId).select("batchId");
    const courses = await Course.find({ batchId: intern.batchId });
    return res.json({ courses });
  }

  if (role === "TRAINER") {
    const courses = await Course.find({ trainerId: userId });
    return res.json({ courses });
  }

  const courses = await Course.find();
  res.json({ courses });
};

const getLearnerCourseById = async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ msg: "Course not found" });
  res.json({ course });
};

const getMyCourses = async (req, res) => {
  const intern = await User.findById(req.user.userId).select("batchId");
  const courses = await Course.find({ batchId: intern.batchId });
  res.json({ courses });
};

/* =========================
   EXPORTS (VERY IMPORTANT)
========================= */
module.exports = {
  submitAssignment,
  gradeAssignment,
  createAssignment,
  getAssignments,
  getMyAssignments,
  askDoubt,
  answerDoubt,
  getDoubts,
  getLearnerCourses,
  getLearnerCourseById,
  getMyCourses
};
