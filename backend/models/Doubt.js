const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema({
  question: { type: String, required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  askedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answer: String,
    answeredAt: { type: Date, default: Date.now }
  }],
  resolved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Doubt', doubtSchema);
