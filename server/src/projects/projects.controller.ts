
import { Controller, Get, Post, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMembersDto } from './dto/add-project-members.dto';
import { CreateProjectFlowDto } from './dto/create-project-flow.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';

@ApiTags('projects')
@Controller('projects')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new project' })
  @ApiHeader({ name: 'x-org-id', required: false, description: 'Organization ID' })
  create(@Body() createProjectDto: CreateProjectDto, @Headers('x-org-id') orgId: string) {
    // If orgId is not in body, try to use header
    if (!createProjectDto.orgId && orgId) {
        createProjectDto.orgId = orgId;
    }
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get projects list' })
  @ApiQuery({ name: 'orgId', required: false })
  @ApiHeader({ name: 'x-org-id', required: false, description: 'Organization ID' })
  findAll(@Query('orgId') queryOrgId: string, @Headers('x-org-id') headerOrgId: string) {
    const orgId = queryOrgId || headerOrgId;
    return this.projectsService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add members to project' })
  addMembers(@Param('id') id: string, @Body() dto: AddProjectMembersDto) {
    return this.projectsService.addMembers(id, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get project members' })
  getMembers(@Param('id') id: string) {
    return this.projectsService.getMembers(id);
  }

  @Post(':id/flows')
  @ApiOperation({ summary: 'Add project flow record' })
  addFlow(@Param('id') id: string, @Body() dto: CreateProjectFlowDto) {
    return this.projectsService.addFlow(id, dto);
  }

  @Get(':id/flows')
  @ApiOperation({ summary: 'Get project flow records' })
  getFlows(@Param('id') id: string) {
    return this.projectsService.getFlows(id);
  }
}
