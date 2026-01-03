const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const Quiz = require("../models/Quiz");
const QuizSubmission = require("../models/QuizSubmission");
const User = require("../models/User");

exports.createCourse = async (req, res) => {
  try {
    const { title, description, content, week, batchId, videoUrl, difficulty } =
      req.body;

    if (!title || !description || !content || !week || !batchId) {
      return res.status(400).json({
        success: false,
        msg: "Please provide title, description, content, week, and batchId",
      });
    }

    if (!req.user || req.user.role !== "HR") {
      return res.status(401).json({
        success: false,
        msg: "Only HR can create courses",
      });
    }

    const course = new Course({
      title,
      description,
      content,
      week,
      batchId,
      videoUrl,
      difficulty,
      trainerIds: [],
    });

    await course.save();

    return res.status(201).json({
      success: true,
      msg: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return res.status(500).json({
      success: false,
      msg: "Error creating course: " + error.message,
    });
  }
};

exports.assignTrainersToCourse = async (req, res) => {
  try {
    const { id } = req.params;
    let { trainerIds } = req.body;

    if (!req.user || req.user.role !== "HR") {
      return res
        .status(403)
        .json({ success: false, msg: "Only HR can assign trainers" });
    }

    if (!Array.isArray(trainerIds) || trainerIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, msg: "Select at least one trainer" });
    }
    const objectIds = trainerIds.map((tid) => new mongoose.Types.ObjectId(tid));
    const trainers = await User.find({
      _id: { $in: objectIds },
      role: "TRAINER",
    }).select("_id name");

    if (trainers.length !== objectIds.length) {
      return res
        .status(400)
        .json({ success: false, msg: "All must be valid TRAINERs" });
    }

    const courseIdObj = new mongoose.Types.ObjectId(id);

    const course = await Course.findByIdAndUpdate(
      id,
      { $addToSet: { trainerIds: { $each: objectIds } } },
      { new: true }
    ).populate("trainerIds", "name email");

    if (!course) {
      return res.status(404).json({ success: false, msg: "Course not found" });
    }

    await User.updateMany(
      { _id: { $in: objectIds } },
      { $addToSet: { trainerCourses: courseIdObj } }
    );

    res.json({
      success: true,
      msg: `Added ${trainers.length} trainer(s). Total: ${course.trainerIds.length}`,
      course,
    });
  } catch (error) {
    console.error("assignTrainers error:", error);
    res.status(500).json({ success: false, msg: error.message });
  }
};

exports.listCourses = async (req, res) => {
  try {
    console.log("🔍 USER:", { role: req.user.role, batchId: req.user.batchId });

    let query = {};
    if (req.user.role === "Intern") {
      const batchIdStr = req.user.batchId?._id?.toString();
      console.log("🎯 Intern filtering batchId:", batchIdStr);
      if (batchIdStr) {
        query.batchId = new mongoose.Types.ObjectId(batchIdStr);
      }
    }

    console.log("🔍 Final query:", JSON.stringify(query));

    const courses = await Course.find(query)
      .populate("trainerIds", "name email")
      .populate("batchId", "name _id");

    console.log(
      "📊 Found courses:",
      courses.length,
      courses.map((c) => ({ title: c.title, batchId: c.batchId }))
    );

    res.json({
      success: true,
      total: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Error listing courses:", error);
    res.status(500).json({
      success: false,
      msg: "Error fetching courses: " + error.message,
    });
  }
};

exports.getTrainerCourses = async (req, res) => {
  try {
    const trainer = await User.findById(req.params.trainerId).populate(
      "trainerBatches",
      "_id"
    );

    if (!trainer || trainer.role !== "TRAINER") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const trainerBatchIds = trainer.trainerBatches.map((b) => b._id);

    const courses = await Course.find({
      $or: [{ trainerIds: trainer._id }, { batchId: { $in: trainerBatchIds } }],
    })
      .populate("batchId", "name")
      .populate("trainerIds", "name")
      .sort({ createdAt: -1 });

    res.json({ courses });
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch courses" });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id)
      .populate("trainerIds", "name email")
      .populate("batchId", "name");
    if (!course) {
      return res.status(404).json({ success: false, msg: "Course not found" });
    }
    return res.json({ success: true, course });
  } catch (error) {
    console.error("Error fetching course:", error);
    return res
      .status(500)
      .json({ success: false, msg: "Error fetching course: " + error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, week, videoUrl, difficulty } =
      req.body;

    const course = await Course.findById(id).populate("trainerIds", "_id");

    if (!course) {
      return res.status(404).json({ success: false, msg: "Course not found" });
    }

    // ✅ FIXED: Handle undefined userId + multiple access points
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    console.log("🔍 AUTH DEBUG:", {
      userId,
      userRole: req.user?.role,
      rawTrainerIds: course.trainerIds.map((t) => String(t._id)),
    });

    const trainerIds = course.trainerIds.map((t) => String(t._id));
    const isTrainerAuthorized = trainerIds.includes(String(userId));

    if (req.user?.role !== "HR" && !isTrainerAuthorized) {
      return res.status(403).json({
        success: false,
        msg: `Access denied. User: ${userId}, Expected trainers: ${trainerIds.join(
          ","
        )}`,
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      {
        title,
        description,
        content,
        week,
        videoUrl,
        difficulty,
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate("trainerIds", "name email");

    return res.json({
      success: true,
      msg: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return res.status(500).json({ success: false, msg: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Only HR can delete
    if (!req.user || req.user.role !== "HR") {
      return res.status(403).json({
        success: false,
        msg: "Only HR can delete courses",
      });
    }

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        msg: "Course not found",
      });
    }

    if (course.videoPath) {
      const videoPath = path.join(__dirname, "../../", course.videoPath);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    await Quiz.deleteMany({ courseId: id });

    // Remove course reference from trainers
    await User.updateMany(
      { trainerCourses: id },
      { $pull: { trainerCourses: id } }
    );

    return res.json({
      success: true,
      msg: "Course and associated quizzes deleted",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return res.status(500).json({
      success: false,
      msg: "Error deleting course: " + error.message,
    });
  }
};

exports.uploadCourseVideo = async (req, res) => {
  try {
    console.log("VIDEO UPLOAD STARTED");

    if (!req.file) {
      return res.status(400).json({ msg: "No video file" });
    }

    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ msg: "Course not found" });
    }

    console.log("✅ HR can upload to any course:", course.title);

    if (course.difficulty === "" || course.difficulty === null) {
      course.difficulty = "Easy";
    }

    if (course.videoPath) {
      const oldPath = path.join(__dirname, "../../", course.videoPath);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    course.videoPath = `/uploads/videos/${req.file.filename}`;
    course.videoFileName = req.file.originalname;
    course.videoSize = req.file.size;
    course.updatedAt = Date.now();

    await course.save();

    console.log("✅ UPLOAD SUCCESS:", course.title);

    res.json({
      success: true,
      msg: "Video uploaded successfully! 🎉",
    });
  } catch (error) {
    console.error("❌ UPLOAD ERROR:", error.message);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ msg: "Upload failed - " + error.message });
  }
};

exports.downloadCourseVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course || !course.videoPath) {
      return res
        .status(404)
        .json({ success: false, msg: "Video not found for this course" });
    }

    const videoPath = path.join(__dirname, "../../", course.videoPath);
    if (!fs.existsSync(videoPath)) {
      return res
        .status(404)
        .json({ success: false, msg: "Video file not found" });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || isNaN(end) || start > end || start >= fileSize) {
        return res.status(416).send("Requested range not satisfiable");
      }

      const chunkSize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      });

      file.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error("Error downloading video:", error);
    return res.status(500).json({
      success: false,
      msg: "Error downloading video: " + error.message,
    });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        msg: "Course not found",
      });
    }

    if (
      req.user.role !== "HR" &&
      !course.trainerIds.some((t) => t.equals(req.user._id))
    ) {
      return res.status(403).json({
        success: false,
        msg: "Access denied",
      });
    }

    if (!course.videoPath) {
      return res.status(400).json({
        success: false,
        msg: "No video to delete",
      });
    }

    const videoPath = path.join(__dirname, "../../", course.videoPath);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    course.videoPath = null;
    course.videoFileName = null;
    course.videoSize = null;
    course.updatedAt = Date.now();

    await course.save();

    console.log(`Video deleted for course: ${course.title}`);

    return res.json({
      success: true,
      msg: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    return res.status(500).json({
      success: false,
      msg: "Error deleting video: " + error.message,
    });
  }
};

exports.generateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id).populate('trainerIds', '_id');
    if (!course) {
      return res.status(404).json({ success: false, msg: 'Course not found' });
    }
    
    const userId = req.user?.userId || req.user?._id;
    const trainerIds = course.trainerIds.map(t => String(t._id));
    const isTrainerAuthorized = trainerIds.includes(String(userId));
    
    if (req.user?.role !== 'HR' && !isTrainerAuthorized) {
      return res.status(403).json({ msg: `Access denied! You are not assigned in this course.` });
    }
    
    const Quiz = require("../models/Quiz");
    const existingQuiz = await Quiz.findOne({ courseId: id });
    if (existingQuiz) {
      return res.status(400).json({ 
        success: false, 
        msg: `Quiz already exists for this course.` 
      });
    }
    
    const { generateQuizWithPerplexity } = require("../utils/quizGenerator");
    const quizData = await generateQuizWithPerplexity(course.title, course.content);
    
    const questions = quizData.questions.map(q => ({
      question: q.question,
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
      correctAnswer: Number(q.correctAnswerIndex) || 0,
    }));
    
    const quiz = new Quiz({
      courseId: id,
      questions,
      passingScore: 60
    });
    
    await quiz.save();
    
    await Course.findByIdAndUpdate(id, { $addToSet: { quizzes: quiz._id } });
    
    res.json({ 
      success: true, 
      msg: 'AI quiz generated successfully!', 
      quiz 
    });
  } catch (error) {
    console.error('generateQuiz error:', error);
    res.status(500).json({ success: false, msg: error.message });
  }
};



exports.getCourseQuizzes = async (req, res) => {
  try {
    const { id } = req.params;

    const quizzes = await Quiz.find({ courseId: id });

    return res.json({
      success: true,
      total: quizzes.length,
      quizzes,
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return res.status(500).json({
      success: false,
      msg: "Error fetching quizzes: " + error.message,
    });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id).populate(
      "courseId",
      "title description"
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        msg: "Quiz not found",
      });
    }

    return res.json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return res.status(500).json({
      success: false,
      msg: "Error fetching quiz: " + error.message,
    });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const internId = req.user.userId;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Please provide answers array",
      });
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        msg: "Quiz not found",
      });
    }

    const existingSubmission = await QuizSubmission.findOne({
      quizId: id,
      internId,
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        msg: "You have already submitted this quiz",
      });
    }

    let correctCount = 0;

    answers.forEach((answer) => {
      const question = quiz.questions[answer.questionIndex];
      if (
        question &&
        typeof question.correctAnswer === "number" &&
        question.correctAnswer === answer.selectedOptionIndex
      ) {
        correctCount++;
      }
    });

    const totalQuestions = quiz.questions.length;
    const rawScore = (correctCount / totalQuestions) * 100;
    const percentage = Math.round(rawScore);

    const passingScore = quiz.passingScore ?? 60;
    const passed = percentage >= passingScore;

    const submission = new QuizSubmission({
      quizId: id,
      internId,
      answers,
      score: percentage,
      percentage,
      totalQuestions,
      correctAnswers: correctCount,
      status: passed ? "passed" : "failed",
    });

    await submission.save();

    return res.status(201).json({
      success: true,
      msg: "Quiz submitted successfully",
      submission: {
        submissionId: submission._id,
        score: submission.score,
        percentage: submission.percentage,
        correctAnswers: submission.correctAnswers,
        totalQuestions: submission.totalQuestions,
        status: submission.status,
        passingScore,
        feedback: passed
          ? `Great! You scored ${percentage}%. You passed the quiz!`
          : `You scored ${percentage}%. You need ${passingScore}% to pass. Try again!`,
      },
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return res.status(500).json({
      success: false,
      msg: "Error submitting quiz: " + error.message,
    });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const internId = req.user.userId;

    const submissions = await QuizSubmission.find({ internId })
      .populate("quizId", "title courseId")
      .populate({
        path: "quizId",
        populate: { path: "courseId", select: "title" },
      })
      .sort({ submittedAt: -1 });

    return res.json({
      success: true,
      total: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return res.status(500).json({
      success: false,
      msg: "Error fetching submissions: " + error.message,
    });
  }
};

exports.getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await QuizSubmission.findById(submissionId)
      .populate("quizId")
      .populate("internId", "name email");

    if (!submission) {
      return res.status(404).json({
        success: false,
        msg: "Submission not found",
      });
    }

    return res.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return res.status(500).json({
      success: false,
      msg: "Error fetching submission: " + error.message,
    });
  }
};

exports.getQuizSubmissions = async (req, res) => {
  try {
    const { id } = req.params;

    const submissions = await QuizSubmission.find({ quizId: id })
      .populate("internId", "name email")
      .sort({ submittedAt: -1 });

    const quiz = await Quiz.findById(id);

    return res.json({
      success: true,
      quizTitle: quiz.title,
      total: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Error fetching quiz submissions:", error);
    return res.status(500).json({
      success: false,
      msg: "Error fetching submissions: " + error.message,
    });
  }
};

module.exports = exports;
