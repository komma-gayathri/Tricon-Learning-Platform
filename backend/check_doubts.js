const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doubt = require('./models/Doubt');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        const doubts = await Doubt.find({});
        console.log('TOTAL DOUBTS:', doubts.length);
        doubts.forEach(d => {
            console.log(`ID: ${d._id}, Question: "${d.question}", AskedBy: ${d.askedBy}`);
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
