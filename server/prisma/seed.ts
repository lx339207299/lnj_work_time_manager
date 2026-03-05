import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // --- 1. 创建超级管理员 ---
  const adminPhone = '13800138000';
  const adminPassword = 'admin'; // 初始密码
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  let admin = await prisma.user.findUnique({
    where: { phone: adminPhone },
  });

  if (!admin) {
    admin = await prisma.user.create({
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
    admin = await prisma.user.update({
      where: { phone: adminPhone },
      data: {
        systemRole: 'admin',
        // Update password if needed, or keep existing
        // password: hashedPassword 
      },
    });
    console.log(`Updated existing user to admin: ${admin.phone}`);
  }

  // --- 2. 创建一批测试用户和组织 ---
  const testUsersCount = 10;
  console.log(`Creating ${testUsersCount} test users...`);

  for (let i = 1; i <= testUsersCount; i++) {
    const phone = `139000000${i.toString().padStart(2, '0')}`;
    const name = `测试用户${i}`;
    const password = await bcrypt.hash('123456', salt);
    
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                phone,
                name,
                password,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                systemRole: 'user',
            }
        });
        
        // 每个用户创建一个自己的组织
        const org = await prisma.organization.create({
            data: {
                name: `${name}的团队`,
                ownerId: user.id,
                description: '这是一个自动生成的测试组织',
                members: {
                    create: {
                        userId: user.id,
                        role: 'owner',
                        status: 'active'
                    }
                }
            }
        });
        
        // 更新 currentOrg
        await prisma.user.update({
            where: { id: user.id },
            data: { currentOrgId: org.id }
        });

        // 在组织里创建几个项目
        await prisma.project.createMany({
            data: [
                { name: '开发项目 A', orgId: org.id, description: '重要项目' },
                { name: '维护项目 B', orgId: org.id, description: '长期维护' },
            ]
        });
        
        console.log(`Created test user: ${phone} and their org/projects`);
    }
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
