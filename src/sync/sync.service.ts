import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  GetHealthAPI,
  GetSyncAPI,
  PostSyncAPI,
  SYNC_TABLE_ORDERS,
} from './sync.constant';
import * as path from 'path';
import * as AdmZip from 'adm-zip';
import { existsSync } from 'fs';
import { ActiveStorageBlob, SlaveMachine } from '@app/schema';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import {
  CommonUtilsService,
  DateFormat,
  DateUtilsService,
} from '@app/common-utils';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { AppConfigService } from '@app/config';

@Injectable()
export class SyncService {
  private publicFolder = path.join(__dirname, '..', 'public', 'uploads');
  private tmpDir = path.join(__dirname, '..', 'tmp', 'files');

  constructor(
    @InjectRepository(SlaveMachine)
    private readonly slaveMachineRepository: Repository<SlaveMachine>,
    private readonly entityManager: EntityManager,
    private readonly appConfigService: AppConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async extractZipData(zipData: any) {
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }

    const tempZipPath = path.resolve(this.tmpDir, 'temp.zip');
    fs.writeFileSync(tempZipPath, zipData);
    const zip = new AdmZip(zipData);
    const extractedPath = path.resolve(this.tmpDir); // Destination folder for extracted files
    if (!fs.existsSync(extractedPath)) {
      fs.mkdirSync(extractedPath, { recursive: true });
    }
    zip.extractAllTo(extractedPath, true);

    const zipEntries = zip.getEntries();
    for (const entry of zipEntries) {
      const extractedFilePath = path.resolve(extractedPath, entry.entryName);
      if (entry.entryName === 'metadata.json') {
        const metadataContent = zip.readAsText(entry);
        const metadata = JSON.parse(metadataContent);
        for (const table of SYNC_TABLE_ORDERS) {
          const temp = metadata[table];
          if ((temp || []).length > 0) {
            await this.upsertData(table, temp);
          }
        }
      } else {
        const destinationPath = path.resolve(
          this.publicFolder,
          entry.entryName,
        );
        const parentDir = path.dirname(destinationPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        fs.renameSync(extractedFilePath, destinationPath);
      }
    }

    fs.unlinkSync(tempZipPath);
    fs.rmSync(extractedPath, { recursive: true, force: true });
  }

  private async syncFromSurface(machine: SlaveMachine) {
    try {
      await this.slaveMachineRepository.update(machine.id, {
        is_syncing: true,
        sync_start_at: new Date(),
        sync_status: 'Processing',
      });

      const lastSyncAt = new Date(machine.last_sync_at); // Convert to Date object
      lastSyncAt.setHours(lastSyncAt.getHours() - 12); // Move back 24 hours

      const config = this.appConfigService.getPort();

      const url = GetSyncAPI(
        `${machine.ipaddress}:${config.port}`,
        DateUtilsService.dateToString(lastSyncAt, DateFormat.serverDate),
      );
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000 * 10,
      });

      await this.extractZipData(response.data);
      await this.slaveMachineRepository.update(machine.id, {
        is_syncing: false,
        sync_end_at: new Date(),
        last_sync_at: new Date(),
        sync_status: 'Success',
      });
    } catch (error) {
      console.log(
        '🚀 ~ SyncService ~ syncMachine ~ error syncFromSurface:',
        error,
      );
      await this.slaveMachineRepository.update(machine.id, {
        is_syncing: false,
        sync_end_at: new Date(),
        sync_status: 'Error',
      });
    }
  }

  private async syncToSurface(machine: SlaveMachine, zipBuffer: any) {
    try {
      await this.slaveMachineRepository.update(machine.id, {
        is_syncing: true,
        sync_start_at: new Date(),
        sync_status: 'Processing',
      });
      const config = this.appConfigService.getPort();

      const url = PostSyncAPI(`${machine.ipaddress}:${config.port}`);

      const formData = new FormData();
      formData.append('file', zipBuffer, {
        filename: 'data.zip',
        contentType: 'application/zip',
      });

      const response = await axios.post(url, formData, {
        headers: formData.getHeaders(),
        timeout: 60000 * 10,
      });
      console.log(
        '🚀 ~ SyncService ~ syncToSurface ~ response:',
        response.data,
      );

      await this.slaveMachineRepository.update(machine.id, {
        is_syncing: false,
        sync_end_at: new Date(),
        last_server_sync_at: new Date(),
        sync_status: 'Success',
      });
    } catch (error) {
      console.log(
        '🚀 ~ SyncService ~ syncMachine ~ error syncToSurface:',
        error,
      );
      await this.slaveMachineRepository.update(machine.id, {
        is_syncing: false,
        sync_end_at: new Date(),
        sync_status: 'Error',
      });
    }
  }

  private async sendServerData(machines: SlaveMachine[]) {
    const surfacePros = machines.filter((x) => x.name !== 'Server');
    for (let index = 0; index < surfacePros.length; index++) {
      const machine = surfacePros[index];
      if (!machine.is_syncing) {
        try {
          const config = this.appConfigService.getPort();

          const url = GetHealthAPI(`${machine.ipaddress}:${config.port}`);
          console.log('🚀 ~ SyncService ~ syncMachineCron ~ url:', url);
          await axios.get(url, {
            timeout: 10000,
          });

          const lastSyncAt = new Date(machine.last_server_sync_at); // Convert to Date object
          lastSyncAt.setHours(lastSyncAt.getHours() - 12); // Move back 24 hours

          const newData = await this.pullData(lastSyncAt);
          await this.syncToSurface(machine, newData);
        } catch {
          console.log(`Could not connect machine ${machine.name}`);
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncMachineCron() {
    const config = this.appConfigService.getMachineInfo();
    if (config.type === 'SERVER' && config.mode === 'OFFLINE') {
      const machines = await this.slaveMachineRepository.find({});

      const surfacePros = machines.filter((x) => x.name !== 'Server');
      for (let index = 0; index < surfacePros.length; index++) {
        const machine = surfacePros[index];
        if (!machine.is_syncing) {
          try {
            const portConfig = this.appConfigService.getPort();

            const url = GetHealthAPI(`${machine.ipaddress}:${portConfig.port}`);
            console.log('🚀 ~ SyncService ~ syncMachineCron ~ url:', url);
            await axios.get(url, {
              timeout: 10000,
            });
            await this.syncFromSurface(machine);
          } catch {
            console.log(`Could not connect machine ${machine.name}`);
          }
        }
      }
      await this.sendServerData(machines);
    }
  }

  async pullData(lastSyncAt: Date | null): Promise<any> {
    const data = {};
    for (const table of SYNC_TABLE_ORDERS) {
      data[table] = await this.fetchData(table, lastSyncAt);
    }

    const zip = new AdmZip();

    const files: ActiveStorageBlob[] = data['active_storage_blobs'];

    for (const file of files) {
      let filePath = path.join(this.publicFolder, file.key);

      if (file.file_type === 'video') {
        const ext = CommonUtilsService.getExtension(file.filename);
        filePath = path.join(this.publicFolder, `${file.key}.${ext}`);
      }
      if (existsSync(filePath)) {
        zip.addLocalFile(filePath);
      } else {
        console.warn(`File not found: ${filePath}`);
      }
    }

    // Add JSON metadata file to the ZIP
    zip.addFile('metadata.json', Buffer.from(JSON.stringify(data, null, 2)));

    return zip.toBuffer();
  }

  private async fetchData(tableName: string, lastSyncAt: Date | null) {
    const column = [
      'active_storage_blobs',
      'active_storage_attachments',
    ].includes(tableName)
      ? 'created_at'
      : 'updated_at';
    const result = await this.entityManager.query(
      `SELECT * FROM ${tableName} ${lastSyncAt ? `WHERE ${column} > $1` : ''}`,
      lastSyncAt ? [lastSyncAt] : [],
    );
    return result;
  }

  private async upsertData(tableName: string, data: any[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    for (const record of data) {
      const columns = Object.keys(record);
      const values = Object.values(record);

      // Construct dynamic insert query
      const insertQuery = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
        ON CONFLICT (${['id'].join(', ')})
        DO UPDATE SET ${columns
          .map((column) => `${column} = EXCLUDED.${column}`)
          .join(', ')}
        RETURNING *;
      `;

      // Execute query
      await queryRunner.query(insertQuery, values);
    }

    await queryRunner.commitTransaction();
    await queryRunner.release();
  }
}
