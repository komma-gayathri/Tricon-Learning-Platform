const User = require("../models/User");
const Batch = require("../models/Batch");

/* =========================
   GET ALL INTERNS (HR)
========================= */
exports.getInterns = async (req, res) => {
  try {
    const interns = await User.find({ role: "Intern" })
      .select("-password")
      .populate("batchId", "name batchId startDate endDate");

    res.json({
      success: true,
      interns
    });
  } catch (err) {
    console.error("❌ getInterns error:", err);
    res.status(500).json({ msg: "Failed to fetch interns" });
  }
};

/* =========================
   GET ALL TRAINERS (HR)
   ✔ batchCount derived from Batch.trainers[]
========================= */
exports.getTrainers = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const trainers = await User.find({ role: "TRAINER" })
      .select("name email")
      .lean();

    const batches = await Batch.find()
      .select("trainers")
      .lean();

    const trainerBatchCount = {};

    batches.forEach((batch) => {
      (batch.trainers || []).forEach((trainerId) => {
        const id = trainerId.toString();
        trainerBatchCount[id] = (trainerBatchCount[id] || 0) + 1;
      });
    });

    const result = trainers.map((trainer) => ({
      _id: trainer._id,
      name: trainer.name,
      email: trainer.email,
      batchCount: trainerBatchCount[trainer._id.toString()] || 0
    }));

    res.json({
      success: true,
      trainers: result
    });
  } catch (err) {
    console.error("❌ getTrainers error:", err);
    res.status(500).json({ msg: "Failed to fetch trainers" });
  }
};

/* =========================
   GET USER PROFILE (HR)
   ✔ Intern + Trainer
========================= */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const batches = await Batch.find()
      .select("name batchId startDate endDate trainers")
      .lean();

    let assignedBatches = [];

    // INTERN → one batch
    if (user.role === "Intern" && user.batchId) {
      const batch = batches.find(
        (b) => b._id.toString() === user.batchId.toString()
      );
      if (batch) assignedBatches.push(batch);
    }

    // TRAINER → many batches
    if (user.role === "TRAINER") {
      assignedBatches = batches.filter((batch) =>
        (batch.trainers || []).some(
          (t) => t.toString() === userId.toString()
        )
      );
    }

    res.json({
      success: true,
      user,
      batches: assignedBatches,
      batchCount: assignedBatches.length
    });
  } catch (err) {
    console.error("❌ getUserProfile error:", err);
    res.status(500).json({ msg: "Failed to fetch user profile" });
  }
};

/* =========================
   ASSIGN INTERNS & TRAINERS TO BATCH
   ✔ Intern → one batch
   ✔ Trainer → many batches
========================= */
exports.assignUsersToBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { internIds = [], trainerIds = [] } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ msg: "Batch not found" });
    }

    /* ========= INTERN LOGIC ========= */
    for (const internId of internIds) {
      const intern = await User.findById(internId);
      if (!intern) continue;

      if (intern.batchId) {
        return res.status(400).json({
          msg: `${intern.name} is already assigned to a batch`
        });
      }

      intern.batchId = batchId;
      await intern.save();

      if (!batch.interns.includes(internId)) {
        batch.interns.push(internId);
      }
    }

    /* ========= TRAINER LOGIC ========= */
    trainerIds.forEach((trainerId) => {
      const exists = batch.trainers.some(
        (t) => t.toString() === trainerId.toString()
      );
      if (!exists) {
        batch.trainers.push(trainerId);
      }
    });

    await batch.save();

    res.json({
      success: true,
      msg: "Users assigned to batch successfully"
    });
  } catch (err) {
    console.error("❌ assignUsersToBatch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
