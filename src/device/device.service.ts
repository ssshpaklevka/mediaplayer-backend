import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { Group } from '../group/entities/group.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

function normalizeMacAddress(mac: string): string {
  return mac
    .replace(/[-:]/g, '')
    .toUpperCase()
    .replace(/(.{2})/g, '$1:')
    .slice(0, -1);
}

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async create(dto: CreateDeviceDto): Promise<Device> {
    let group: Group | null = null;
    if (dto.groupId) {
      group = await this.groupRepository.findOne({
        where: { id: dto.groupId },
      });
      if (!group) {
        throw new NotFoundException(`Группа с id ${dto.groupId} не найдена`);
      }
    }
    const device = this.deviceRepository.create({
      macAddress: normalizeMacAddress(dto.macAddress),
      ip: dto.ip,
      name: dto.name,
      location: dto.location,
      lastSeen: dto.lastSeen ? new Date(dto.lastSeen) : null,
      groupId: dto.groupId ?? null,
      group,
    });
    return this.deviceRepository.save(device);
  }

  /**
   * Устройство «стучится» на бэк по MAC.
   * Если верифицировано (groupId задан) — verified: true, иначе создаём/обновляем pending и verified: false.
   */
  async checkIn(
    macAddress: string,
    ip: string,
  ): Promise<{ device: Device; verified: boolean }> {
    const normalized = normalizeMacAddress(macAddress);
    let device = await this.deviceRepository.findOne({
      where: { macAddress: normalized },
      relations: ['group'],
    });

    const now = new Date();
    if (device) {
      device.ip = ip;
      device.lastSeen = now;
      device = await this.deviceRepository.save(device);
      const verified = device.group !== null && device.group.enabled;
      return { device, verified };
    }

    device = this.deviceRepository.create({
      macAddress: normalized,
      ip,
      name: null,
      location: null,
      lastSeen: now,
      groupId: null,
      group: null,
    });
    device = await this.deviceRepository.save(device);
    return { device, verified: false };
  }

  async findAll(): Promise<Device[]> {
    return this.deviceRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['group'],
    });
  }

  async findOne(id: string, loadGroup = true): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { id },
      relations: loadGroup ? ['group'] : [],
    });
    if (!device) {
      throw new NotFoundException(`Устройство с id ${id} не найдено`);
    }
    return device;
  }

  async update(id: string, dto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id);
    const {
      macAddress: dtoMac,
      lastSeen: dtoLastSeen,
      groupId: dtoGroupId,
      ...rest
    } = dto;
    const updates: Partial<Device> = { ...rest };
    if (dtoMac !== undefined) {
      updates.macAddress = normalizeMacAddress(dtoMac);
    }
    if (dtoLastSeen !== undefined) {
      updates.lastSeen = new Date(dtoLastSeen);
    }
    if (dtoGroupId !== undefined) {
      if (dtoGroupId === null) {
        device.groupId = null;
        device.group = null;
      } else {
        const group = await this.groupRepository.findOne({
          where: { id: dtoGroupId },
        });
        if (!group) {
          throw new NotFoundException(`Группа с id ${dtoGroupId} не найдена`);
        }
        device.groupId = dtoGroupId;
        device.group = group;
      }
    }
    Object.assign(device, updates);
    return this.deviceRepository.save(device);
  }

  async remove(id: string): Promise<void> {
    const device = await this.findOne(id);
    await this.deviceRepository.remove(device);
  }
}
