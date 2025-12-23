import { Module } from '@nestjs/common';
import { ProtectedController } from './Protected.controller';

@Module({
  imports: [],
  controllers: [ProtectedController],
})
export class ProtectedModule { }
