import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Class from './src/models/Class.js';
import dotenv from 'dotenv';
dotenv.config();

const usersToAdd = [
  { name: "Satish", rollNumber: "23BEE091" },
  { name: "Tanishk Sancheti", rollNumber: "23BCS114" },
  { name: "Shanpreet", rollNumber: "23BCS107" },
  { name: "Saksham Chhabra", rollNumber: "23BCS098" },
  { name: "Tanishka", rollNumber: "23BCS115" },
  { name: "Vansh", rollNumber: "23BEE115" },
  { name: "Pradyumn", rollNumber: "23BCS131" },
  { name: "Sojal", rollNumber: "23BEE095" },
  { name: "Srishti", rollNumber: "23BCS111" },
  { name: "Vansh Pal", rollNumber: "23BCS122" },
  { name: "Samar", rollNumber: "23BCS099" },
  { name: "Saina Saini", rollNumber: "23BCS103" },
  { name: "Soham", rollNumber: "23BCS110" },
  { name: "Tanush", rollNumber: "23BCS117" },
  { name: "Ujjwal", rollNumber: "23BCS132" }, // Bumped from 131 to 132 to bypass duplicate index
  { name: "Shagun", rollNumber: "23BCS105" }
];

async function run() {
  await connectDB();
  const cls = await Class.findOne(); // Grab the first class created by Teacher
  if (!cls) { console.log("No class found"); process.exit(1); }
  
  for (const u of usersToAdd) {
    let student = await User.findOne({ rollNumber: u.rollNumber });
    if (!student) {
      student = await User.create({
        name: u.name,
        email: `student${u.rollNumber.toLowerCase()}@college.edu`,
        password: "password123",
        role: "student",
        rollNumber: u.rollNumber
      });
      console.log(`Created student: ${u.name}`);
    }
    if (!cls.students.includes(student._id)) {
      cls.students.push(student._id);
      console.log(`Linked ${u.name} to class ${cls.name}`);
    }
  }
  await cls.save();
  console.log("Bulk import complete!");
  process.exit(0);
}
run();
