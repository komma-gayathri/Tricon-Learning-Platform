const User = require("../models/User");
const Batch = require("../models/Batch");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const QuizSubmission = require("../models/QuizSubmission");
const Doubt = require("../models/Doubt");

const getDashboardStats = async (req, res) => {
    try {
        const { userId, role } = req.user;
        if (!userId) {
            return res.status(401).json({ success: false, msg: "User ID missing from token" });
        }
        const userRole = role?.toUpperCase();

        let stats = {};

        if (userRole === "HR") {
            const [totalBatches, totalTrainers, totalInterns, totalCourses, recentBatches] = await Promise.all([
                Batch.countDocuments(),
                User.countDocuments({ role: "TRAINER" }),
                User.countDocuments({ role: "INTERN" }),
                Course.countDocuments(),
                Batch.find().sort({ createdAt: -1 }).limit(5).select("name batchId createdAt")
            ]);

            stats = {
                totalBatches,
                totalTrainers,
                totalInterns,
                totalCourses,
                recentBatches,
                role: "HR"
            };
        } else if (userRole === "TRAINER") {
            // Get batches assigned to this trainer
            const myBatches = await Batch.find({ trainers: userId }).select("_id interns");
            const batchIds = myBatches.map(b => b._id);

            // Calculate total interns across all batches
            const internSet = new Set();
            myBatches.forEach(b => b.interns?.forEach(i => internSet.add(i.toString())));

            // Count pending assignment reviews
            const assignments = await Assignment.find({ batchId: { $in: batchIds } });
            let pendingReviews = 0;
            assignments.forEach(ass => {
                ass.submissions?.forEach(sub => {
                    if (sub.trainerGrade === undefined || sub.trainerGrade === null) {
                        pendingReviews++;
                    }
                });
            });

            // Get count of courses trainer is assigned to
            const courseCount = await Course.countDocuments({
                $or: [
                    { trainerIds: userId },
                    { batchId: { $in: batchIds } }
                ]
            });

            stats = {
                assignedBatches: batchIds.length,
                totalLearners: internSet.size,
                pendingReviews,
                courseCount,
                role: "TRAINER"
            };
        } else if (userRole === "INTERN") {
            const intern = await User.findById(userId).select("batches");
            const batchIds = intern?.batches || [];

            const batchInfo = await Batch.find({ _id: { $in: batchIds } }).select("name");
            const courseCount = await Course.countDocuments({ batchId: { $in: batchIds } });

            // Assignments
            const allAssignments = await Assignment.find({ batchId: { $in: batchIds } });
            const pendingAssignments = allAssignments.filter(ass =>
                !ass.submissions?.some(sub => sub.internId.toString() === userId.toString())
            ).length;

            // Quiz Performance
            const quizSubs = await QuizSubmission.find({ internId: userId });
            const avgQuizScore = quizSubs.length > 0
                ? Math.round(quizSubs.reduce((acc, curr) => acc + (curr.score || 0), 0) / quizSubs.length)
                : 0;

            // Recent Doubts
            const recentDoubts = await Doubt.find({ askedBy: userId })
                .sort({ createdAt: -1 })
                .limit(3)
                .populate("answers.answeredBy", "name");

            stats = {
                batchName: batchInfo.map(b => b.name).join(", ") || "No Batch",
                courseCount,
                pendingAssignments,
                avgQuizScore,
                recentDoubts,
                role: "INTERN"
            };
        }

        res.json({ success: true, stats });
    } catch (err) {
        console.error("Dashboard stats error:", err);
        res.status(500).json({ success: false, msg: "Failed to load dashboard stats" });
    }
};

module.exports = { getDashboardStats };
