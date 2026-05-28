
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationIdDto } from './dto/organization-id.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { 
  CreateOrganizationResponseDto, 
  OrganizationListResponseDto, 
  OrganizationDetailResponseDto, 
  OrganizationResponseDto, 
  SwitchOrganizationResponseDto 
} from './dto/organization-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create new organization' })
  @ApiResponse({ status: 201, type: CreateOrganizationResponseDto })
  async create(@Request() req: any, @Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(req.user.sub, createOrganizationDto);
  }

  @Post('list')
  @ApiOperation({ summary: 'Get my organizations' })
  @ApiResponse({ status: 200, type: [OrganizationListResponseDto] })
  findAll(@Request() req: any) {
    return this.organizationsService.findAll(req.user.sub);
  }

  @Post('detail')
  @ApiOperation({ summary: 'Get organization details' })
  @ApiResponse({ status: 200, type: OrganizationDetailResponseDto })
  findOne(@Body() body: OrganizationIdDto) {
    return this.organizationsService.findOne(body.id);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  update(@Request() req: any, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    const { id, ...updateData } = updateOrganizationDto;
    return this.organizationsService.update(id, req.user.sub, updateData);
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete organization (Owner only)' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  remove(@Request() req: any, @Body() body: OrganizationIdDto) {
    return this.organizationsService.remove(body.id, req.user.sub);
  }

  @Post('leave')
  @ApiOperation({ summary: 'Leave organization' })
  @ApiResponse({ status: 200, description: 'Batch payload' })
  leave(@Request() req: any, @Body() body: OrganizationIdDto) {
    return this.organizationsService.leave(body.id, req.user.sub);
  }

  @Post('switch')
  @ApiOperation({ summary: 'Switch current organization' })
  @ApiResponse({ status: 200, type: SwitchOrganizationResponseDto })
  async switchOrg(@Request() req: any, @Body() body: OrganizationIdDto) {
    return this.organizationsService.switchToOrg(req.user.sub, body.id);
  }
}
