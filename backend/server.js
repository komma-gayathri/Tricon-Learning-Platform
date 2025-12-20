const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors({
  origin: '*', 
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/learner', require('./routes/learner'));
app.use('/api/batch', require('./routes/batch'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1); 
  });

app.post('/api/auth/create-hr', async (req, res) => {
  try {
    const User = require('./models/User');
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Please provide name, email, and password' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        msg: 'User with this email already exists' 
      });
    }

    const hrUser = new User({ 
      name, 
      email, 
      password, 
      role: 'HR' 
    });
    
    await hrUser.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'HR user created successfully!', 
      userId: hrUser._id 
    });
    
  } catch (error) {
    console.error('Error creating HR user:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected ' : 'Disconnected '
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    msg: `Route ${req.originalUrl} not found` 
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    msg: 'Something went wrong!' 
  });
});

// === START SERVER ===
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Create HR first: POST http://localhost:${PORT}/api/auth/create-hr`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
