import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from './entities/admin.entity';

const SEED_USERNAME = 'admin';
const SEED_PASSWORD = 'admin';
const SALT_ROUNDS = 10;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) {}

  async findByUsername(username: string): Promise<Admin | null> {
    return this.adminRepo.findOne({ where: { username } });
  }

  async create(username: string, plainPassword: string): Promise<Admin> {
    const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    const admin = this.adminRepo.create({ username, passwordHash });
    return this.adminRepo.save(admin);
  }

  async validatePassword(admin: Admin, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, admin.passwordHash);
  }

  /** Создаёт админа admin/admin, если в БД ещё нет ни одного админа. */
  async seedAdmin(): Promise<{ created: boolean; message: string }> {
    const existing = await this.adminRepo.count();
    if (existing > 0) {
      return { created: false, message: 'Админ уже существует' };
    }
    await this.create(SEED_USERNAME, SEED_PASSWORD);
    return { created: true, message: 'Админ создан (admin / admin)' };
  }
}
