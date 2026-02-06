import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiExtraModels,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupRo } from './dto/group.ro';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

function toGroupRo(entity: { id: string; name: string; enabled: boolean; createdAt: Date; updatedAt: Date }): GroupRo {
  return {
    id: entity.id,
    name: entity.name,
    enabled: entity.enabled,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

@ApiTags('group')
@ApiExtraModels(GroupRo)
@Controller('group')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth('admin-jwt')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiOperation({ summary: 'Создать группу (только админ)' })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({ status: 201, description: 'Группа создана', type: GroupRo })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  async create(@Body() dto: CreateGroupDto) {
    const entity = await this.groupService.create(dto);
    return toGroupRo(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Список групп (только админ)' })
  @ApiResponse({ status: 200, description: 'Список групп', type: [GroupRo] })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async findAll() {
    const list = await this.groupService.findAll();
    return list.map(toGroupRo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Группа по id (только админ)' })
  @ApiParam({ name: 'id', description: 'UUID группы' })
  @ApiResponse({ status: 200, description: 'Группа', type: GroupRo })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const entity = await this.groupService.findOne(id);
    return toGroupRo(entity);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить группу (только админ)' })
  @ApiParam({ name: 'id', description: 'UUID группы' })
  @ApiBody({ type: UpdateGroupDto })
  @ApiResponse({ status: 200, description: 'Группа обновлена', type: GroupRo })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    const entity = await this.groupService.update(id, dto);
    return toGroupRo(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить группу (только админ)' })
  @ApiParam({ name: 'id', description: 'UUID группы' })
  @ApiResponse({ status: 204, description: 'Группа удалена' })
  @ApiResponse({ status: 404, description: 'Группа не найдена' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.groupService.remove(id);
  }
}
