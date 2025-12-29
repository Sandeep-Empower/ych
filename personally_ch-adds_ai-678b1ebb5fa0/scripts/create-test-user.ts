import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Test user credentials
    const email = 'admin@test.com';
    const password = 'Admin@123';
    const username = 'admin';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('User already exists!');
      console.log('Email:', email);
      console.log('Password: Admin@123');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find or create Admin role
    const role = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        status: true
      }
    });

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nicename: username,
        status: true,
        roleId: role.id
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('================================');
    console.log('Email:    admin@test.com');
    console.log('Password: Admin@123');
    console.log('================================');

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
