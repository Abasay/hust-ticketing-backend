import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { DatabaseModelNames } from 'src/shared/constants';
import { UserSchema } from '../user/user.schema';
import { AuthorizedUserSchema } from '../user/authorized-user.schema';
import { TicketSchema } from '../tickets/ticket.schema';
import { TransactionSchema } from '../transactions/transaction.schema';
import { RedemptionSchema } from '../redemptions/redemption.schema';
import { ReportSchema } from '../reports/report.schema';

// Purpose: Centralized module to manage all Mongoose models and schemas to avoid circular dependencies

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DatabaseModelNames.USER, schema: UserSchema },
      { name: DatabaseModelNames.AUTHORIZED_USER, schema: AuthorizedUserSchema },
      { name: DatabaseModelNames.TICKET, schema: TicketSchema },
      { name: DatabaseModelNames.TRANSACTION, schema: TransactionSchema },
      { name: DatabaseModelNames.REDEMPTION, schema: RedemptionSchema },
      { name: DatabaseModelNames.REPORT, schema: ReportSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongooseModelsModule {}
