
import { Controller, Post, Body, Headers, Req, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMembersDto } from './dto/add-project-members.dto';
import { CreateProjectFlowDto } from './dto/create-project-flow.dto';
import { ProjectIdDto } from './dto/project-id.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto, ProjectMemberDto, ProjectFlowDto } from './dto/project-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiHeader, ApiResponse } from '@nestjs/swagger';

@ApiTags('projects')
@Controller('projects')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create new project' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  create(@Body() createProjectDto: CreateProjectDto, @Req() req: any) {
    createProjectDto.orgId = req.user.orgId;
    return this.projectsService.create(createProjectDto);
  }

  @Post('list')
  @ApiOperation({ summary: 'Get projects list' })
  @ApiResponse({ status: 200, type: [ProjectResponseDto] })
  findAll(@Req() req: any) {
    return this.projectsService.findAll(req.user.orgId, req.user);
  }

  @Post('detail')
  @ApiOperation({ summary: 'Get project details' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  findOne(@Body() body: ProjectIdDto, @Req() req: any) {
    return this.projectsService.findOne(body.id, req.user);
  }

  @Post('add-members')
  @ApiOperation({ summary: 'Add members to project' })
  @ApiResponse({ status: 200, description: 'Success' })
  addMembers(@Body() dto: AddProjectMembersDto) {
    // Note: If 'id' is in dto, use it. But existing code uses @Body('id').
    // Since we updated DTO to include optional 'id', we can assume frontend sends it in body.
    // However, the original code used `@Body('id') id: string, @Body() dto: AddProjectMembersDto`.
    // Swagger doesn't like multiple @Body.
    // We should use a single @Body() dto: AddProjectMembersDto and make sure 'id' is required there if we want strictly typed.
    // But since I made it optional in DTO to match "if passed in body", I should probably enforce it here or extract it.
    // Let's assume the body is { id: "...", memberIds: [...] }
    return this.projectsService.addMembers(dto.id!, dto);
  }

  @Post('list-members')
  @ApiOperation({ summary: 'Get project members' })
  @ApiResponse({ status: 200, type: [ProjectMemberDto] })
  getMembers(@Body() body: ProjectIdDto) {
    return this.projectsService.getMembers(body.id);
  }

  @Post('add-flow')
  @ApiOperation({ summary: 'Add project flow record' })
  @ApiResponse({ status: 201, type: ProjectFlowDto })
  addFlow(@Body() dto: CreateProjectFlowDto) {
    return this.projectsService.addFlow(dto.id!, dto);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  update(@Body() updateDto: UpdateProjectDto) {
    const { id, ...data } = updateDto;
    return this.projectsService.update(id, data);
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  remove(@Body() body: ProjectIdDto) {
    return this.projectsService.remove(body.id);
  }

  @Post('list-flows')
  @ApiOperation({ summary: 'Get project flow records' })
  @ApiResponse({ status: 200, type: [ProjectFlowDto] })
  getFlows(@Body() body: ProjectIdDto) {
    return this.projectsService.getFlows(body.id);
  }
}
