// seed-users.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { User } from "./src/modules/users/user.model.js";
import { StudentProfile } from "./src/modules/studentProfiles/studentProfile.model.js";
import { FacultyProfile } from "./src/modules/facultyProfiles/facultyProfile.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

type UserRole = "student" | "faculty" | "admin";

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI/MONGO_URI not set");
}
const mongoUriValue = mongoUri;

const seedUsers: SeedUser[] = [
  // Students
  {
    name: "Rahul Sharma",
    email: "rahul.sharma@mitmanipal.edu",
    password: "manipal123",
    role: "student",
  },
  {
    name: "Priya Verma",
    email: "priya.verma@mitmanipal.edu",
    password: "manipal123",
    role: "student",
  },
  {
    name: "Aarav Nair",
    email: "aarav.nair@mitmanipal.edu",
    password: "manipal123",
    role: "student",
  },

  // Faculty
  {
    name: "Dr. Rajesh Kumar",
    email: "dr.rajesh.kumar@mitmanipal.edu",
    password: "manipal123",
    role: "faculty",
  },
  {
    name: "Prof. Sneha Iyer",
    email: "prof.sneha.iyer@mitmanipal.edu",
    password: "manipal123",
    role: "faculty",
  },
  {
    name: "Dr. Kavita Rao",
    email: "dr.kavita.rao@mitmanipal.edu",
    password: "manipal123",
    role: "faculty",
  },
];

async function main() {
  await mongoose.connect(mongoUriValue);
  console.log("Connected to MongoDB for seeding");

  const existing = await User.findOne({ email: seedUsers[0].email }).lean();
  if (existing) {
    console.log("Seed users already exist, skipping.");
    await mongoose.disconnect();
    return;
  }

  const passwordHashes = await Promise.all(
    seedUsers.map((u) => bcrypt.hash(u.password, 10))
  );

  const users = await User.insertMany(
    seedUsers.map((u, index) => ({
      name: u.name,
      email: u.email,
      passwordHash: passwordHashes[index],
      role: u.role,
      status: "active",
    }))
  );

  // Group by role
  const students = users.filter((u) => u.role === "student");
  const faculty = users.filter((u) => u.role === "faculty");

  const [rahul, priya, aarav] = students;
  const [rajesh, sneha, kavita] = faculty;

  // Student profiles
  await StudentProfile.insertMany([
    {
      userId: rahul._id,
      registrationNumber: "MIT24CS001",
      isAlumni: false,
      department: "Computer Science",
      verificationStatus: "verified",
      employment: {
        status: "studying",
        university: "MIT Manipal",
        course: "B.Tech CSE",
      },
      targetUniversities: [],
      certificates: [],
      isActive: true,
    },
    {
      userId: priya._id,
      registrationNumber: "MIT24IT002",
      isAlumni: false,
      department: "Information Technology",
      verificationStatus: "pending",
      employment: {
        status: "unemployed",
      },
      targetUniversities: [],
      certificates: [],
      isActive: true,
    },
    {
      userId: aarav._id,
      registrationNumber: "MIT24EC003",
      isAlumni: false,
      department: "Electronics",
      verificationStatus: "verified",
      employment: {
        status: "studying",
        university: "MIT Manipal",
        course: "B.Tech ECE",
      },
      targetUniversities: [],
      certificates: [],
      isActive: true,
    },
  ]);

  // Faculty profiles
  await FacultyProfile.insertMany([
    {
      userId: rajesh._id,
      facultyCode: "CSE-RAJESH",
      department: "Computer Science",
      designation: "Associate Professor",
      isActive: true,
    },
    {
      userId: sneha._id,
      facultyCode: "IT-SNEHA",
      department: "Information Technology",
      designation: "Assistant Professor",
      isActive: true,
    },
    {
      userId: kavita._id,
      facultyCode: "ECE-KAVITA",
      department: "Electronics",
      designation: "Assistant Professor",
      isActive: true,
    },
  ]);

  console.log("✅ Seed users (students, faculty) and profiles created.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
