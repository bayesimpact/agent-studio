import { Module } from '@nestjs/common';
import { LaborMarketDataService } from './labormarket.service';

@Module({
  providers: [LaborMarketDataService],
  exports: [LaborMarketDataService],
})
export class LaborMarketDataModule {}