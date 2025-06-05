import { Module } from '@nestjs/common';
import { MediaService } from '../src/media';

@Module({
  providers: [
    {
      provide: MediaService,
      useValue: {
        getThumbnailUrl: jest.fn().mockResolvedValue('mock-thumbnail-url'),
      },
    },
  ],
  exports: [MediaService], // ✅ required so AuthModule can use it
})
export class MediaModuleAuth {}
