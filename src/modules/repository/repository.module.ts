import { Module } from '@nestjs/common';
import { MongooseModelsModule } from '../mongoose-models/mongoose.models.module';
import { Repositories } from 'src/shared/enums';
import { BaseRepository } from './base.repository';
import { getModelToken } from '@nestjs/mongoose';
import { DatabaseModelNames } from 'src/shared/constants';

@Module({
  imports: [MongooseModelsModule],
  providers: [
    // Dynamic repository providers for each database schema & entity
    // e.g
    {
      provide: Repositories.UserRepository,
      useFactory: (userModel) => new BaseRepository(userModel),
      inject: [getModelToken(DatabaseModelNames.USER)],
    },
    {
      provide: Repositories.AuthorizedUserRepository,
      useFactory: (authorizedUserModel) => new BaseRepository(authorizedUserModel),
      inject: [getModelToken(DatabaseModelNames.AUTHORIZED_USER)],
    },
    {
      provide: Repositories.TicketRepository,
      useFactory: (ticketModel) => new BaseRepository(ticketModel),
      inject: [getModelToken(DatabaseModelNames.TICKET)],
    },
    {
      provide: Repositories.TransactionRepository,
      useFactory: (transactionModel) => new BaseRepository(transactionModel),
      inject: [getModelToken(DatabaseModelNames.TRANSACTION)],
    },
    {
      provide: Repositories.RedemptionRepository,
      useFactory: (redemptionModel) => new BaseRepository(redemptionModel),
      inject: [getModelToken(DatabaseModelNames.REDEMPTION)],
    },
    {
      provide: Repositories.ReportRepository,
      useFactory: (reportModel) => new BaseRepository(reportModel),
      inject: [getModelToken(DatabaseModelNames.REPORT)],
    },
    {
      provide: Repositories.FoodstuffRepository,
      useFactory: (foodstuffModel) => new BaseRepository(foodstuffModel),
      inject: [getModelToken(DatabaseModelNames.FOODSTUFF)],
    },
    {
      provide: Repositories.FoodstuffHistoryRepository,
      useFactory: (foodstuffHistoryModel) => new BaseRepository(foodstuffHistoryModel),
      inject: [getModelToken(DatabaseModelNames.FOODSTUFF_HISTORY)],
    },
    {
      provide: Repositories.CookedFoodNameRepository,
      useFactory: (cookedFoodNameModel) => new BaseRepository(cookedFoodNameModel),
      inject: [getModelToken(DatabaseModelNames.COOKED_FOOD_NAME)],
    },
    {
      provide: Repositories.CookedFoodRepository,
      useFactory: (cookedFoodModel) => new BaseRepository(cookedFoodModel),
      inject: [getModelToken(DatabaseModelNames.COOKED_FOOD)],
    },
    {
      provide: Repositories.FoodstuffRequisitionRepository,
      useFactory: (foodstuffRequisitionModel) => new BaseRepository(foodstuffRequisitionModel),
      inject: [getModelToken(DatabaseModelNames.FOODSTUFF_REQUISITION)],
    },
    {
      provide: Repositories.WalletRepository,
      useFactory: (walletModel) => new BaseRepository(walletModel),
      inject: [getModelToken(DatabaseModelNames.WALLET)],
    },
  ],
  exports: [...Object.values(Repositories)],
})
export class RepositoryModule {}
