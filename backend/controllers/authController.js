const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Batch = require('../models/Batch');
 
// Helper to create JWT
const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};
 
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, batchId } = req.body;
 
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, msg: 'Please provide name, email and password' });
    }
 
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, msg: 'User already exists with this email' });
    }
 
    const user = new User({
      name,
      email,
      password,
      role: role || 'Intern',
      batchId: batchId || undefined
    });
 
    await user.save();
 
    // 🔹 If batchId is provided, link user to batch (trainers & interns)
    if (batchId && (user.role === 'TRAINER' || user.role === 'Intern')) {
      const update =
        user.role === 'TRAINER'
          ? { $addToSet: { trainers: user._id } }
          : { $addToSet: { interns: user._id } };
 
      await Batch.findByIdAndUpdate(batchId, update);
    }
 
    const token = createToken(user);
 
    return res.status(201).json({
      success: true,
      msg: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        batchId: user.batchId
      }
    });
  } catch (err) {
    console.error('Error in register:', err);
    return res.status(500).json({ success: false, msg: 'Server error: ' + err.message });
  }
};
 
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({ success: false, msg: 'Please provide email and password' });
    }
 
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, msg: 'Invalid credentials' });
    }
 
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, msg: 'Invalid credentials' });
    }
 
    const token = createToken(user);
 
    return res.json({
      success: true,
      msg: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        batchId: user.batchId,          
      }
    });
  } catch (err) {
    console.error('Error in login:', err);
    return res.status(500).json({ success: false, msg: 'Server error: ' + err.message });
  }
};
 
 
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }
 
    return res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Error in getMe:', err);
    return res.status(500).json({ success: false, msg: 'Server error: ' + err.message });
  }
};
 
// @route   POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
 
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide current password and new password'
      });
    }
 
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        msg: 'New password must be at least 6 characters long'
      });
    }
 
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }
 
    // Verify current password
    const isCurrentPasswordMatch = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordMatch) {
      return res.status(401).json({
        success: false,
        msg: 'Current password is incorrect'
      });
    }
 
    // Update password
    user.password = newPassword;
    await user.save();
 
    return res.json({
      success: true,
      msg: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({
      success: false,
      msg: 'Server error: ' + err.message
    });
  }
};
 
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
 
    if (!email) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide email address'
      });
    }
 
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'No user found with this email'
      });
    }
 
    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
 
    const resetURL = `http://localhost:5000/api/auth/reset-password/${resetToken}`;
 
    console.log(`🔑 Password reset token: ${resetToken}`);
    console.log(`📧 Reset URL: ${resetURL}`);
 
    return res.json({
      success: true,
      msg: 'Password reset token sent to your email',
      resetToken // for testing; remove in production
    });
  } catch (err) {
    console.error('Error in forgot password:', err);
    return res.status(500).json({
      success: false,
      msg: 'Server error: ' + err.message
    });
  }
};
 
// @route   POST /api/auth/reset-password/:resetToken
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { resetToken } = req.params;
 
    if (!password) {
      return res.status(400).json({
        success: false,
        msg: 'Please provide new password'
      });
    }
 
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        msg: 'Password must be at least 6 characters'
      });
    }
 
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
 
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
 
    if (!user) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid or expired token'
      });
    }
 
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
 
    await user.save();
 
    return res.json({
      success: true,
      msg: 'Password reset successful. Please login with new password.'
    });
  } catch (err) {
    console.error('Error resetting password:', err);
    return res.status(500).json({
      success: false,
      msg: 'Server error: ' + err.message
    });
  }
};
 
 