import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Class from './src/models/Class.js';

dotenv.config();

const rawData = {
  "rolls": {
    "0":"23BEE091","1":"23BCS114","2":"23BCS107","3":"23BCS098",
    "4":"23BCS115","5":"23BEE115","6":"23BCS131","7":"23BEE095",
    "8":"23BCS111","9":"23BCS122","10":"23BCS099","11":"23BCS103",
    "12":"23BCS110","13":"23BCS117","14":"23BCS133","15":"23BCS105"
  }
};

const enrollScript = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected.');

    // Find the Target Class
    const targetClass = await Class.findOne({ name: { $regex: /CS382: Machine Learning/i } });
    if (!targetClass) {
        console.log('❌ Error: Class "CS382: Machine Learning" could not be located in the Database.');
        process.exit(1);
    }

    console.log(`✅ Located Target Class: ${targetClass.name} (ID: ${targetClass._id})`);

    // Fetch the 16 students via their Roll Numbers explicitly
    const rollArray = Object.values(rawData.rolls);
    
    // We want a case-insensitive check just in case. 
    // We can also just search by user emails since we know the format `roll@nith.ac.in`
    const exactEmails = rollArray.map(r => `${r.toLowerCase()}@nith.ac.in`);
    
    const students = await User.find({ email: { $in: exactEmails }, role: 'student' });
    console.log(`✅ Located ${students.length} matching students from the database.`);

    let addedCount = 0;
    
    for (const student of students) {
        // Prevent duplicate Object ID assignments
        if (!targetClass.students.includes(student._id)) {
            targetClass.students.push(student._id);
            addedCount++;
        }
    }

    if (addedCount > 0) {
        await targetClass.save();
        console.log(`✅ Success: ${addedCount} new students successfully bolted to class roster!`);
    } else {
        console.log('⚠️ Warning: All students were already enrolled in this class. No changes made.');
    }

    process.exit();
  } catch (error) {
    console.error('Execution Error:', error);
    process.exit(1);
  }
};

enrollScript();
