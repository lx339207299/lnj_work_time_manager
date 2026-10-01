import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { OrgFlowsService } from './org-flows.service';
import { CreateOrgFlowDto } from './dto/create-org-flow.dto';
import { OrgFlowIdDto } from './dto/org-flow-id.dto';
import { ListOrgFlowsDto } from './dto/list-org-flows.dto';

@ApiTags('org-flows')
@Controller('org-flows')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OrgFlowsController {
  constructor(private readonly orgFlowsService: OrgFlowsService) {}

  @Post('list')
  @ApiOperation({ summary: 'List organization flows' })
  list(@Request() req: any, @Body() body: ListOrgFlowsDto) {
    return this.orgFlowsService.findAll(req.user.orgId, body.month);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create organization flow record' })
  create(@Body() dto: CreateOrgFlowDto, @Request() req: any) {
    dto.orgId = req.user.orgId;
    return this.orgFlowsService.create(dto);
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete organization flow record' })
  remove(@Body() body: OrgFlowIdDto, @Request() req: any) {
    return this.orgFlowsService.remove(body.id, req.user.orgId);
  }
}
