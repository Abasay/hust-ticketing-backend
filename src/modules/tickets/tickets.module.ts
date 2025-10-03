import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  imports: [
    RepositoryModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
