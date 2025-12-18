const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  week: { type: Number, required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  title: String,
  description: String,
  submissions: [{
    internId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    githubRepo: String,
    aiReport: String,
    trainerGrade: Number,
    trainerComments: String,
    submittedAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
