import { Module } from '@nestjs/common';
import { ProfileDisplayProvider } from './profile-display.provider';

@Module({
  providers: [ProfileDisplayProvider],
  exports: [ProfileDisplayProvider],
})
export class ProfileModule {}