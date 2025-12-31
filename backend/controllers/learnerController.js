const Assignment = require('../models/Assignment');
const Doubt = require('../models/Doubt');
const User = require('../models/User');
const Batch = require('../models/Batch');

async function analyzeGithubRepo(repoUrl) { // MOCK AI FUNCTION
    return { report: `AI analysis of ${repoUrl}: Code structure is good. README is well-written. Lacks unit tests.`, score: 85 };
}

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

<<<<<<< HEAD
=======
exports.getLearnerCourses = async (req, res) => {
  try {
    const { role, userId } = req.user;

    // INTERN → only batch courses
    if (role === 'Intern') {
      const intern = await User.findById(userId).select('batchId');
      if (!intern?.batchId) {
        return res.json({ success: true, courses: [] });
      }

      const courses = await Course.find({
        batchId: intern.batchId
      });

      return res.json({ success: true, courses });
    }

    // TRAINER → only assigned courses
    if (role === 'TRAINER') {
      const courses = await Course.find({
        trainerId: userId
      });
      return res.json({ success: true, courses });
    }

    // HR → all courses
    const courses = await Course.find();
    return res.json({ success: true, courses });

  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.getLearnerCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { role, userId } = req.user;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, msg: 'Course not found' });
    }

    // Intern security check
    if (role === 'Intern') {
      const intern = await User.findById(userId).select('batchId');
      if (!course.batchId.equals(intern.batchId)) {
        return res.status(403).json({ success: false, msg: 'Access denied' });
      }
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.getMyCourses = async (req, res) => {
  const internId = req.user.userId;

  const intern = await User.findById(internId).select("batchId");
  if (!intern || !intern.batchId) {
    return res.status(400).json({ msg: "Intern not assigned to a batch" });
  }

  const courses = await Course.find({ batchId: intern.batchId })
    .populate("batchId", "name");
  res.json({ courses });
};
>>>>>>> recover-learner
