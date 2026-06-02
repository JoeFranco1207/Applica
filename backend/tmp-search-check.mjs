import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './Model/UserSchema.js';

const uri = process.env.DATABASE_URL || process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error('No DB URI found');
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const users = await User.find({ companyName: /Microsoft/i })
    .select('firstName lastName companyName showProfileInSearch role')
    .lean()
    .limit(10);
  console.log('found', users.length);
  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
