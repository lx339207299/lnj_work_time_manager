
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Request() req, @Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(req.user.userId, createOrganizationDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.organizationsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }
}
