const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Batch = require('./models/Batch');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        const batches = await Batch.find({ $or: [{ batchId: { $exists: false } }, { batchId: "undefined" }, { batchId: null }] });
        console.log('Found', batches.length, 'batches to fix');

        for (const b of batches) {
            let newId = b.name.replace('Batch-', '').trim();
            if (!newId || newId === b.name) {
                newId = 'B-' + b._id.toString().slice(-4);
            }

            console.log(`Fixing Batch "${b.name}" -> new batchId: "${newId}"`);
            b.batchId = newId;
            await b.save();
        }

        console.log('Migration complete');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
