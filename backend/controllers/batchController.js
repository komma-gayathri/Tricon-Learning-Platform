const Batch = require("../models/Batch");
const User = require("../models/User");

/* =========================
   CREATE BATCH
========================= */
exports.createBatch = async (req, res) => {
  try {
    const { batchId, name, startDate, endDate } = req.body;

    if (!batchId || !name || !startDate || !endDate) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existing = await Batch.findOne({ batchId });
    if (existing) {
      return res.status(400).json({ msg: "Batch ID already exists" });
    }

    const batch = await Batch.create({
      batchId,
      name,
      startDate,
      endDate,
      interns: [],
      trainers: [],
    });

    res.status(201).json({ success: true, batch });
  } catch (err) {
    console.error("createBatch error:", err);
    res.status(500).json({ msg: "Failed to create batch" });
  }
};

/* =========================
   LIST BATCHES
========================= */
exports.listBatches = async (req, res) => {
  try {
    const batches = await Batch.find()
      .sort({ createdAt: -1 })
      .populate("interns", "name email")
      .populate("trainers", "name email");

    res.json({ success: true, batches });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch batches" });
  }
};

/* =========================
   GET BATCH DETAILS
========================= */
exports.getBatchDetails = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate("interns", "name email")
      .populate("trainers", "name email");

    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    res.json({ success: true, batch });
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch batch details" });
  }
};

/* =========================
   GET UNASSIGNED USERS
========================= */
exports.getUnassignedUsers = async (req, res) => {
  try {
    const interns = await User.find({
      role: "Intern",
      batchId: { $exists: false },
    }).select("name email");

    const trainers = await User.find({
      role: "TRAINER",
    }).select("name email");

    res.json({ success: true, interns, trainers });
  } catch (err) {
    console.error("getUnassignedUsers error:", err);
    res.status(500).json({ msg: "Failed to fetch users" });
  }
};

/* =========================
   ASSIGN USERS TO BATCH
    SAFE + CONFLICT-FREE FIX
========================= */
exports.assignUsersToBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { internIds = [], trainerIds = [] } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    /* ===== INTERN: ONE BATCH ONLY ===== */
    for (const internId of internIds) {
      const intern = await User.findById(internId);
      if (!intern) continue;

      if (intern.batchId) {
        return res
          .status(400)
          .json({ msg: `${intern.name} already assigned to a batch` });
      }

      intern.batchId = batch._id;
      await intern.save();

      if (!batch.interns.includes(internId)) {
        batch.interns.push(internId);
      }
    }

    /* ===== TRAINER: MULTIPLE BATCHES ===== */
    for (const trainerId of trainerIds) {
      const exists = batch.trainers.some(
        (t) => t.toString() === trainerId.toString()
      );

      if (!exists) {
        batch.trainers.push(trainerId);
      }

      //  IMPORTANT FIX (DOES NOT BREAK ANYTHING)
      // Keep trainer → batch mapping in sync
      await User.findByIdAndUpdate(trainerId, {
        $addToSet: { trainerBatches: batch._id },
      });
    }

    await batch.save();

    res.json({ success: true, msg: "Users assigned successfully" });
  } catch (err) {
    console.error("assignUsersToBatch error:", err);
    res.status(500).json({ msg: "Failed to assign users" });
  }
};

/* =========================
   REMOVE USER FROM BATCH
========================= */
exports.removeUserFromBatch = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ msg: "Batch not found" });

    if (role === "Intern") {
      batch.interns = batch.interns.filter(
        (id) => id.toString() !== userId
      );
      await User.findByIdAndUpdate(userId, {
        $unset: { batchId: "" },
      });
    }

    if (role === "TRAINER") {
      batch.trainers = batch.trainers.filter(
        (id) => id.toString() !== userId
      );

      //  keep trainer document clean
      await User.findByIdAndUpdate(userId, {
        $pull: { trainerBatches: batch._id },
      });
    }

    await batch.save();

    res.json({ success: true, msg: "User removed from batch" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to remove user" });
  }
};
