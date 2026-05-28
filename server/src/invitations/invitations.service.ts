import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  constructor(private prisma: PrismaService) {}

  async findAllByOrg(orgId: number) {
    return this.prisma.invitation.findMany({
      where: { orgId },
      include: {
        inviter: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(createInvitationDto: CreateInvitationDto, user: any) {
    if (user.systemRole !== 'admin') {
      const currentMember = await this.prisma.organizationMember.findFirst({
        where: { orgId: createInvitationDto.orgId, userId: user.sub }
      });
      if (!currentMember || !['owner', 'admin', 'leader'].includes(currentMember.role)) {
        throw new ForbiddenException('Only owner, admin, or leader can create invitations');
      }
    }

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
        inviterId: user.sub,
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
    this.logger.log(`accept called: code=${code}, userId=${userId}`);
    try {
    const invite = await this.findOne(code);
    
    // Check if already an active member
    const existingMember = await this.prisma.organizationMember.findFirst({
      where: {
        orgId: invite.orgId,
        userId: userId,
        isDeleted: false,
      },
    });

    if (existingMember) {
      this.logger.log(`Already active member: memberId=${existingMember.id}`);
      return existingMember;
    }

    // Check if there's a soft-deleted record — reactivate it
    const deletedMember = await this.prisma.organizationMember.findFirst({
      where: {
        orgId: invite.orgId,
        userId: userId,
        isDeleted: true,
      },
    });

    if (deletedMember) {
      this.logger.log(`Reactivating soft-deleted member: memberId=${deletedMember.id}`);
      const member = await this.prisma.organizationMember.update({
        where: { id: deletedMember.id },
        data: { isDeleted: false, status: 'active' },
      });
      return member;
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

    this.logger.log(`Member created: memberId=${member.id}, orgId=${invite.orgId}`);
    
    return member;
    } catch (err) {
      this.logger.error(`accept failed: ${err.message}`, err.stack);
      throw err;
    }
  }
}
