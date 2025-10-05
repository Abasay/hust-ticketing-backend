import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModelNames } from 'src/shared/constants';
import { UserSchema } from '../user/user.schema';

import { TicketSchema } from '../tickets/ticket.schema';
import { TransactionSchema } from '../transactions/transaction.schema';
import { RedemptionSchema } from '../redemptions/redemption.schema';
import { ReportSchema } from '../reports/report.schema';
import { FoodstuffSchema } from '../foodstuffs/schemas/foodstuff.schema';
import { FoodstuffHistorySchema } from '../foodstuffs/schemas/foodstuff-history.schema';
import { AuthorizedUserSchema } from '../user/authorized-user.schema';
import { CookedFoodNameSchema } from '../foodstuffs/schemas/cooked-food-name.schema';
import { CookedFoodSchema } from '../foodstuffs/schemas/cooked-food.schema';
import { FoodstuffRequisitionSchema } from '../foodstuffs/schemas/foodstuff-requisition.schema';
import { WalletSchema } from '../wallet/wallet.schema';
import { OrderSchema } from '../foodstuffs/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DatabaseModelNames.USER, schema: UserSchema },
      { name: DatabaseModelNames.AUTHORIZED_USER, schema: AuthorizedUserSchema },
      { name: DatabaseModelNames.TICKET, schema: TicketSchema },
      { name: DatabaseModelNames.TRANSACTION, schema: TransactionSchema },
      { name: DatabaseModelNames.REDEMPTION, schema: RedemptionSchema },
      { name: DatabaseModelNames.REPORT, schema: ReportSchema },
      { name: DatabaseModelNames.FOODSTUFF, schema: FoodstuffSchema },
      { name: DatabaseModelNames.FOODSTUFF_HISTORY, schema: FoodstuffHistorySchema },
      { name: DatabaseModelNames.COOKED_FOOD_NAME, schema: CookedFoodNameSchema },
      { name: DatabaseModelNames.COOKED_FOOD, schema: CookedFoodSchema },
      { name: DatabaseModelNames.FOODSTUFF_REQUISITION, schema: FoodstuffRequisitionSchema },
      { name: DatabaseModelNames.WALLET, schema: WalletSchema },
      { name: DatabaseModelNames.ORDER, schema: OrderSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongooseModelsModule {}
