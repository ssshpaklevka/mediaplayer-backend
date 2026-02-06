import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

export const multerImageOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 100,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      cb(null, true);
    } else {
      cb(
        new Error('Можно загружать только изображения (jpg, jpeg, png, webp)!'),
        false,
      );
    }
  },
};

export const multerVideoOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
    files: 10,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.match(/\/(mp4|avi)$/)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Можно загружать только видео (mp4, avi, mov, wmv, flv, webm, mkv)!',
        ),
        false,
      );
    }
  },
};

export const multerUniversalOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
    files: 100,
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.match(/\/(webp|png|webm|)$/)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          'Можно загружать только изображения (webp, png) и видео (webm)!',
        ),
        false,
      );
    }
  },
};
