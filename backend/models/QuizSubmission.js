const mongoose = require('mongoose');

const quizSubmissionSchema = new mongoose.Schema({
  
  quizId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  
  internId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  answers: [{
    questionIndex: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    selectedOptionIndex: { 
      type: Number, 
      required: true, 
      min: 0 
    }
  }],
  
  score: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  
  percentage: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  
  totalQuestions: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  
  correctAnswers: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  
  status: { 
    type: String, 
    enum: ['passed', 'failed'], 
    required: true 
  }
  
}, { 
  timestamps: true 
});

// Index for fast queries
quizSubmissionSchema.index({ quizId: 1, internId: 1 }, { unique: true });
quizSubmissionSchema.index({ internId: 1 });
quizSubmissionSchema.index({ quizId: 1 });

module.exports = mongoose.model('QuizSubmission', quizSubmissionSchema);
