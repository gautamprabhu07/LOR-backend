// create-profiles.js
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'lor-system';

async function createProfiles() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = await db.collection('users').find().toArray();

    for (const user of users) {
      if (user.role === 'student' || user.role === 'alumni') {
        await db.collection('studentprofiles').updateOne(
          { userId: user._id },
          {
            $setOnInsert: {
              userId: user._id,
              registrationNumber: `REG-${Math.floor(1000 + Math.random() * 9000)}`,
              isAlumni: user.role === 'alumni',
              department: 'Computer Science',
              verificationStatus: 'verified',
              isActive: true,
              targetUniversities: []
            }
          },
          { upsert: true }
        );
        console.log(`✅ Student Profile created for: ${user.email}`);
      } 
      
      else if (user.role === 'faculty') {
        await db.collection('facultyprofiles').updateOne(
          { userId: user._id },
          {
            $setOnInsert: {
              userId: user._id,
              facultyCode: `FAC-${Math.floor(100 + Math.random() * 900)}`,
              department: 'Computer Science',
              designation: 'Assistant Professor',
              isActive: true
            }
          },
          { upsert: true }
        );
        console.log(`✅ Faculty Profile created for: ${user.email}`);
      }
    }
    console.log('\n🚀 All profiles are now linked to users!');
  } finally {
    await client.close();
  }
}

createProfiles();
