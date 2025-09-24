import { Module } from '@nestjs/common';
import { FoodstuffsController } from './foodstuffs.controller';
import { FoodstuffsService } from './foodstuffs.service';
import { MongooseModelsModule } from '../mongoose-models/mongoose.models.module';
import { BaseRepository } from '../repository/base.repository';
import { getModelToken } from '@nestjs/mongoose';
import { DatabaseModelNames } from 'src/shared/constants';
import { Repositories } from 'src/shared/enums';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  imports: [MongooseModelsModule, RepositoryModule],
  controllers: [FoodstuffsController],
  providers: [
    FoodstuffsService,
    // {
    //   provide: Repositories.FOODSTUFF_REPOSITORY,
    //   useFactory: (model) => new BaseRepository(model),
    //   inject: [getModelToken(DatabaseModelNames.FOODSTUFF)],
    // },
    // {
    //   provide: Repositories.FOODSTUFF_HISTORY_REPOSITORY,
    //   useFactory: (model) => new BaseRepository(model),
    //   inject: [getModelToken(DatabaseModelNames.FOODSTUFF_HISTORY)],
    // },
  ],
  exports: [FoodstuffsService],
})
export class FoodstuffsModule {}
