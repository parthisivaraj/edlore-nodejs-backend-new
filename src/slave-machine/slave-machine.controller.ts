import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { SlaveMachineService } from './slave-machine.service';
import { SlaveMachineDTO } from './dto/slave-machine';
import { CreateUpdateSlaveMachineDTO } from './dto/add-edit';
import { ApiTags } from '@nestjs/swagger';

@Controller('slave_machines')
@ApiTags('slave_machines')
export class SlaveMachineController {
  constructor(private readonly slaveMachineService: SlaveMachineService) {}

  @Get()
  async get(): Promise<SlaveMachineDTO[]> {
    return this.slaveMachineService.get();
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<SlaveMachineDTO> {
    return this.slaveMachineService.getById(id);
  }

  @Post()
  async create(
    @Body() createSlaveMachineDto: CreateUpdateSlaveMachineDTO,
  ): Promise<SlaveMachineDTO> {
    return this.slaveMachineService.create(createSlaveMachineDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSlaveMachineDto: CreateUpdateSlaveMachineDTO,
  ): Promise<SlaveMachineDTO> {
    return this.slaveMachineService.update(id, updateSlaveMachineDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.slaveMachineService.remove(id);
  }
}
