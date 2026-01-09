const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Doubt = require('./models/Doubt');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        const result = await Doubt.findByIdAndDelete('695bacb7cf6bd0df1152e168');
        console.log('DELETION RESULT:', result ? 'Deleted Successfully' : 'Not Found');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
