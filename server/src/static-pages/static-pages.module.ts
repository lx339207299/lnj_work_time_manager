import { Module } from '@nestjs/common';
import { StaticPagesService } from './static-pages.service';
import { StaticPagesController } from './static-pages.controller';
import { AdminStaticPagesController } from './admin-static-pages.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaticPagesController, AdminStaticPagesController],
  providers: [StaticPagesService],
})
export class StaticPagesModule {}
