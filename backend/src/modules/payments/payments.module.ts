import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { YooKassaProvider } from './providers/yookassa.provider';
import { CloudPaymentsProvider } from './providers/cloudpayments.provider';
import { RobokassaProvider } from './providers/robokassa.provider';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [InvoicesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, YooKassaProvider, CloudPaymentsProvider, RobokassaProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}

