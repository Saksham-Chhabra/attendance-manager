import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Load env vars
dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected.');

    const adminEmail = 'siddharth@nith.ac.in';
    const facultyEmail = 'khalid@nith.ac.in';
    
    // Check if they already exist
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
        admin = await User.create({
            name: 'Dr Siddharth Chauhan',
            email: adminEmail,
            password: 'password123',
            role: 'admin'
        });
        console.log('✅ Admin Provisioned: Dr Siddharth Chauhan');
    } else {
        console.log('⚠️ Admin already exists.');
    }

    let faculty = await User.findOne({ email: facultyEmail });
    if (!faculty) {
        faculty = await User.create({
            name: 'Dr Mohammad Khalid Pandit',
            email: facultyEmail,
            password: 'password123',
            role: 'teacher'
        });
        console.log('✅ Faculty Provisioned: Dr Mohammad Khalid Pandit');
    } else {
        console.log('⚠️ Faculty already exists.');
    }

    console.log('\n--- Seeding Complete ---');
    console.log('Login credentials:');
    console.log('Admin -> Email:', adminEmail, '| Password: password123');
    console.log('Faculty -> Email:', facultyEmail, '| Password: password123');
    
    process.exit();
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedUsers();
