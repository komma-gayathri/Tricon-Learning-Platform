const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, unique: true },
    name: String,
    course: String,
    startDate: Date,
    endDate: Date,

    // 🔹 Allocation happens here
    trainers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    interns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Batch", batchSchema);
