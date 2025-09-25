import { Module } from '@nestjs/common';
import { FoodstuffsController } from './foodstuffs.controller';
import { FoodstuffsService } from './foodstuffs.service';
import { MongooseModelsModule } from '../mongoose-models/mongoose.models.module';
import { BaseRepository } from '../repository/base.repository';
import { getModelToken } from '@nestjs/mongoose';
import { DatabaseModelNames } from 'src/shared/constants';
import { Repositories } from 'src/shared/enums';
import { RepositoryModule } from '../repository/repository.module';
import { CookedFoodNamesService } from './cooked-food-names.service';
import { CookedFoodsService } from './cooked-foods.service';
import { CookedFoodNamesController } from './cooked-food-names.controller';
import { CookedFoodsController } from './cooked-foods.controller';
import { RequisitionsService } from './requisitions.service';
import { RequisitionsController } from './requisitions.controller';

@Module({
  imports: [MongooseModelsModule, RepositoryModule],
  controllers: [FoodstuffsController, CookedFoodNamesController, CookedFoodsController, RequisitionsController],
  providers: [
    FoodstuffsService,
    CookedFoodNamesService,
    CookedFoodsService,
    RequisitionsService,
    {
      provide: Repositories.FoodstuffRequisitionRepository,
      useFactory: (model) => new BaseRepository(model),
      inject: [getModelToken(DatabaseModelNames.FOODSTUFF_REQUISITION)],
    },
  ],
})
export class FoodstuffsModule {}
