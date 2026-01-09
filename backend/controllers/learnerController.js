const Assignment = require("../models/Assignment");
const Doubt = require("../models/Doubt");
const User = require("../models/User");
const Batch = require("../models/Batch");
const Course = require("../models/Course");
const QuizSubmission = require("../models/QuizSubmission");

/* =========================
   MOCK AI ANALYSIS
========================= */
async function analyzeGithubRepo(repoUrl) {
  return {
    report: `AI analysis of ${repoUrl}: Code structure is good. README is well-written. Lacks unit tests.`,
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

    res.json({ success: true, msg: "Assignment submitted successfully" });
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
      return res.status(404).json({ success: false, msg: "Submission not found." });
    }

    const submission = assignment.submissions.find(
      sub => sub._id.toString() === submissionId
    );

    await User.findByIdAndUpdate(submission.internId, {
      $push: {
        "performance.assignments": { score: trainerGrade, assignmentId }
      }
    });

    res.json({ success: true, msg: "Grade submitted." });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { week, batchId, title, description } = req.body;

    if (!week || !batchId || !title) {
      return res.status(400).json({
        success: false,
        msg: "week, batchId and title are required"
      });
    }

    const assignment = new Assignment({
      week,
      batchId,
      title,
      description,
      courseId,
      createdBy: req.user.userId
    });

    await assignment.save();
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getAssignments = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { batchId, week } = req.query;
    let query = {};

    const userRole = role?.toUpperCase();
    if (batchId) {
      query.batchId = batchId;
    } else if (userRole === "TRAINER") {
      // If trainer doesn't provide batchId, show assignments for all their batches
      const batches = await Batch.find({ trainers: userId }).select("_id");
      const batchIds = batches.map(b => b._id);
      if (batchIds.length > 0) {
        query.batchId = { $in: batchIds };
      } else {
        return res.json({ success: true, assignments: [] });
      }
    }

    // Filter by creator for trainers
    // Show assignments created by this trainer OR assignments without createdBy (old assignments)
    if (userRole === "TRAINER") {
      query.$or = [
        { createdBy: userId },           // Assignments created by this trainer
        { createdBy: { $exists: false } }, // Old assignments without createdBy field
        { createdBy: null }               // Assignments with null createdBy
      ];
    }

    if (week) query.week = parseInt(week);

    const assignments = await Assignment.find(query)
      .populate("batchId", "name")
      .populate("submissions.internId", "name email");

    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getMyAssignments = async (req, res) => {
  try {
    // ROBUST FIX: Query Batch model directly to find where intern is assigned
    // This handles cases where user.batches might be out of sync
    const batches = await Batch.find({ interns: req.user.userId }).select("_id");

    if (!batches.length) {
      return res.json({ success: true, assignments: [] });
    }

    const batchIds = batches.map(b => b._id);

    const assignments = await Assignment.find({
      batchId: { $in: batchIds }
    }).populate("batchId", "name");

    res.json({ success: true, assignments });
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

    if (!question || !batchId) {
      return res.status(400).json({
        success: false,
        msg: "Question and batchId are required"
      });
    }

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
    )
      .populate("askedBy", "name email")
      .populate("answers.answeredBy", "name");

    res.json({ success: true, doubt });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getDoubts = async (req, res) => {
  try {
    const { role, userId } = req.user;
    let query = {};

    if (role === "TRAINER") {
      const { batchId } = req.query;
      if (batchId) {
        // If specific batch requested, verify access
        const hasAccess = await Batch.exists({ _id: batchId, trainers: userId });
        if (!hasAccess) {
          // Return empty if no access, or error? 
          // To be safe and UI friendly, just return empty or restrict query
          query.batchId = null;
        } else {
          query.batchId = batchId;
        }
      } else {
        // If no batch specified, get all batches where they are trainer
        const batches = await Batch.find({ trainers: userId }).select("_id");
        const batchIds = batches.map(b => b._id);
        query.batchId = { $in: batchIds };
      }
    }

    if (role === "INTERN") {
      // ROBUST FIX: Query Batch model directly
      const batches = await Batch.find({ interns: userId }).select("_id");
      const batchIds = batches.map(b => b._id);
      query.batchId = { $in: batchIds };
    }

    const doubts = await Doubt.find(query)
      .populate("batchId", "name batchId")
      .populate("askedBy", "name email")
      .populate("answers.answeredBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, doubts });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

/* =========================
   COURSES
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
  const intern = await User.findById(req.user.userId).select("batches");

  // If intern has no batches, show courses without batch assignment (available to all)
  if (!intern?.batches?.length) {
    const courses = await Course.find({
      $or: [
        { batchId: { $exists: false } },
        { batchId: null }
      ]
    });
    return res.json({ courses });
  }

  // Show courses assigned to intern's batches OR courses without batch (available to all)
  const courses = await Course.find({
    $or: [
      { batchId: { $in: intern.batches } },
      { batchId: { $exists: false } },
      { batchId: null }
    ]
  });

  res.json({ courses });
};

/* =========================
   PERFORMANCE
========================= */
const getBatchPerformanceReport = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await Batch.findById(batchId).populate("interns");

    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }
    if (!batch.interns || batch.interns.length === 0) {
      return res.status(200).json({
        interns: [],
        message: "No interns are assigned to this batch yet."
      });
    }

    if (!batch.interns || batch.interns.length === 0) {
      return res.json({ interns: [] });
    }

    const internsWithPerformance = await Promise.all(
      batch.interns.map(async (intern) => {
        /* ======================
           QUIZ PERFORMANCE
        ====================== */
        const quizSubmissions = await QuizSubmission.find({
          internId: intern._id,
        });

        const quizzes = quizSubmissions.map((q) => ({
          score: q.percentage, // frontend uses this for avg
        }));

        /* ======================
           ASSIGNMENT PERFORMANCE
        ====================== */
        const assignments = await Assignment.find({
          batchId: batch._id,
          "submissions.internId": intern._id,
        });

        const assignmentScores = assignments
          .map((a) =>
            a.submissions.find(
              (s) => s.internId.toString() === intern._id.toString()
            )
          )
          .filter(Boolean)
          .map((s) => ({
            score: s.trainerGrade ?? 0,
          }));

        // Calculate Quiz Average
        const totalQuizScore = quizzes.reduce((sum, q) => sum + (q.score || 0), 0);
        const quizAverage = quizzes.length > 0 ? Math.round(totalQuizScore / quizzes.length) : null;

        // Calculate Assignment Average
        const gradedAssignments = assignmentScores.filter(a => a.score !== undefined && a.score !== null);
        const totalAssignmentScore = gradedAssignments.reduce((sum, a) => sum + a.score, 0);
        const assignmentAverage = gradedAssignments.length > 0 ? Math.round(totalAssignmentScore / gradedAssignments.length) : null;

        return {
          name: intern.name,
          email: intern.email,
          performance: {
            quizzes,
            assignments: assignmentScores,
          },
          quizzesTaken: quizzes.length,
          assignmentsSubmitted: assignmentScores.length,
          quizAverage,
          assignmentAverage
        };
      })
    );

    return res.json({ interns: internsWithPerformance });
  } catch (error) {
    console.error("Batch performance error:", error);
    return res
      .status(500)
      .json({ msg: "Failed to load batch performance" });
  }
};



/* =========================
   EXPORTS
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
  getMyCourses,
  getBatchPerformanceReport
};
