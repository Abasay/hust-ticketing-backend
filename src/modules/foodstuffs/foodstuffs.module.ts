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
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [MongooseModelsModule, RepositoryModule],
  controllers: [
    FoodstuffsController,
    CookedFoodNamesController,
    CookedFoodsController,
    RequisitionsController,
    OrdersController,
  ],
  providers: [
    FoodstuffsService,
    CookedFoodNamesService,
    CookedFoodsService,
    RequisitionsService,
    OrdersService,
    {
      provide: Repositories.FoodstuffRequisitionRepository,
      useFactory: (model) => new BaseRepository(model),
      inject: [getModelToken(DatabaseModelNames.FOODSTUFF_REQUISITION)],
    },
    {
      provide: Repositories.OrderRepository,
      useFactory: (model) => new BaseRepository(model),
      inject: [getModelToken(DatabaseModelNames.ORDER)],
    },
  ],
})
export class FoodstuffsModule {}
