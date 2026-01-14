// seed-test-data.ts - Run: npx tsx seed-test-data.ts
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./src/modules/users/user.model.js";
import { StudentProfile } from "./src/modules/studentProfiles/studentProfile.model.js";
import { FacultyProfile } from "./src/modules/facultyProfiles/facultyProfile.model.js";
import { env } from "./src/config/env.js";

async function seedTestData() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Password hash (password123 for all users)
    const passwordHash = await bcrypt.hash("password123", 12);

    // Clear existing data
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await FacultyProfile.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // ==================== STUDENTS ====================
    const student1 = await User.create({
      email: "rahul.sharma@mitmanipal.edu",
      passwordHash,
      role: "student",
      status: "active"
    });

    await StudentProfile.create({
      userId: student1._id,
      registrationNumber: "200901001",
      isAlumni: false,
      department: "Computer Science",
      verificationStatus: "verified",
      isActive: true
    });

    const student2 = await User.create({
      email: "priya.patel@mitmanipal.edu",
      passwordHash,
      role: "student",
      status: "active"
    });

    await StudentProfile.create({
      userId: student2._id,
      registrationNumber: "200901002",
      isAlumni: false,
      department: "Electronics",
      verificationStatus: "verified",
      isActive: true
    });

    const student3 = await User.create({
      email: "vikas.singh@mitmanipal.edu",
      passwordHash,
      role: "alumni",
      status: "active"
    });

    await StudentProfile.create({
      userId: student3._id,
      registrationNumber: "200801001",
      isAlumni: true,
      department: "Mechanical",
      verificationStatus: "verified",
      isActive: true
    });

    console.log("✅ 3 Students created");

    // ==================== FACULTY ====================
    const faculty1 = await User.create({
      email: "prof.anita.gupta@mitmanipal.edu",
      passwordHash,
      role: "faculty",
      status: "active"
    });

    await FacultyProfile.create({
      userId: faculty1._id,
      facultyCode: "FAC001",
      department: "Computer Science",
      designation: "Associate Professor",
      isActive: true
    });

    const faculty2 = await User.create({
      email: "dr.rajesh.kumar@mitmanipal.edu",
      passwordHash,
      role: "faculty",
      status: "active"
    });

    await FacultyProfile.create({
      userId: faculty2._id,
      facultyCode: "FAC002",
      department: "Electronics",
      designation: "Professor",
      isActive: true
    });

    const faculty3 = await User.create({
      email: "prof.monica.jain@mitmanipal.edu",
      passwordHash,
      role: "faculty",
      status: "active"
    });

    await FacultyProfile.create({
      userId: faculty3._id,
      facultyCode: "FAC003",
      department: "Mechanical",
      designation: "Assistant Professor",
      isActive: true
    });

    console.log("✅ 3 Faculty created");

    // ==================== ADMIN ====================
    const admin = await User.create({
      email: "dean.varun.mehta@mitmanipal.edu",
      passwordHash,
      role: "admin",
      status: "active"
    });

    console.log("✅ 1 Admin created");

    // ==================== SUMMARY ====================
    console.log("\n🎉 Test data seeded successfully!");
    console.log("\n📧 All users - Password: password123");
    console.log("\n👨‍🎓 STUDENTS:");
    console.log("  - rahul.sharma@mitmanipal.edu (CS, Active Student)");
    console.log("  - priya.patel@mitmanipal.edu (ECE, Active Student)");
    console.log("  - vikas.singh@mitmanipal.edu (Mech, Alumni)");
    
    console.log("\n👨‍🏫 FACULTY:");
    console.log("  - prof.anita.gupta@mitmanipal.edu (CS)");
    console.log("  - dr.rajesh.kumar@mitmanipal.edu (ECE)");
    console.log("  - prof.monica.jain@mitmanipal.edu (Mech)");
    
    console.log("\n🛡️  ADMIN:");
    console.log("  - dean.varun.mehta@mitmanipal.edu");

    // Get Faculty IDs for easy testing
    const facultyProfiles = await FacultyProfile.find().select("_id facultyCode");
    console.log("\n🔑 FACULTY IDs (for creating submissions):");
    facultyProfiles.forEach(f => {
      console.log(`  - ${f.facultyCode}: ${f._id}`);
    });

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

seedTestData();
