const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  week: {
    type: Number,
    required: true,
    min: 1,
    max: 52
  },
  trainerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: false },
  removedFromBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  content: String,
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  topics: [String],
  videoPath: { type: String },
  videoFileName: { type: String },
  videoSize: { type: Number },
  difficulty: {
    type: String,
    enum : ['Easy', 'Medium', 'Hard'],
    default: null
  }
}, { timestamps: true });

courseSchema.index(
  { title: 1, week: 1, batchId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Course', courseSchema);
