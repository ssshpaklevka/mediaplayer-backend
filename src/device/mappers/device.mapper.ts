import { Device } from '../entities/device.entity';
import { DeviceRo } from '../dto/device.ro';

export function toDeviceRo(entity: Device): DeviceRo {
  return {
    id: entity.id,
    macAddress: entity.macAddress,
    ip: entity.ip,
    name: entity.name,
    location: entity.location,
    group: entity.group
      ? {
          id: entity.group.id,
          name: entity.group.name,
          enabled: entity.group.enabled,
        }
      : null,
    lastSeen: entity.lastSeen?.toISOString() ?? null,
  };
}
