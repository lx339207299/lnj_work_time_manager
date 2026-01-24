
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
    return this.prisma.$transaction(async (tx: any) => {
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

      return {
        ...org,
        role: 'owner'
      };
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

  async update(id: string, userId: string, updateDto: any) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new Error('Organization not found');
    if (org.ownerId !== userId) throw new Error('Only owner can update organization');

    return this.prisma.organization.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, userId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new Error('Organization not found');
    if (org.ownerId !== userId) throw new Error('Only owner can delete organization');

    // Transactional delete to ensure cleanup
    return this.prisma.$transaction(async (tx: any) => {
        // 1. Delete all members
        await tx.organizationMember.deleteMany({ where: { orgId: id } });
        
        // 2. Delete projects and related data? 
        // For simplicity, let's just delete org. If schema has ON DELETE CASCADE, it works.
        // Otherwise, this might fail.
        
        return tx.organization.delete({ where: { id } });
    });
  }

  async leave(id: string, userId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new Error('Organization not found');
    if (org.ownerId === userId) throw new Error('Owner cannot leave organization');

    return this.prisma.organizationMember.deleteMany({
      where: {
        orgId: id,
        userId: userId
      }
    });
  }
}
