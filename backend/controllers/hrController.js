const User = require('../models/User');
const Batch = require('../models/Batch');

exports.createIntern = async (req, res) => {
  try {
    const { name, email, password, batchId } = req.body;

    // Verify HR role
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, msg: 'Access denied' });
    }

    if (!name || !email || !password || !batchId) {
      return res.status(400).json({ success: false, msg: 'All fields required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, msg: 'Email already exists' });
    }

    // Verify batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(400).json({ success: false, msg: 'Invalid batch ID' });
    }

    const user = new User({
      name,
      email,
      password,
      role: 'Intern',
      batchId
    });

    await user.save();

    // Add to batch
    await Batch.findByIdAndUpdate(batchId, { 
      $addToSet: { interns: user._id } 
    });

    res.status(201).json({
      success: true,
      msg: 'Intern created successfully',
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Error creating intern:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

exports.createTrainer = async (req, res) => {
  try {
    const { name, email, password, batchId } = req.body;

    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, msg: 'Access denied' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, msg: 'Name, email, password required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, msg: 'Email already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      role: 'TRAINER',
      batchId: batchId || undefined
    });

    await user.save();

    if (batchId) {
      await Batch.findByIdAndUpdate(batchId, { 
        $addToSet: { trainers: user._id } 
      });
    }

    res.status(201).json({
      success: true,
      msg: 'Trainer created successfully',
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Error creating trainer:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

exports.getInterns = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, msg: 'Access denied' });
    }

    const interns = await User.find({ role: 'Intern' })
      .select('name email batchId createdAt')
      .populate('batchId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, users: interns });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

exports.getTrainers = async (req, res) => {
  try {
    if (req.user.role !== 'HR') {
      return res.status(403).json({ success: false, msg: 'Access denied' });
    }

    const trainers = await User.find({ role: 'TRAINER' })
      .select('name email batchId createdAt')
      .populate('batchId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, users: trainers });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};
