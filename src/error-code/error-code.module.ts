// error-code.module.ts
import { Module } from '@nestjs/common';
import { ErrorCodeService } from './error-code.service';
import { ErrorCodeController } from './error-code.controller';
import { DBSchemas } from '@app/schema';
import { MediaModule } from 'src/media';

@Module({
  imports: [
    DBSchemas.errorCode,
    DBSchemas.errorCodeLinking,
    DBSchemas.errorCodeMachineType,
    DBSchemas.model,
    DBSchemas.procedure,
    DBSchemas.troubleshoot,
    MediaModule,
  ],
  controllers: [ErrorCodeController],
  providers: [ErrorCodeService],
})
export class ErrorCodeModule {}
