const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); 

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Intern', 'TRAINER', 'HR'], required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    
    // ADD THESE FIELDS FOR PASSWORD RESET
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    performance: {
        quizzes: [{ 
            score: Number, 
            submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizSubmission' },
            date: { type: Date, default: Date.now }
        }],
        assignments: [{ 
            score: Number, 
            assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
            date: { type: Date, default: Date.now }
        }]
    }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// ADD THIS METHOD FOR PASSWORD RESET
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
