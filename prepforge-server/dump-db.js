require('dotenv').config();
const mongoose = require('mongoose');
const Solution = require('./src/models/Solution.model');
const Note = require('./src/models/Note.model');
const Revision = require('./src/models/Revision.model');
const Activity = require('./src/models/Activity.model');

async function dump() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- SOLUTIONS ---');
  const sols = await Solution.find().lean();
  console.log(JSON.stringify(sols, null, 2));

  console.log('\n--- NOTES ---');
  const notes = await Note.find().lean();
  console.log(JSON.stringify(notes, null, 2));

  console.log('\n--- REVISIONS ---');
  const revs = await Revision.find().lean();
  console.log(JSON.stringify(revs, null, 2));
  
  console.log('\n--- ACTIVITIES ---');
  const acts = await Activity.find().lean();
  console.log(JSON.stringify(acts, null, 2));

  await mongoose.disconnect();
}
dump().catch(console.error);
