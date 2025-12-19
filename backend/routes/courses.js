const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { auth, checkRole } = require('../middleware/auth');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/videos/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.use(auth);

router.post('/create', checkRole(['TRAINER']), courseController.createCourse);
router.get('/', courseController.listCourses);
router.get('/:id', courseController.getCourse);
router.put('/:id', checkRole(['TRAINER']), courseController.updateCourse);
router.delete('/:id', checkRole(['TRAINER']), courseController.deleteCourse);

router.post('/:id/upload-video', checkRole(['TRAINER']), upload.single('video'), courseController.uploadCourseVideo);
router.get('/:id/download-video', courseController.downloadCourseVideo);
router.delete('/:id/delete-video', checkRole(['TRAINER']), courseController.deleteVideo);

router.post('/:id/generate-quiz', checkRole(['TRAINER']), courseController.generateQuiz);
router.get('/:id/quizzes', courseController.getCourseQuizzes);
router.get('/quiz/:id', courseController.getQuiz);
router.post('/quiz/:id/submit', courseController.submitQuiz); 
router.get('/submissions/my', courseController.getMySubmissions);
router.get('/quiz/:id/submissions', checkRole(['TRAINER']), courseController.getQuizSubmissions);

module.exports = router;
