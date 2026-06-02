import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../Model/UserSchema.js';

const email = process.argv[2] || 'Francomartnabung@gmail.com';

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email }).lean();
  console.log('email:', email);
  console.log('found:', !!user);
  if (user) {
    console.log('role:', user.role);
    console.log('location type:', typeof user.location);
    console.log('location:', JSON.stringify(user.location, null, 2));
    console.log('raw user keys:', Object.keys(user));
  }
  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
