import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPhone = '13800138000';
  const adminPassword = 'admin'; // 初始密码
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  const existingAdmin = await prisma.user.findUnique({
    where: { phone: adminPhone },
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        phone: adminPhone,
        password: hashedPassword,
        name: '超级管理员',
        systemRole: 'admin',
        email: 'admin@lnj.com',
      },
    });
    console.log(`Created admin user: ${admin.phone}`);
    
    // Create default organization for admin
    await prisma.organization.create({
        data: {
            name: 'LNJ管理组',
            ownerId: admin.id,
            members: {
                create: {
                    userId: admin.id,
                    role: 'owner',
                    status: 'active'
                }
            }
        }
    })
    console.log(`Created default org for admin`);

  } else {
    // Ensure existing user is admin
    const admin = await prisma.user.update({
      where: { phone: adminPhone },
      data: {
        systemRole: 'admin',
        // Update password if needed, or keep existing
        // password: hashedPassword 
      },
    });
    console.log(`Updated existing user to admin: ${admin.phone}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
