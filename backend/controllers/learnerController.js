const Assignment = require('../models/Assignment');
const Doubt = require('../models/Doubt');
const User = require('../models/User');
const Batch = require('../models/Batch');
const Course = require('../models/Course');

async function analyzeGithubRepo(repoUrl) { // MOCK AI FUNCTION
    return { report: `AI analysis of ${repoUrl}: Code structure is good. README is well-written. Lacks unit tests.`, score: 85 };
}

exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, githubRepo } = req.body;
    const internId = req.user.userId;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
        return res.status(404).json({ success: false, msg: 'Assignment not found.' });
    }
    const { report, score } = await analyzeGithubRepo(githubRepo);
    const submission = { internId, githubRepo, aiReport: report, aiScore: score };
    assignment.submissions.push(submission);
    await assignment.save();
    res.status(201).json({ success: true, msg: 'Assignment submitted and AI analysis is complete.', aiReport: report });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Server Error: ' + err.message });
  }
};

exports.gradeAssignment = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { trainerGrade, trainerComments } = req.body;
    const assignment = await Assignment.findOneAndUpdate(
        { "_id": assignmentId, "submissions._id": submissionId },
        {
            "$set": {
                "submissions.$.trainerGrade": trainerGrade,
                "submissions.$.trainerComments": trainerComments
            }
        },
        { new: true }
    );
    if (!assignment) {
        return res.status(404).json({ success: false, msg: 'Submission not found.' });
    }
    // Update user performance record
    const submission = assignment.submissions.find(sub => sub._id.toString() === submissionId);
    await User.findByIdAndUpdate(submission.internId, { $push: { 'performance.assignments': { score: trainerGrade, assignmentId } } });
    res.json({ success: true, msg: 'Grade submitted.' });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Server Error: ' + err.message });
  }
};

exports.getPerformanceReport = async (req, res) => {
  try {
    const batchCode = req.params.batchId; 

    if (!batchCode) {
      return res.status(400).json({
        success: false,
        msg: 'BatchId is required'
      });
    }

    const batch = await Batch.findOne({ batchId: batchCode });
    if (!batch) {
      return res.status(404).json({
        success: false,
        msg: 'Batch not found with this batchId'
      });
    }

    // Use the Batch _id to find interns
    const interns = await User.find({
      role: 'Intern',
      batchId: batch._id
    }).select('name email performance');

    return res.json({ success: true, interns });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: 'Server Error: ' + err.message
    });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { batchId, week } = req.query;
    let query = { batchId };
    if (week) query.week = parseInt(week);
    
    const assignments = await Assignment.find(query)
      .populate('batchId', 'name')
      .populate('submissions.internId', 'name email');
    
    res.json({ success: true, total: assignments.length, assignments });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const internId = req.user.userId;
    const user = await User.findById(internId).select('batchId');
    if (!user || !user.batchId) {
      return res.status(400).json({
        success: false,
        msg: 'Intern is not linked to any batch'
      });
    }

    const assignments = await Assignment.find({
      batchId: user.batchId
    }).populate('batchId', 'name');

    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.askDoubt = async (req, res) => {
  try {
    const { question, batchId } = req.body; // here batchId is e.g. "Batch01"

    if (!question || !batchId) {
      return res.status(400).json({
        success: false,
        msg: 'Question and batchId are required'
      });
    }

    // Find Batch by its string code
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        msg: 'Batch not found with this batchId'
      });
    }

    const doubt = new Doubt({
      question,
      batchId: batch._id,        // store ObjectId
      askedBy: req.user.userId
    });

    await doubt.save();

    res.status(201).json({
      success: true,
      msg: 'Doubt posted successfully',
      doubt
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.answerDoubt = async (req, res) => {
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
    ).populate('askedBy', 'name').populate('answers.answeredBy', 'name');
    
    res.json({ success: true, doubt });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.getDoubts = async (req, res) => {
  try {
    const { batchId } = req.query; // e.g. "Batch01"

    let filter = {};
    if (batchId) {
      const batch = await Batch.findOne({ batchId });  // use string field
      if (!batch) {
        return res.status(404).json({
          success: false,
          msg: 'Batch not found with this batchId'
        });
      }
      filter.batchId = batch._id;   // ObjectId for Doubt.batchId
    }

    const doubts = await Doubt.find(filter)
      .populate('askedBy', 'name email')
      .populate('answers.answeredBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, total: doubts.length, doubts });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { week, batchId, title, description } = req.body;
    if (!week || !batchId || !title) {
      return res.status(400).json({
        success: false,
        msg: 'week, batchId and title are required'
      });
    }

    const assignment = new Assignment({
      week,
      batchId,       // Batch _id
      title,
      description
    });

    await assignment.save();
    res.status(201).json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

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