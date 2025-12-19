const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  content: String,
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  topics: [String],
  videoPath: { type: String },
  videoFileName: { type: String },
  videoSize: { type: Number }
}, { timestamps: true });


module.exports = mongoose.model('Course', courseSchema);
