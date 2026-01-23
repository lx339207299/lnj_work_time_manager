
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createOrganizationDto: CreateOrganizationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Transaction: Create Org + Add Creator as Owner
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: createOrganizationDto.name,
          description: createOrganizationDto.description,
          ownerId: userId,
        },
      });

      await tx.organizationMember.create({
        data: {
          orgId: org.id,
          userId: userId,
          name: user.name || user.phone, // Default name
          phone: user.phone,
          role: 'owner',
          wageType: 'month', // Owner usually doesn't count wage like this but needed default
          wageAmount: 0,
          status: 'active',
        },
      });

      return org;
    });
  }

  async findAll(userId: string) {
    // Find orgs where user is a member
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
    });
    return memberships.map((m) => ({
      ...m.organization,
      role: m.role, // Include role in the list
    }));
  }

  async findOne(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
          members: true,
          projects: true
      }
    });
  }
}
