const mongoose = require('mongoose');
const User = require('./models/User');
const Batch = require('./models/Batch');
const QuizSubmission = require('./models/QuizSubmission');
const Assignment = require('./models/Assignment');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

async function debugPerformance() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const batch = await Batch.findOne({ name: /Sreya/ }).populate('interns');
        if (!batch) {
            // Try finding by ID from screenshot if name fails
            // Batch Sreya ID from my previous run: 6954bba445248be5a6cda1df
            const batchById = await Batch.findById('6954bba445248be5a6cda1df').populate('interns');
            if (!batchById) {
                console.log('Batch Sreya not found by name or ID');
                return;
            }
            processBatch(batchById);
        } else {
            processBatch(batch);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

async function processBatch(batch) {
    console.log(`Analyzing batch: ${batch.name} (${batch._id})`);
    console.log(`Interns in batch: ${batch.interns?.length || 0}`);

    const internsWithPerformance = await Promise.all(
        (batch.interns || []).map(async intern => {
            console.log(`Checking intern: ${intern.name} (${intern.email})`);
            const quizSubs = await QuizSubmission.find({ internId: intern._id });
            console.log(`Quiz submissions for ${intern.email}: ${quizSubs.length}`);
            const assignments = await Assignment.find({
                batchId: batch._id,
                "submissions.internId": intern._id
            });
            console.log(`Assignments with submissions for ${intern.email}: ${assignments.length}`);

            // Calculate Quiz Average
            let quizAvg = 0;
            if (quizSubs.length > 0) {
                const totalScore = quizSubs.reduce((acc, sub) => acc + (sub.score || 0), 0);
                quizAvg = Math.round(totalScore / quizSubs.length);
            }

            // Calculate Assignment Average
            let assignmentAvg = 0;
            let gradedAssignmentsCount = 0;
            let assignmentsSubmittedCount = 0;

            assignments.forEach(ass => {
                const sub = ass.submissions.find(s => s.internId.toString() === intern._id.toString());
                if (sub) {
                    assignmentsSubmittedCount++;
                    if (sub.trainerGrade !== undefined && sub.trainerGrade !== null) {
                        assignmentAvg += sub.trainerGrade;
                        gradedAssignmentsCount++;
                    }
                }
            });

            if (gradedAssignmentsCount > 0) {
                assignmentAvg = Math.round(assignmentAvg / gradedAssignmentsCount);
            }

            return {
                _id: intern._id,
                name: intern.name,
                email: intern.email,
                quizzesTaken: quizSubs.length,
                assignmentsSubmitted: assignmentsSubmittedCount,
                quizAverage: quizSubs.length > 0 ? quizAvg : null,
                assignmentAverage: gradedAssignmentsCount > 0 ? assignmentAvg : null
            };
        })
    );

    console.log('Performance Data:', JSON.stringify(internsWithPerformance, null, 2));
    await mongoose.connection.close();
}

debugPerformance();
