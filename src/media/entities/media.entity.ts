import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Group } from '../../group/entities/group.entity';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => Group)
  @JoinTable({
    name: 'media_groups',
    joinColumn: { name: 'media_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'group_id', referencedColumnName: 'id' },
  })
  groups: Group[];

  /** Ссылка на CDN (после конвертации и заливки) или прямая ссылка */
  @Column({ type: 'varchar', length: 2048, nullable: true })
  url: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'READY',
    comment: 'PENDING=в очереди на конвертацию, READY=доступно, FAILED=ошибка',
  })
  status: 'PENDING' | 'READY' | 'FAILED';

  @Column({
    type: 'varchar',
    length: 512,
    nullable: true,
    name: 'processing_error',
  })
  processingError: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  /** Размер исходного файла в байтах (для отслеживания PENDING файлов) */
  @Column({ type: 'bigint', nullable: true, name: 'file_size' })
  fileSize: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
