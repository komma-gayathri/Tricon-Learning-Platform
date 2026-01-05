const Assignment = require("../models/Assignment");
const Doubt = require("../models/Doubt");
const User = require("../models/User");
const Batch = require("../models/Batch");

async function analyzeGithubRepo(repoUrl) {
  return {
    report: `AI analysis of ${repoUrl}: Code structure is good. README is well-written. Lacks unit tests.`,
    score: 85,
  };
}

exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, githubRepo } = req.body;
    const internId = req.user.userId;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res
        .status(404)
        .json({ success: false, msg: "Assignment not found." });
    }
    const { report, score } = await analyzeGithubRepo(githubRepo);
    const submission = {
      internId,
      githubRepo,
      aiReport: report,
      aiScore: score,
      submittedAt: new Date(),
    };
    assignment.submissions.push(submission);
    await assignment.save();
    res.status(201).json({
      success: true,
      msg: "Assignment submitted and AI analysis is complete.",
      aiReport: report,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, msg: "Server Error: " + err.message });
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
    )
      .populate("batchId", "name")
      .populate("submissions.internId", "name email");

    if (!assignment) {
      return res.status(404).json({ msg: "Submission not found." });
    }

    // Update user performance record
    const submission = assignment.submissions.find(
      (sub) => sub._id.toString() === submissionId
    );
    await User.findByIdAndUpdate(submission.internId, {
      $push: {
        "performance.assignments": { score: trainerGrade, assignmentId },
      },
    });

    res.json({ msg: "Grade submitted.", assignments: [assignment] });
  } catch (err) {
    res.status(500).json({ msg: "Server Error: " + err.message });
  }
};

exports.getPerformanceReport = async (req, res) => {
  try {
    console.log("🔍 Backend batchId:", req.params.id);

    const batch = await Batch.findById(req.params.id).lean();
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }
    const interns = await User.find({
      role: "Intern",
      batchId: batch._id,
    })
      .select("name email performance")
      .lean();

    res.json({
      batch,
      totalInterns: interns.length,
      interns,
    });
  } catch (err) {
    console.error("💥 ERROR:", err.message);
    res.status(500).json({ msg: err.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    console.log("🔍 Trainer ID:", req.user.userId);

    const trainer = await User.findById(req.user.userId).populate("batchId");
    console.log("🔍 Trainer batchId:", trainer?.batchId?._id);

    if (!trainer?.batchId) {
      console.log("❌ No trainer batch");
      return res.json([]);
    }

    const assignments = await Assignment.find({ batchId: trainer.batchId._id })
      .populate({
        path: "batchId",
        select: "name",
      })
      .populate({
        path: "submissions.internId",
        select: "name email",
        model: "User",
      })
      .lean();

    console.log("🔍 Assignments found:", assignments.length);
    console.log(
      "🔍 First submission internId:",
      assignments[0]?.submissions[0]?.internId
    );

    res.json(assignments);
  } catch (error) {
    console.error("❌ getAssignments ERROR:", error);
    res.status(500).json({ msg: error.message });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const internId = req.user.userId;

    const user = await User.findById(internId).select("batchId");
    if (!user?.batchId) {
      return res.status(400).json({
        success: false,
        msg: "Intern is not linked to any batch",
      });
    }

    const assignments = await Assignment.find({
      batchId: user.batchId,
    })
      .populate("batchId", "name")
      .lean();
    const formatted = assignments.map((a) => ({
      ...a,
      submissions: a.submissions.filter(
        (s) => s.internId.toString() === internId
      ),
    }));

    res.json({ success: true, assignments: formatted });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};



exports.askDoubt = async (req, res) => {
  try {
    const { question, batchId } = req.body;
    if (!question || !batchId) {
      return res
        .status(400)
        .json({ success: false, msg: "Question and batchId are required" });
    }
    const batch = await Batch.findOne({ batchId });
    if (!batch) {
      return res
        .status(404)
        .json({ success: false, msg: "Batch not found with this batchId" });
    }
    const doubt = new Doubt({
      question,
      batchId: batch._id,
      askedBy: req.user.userId,
    });
    await doubt.save();
    res
      .status(201)
      .json({ success: true, msg: "Doubt posted successfully", doubt });
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
      { $push: { answers: { answeredBy: req.user.userId, answer } } },
      { new: true }
    )
      .populate("askedBy", "name")
      .populate("answers.answeredBy", "name");
    res.json({ success: true, doubt });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.getDoubts = async (req, res) => {
  try {
    const { batchId } = req.query;
    let filter = {};
    if (batchId) {
      const batch = await Batch.findOne({ batchId });
      if (!batch) {
        return res
          .status(404)
          .json({ success: false, msg: "Batch not found with this batchId" });
      }
      filter.batchId = batch._id;
    }
    const doubts = await Doubt.find(filter)
      .populate("askedBy", "name email")
      .populate("answers.answeredBy", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, total: doubts.length, doubts });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.editDoubt = async (req, res) => {
  try {
    const { doubtId } = req.params;

    // ✅ FIXED: Handle BOTH question AND answer
    const question = req.body.question;
    const answer = req.body.answer;

    if (!question && !answer) {
      return res.status(400).json({
        success: false,
        msg: "Question or answer is required",
      });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, msg: "Not authenticated" });
    }

    let doubt;
    let targetDoc;
    let ownerField;

    // ✅ FIRST: Try to find as ANSWER
    doubt = await Doubt.findOne({ "answers._id": doubtId })
      .populate("askedBy", "name email _id")
      .populate("answers.answeredBy", "name _id");

    if (doubt && doubt.answers.id(doubtId)) {
      targetDoc = doubt.answers.id(doubtId);
      ownerField = "answeredBy";
    } else {
      // ✅ THEN: Try as DOUBT
      doubt = await Doubt.findById(doubtId)
        .populate("askedBy", "name email _id")
        .populate("answers.answeredBy", "name");

      if (!doubt || !doubt.askedBy || !doubt.askedBy._id) {
        return res.status(404).json({ success: false, msg: "Item not found" });
      }
      targetDoc = doubt;
      ownerField = "askedBy";
    }

    // ✅ SAME AUTH LOGIC
    const isOwner =
      targetDoc[ownerField]._id.toString() === req.user.userId?.toString();
    const isTrainerOrHR =
      req.user.role && ["TRAINER", "HR"].includes(req.user.role);

    console.log("DEBUG:", {
      itemType: ownerField === "askedBy" ? "DOUBT" : "ANSWER",
      ownerId: targetDoc[ownerField]._id.toString(),
      userId: req.user.userId?.toString(),
      isOwner,
      isTrainerOrHR,
    });

    if (!isOwner && !isTrainerOrHR) {
      return res.status(403).json({
        success: false,
        msg: `Not authorized to edit this ${
          ownerField === "askedBy" ? "doubt" : "answer"
        }`,
      });
    }

    // ✅ UPDATE LOGIC
    if (answer !== undefined && ownerField === "answeredBy") {
      // Update ANSWER
      targetDoc.answer = answer;
      targetDoc.answeredAt = new Date();
      await doubt.save();
    } else {
      // Update DOUBT
      const updatedDoubt = await Doubt.findByIdAndUpdate(
        doubtId,
        { question: question || answer }, // Use whichever was sent
        { new: true, runValidators: true }
      )
        .populate("askedBy", "name email _id")
        .populate("answers.answeredBy", "name");

      targetDoc = updatedDoubt;
    }

    const finalDoubt = await Doubt.findById(doubt._id || doubtId)
      .populate("askedBy", "name email")
      .populate("answers.answeredBy", "name");

    res.json({
      success: true,
      msg: `${
        ownerField === "askedBy" ? "Doubt" : "Answer"
      } updated successfully`,
      doubt: finalDoubt,
    });
  } catch (error) {
    console.error("editDoubt error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.deleteDoubt = async (req, res) => {
  try {
    const { doubtId } = req.params;

    if (!req.user) {
      return res.status(401).json({ success: false, msg: "Not authenticated" });
    }

    if (!req.user.userId) {
      return res
        .status(401)
        .json({ success: false, msg: "Invalid user session" });
    }

    let doubt;
    let targetDoc;
    let ownerField;

    // ✅ FIRST: Try to find as ANSWER
    doubt = await Doubt.findOne({ "answers._id": doubtId }).populate(
      "answers.answeredBy",
      "_id"
    );

    if (doubt && doubt.answers.id(doubtId)) {
      targetDoc = doubt.answers.id(doubtId);
      ownerField = "answeredBy";
    } else {
      // ✅ THEN: Try as DOUBT
      doubt = await Doubt.findById(doubtId).populate("askedBy", "_id");

      if (!doubt) {
        return res.status(404).json({ success: false, msg: "Item not found" });
      }

      if (!doubt.askedBy || !doubt.askedBy._id) {
        return res
          .status(403)
          .json({ success: false, msg: "Invalid item owner" });
      }

      targetDoc = doubt;
      ownerField = "askedBy";
    }

    // ✅ SAME AUTH LOGIC
    const isOwner =
      targetDoc[ownerField]._id.toString() === req.user.userId.toString();
    const isTrainerOrHR =
      req.user.role && ["TRAINER", "HR"].includes(req.user.role);

    console.log("DELETE DEBUG:", {
      itemType: ownerField === "askedBy" ? "DOUBT" : "ANSWER",
      ownerId: targetDoc[ownerField]._id.toString(),
      userId: req.user.userId.toString(),
      isOwner,
      isTrainerOrHR,
    });

    if (!isOwner && !isTrainerOrHR) {
      return res.status(403).json({
        success: false,
        msg: `Not authorized to delete this ${
          ownerField === "askedBy" ? "doubt" : "answer"
        }`,
      });
    }

    // ✅ DELETE LOGIC
    if (ownerField === "answeredBy") {
      // Delete ANSWER
      doubt.answers.pull(doubtId);
      await doubt.save();
    } else {
      // Delete DOUBT
      await Doubt.findByIdAndDelete(doubtId);
    }

    res.json({
      success: true,
      msg: `${
        ownerField === "askedBy" ? "Doubt" : "Answer"
      } deleted successfully`,
    });
  } catch (error) {
    console.error("deleteDoubt error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { week, batchId, title, description } = req.body;
    if (!week || !batchId || !title) {
      return res
        .status(400)
        .json({ msg: "week, batchId and title are required" });
    }

    const assignment = new Assignment({ week, batchId, title, description });
    await assignment.save();

    // ✅ RELOAD with populate
    const trainer = await User.findById(req.user.userId).populate("batchId");
    const assignments = await Assignment.find({ batchId: trainer.batchId._id })
      .populate("batchId", "name")
      .populate("submissions.internId", "name email")
      .lean();

    console.log("🔍 Created + reloaded:", assignments.length);
    res.status(201).json({ msg: "Assignment created.", assignments });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
