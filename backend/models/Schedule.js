const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  timetable: [{
    date: Date,
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    timeSlot: String,
    topic: String
  }],
  notifications: [{ sentTo: String, timestamp: Date }]
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
