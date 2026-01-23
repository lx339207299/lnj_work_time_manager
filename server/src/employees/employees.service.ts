
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { phone: createEmployeeDto.phone },
    });

    return this.prisma.organizationMember.create({
      data: {
        orgId: createEmployeeDto.orgId,
        userId: user?.id || null, // Link if exists
        name: createEmployeeDto.name,
        phone: createEmployeeDto.phone,
        role: createEmployeeDto.role || 'member',
        wageType: createEmployeeDto.wageType || 'day',
        wageAmount: createEmployeeDto.wageAmount || 0,
        birthday: createEmployeeDto.birthday,
        status: 'active', // Should be pending if user is null? But user wants "invite -> register -> join" flow.
        // If we add them directly, they are 'active' in the system view, but maybe user needs to confirm?
        // Let's assume active for simplicity or pending logic in invite flow.
      },
    });
  }

  findAll(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { orgId },
      include: { user: true } // Include user avatar/info if linked
    });
  }

  findOne(id: string) {
    return this.prisma.organizationMember.findUnique({
      where: { id },
    });
  }

  update(id: string, data: any) {
    return this.prisma.organizationMember.update({
        where: { id },
        data
    });
  }

  remove(id: string) {
    return this.prisma.organizationMember.delete({
      where: { id },
    });
  }
}
