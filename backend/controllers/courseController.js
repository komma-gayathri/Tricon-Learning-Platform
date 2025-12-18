const fs = require('fs');
const path = require('path');
const Course = require('../models/Course');

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