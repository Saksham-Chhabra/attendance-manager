import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const rawData = {
  "names": {
    "0":"Satish","1":"Tanishk Saini","2":"Shanpreet Singh","3":"Saksham Chhabra",
    "4":"Tanishka Khandelwal","5":"Vansh Kumar","6":"Pradyumna Sharma","7":"Sojal",
    "8":"Srishti Chamoli","9":"Vansh Pal","10":"Samar Kumar","11":"Saina Saini",
    "12":"Soham Juneja","13":"Tanush Dang","14":"Ujjwal Kumar","15":"Shagun Rana"
  },
  "rolls": {
    "0":"23BEE091","1":"23BCS114","2":"23BCS107","3":"23BCS098",
    "4":"23BCS115","5":"23BEE115","6":"23BCS131","7":"23BEE095",
    "8":"23BCS111","9":"23BCS122","10":"23BCS099","11":"23BCS103",
    "12":"23BCS110","13":"23BCS117","14":"23BCS133","15":"23BCS105"
  }
};

const seedStudents = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected.');

    const numStudents = Object.keys(rawData.names).length;
    let seeded = 0;

    for (let i = 0; i < numStudents; i++) {
        const name = rawData.names[String(i)];
        let rawRoll = rawData.rolls[String(i)];
        
        const rollLower = rawRoll.toLowerCase();
        const email = `${rollLower}@nith.ac.in`;
        const password = rollLower;

        try {
            const existingUser = await User.findOne({ email });
            if (!existingUser) {
                await User.create({
                    name: name,
                    email: email,
                    password: password,
                    role: 'student',
                    rollNumber: rawRoll // Keeps uppercase/original
                });
                console.log(`✅ Provisioned: ${name} (${rawRoll})`);
                seeded++;
            } else {
                console.log(`⚠️ Exists: ${name} (${rawRoll})`);
            }
        } catch(err) {
            console.log(`❌ Error mapping ${name}:`, err.message);
        }
    }

    console.log(`\n--- Seeding Complete: ${seeded}/${numStudents} accounts created ---`);
    process.exit();
  } catch (error) {
    console.error('Core Execution Error:', error);
    process.exit(1);
  }
};

seedStudents();
