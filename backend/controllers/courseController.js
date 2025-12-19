const fs = require('fs');
const path = require('path');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const generateQuizWithPerplexity = require('../utils/quizGenerator');

exports.getCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('trainerId', 'name email')
      .populate('batchId', 'name');

    if (!course) {
      return res.status(404).json({
        success: false,
        msg: 'Course not found'
      });
    }

    return res.json({
      success: true,
      course
    });

  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error fetching course: ' + error.message
    });
  }
};

exports.listCourses = async (req, res) => {
  try {
    const { batchId, week } = req.query;

    let query = {};
    if (batchId) query.batchId = batchId;
    if (week) query.week = parseInt(week);

    const courses = await Course.find(query)
      .populate('trainerId', 'name email')
      .populate('batchId', 'name')
      .sort({ week: 1 });

    return res.json({
      success: true,
      total: courses.length,
      courses
    });

  } catch (error) {
    console.error('Error listing courses:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error fetching courses: ' + error.message
    });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('trainerId', 'name email')
      .populate('batchId', 'name');

    if (!course) {
      return res.status(404).json({
        success: false,
        msg: 'Course not found'
      });
    }

    return res.json({
      success: true,
      course
    });

  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error fetching course: ' + error.message
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, week, videoUrl, difficulty } = req.body;

    const course = await Course.findByIdAndUpdate(
      id,
      {
        title,
        description,
        content,
        week,
        videoUrl,
        difficulty,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        msg: 'Course not found'
      });
    }

    return res.json({
      success: true,
      msg: 'Course updated successfully',
      course
    });

  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error updating course: ' + error.message
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        msg: 'Course not found'
      });
    }

    if (course.videoPath) {
      const videoPath = path.join(__dirname, '../../', course.videoPath);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    await Quiz.deleteMany({ courseId: id });

    return res.json({
      success: true,
      msg: 'Course and associated quizzes deleted'
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error deleting course: ' + error.message
    });
  }
};

exports.uploadCourseVideo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        msg: 'No video file uploaded'
      });
    }

    const course = await Course.findById(id);
    if (!course) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        msg: 'Course not found'
      });
    }

    if (course.videoPath) {
      const oldVideoPath = path.join(__dirname, '../../', course.videoPath);
      if (fs.existsSync(oldVideoPath)) {
        fs.unlinkSync(oldVideoPath);
      }
    }

    const videoPath = `uploads/videos/${req.file.filename}`;

    course.videoPath = videoPath;
    course.videoFileName = req.file.originalname;
    course.videoSize = req.file.size;
    course.updatedAt = Date.now();

    await course.save();

    console.log(`Video uploaded for course: ${course.title}`);
    console.log(`File: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

    return res.status(200).json({
      success: true,
      msg: 'Video uploaded successfully',
      video: {
        courseId: course._id,
        videoPath: course.videoPath,
        videoFileName: course.videoFileName,
        videoSize: course.videoSize,
        downloadUrl: `/api/courses/${id}/download-video`
      }
    });

  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading video:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error uploading video: ' + error.message
    });
  }
};
exports.downloadCourseVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course || !course.videoPath) {
            return res.status(404).json({ success: false, msg: 'Video not found for this course' });
        }
        const videoPath = path.join(__dirname, '../../', course.videoPath);
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ success: false, msg: 'Video file not found' });
        }
        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            if (start >= fileSize) {
                return res.status(416).send('Requested range not satisfiable');
            }
            const chunkSize = (end - start) + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes', 'Content-Length': chunkSize, 'Content-Type': 'video/mp4'
            });
            file.pipe(res);
        } else {
            res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': 'video/mp4' });
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error) {
        console.error('Error downloading video:', error);
        return res.status(500).json({ success: false, msg: 'Error downloading video: ' + error.message });
    }
};
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        msg: 'Course not found'
      });
    }

    if (!course.videoPath) {
      return res.status(400).json({
        success: false,
        msg: 'No video to delete'
      });
    }

    const videoPath = path.join(__dirname, '../../', course.videoPath);
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
      msg: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error deleting video: ' + error.message
    });
  }
};

exports.generateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, msg: 'Course not found' });
    }

    if (await Quiz.findOne({ courseId: id })) {
      return res.status(400).json({
        success: false,
        msg: 'A quiz already exists for this course',
      });
    }

    console.log(`\nGenerating AI quiz for course: "${course.title}"`);

    const quizData = await generateQuizWithPerplexity(
      course.title,
      course.content
    );

    const mappedQuestions = quizData.questions.map((q) => ({
      question: q.question,                 
      options: q.options,
      correctAnswer: q.correctAnswerIndex,  
      userAnswer: null,
      aiScore: null,
    }));

    const quiz = new Quiz({
      courseId: id,
      questions: mappedQuestions,
      completed: false,
    });

    await quiz.save();
    await Course.findByIdAndUpdate(id, { $push: { quizzes: quiz._id } });

    console.log(
      `Quiz saved to database with ${quiz.questions.length} questions\n`
    );

    return res.status(201).json({
      success: true,
      msg: 'AI Quiz generated and saved successfully',
      quiz,
    });
  } catch (error) {
    console.error('Error generating quiz FULL:', error);

    const detail =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.response?.data?.msg ||
      error.message ||
      JSON.stringify(error);

    return res.status(500).json({
      success: false,
      msg: 'Error generating quiz: ' + detail,
    });
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
    console.error('Error fetching quizzes:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error fetching quizzes: ' + error.message,
    });
  }
};


exports.getQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id)
      .populate('courseId', 'title description');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        msg: 'Quiz not found'
      });
    }

    return res.json({
      success: true,
      quiz
    });

  } catch (error) {
    console.error('Error fetching quiz:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error fetching quiz: ' + error.message
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
        msg: 'Please provide answers array'
      });
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        msg: 'Quiz not found'
      });
    }

    const existingSubmission = await QuizSubmission.findOne({
      quizId: id,
      internId
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        msg: 'You have already submitted this quiz'
      });
    }

    let correctCount = 0;

    answers.forEach((answer) => {
      const question = quiz.questions[answer.questionIndex];
      if (
        question &&
        typeof question.correctAnswer === 'number' &&       
        question.correctAnswer === answer.selectedOptionIndex
      ) {
        correctCount++;
      }
    });

    const score = (correctCount / quiz.questions.length) * 100;
    const percentage = Math.round(score);
    const passed = percentage >= quiz.passingScore; 

    const submission = new QuizSubmission({
      quizId: id,
      internId,
      answers,
      score: Math.round(score),
      percentage,
      totalQuestions: quiz.questions.length,
      correctAnswers: correctCount,
      status: passed ? 'passed' : 'failed'
    });

    await submission.save();

    console.log(`Quiz submitted by intern ${internId}`);
    console.log(`Score: ${correctCount}/${quiz.questions.length} = ${percentage}%`);

    return res.status(201).json({
      success: true,
      msg: 'Quiz submitted successfully',
      submission: {
        submissionId: submission._id,
        score: submission.score,
        percentage: submission.percentage,
        correctAnswers: submission.correctAnswers,
        totalQuestions: submission.totalQuestions,
        status: submission.status,
        passingScore: quiz.passingScore,
        feedback: passed
          ? `Great! You scored ${percentage}%. You passed the quiz!`
          : `You scored ${percentage}%. You need ${quiz.passingScore}% to pass. Try again!`
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error submitting quiz: ' + error.message
    });
  }
};

exports.getMySubmissions = async (req, res) => {
  try {
    const internId = req.user.userId;

    const submissions = await QuizSubmission.find({ internId })
      .populate('quizId', 'title courseId')
      .populate({
        path: 'quizId',
        populate: { path: 'courseId', select: 'title' }
      })
      .sort({ submittedAt: -1 });

    return res.json({
      success: true,
      total: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error fetching submissions: ' + error.message
    });
  }
};

exports.getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await QuizSubmission.findById(submissionId)
      .populate('quizId')
      .populate('internId', 'name email');

    if (!submission) {
      return res.status(404).json({
        success: false,
        msg: 'Submission not found'
      });
    }

    return res.json({
      success: true,
      submission
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error fetching submission: ' + error.message
    });
  }
};

exports.getQuizSubmissions = async (req, res) => {
  try {
    const { id } = req.params;

    const submissions = await QuizSubmission.find({ quizId: id })
      .populate('internId', 'name email')
      .sort({ submittedAt: -1 });

    const quiz = await Quiz.findById(id);

    return res.json({
      success: true,
      quizTitle: quiz.title,
      total: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Error fetching quiz submissions:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error fetching submissions: ' + error.message
    });
  }
};

module.exports = exports;