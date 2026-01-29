
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly authService: AuthService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new organization' })
  async create(@Request() req: any, @Body() createOrganizationDto: CreateOrganizationDto) {
    const org = await this.organizationsService.create(req.user.sub, createOrganizationDto);
    const access_token = await this.authService.issueTokenForUser(req.user.sub);
    return { ...org, access_token };
  }

  @Get()
  @ApiOperation({ summary: 'Get my organizations' })
  findAll(@Request() req: any) {
    return this.organizationsService.findAll(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  update(@Request() req: any, @Param('id') id: string, @Body() updateDto: any) {
    return this.organizationsService.update(id, req.user.sub, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete organization (Owner only)' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.organizationsService.remove(id, req.user.sub);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave organization' })
  leave(@Request() req: any, @Param('id') id: string) {
    return this.organizationsService.leave(id, req.user.sub);
  }

  @Post(':id/switch')
  @ApiOperation({ summary: 'Switch current organization' })
  async switchOrg(@Request() req: any, @Param('id') id: string) {
    const res = await this.organizationsService.switchToOrg(req.user.sub, id);
    const access_token = await this.authService.issueTokenForUser(req.user.sub);
    return { ...res, access_token };
  }
}
