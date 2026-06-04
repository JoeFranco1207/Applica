/**
 * Fixes all resume URLs in the database to use BACKEND_URL instead of localhost
 * Usage: node fix-resume-urls.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../Model/UserSchema.js';
import connectDB from '../config/ApplicaDB.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixResumeUrls() {
  try {
    await connectDB();
    console.log('Connected to database');

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    console.log(`Using BACKEND_URL: ${backendUrl}`);

    // Fix user.resume field
    const usersWithLocalhost = await User.find({ 
      resume: { $regex: '^http://localhost' } 
    });

    console.log(`Found ${usersWithLocalhost.length} users with localhost resume URLs`);

    for (const user of usersWithLocalhost) {
      const oldUrl = user.resume;
      const newUrl = oldUrl.replace(/^http:\/\/localhost:\d+/, backendUrl);
      console.log(`Updating: ${oldUrl} → ${newUrl}`);
      user.resume = newUrl;
      await user.save();
    }

    // Fix user.resumes array
    const usersWithResumeArray = await User.find({ 
      'resumes.url': { $regex: '^http://localhost' } 
    });

    console.log(`Found ${usersWithResumeArray.length} users with localhost resume array URLs`);

    for (const user of usersWithResumeArray) {
      let updated = false;
      for (const resume of user.resumes || []) {
        if (resume.url && resume.url.startsWith('http://localhost')) {
          const oldUrl = resume.url;
          resume.url = oldUrl.replace(/^http:\/\/localhost:\d+/, backendUrl);
          console.log(`Updating array: ${oldUrl} → ${resume.url}`);
          updated = true;
        }
      }
      if (updated) {
        await user.save();
      }
    }

    console.log('✓ Resume URL migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing resume URLs:', error);
    process.exit(1);
  }
}

fixResumeUrls();
