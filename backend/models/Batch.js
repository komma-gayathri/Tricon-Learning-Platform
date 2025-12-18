const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  startDate: Date,
  endDate: Date,
  interns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  trainers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' }
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);
