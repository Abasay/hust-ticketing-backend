import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './provider';
import { UploadService } from './cloudinary.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [CloudinaryProvider, UploadService],
  exports: [CloudinaryProvider, UploadService],
})
export class CloudinaryModule {}
