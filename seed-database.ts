import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB_NAME || 'test';

// Sample user data (without _id - MongoDB will auto-generate)
const users = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    age: 32,
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    profile: {
      bio: 'Software engineer with 8 years of experience',
      location: 'San Francisco, CA',
      skills: ['JavaScript', 'TypeScript', 'Node.js', 'MongoDB']
    },
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en'
    }
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    age: 28,
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-02-20'),
    profile: {
      bio: 'UX Designer passionate about user experience',
      location: 'New York, NY',
      skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping']
    },
    preferences: {
      theme: 'light',
      notifications: false,
      language: 'en'
    }
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    age: 35,
    role: 'moderator',
    status: 'active',
    createdAt: new Date('2024-01-10'),
    profile: {
      bio: 'Data scientist working on machine learning projects',
      location: 'Seattle, WA',
      skills: ['Python', 'TensorFlow', 'SQL', 'Data Analysis']
    },
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en'
    }
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    age: 26,
    role: 'user',
    status: 'inactive',
    createdAt: new Date('2024-03-05'),
    profile: {
      bio: 'Marketing specialist with focus on digital campaigns',
      location: 'Austin, TX',
      skills: ['Google Ads', 'Facebook Ads', 'Analytics', 'Content Marketing']
    },
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en'
    }
  },
  {
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    age: 41,
    role: 'admin',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    profile: {
      bio: 'Senior product manager with 15 years of experience',
      location: 'Boston, MA',
      skills: ['Product Strategy', 'Agile', 'User Stories', 'Roadmapping']
    },
    preferences: {
      theme: 'dark',
      notifications: false,
      language: 'en'
    }
  },
  {
    name: 'Lisa Brown',
    email: 'lisa.brown@example.com',
    age: 29,
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-02-28'),
    profile: {
      bio: 'Frontend developer specializing in React and Vue.js',
      location: 'Denver, CO',
      skills: ['React', 'Vue.js', 'CSS', 'JavaScript']
    },
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en'
    }
  },
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@example.com',
    age: 33,
    role: 'user',
    status: 'suspended',
    createdAt: new Date('2024-01-25'),
    profile: {
      bio: 'DevOps engineer focused on cloud infrastructure',
      location: 'Chicago, IL',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform']
    },
    preferences: {
      theme: 'dark',
      notifications: false,
      language: 'en'
    }
  },
  {
    name: 'Jennifer Lee',
    email: 'jennifer.lee@example.com',
    age: 27,
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-03-10'),
    profile: {
      bio: 'Content writer and copywriter for tech companies',
      location: 'Portland, OR',
      skills: ['Content Writing', 'SEO', 'Copywriting', 'Editing']
    },
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en'
    }
  },
  {
    name: 'Thomas Anderson',
    email: 'thomas.anderson@example.com',
    age: 38,
    role: 'moderator',
    status: 'active',
    createdAt: new Date('2024-02-15'),
    profile: {
      bio: 'Security analyst with expertise in cybersecurity',
      location: 'Washington, DC',
      skills: ['Cybersecurity', 'Penetration Testing', 'SIEM', 'Incident Response']
    },
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en'
    }
  },
  {
    name: 'Amanda Garcia',
    email: 'amanda.garcia@example.com',
    age: 31,
    role: 'user',
    status: 'active',
    createdAt: new Date('2024-03-01'),
    profile: {
      bio: 'QA engineer ensuring software quality and reliability',
      location: 'Miami, FL',
      skills: ['Manual Testing', 'Automated Testing', 'Selenium', 'JIRA']
    },
    preferences: {
      theme: 'light',
      notifications: false,
      language: 'es'
    }
  }
];

async function seedDatabase() {
  let client: MongoClient | null = null;

  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('users');

    // Clear existing data
    console.log('🧹 Clearing existing users collection...');
    await collection.deleteMany({});
    console.log('✅ Cleared existing data');

    // Insert new data
    console.log('📝 Inserting user data...');
    const result = await collection.insertMany(users);
    console.log(`✅ Inserted ${result.insertedCount} users`);

    // Create indexes for better query performance
    console.log('🔍 Creating indexes...');
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ role: 1 });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ age: 1 });
    await collection.createIndex({ createdAt: 1 });
    console.log('✅ Indexes created');

    // Verify the data and show some generated IDs
    console.log('🔍 Verifying data...');
    const totalUsers = await collection.countDocuments();
    const activeUsers = await collection.countDocuments({ status: 'active' });
    const admins = await collection.countDocuments({ role: 'admin' });
    
    console.log(` Database Summary:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Active users: ${activeUsers}`);
    console.log(`   Admins: ${admins}`);

    // Show some sample users with their auto-generated IDs
    console.log('\n🆔 Sample users with auto-generated IDs:');
    const sampleUsers = await collection.find({}).limit(3).toArray();
    sampleUsers.forEach((user, index) => {
      console.log(`   User ${index + 1}: ${user.name} (ID: ${user._id})`);
    });

    // Show sample queries that work with your MCP tools
    console.log('\n Sample queries you can test with your MCP tools:');
    console.log('1. Get all active users: { "status": "active" }');
    console.log('2. Get users older than 30: { "age": { "$gte": 30 } }');
    console.log('3. Get admins: { "role": "admin" }');
    console.log('4. Get users created in March: { "createdAt": { "$gte": new Date("2024-03-01") } }');
    console.log('5. Get users with specific skills: { "profile.skills": "React" }');
    console.log('6. Get user by auto-generated ID: Use the ID from the sample above');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('You can now test your MCP server with: npm run test');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the seeding
seedDatabase().catch(console.error);
