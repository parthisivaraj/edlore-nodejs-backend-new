import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlaveMachineController } from './slave-machine.controller';
import { SlaveMachineService } from './slave-machine.service';
import { SlaveMachine } from '@app/schema';

@Module({
  imports: [TypeOrmModule.forFeature([SlaveMachine])],
  controllers: [SlaveMachineController],
  providers: [SlaveMachineService],
})
export class SlaveMachineModule {}
