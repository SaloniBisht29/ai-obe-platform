/**
 * seed-db.ts — Populate MongoDB with initial OBE Platform data
 *
 * Run: npx tsx scripts/seed-db.ts
 *
 * This creates initial programs, courses, and an admin user
 * if they don't already exist.
 */

import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://salonibisht999_db_user:Xr6S3gbHgmpeBVjv@cluster0.34d1iju.mongodb.net/?appName=Cluster0';
const DB_NAME = 'obe_platform';

async function seed() {
  console.log('🌱 Starting database seed...');
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB');

    // ── Seed Programs ────────────────────────────────────────
    const programsCol = db.collection('programs');
    const existingPrograms = await programsCol.countDocuments();
    if (existingPrograms === 0) {
      const programs = [
        {
          name: 'Computer Science & Engineering',
          code: 'CSE',
          department: 'Engineering',
          level: 'B.Tech',
          duration: '4 Years',
          semesters: 8,
          totalCourses: 0,
          activeCourses: 0,
          totalCOs: 0,
          completionRate: 0,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Information Technology',
          code: 'IT',
          department: 'Engineering',
          level: 'B.Tech',
          duration: '4 Years',
          semesters: 8,
          totalCourses: 0,
          activeCourses: 0,
          totalCOs: 0,
          completionRate: 0,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Artificial Intelligence & ML',
          code: 'AI-ML',
          department: 'Engineering',
          level: 'B.Tech',
          duration: '4 Years',
          semesters: 8,
          totalCourses: 0,
          activeCourses: 0,
          totalCOs: 0,
          completionRate: 0,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      await programsCol.insertMany(programs);
      console.log(`✅ Seeded ${programs.length} programs`);
    } else {
      console.log(`⏭️  Programs already exist (${existingPrograms}), skipping`);
    }

    // ── Seed Courses ─────────────────────────────────────────
    const coursesCol = db.collection('courses');
    const existingCourses = await coursesCol.countDocuments();
    if (existingCourses === 0) {
      const courses = [
        { code: 'CS101', name: 'Introduction to Programming', semester: 1, credits: 4, department: 'Computer Science & Engineering', faculty: 'Dr. Rajesh Kumar', status: 'published', progress: 100, cosCount: 5, posCount: 3 },
        { code: 'CS201', name: 'Data Structures', semester: 3, credits: 4, department: 'Computer Science & Engineering', faculty: 'Dr. Priya Singh', status: 'published', progress: 85, cosCount: 6, posCount: 4 },
        { code: 'CS301', name: 'Operating Systems', semester: 5, credits: 4, department: 'Computer Science & Engineering', faculty: 'Dr. Neha Gupta', status: 'approved', progress: 70, cosCount: 5, posCount: 3 },
        { code: 'CS302', name: 'Database Management Systems', semester: 5, credits: 3, department: 'Computer Science & Engineering', faculty: 'Dr. Amit Verma', status: 'approved', progress: 65, cosCount: 4, posCount: 3 },
        { code: 'CS401', name: 'Machine Learning', semester: 7, credits: 4, department: 'Computer Science & Engineering', faculty: 'Dr. Priya Singh', status: 'review', progress: 40, cosCount: 5, posCount: 4 },
        { code: 'CS202', name: 'Web Development', semester: 3, credits: 3, department: 'Computer Science & Engineering', faculty: 'Dr. Neha Gupta', status: 'draft', progress: 20, cosCount: 3, posCount: 2 },
        { code: 'CS303', name: 'Computer Networks', semester: 5, credits: 3, department: 'Computer Science & Engineering', faculty: 'Dr. Rajesh Kumar', status: 'published', progress: 90, cosCount: 6, posCount: 5 },
        { code: 'CS402', name: 'Artificial Intelligence', semester: 7, credits: 4, department: 'Computer Science & Engineering', faculty: 'Dr. Amit Verma', status: 'draft', progress: 15, cosCount: 0, posCount: 0 },
        { code: 'IT201', name: 'Software Engineering', semester: 3, credits: 3, department: 'Information Technology', faculty: 'Dr. Sunita Rao', status: 'approved', progress: 75, cosCount: 5, posCount: 4 },
        { code: 'IT301', name: 'Cloud Computing', semester: 5, credits: 3, department: 'Information Technology', faculty: 'Dr. Sunita Rao', status: 'review', progress: 50, cosCount: 4, posCount: 3 },
      ].map(c => ({ ...c, createdAt: new Date(), updatedAt: new Date() }));

      await coursesCol.insertMany(courses);
      console.log(`✅ Seeded ${courses.length} courses`);
    } else {
      console.log(`⏭️  Courses already exist (${existingCourses}), skipping`);
    }

    // ── Create indexes ───────────────────────────────────────
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('courses').createIndex({ code: 1 }, { unique: true });
    await db.collection('programs').createIndex({ code: 1 }, { unique: true });
    await db.collection('audit_log').createIndex({ timestamp: -1 });
    await db.collection('feedback').createIndex({ createdAt: -1 });
    console.log('✅ Database indexes created');

    // ── Summary ──────────────────────────────────────────────
    const counts = {
      users: await db.collection('users').countDocuments(),
      programs: await db.collection('programs').countDocuments(),
      courses: await db.collection('courses').countDocuments(),
      feedback: await db.collection('feedback').countDocuments(),
      auditLogs: await db.collection('audit_log').countDocuments(),
    };
    console.log('\n📊 Database summary:');
    console.table(counts);
    console.log('\n🎉 Seed complete!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
