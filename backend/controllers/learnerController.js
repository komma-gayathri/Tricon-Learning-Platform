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
 
    // Prevent duplicate submissions
    const existingSubmission = assignment.submissions.find(
      sub => sub.internId.toString() === internId.toString()
    );
 
    const { report, score } = await analyzeGithubRepo(githubRepo);
 
    if (existingSubmission) {
      // Update existing submission instead of pushing a new one
      existingSubmission.githubRepo = githubRepo;
      existingSubmission.aiReport = report;
      existingSubmission.aiScore = score;
      existingSubmission.submittedAt = new Date();
    } else {
      assignment.submissions.push({
        internId,
        githubRepo,
        aiReport: report,
        aiScore: score,
        submittedAt: new Date()
      });
    }
 
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
    const { week, batchId, title, description, courseId } = req.body;
 
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
      .populate("batchId", "name batchId")
      .populate("courseId", "title")
      .populate("submissions.internId", "name email")
      .sort({ createdAt: -1 });
 
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
 
const getMyAssignments = async (req, res) => {
  try {
    const intern = await User.findById(req.user.userId).select("batches");
 
    if (!intern?.batches || intern.batches.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Intern not linked to any batch"
      });
    }
 
    const assignments = await Assignment.find({
      batchId: { $in: intern.batches }
    }).populate("batchId", "name");
 
    // Filter submissions for each assignment to only include the current intern's submission
    const filteredAssignments = assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      const mySubmission = assignmentObj.submissions?.find(
        sub => sub.internId.toString() === req.user.userId.toString()
      );
      assignmentObj.submissions = mySubmission ? [mySubmission] : [];
      return assignmentObj;
    });
 
    res.json({ success: true, assignments: filteredAssignments });
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
 
    let batch = await Batch.findOne({ batchId });
 
    // Fallback: If not found by string ID, check if it's a valid ObjectId (legacy support)
    if (!batch && require("mongoose").Types.ObjectId.isValid(batchId)) {
      batch = await Batch.findById(batchId);
    }
 
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
 
    const userRole = role?.toUpperCase();
 
    if (userRole === "TRAINER") {
      // Query Batches where this trainer is assigned
      const batches = await Batch.find({ trainers: userId }).select("_id");
      const batchIds = batches.map(b => b._id);
      if (batchIds.length > 0) {
        query.batchId = { $in: batchIds };
      } else {
        // Return empty if no batches assigned
        return res.json({ success: true, doubts: [] });
      }
    }
 
    if (userRole === "INTERN") {
      const intern = await User.findById(userId).select("batches");
      if (intern?.batches?.length > 0) {
        query.batchId = { $in: intern.batches };
      }
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
 
const updateDoubt = async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;
    const userId = req.user.userId;
 
    const doubt = await Doubt.findById(id);
    if (!doubt) {
      return res.status(404).json({ success: false, msg: "Doubt not found" });
    }
 
    // Authorization check: Only the intern who asked can edit
    if (doubt.askedBy.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, msg: "Not authorized to edit this doubt" });
    }
 
    doubt.question = question;
    await doubt.save();
 
    res.json({ success: true, msg: "Doubt updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};
 
const deleteDoubt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
 
    const doubt = await Doubt.findById(id);
    if (!doubt) {
      return res.status(404).json({ success: false, msg: "Doubt not found" });
    }
 
    // Authorization check: Only the intern who asked can delete
    if (doubt.askedBy.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, msg: "Not authorized to delete this doubt" });
    }
 
    await Doubt.findByIdAndDelete(id);
 
    res.json({ success: true, msg: "Doubt deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};
 
/* =========================
   COURSES
========================= */
const getLearnerCourses = async (req, res) => {
  const { role, userId } = req.user;
  const userRole = role?.toUpperCase();
 
  if (userRole === "INTERN") {
    const intern = await User.findById(userId).select("batches");
    if (!intern?.batches?.length) return res.json({ courses: [] });
    const courses = await Course.find({ batchId: { $in: intern.batches } });
    return res.json({ courses });
  }
 
  if (userRole === "TRAINER") {
 
    // 1. Get batches where trainer is explicitly listed in Batch model
    const batchesFromBatchModel = await Batch.find({ trainers: userId }).select("_id");
 
    // 2. Get batches where trainer is listed in User model (legacy/redundancy)
    const trainerUser = await User.findById(userId).select("batches");
    const batchesFromUserModel = trainerUser ? trainerUser.batches : [];
 
    // 3. Merge batch IDs
    const allBatchIds = [
      ...batchesFromBatchModel.map(b => b._id.toString()),
      ...batchesFromUserModel.map(b => b.toString())
    ];
 
    const courses = await Course.find({
      $or: [
        { trainerIds: userId },
        { batchId: { $in: allBatchIds } } // allBatchIds contains strings, Mongo handles coercion usually, but best to be safe
      ]
    })
      .populate("batchId", "name"); // Populate batch name to help invalid entries if needed
 
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
    if (!batch) return res.status(404).json({ msg: "Batch not found" });
 
    const batchCourses = await Course.find({ batchId: batch._id }).select("quizzes");
    const batchQuizIds = batchCourses.reduce((acc, c) => {
      if (c.quizzes) acc.push(...c.quizzes);
      return acc;
    }, []);
 
    const internsWithPerformance = await Promise.all(
      batch.interns.map(async intern => {
        // Only count quiz submissions for quizzes that belong to this batch's courses
        const quizSubs = await QuizSubmission.find({
          internId: intern._id,
          quizId: { $in: batchQuizIds }
        });
 
        const assignments = await Assignment.find({
          batchId: batch._id,
          "submissions.internId": intern._id
        });
 
        // Calculate Quiz Average
        let quizAvg = 0;
        if (quizSubs.length > 0) {
          const totalScore = quizSubs.reduce((acc, sub) => acc + (sub.score || 0), 0);
          quizAvg = Math.round(totalScore / quizSubs.length);
        }
 
        // Calculate Assignment Average (from trainerGrade)
        let assignmentAvg = 0;
        let gradedAssignmentsCount = 0;
        let assignmentsSubmittedCount = 0;
 
        assignments.forEach(ass => {
          const sub = ass.submissions.find(s => s.internId.toString() === intern._id.toString());
          if (sub) {
            assignmentsSubmittedCount++;
            if (sub.trainerGrade !== undefined && sub.trainerGrade !== null) {
              assignmentAvg += sub.trainerGrade;
              gradedAssignmentsCount++;
            }
          }
        });
 
        if (gradedAssignmentsCount > 0) {
          assignmentAvg = Math.round(assignmentAvg / gradedAssignmentsCount);
        }
 
        return {
          _id: intern._id,
          name: intern.name,
          email: intern.email,
          quizzesTaken: quizSubs.length,
          assignmentsSubmitted: assignmentsSubmittedCount,
          // Add calculated averages to response
          quizAverage: quizSubs.length > 0 ? quizAvg : null,
          assignmentAverage: gradedAssignmentsCount > 0 ? assignmentAvg : null
        };
      })
    );
 
    res.json({ interns: internsWithPerformance });
  } catch (err) {
    res.status(500).json({ msg: "Failed to load batch performance" });
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
  updateDoubt,
  deleteDoubt,
  getLearnerCourses,
  getLearnerCourseById,
  getMyCourses,
  getBatchPerformanceReport
};
 
