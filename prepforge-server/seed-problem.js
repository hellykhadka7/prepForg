require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('./src/models/Problem.model');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const p = await Problem.create({
    title: 'Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    week: 1,
    orderIndex: 1,
    leetcodeUrl: 'https://leetcode.com/problems/two-sum/',
    patterns: ['HashMap', 'Arrays'],
    isActive: true,
  });
  
  console.log('Created Problem:', p._id);
  await mongoose.disconnect();
}

seed().catch(console.error);
