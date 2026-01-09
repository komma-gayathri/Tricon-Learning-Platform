const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Batch = require('./models/Batch');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        const batches = await Batch.find({});
        console.log('TOTAL BATCHES:', batches.length);
        batches.forEach(b => {
            console.log(`ID: ${b._id}, Name: "${b.name}", BatchID: "${b.batchId}"`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
