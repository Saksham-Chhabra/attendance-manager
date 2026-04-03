import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const cleanup = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        const result = await User.deleteMany({ email: { $regex: /@college\.edu/ } });
        console.log(`Deleted ${result.deletedCount} legacy accounts containing '@college.edu'`);

        // Also clean the lowercase roll matching issue from previous manual testing
        
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
cleanup();
