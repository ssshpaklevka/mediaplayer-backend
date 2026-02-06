import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminService } from './admin.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService,
  ) {}

  @Post('admin/seed')
  @ApiOperation({ summary: 'Создать админа admin/admin (если ещё нет)' })
  @ApiResponse({
    status: 200,
    description: 'Результат',
    schema: {
      properties: { created: { type: 'boolean' }, message: { type: 'string' } },
    },
  })
  async adminSeed() {
    return this.adminService.seedAdmin();
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Вход админа (JWT)' })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Успешный вход',
    schema: { properties: { accessToken: { type: 'string' } } },
  })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
  async adminLogin(@Body() dto: AdminLoginDto) {
    const admin = await this.adminService.findByUsername(dto.username);
    if (
      !admin ||
      !(await this.adminService.validatePassword(admin, dto.password))
    ) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    const secret = this.configService.get<string>(
      'JWT_ADMIN_SECRET',
      'admin-secret-change-me',
    );
    const accessToken = this.jwtService.sign(
      { sub: admin.username },
      { secret, expiresIn: '7d' },
    );
    return { accessToken };
  }
}
