
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new organization' })
  create(@Request() req: any, @Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(req.user.userId, createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my organizations' })
  findAll(@Request() req: any) {
    return this.organizationsService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }
}
