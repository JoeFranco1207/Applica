import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../config/ApplicaDB.js';
import mongoose from 'mongoose';
import User from '../Model/UserSchema.js';

const run = async () => {
  await connectDB();
  try {
    const res = await User.updateMany(
      { location: { $type: 'string' } },
      {
        $set: {
          location: {
            region: '',
            city: '',
            barangay: '',
            otherDetails: '',
            coords: { lat: null, lng: null },
          },
        },
      }
    );

    console.log('Migration result:', res);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
