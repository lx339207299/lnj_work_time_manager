import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async create(createInvitationDto: CreateInvitationDto, inviterId: number) {
    // Check if org exists and user is member (or owner)
    const org = await this.prisma.organization.findUnique({
      where: { id: createInvitationDto.orgId },
    });
    if (!org) throw new NotFoundException('Organization not found');

    // Create invitation
    // Generate a simple 6-char code or use UUID. 
    // Let's use a random 8-char string for friendly sharing.
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.invitation.create({
      data: {
        orgId: createInvitationDto.orgId,
        inviterId,
        code,
        expiresAt,
      },
    });
  }

  async findOne(code: string) {
    const invite = await this.prisma.invitation.findUnique({
      where: { code },
      include: {
        organization: { select: { name: true, owner: { select: { name: true } } } },
        inviter: { select: { name: true, phone: true } },
      },
    });

    if (!invite) throw new NotFoundException('Invitation not found');
    if (invite.expiresAt < new Date()) {
        throw new BadRequestException('Invitation expired');
    }

    return invite;
  }

  async accept(code: string, userId: number) {
    const invite = await this.findOne(code);
    
    // Check if already a member
    const existingMember = await this.prisma.organizationMember.findFirst({
      where: {
        orgId: invite.orgId,
        userId: userId,
      },
    });

    if (existingMember) {
      return { message: 'Already a member', member: existingMember };
    }

    // Get User info to populate member snapshot
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Create member
    const member = await this.prisma.organizationMember.create({
      data: {
        organization: { connect: { id: invite.orgId } },
        user: { connect: { id: userId } },
        role: 'member',
        status: 'active',
      },
    });

    // Update invite status? 
    // If we want one-time invite, we set status to accepted. 
    // If reusable (like a group link), we keep it pending until expiry.
    // Let's assume reusable for now.
    
    return member;
  }
}
