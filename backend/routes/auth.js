const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');
const { auth, optionalAuth } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected routes 
router.get('/me', optionalAuth, getMe);
router.post('/change-password', auth, changePassword);

module.exports = router;
