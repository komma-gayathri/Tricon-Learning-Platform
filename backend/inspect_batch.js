const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Batch = require('./models/Batch');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        const batchId = '695b658f997961f4143612a3';
        const batch = await Batch.findById(batchId);
        if (batch) {
            console.log('BATCH DOCUMENT:', JSON.stringify(batch, null, 2));
            console.log('batchId field value:', batch.batchId);
            console.log('Type of batchId:', typeof batch.batchId);
        } else {
            console.log('Batch not found');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
