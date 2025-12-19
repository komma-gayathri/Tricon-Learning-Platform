const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  changePassword, 
  forgotPassword,   
  resetPassword     
} = require('../controllers/authController');
const { auth } = require('../middleware/auth'); 

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected routes 
router.get('/me', auth, getMe);
router.post('/change-password', auth, changePassword);

module.exports = router;
