import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { AdminMailController } from './admin-mail.controller';

@Global()
@Module({
  controllers: [AdminMailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
