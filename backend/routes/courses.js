const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { auth, checkRole } = require('../middleware/auth');
const uploadVideo = require('../middleware/uploadVideo'); 

router.get('/:id/download-video', courseController.downloadCourseVideo);

router.post('/:id/generate-quiz', auth, courseController.generateQuiz);

router.post('/:id/upload-video', auth, uploadVideo.single('video'), courseController.uploadCourseVideo);
router.delete('/:id/delete-video', auth, courseController.deleteVideo);  

router.use(auth);

router.post('/', checkRole(['HR']), courseController.createCourse);
router.put('/:id/assign-trainers', checkRole(['HR']), courseController.assignTrainersToCourse);
router.get('/trainer/:trainerId', auth, checkRole(['TRAINER']), courseController.getTrainerCourses);

router.get('/', courseController.listCourses);
router.get('/:id', courseController.getCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', checkRole(['HR']), courseController.deleteCourse);

router.get('/:id/quizzes', courseController.getCourseQuizzes);
router.get('/quiz/:id', courseController.getQuiz);
router.post('/quiz/:id/submit', checkRole(['Intern']), courseController.submitQuiz);
router.get('/submissions/my', courseController.getMySubmissions);
router.get('/quiz/:id/submissions', checkRole(['TRAINER'], ['HR']), courseController.getQuizSubmissions);

module.exports = router;
