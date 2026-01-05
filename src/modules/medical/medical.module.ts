import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalService } from './medical.service';
import { WalletsController } from './wallets.controller';
import { MongooseModelsModule } from '../mongoose-models/mongoose.models.module';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  controllers: [StudentsController, MedicalRecordsController, WalletsController],
  providers: [MedicalService],
  exports: [MedicalService],
  imports: [MongooseModelsModule, RepositoryModule],
})
export class MedicalModule {}
