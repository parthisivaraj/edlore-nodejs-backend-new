import { Module } from '@nestjs/common';
import { HealthModule } from './health';
import { OrganizationModule } from './organization';
import { AuthModule } from './auth';
import { NoteModule } from './notes';
import { NotificationsModule } from './notifications';
import { DashboardModule } from './dashboard';
import { GlobalSearchModule } from './global-search';
import { TaskTypeModule } from './task-type';
import { AssetNotesModule } from './asset-notes';
import { TabletVersionsModule } from './tablet-versions';
import { AppConfigModule } from '@app/config';
import { ErrorCodeMachineType, SchemaModule, Status } from '@app/schema';
import { ModelModule } from './model';
import { CategoriesModule } from './categories';
import { DeviceModule } from './devices';
import { ProcedureModule } from './procedure';
import { SectionModule } from './section/section.module';
import { TroubleshootModule } from './troubleshoot';
import { WrittenIssueModule } from './written-issue';
import { ErrorCodeModule } from './error-code';
import { SketchModule } from './sketch';
import { AnaglyphModule } from './anaglyph';
import { SafetyMeasureModule } from './safety-measure';
import { UsersModule } from './users';
import { WorkOrderModule } from './work-order';
import { GroupModule } from './groups';
import { UserRoleModule } from './user-role';
import { MediaModule } from './media';
import { DeskProcedureModule } from './desk-procedure';
import { AwsModule } from './aws';
import { SlaveMachineModule } from './slave-machine';
import { DeviceTokenModule } from './device-token';
import { RealiseNoteModule } from './realise-note';
import { DatabaseModule } from './database';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SyncModule } from './sync/sync.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PermissionsModule } from './permission/permission.module';
import { StepModule } from './step';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './response-interceptor.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    ScheduleModule.forRoot(),
    AppConfigModule,
    SchemaModule,
    // MongoSchemaModule,
    HealthModule,
    OrganizationModule,
    AuthModule,
    CategoriesModule,
    ModelModule,
    DeviceModule,
    ProcedureModule,
    SectionModule,
    TroubleshootModule,
    UsersModule,
    PermissionsModule,
    NoteModule,
    NotificationsModule,
    DashboardModule,
    GlobalSearchModule,
    TaskTypeModule,
    AssetNotesModule,
    TabletVersionsModule,
    WrittenIssueModule,
    SafetyMeasureModule,
    Status,
    ErrorCodeModule,
    ErrorCodeMachineType,
    SketchModule,
    AnaglyphModule,
    TaskTypeModule,
    WorkOrderModule,
    GroupModule,
    UserRoleModule,
    MediaModule,
    DeskProcedureModule,
    AwsModule,
    AuthModule,
    SlaveMachineModule,
    DeviceTokenModule,
    DatabaseModule,
    SyncModule,
    StepModule,
    RealiseNoteModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
