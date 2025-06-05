import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  ActiveStorageAttachment,
  ActiveStorageBlob,
  AttachedMedia,
} from '@app/schema';
import { MediaSearchParams } from './dto/search';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '@app/config';
import { MediaDTO, MediaResponse, UpdateMediaDTO } from './dto/response';
import { FilterService } from '@app/schema/service';
import { AttachedMediaDTO } from '@app/schema/dto';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  CreateAWSMediaDTO,
  CreateMediaDTO,
  CreateUnityAWSMediaDTO,
  SaveMediaDTO,
  UploadFileParams,
} from './dto/upload';
import * as mime from 'mime-types';
import axios from 'axios';
import { CommonUtilsService } from '@app/common-utils';
// import * as thumbsupply from 'thumbsupply';
// import { fromPath } from 'pdf2pic';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  s3: S3Client;
  bucket: string;
  frontendURL: string;

  private tmpDir = path.join(__dirname, '..', 'tmp', 'files');
  private publicFolder = path.join(__dirname, '..', 'public', 'uploads');

  constructor(
    private configService: AppConfigService,
    private filterService: FilterService,
    @InjectRepository(AttachedMedia)
    private attachmentMediaRepository: Repository<AttachedMedia>,

    @InjectRepository(ActiveStorageAttachment)
    private readonly attachmentRepository: Repository<ActiveStorageAttachment>,

    @InjectRepository(ActiveStorageBlob)
    private readonly blobRepository: Repository<ActiveStorageBlob>,
    private dataSource: DataSource,
  ) {
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }
    const config = this.configService.getAWSConfig();
    this.s3 = new S3Client({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      region: config.region,
    });
    this.bucket = config.bucket;
    this.frontendURL = config.frontEndURL;
    // this.moveAllFilesToOneFolder();
  }

  private async convertDTO(
    attachment: ActiveStorageAttachment,
  ): Promise<MediaDTO> {
    const { blob } = attachment;
    return {
      id: attachment.id,
      title: blob.title,
      content_type: blob.content_type,
      file_name: blob.filename,
      file_type: blob.file_type,
      url: await this.getSignedUrl(blob),
      thumb_url: await this.getThumbnailUrl(blob.file_type, blob),
    };
  }

  async get(params: MediaSearchParams): Promise<MediaResponse> {
    let queryBuilder = this.attachmentRepository
      .createQueryBuilder('attachment')
      .leftJoinAndSelect('attachment.blob', 'blob')
      .where({ name: 'medias' });

    if (params.organization_id && params.organization_id !== 'undefined') {
      queryBuilder.andWhere({ record_id: params.organization_id });
    }

    if (params.type && params.type_id) {
      let ids: string[] = [];

      switch (params.type) {
        case 'procedure_step':
        case 'written_issue_step':
        case 'troubleshoot_step':
        case 'part':
        case 'sketch':
        case 'written_issues':
        case 'safety_measure':
        case 'note':
        case 'error_codes':
        case 'asset_notes':
        case 'anaglyph':
          const attachmentMedia = await this.attachmentMediaRepository.find({
            where: { mediable_id: params.type_id },
            select: ['id'],
          });
          ids = attachmentMedia.map(
            (media) => media.active_storage_attachment_id.id,
          );
          break;
      }

      if (ids.length > 0) {
        queryBuilder = queryBuilder
          .andWhere(
            '(attachment.id IN (:...ids) OR attachment.id NOT IN (:...ids))',
            {
              ids,
            },
          )
          .addSelect(
            `CASE WHEN attachment.id IN (:...ids) THEN 0 ELSE 1 END`,
            'rank',
          ) // Add computed field
          .orderBy('rank', 'ASC')
          .addOrderBy('attachment.created_at', 'DESC')
          .setParameter('ids', ids);
      }
    } else {
      queryBuilder = queryBuilder.orderBy('attachment.created_at', 'DESC');
    }

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER(blob.title) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    // const attachments = await this.attachmentRepository.find({
    //   where: { name: 'medias', record_id: params.organization_id },
    //   relations: ['blob'],
    // });

    const selected_filters = { media_type: [] };

    if (params.filters) {
      const { media_type } = params.filters;

      selected_filters.media_type = media_type || [];

      if (media_type && media_type.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          'blob.file_type IN (:...media_type)',
          {
            media_type,
          },
        );
      }
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;

    queryBuilder = queryBuilder.addOrderBy('attachment.created_at', 'DESC');
    queryBuilder = queryBuilder.skip(skip).take(take);

    const [attachments, total] = await queryBuilder.getManyAndCount();

    const medias: MediaDTO[] = await Promise.all(
      attachments.map((attachment) => this.convertDTO(attachment)),
    );

    const filters = await this.filterService.getFilters(
      selected_filters,
      'medias',
    );

    return {
      medias,
      filters,
      message: 'Success',
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
    };
  }

  // private getPdfThumbnail = async (pdfPath) => {
  //   // Get filename without extension
  //   const baseName = path.basename(pdfPath, path.extname(pdfPath));
  //   const thumbnailPath = path.join(this.publicFolder, `${baseName}.jpg`);
  //   if (fs.existsSync(thumbnailPath)) {
  //     return thumbnailPath;
  //   }

  //   if (!fs.existsSync(this.publicFolder)) {
  //     fs.mkdirSync(this.publicFolder, { recursive: true });
  //   }

  //   try {
  //     const options = {
  //       density: 100,
  //       width: 300,
  //       height: 300,
  //     };
  //     const convert = fromPath(pdfPath, options);
  //     const pageToConvertAsImage = 1;

  //     const image: any = await convert(pageToConvertAsImage, {
  //       responseType: 'image',
  //     });
  //     console.log('🚀 ~ MediaService ~ getPdfThumbnail= ~ image:', image);
  //     await fs.writeFileSync(thumbnailPath, image.buffer);

  //     return thumbnailPath; // Return new thumbnail path
  //   } catch (error) {
  //     console.error('Error generating thumbnail:', error);
  //     throw error;
  //   }
  // };

  // private getVideoThumbnail = async (pdfPath) => {
  //   // Get filename without extension
  //   const baseName = path.basename(pdfPath, path.extname(pdfPath));
  //   const thumbnailPath = path.join(this.publicFolder, `${baseName}.jpg`);
  //   if (fs.existsSync(thumbnailPath)) {
  //     return `${this.frontendURL}/uploads/${baseName}.jpg`;
  //   }

  //   if (!fs.existsSync(this.publicFolder)) {
  //     fs.mkdirSync(this.publicFolder, { recursive: true });
  //   }

  //   try {
  //     const output = await thumbsupply.generateThumbnail(pdfPath, {
  //       mimetype: 'video/mp4',
  //     });
  //     fs.renameSync(output, thumbnailPath);

  //     return `${this.frontendURL}/uploads/${baseName}.jpg`; // Return new thumbnail path
  //   } catch (error) {
  //     console.error('Error generating thumbnail:', error);
  //     throw error;
  //   }
  // };

  private async getSignedUrl(
    blob: ActiveStorageBlob,
    // key: string,
    // service_name: 'local' | 'amazon',
  ): Promise<string> {
    if (blob.service_name === 'local') {
      const url = `${this.frontendURL}/uploads/${blob.key}`;
      const hasExtension = /\.[^/.]+$/.test(blob.key); // checks if blob.key has a file extension

      if (blob.file_type === 'video' && !hasExtension) {
        const ext = CommonUtilsService.getExtension(blob.filename);
        return `${url}.${ext}`;
      }
      return url;
    }
    const metadata = blob.metadata ? JSON.parse(blob.metadata) : {};

    if (metadata?.public) {
      return blob.key;
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: blob.key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: 3600 }); // URL valid for 1 hour
  }

  async getThumbnailUrl(
    fileType: string,
    blob: ActiveStorageBlob,
  ): Promise<string> {
    switch (fileType) {
      // case 'video':
      //   return `${this.frontendURL}/image-video.png`;

      case 'pdf':
        // const url = `${this.frontendURL}/uploads/${blob.key}`;
        // console.log('🚀 ~ MediaService ~ url:', url);
        // const baseName = path.basename(blob.key, path.extname(blob.key));
        // const url = path.join(this.publicFolder, blob.key);
        // if (fs.existsSync(url)) {
        //   return await this.getPdfThumbnail(url);
        // }
        // return `${this.frontendURL}/image-pdf.png`;
        // if (blob.file_type === 'pdf') {

        // }
        return `${this.frontendURL}/image-pdf.png`;

      case 'csv':
        return `${this.frontendURL}/image-csv.png`;

      case 'txt':
        return `${this.frontendURL}/image-txt.png`;

      case 'audio':
        return `${this.frontendURL}/image-audio.png`;

      case '3d-zip':
        return `${this.frontendURL}/image-zip.png`;

      case 'image':
        return this.getSignedUrl(blob);
      case 'video':
        // const videoUrl = path.join(this.publicFolder, blob.key);
        // if (fs.existsSync(videoUrl)) {
        //   return await this.getVideoThumbnail(videoUrl);
        // }
        return `${this.frontendURL}/image-video.png`;

      default:
        return `${this.frontendURL}/image-other.png`;
    }
  }

  getDefaultDeviceImage(): string {
    return `${this.frontendURL}/device-default.jpg`;
  }

  async convertAttachementDTO(
    attached_media: AttachedMedia,
  ): Promise<AttachedMediaDTO> {
    if (!attached_media.active_storage_attachment_id) {
      return null;
    }
    const tempData = await this.convertDTO(
      attached_media.active_storage_attachment_id,
    );

    return {
      active_storage_attachment_id:
        attached_media.active_storage_attachment_id.id,
      id: attached_media.id,
      blob: {
        content_type: tempData.content_type,
        file_name: tempData.title,
        thumb_url: tempData.thumb_url,
        title: tempData.title,
      },
      url: tempData.url,
    };
  }

  async getMediaByDeviceId(
    deviceId: string,
  ): Promise<ActiveStorageAttachment | null> {
    const media = await this.attachmentRepository.findOne({
      where: { record_id: deviceId },
      relations: ['blob'],
    });

    return media;
  }

  async update(id: string, updateData: UpdateMediaDTO): Promise<MediaDTO> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
      relations: ['blob'],
    });

    if (!attachment) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    const blob = await this.blobRepository.findOne({
      where: { id: attachment.blob_id },
    });

    if (updateData.title) {
      Object.assign(blob, {
        title: updateData.title,
      });
    }
    await this.blobRepository.save(blob);

    return this.convertDTO(attachment);
  }

  async updateByMedia(id: string, updateData: UpdateMediaDTO) {
    const media = await this.attachmentMediaRepository.findOne({
      where: { id },
    });

    const attachment = await this.attachmentRepository.findOne({
      where: { id: media.active_storage_attachment_id.id },
      relations: ['blob'],
    });

    if (!attachment) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    const blob = await this.blobRepository.findOne({
      where: { id: attachment.blob_id },
    });

    if (updateData.title) {
      Object.assign(blob, {
        title: updateData.title,
      });
    }
    await this.blobRepository.save(blob);
    return {
      message: `Successfully Updated`,
    };
  }

  async delete(id: string): Promise<{ message: string }> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const media = await this.attachmentRepository.findOne({
        where: { id },
      });

      if (!media) {
        throw new NotFoundException('Media not found');
      }

      if (media.blob.service_name === 'amazon') {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: media.blob.key,
        });
        await this.s3.send(deleteCommand);
      } else {
        const filePath = path.join(this.tmpDir, media.blob.key);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await queryRunner.manager.delete(ActiveStorageAttachment, {
        id,
      });
      await queryRunner.manager.delete(ActiveStorageBlob, {
        id: media.blob_id,
      });
      await queryRunner.manager.delete(AttachedMedia, {
        active_storage_attachment_id: id,
      });
      await queryRunner.commitTransaction();

      return { message: 'Media deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async uploadFile(file: Express.Multer.File) {
    try {
      const fileName = crypto.randomBytes(4).toString('hex').toUpperCase();

      const extname =
        path.extname(file.originalname) || path.extname(file.mimetype);
      const finalFileName = `${fileName}${extname}`;

      console.log(
        '🚀 ~ MediaService ~ uploadFile ~ finalFileName:',
        finalFileName,
      );
      // Ensure public uploads directory exists
      const finalFilePath = path.join(this.publicFolder, finalFileName);

      const destinationDir = path.dirname(finalFilePath);
      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
      }

      if (fs.existsSync(finalFilePath)) {
        throw new BadRequestException('File already exists');
      }

      fs.writeFileSync(finalFilePath, file.buffer, 'utf-8');

      return { file_name: finalFileName, is_sucess: true };
    } catch (error) {
      throw new BadRequestException({
        is_sucess: false,
        message: error.message,
      });
    }
  }

  async createMedia(
    file: Express.Multer.File,
    body: CreateMediaDTO,
    org_id: string,
    service_name?: 'local' | 'amazon',
  ) {
    try {
      const result = await this.saveMedia(
        file,
        {
          media_title: body.media_title,
          media_type: body.media_type,
          record_id: org_id,
          record_type: 'Organization',
          name: 'medias',
        },
        service_name,
      );

      const media = this.attachmentMediaRepository.create({
        active_storage_attachment_id: result.id as any,
        created_at: new Date(),
        mediable_type: body.mediable_type,
        mediable_id: body.mediable_id,
        file_type: null,
      });
      await this.attachmentMediaRepository.save(media);

      return {
        message: 'Successfully added to library and attached',
      };
    } catch (error) {
      console.log('🚀 ~ MediaService ~ createMedia ~ error:', error);
      throw new BadRequestException({
        is_sucess: false,
        message: 'Something went wrong, please try again later!',
      });
    }
  }

  async createAWSMedia(body: CreateAWSMediaDTO, org_id: string) {
    try {
      const blob = this.blobRepository.create({
        created_at: new Date(),
        key: body.key,
        filename: body.original_file_name,
        service_name: 'amazon',
        content_type: body.mime_type,
        byte_size: body.byte_size,
        checksum: uuidv4(),
        metadata: {
          public: true,
        },
        title: body.media_title,
        file_type: body.media_type || 'other',
      });
      await this.blobRepository.save(blob);

      const attachment = this.attachmentRepository.create({
        created_at: new Date(),
        blob_id: blob.id,
        record_id: org_id,
        record_type: 'Organization',
        name: 'medias',
      });
      await this.attachmentRepository.save(attachment);

      return {
        is_success: true,
        file_url: body.key,
      };
    } catch (error) {
      console.log('🚀 ~ MediaService ~ createMedia ~ error:', error);
      throw new BadRequestException({
        is_sucess: false,
        message: 'Something went wrong, please try again later!',
      });
    }
  }

  async createAWSMediaUnity(body: CreateUnityAWSMediaDTO, org_id: string) {
    try {
      const blob = this.blobRepository.create({
        created_at: new Date(),
        key: body.key,
        filename: body.original_file_name,
        service_name: 'amazon',
        content_type: body.mime_type,
        byte_size: body.byte_size,
        checksum: uuidv4(),
        metadata: {
          public: true,
        },
        title: body.media_title,
        file_type: body.media_type || 'other',
      });
      await this.blobRepository.save(blob);

      const attachment = this.attachmentRepository.create({
        created_at: new Date(),
        blob_id: blob.id,
        record_id: org_id,
        record_type: 'Organization',
        name: 'medias',
      });
      const result = await this.attachmentRepository.save(attachment);

      const media = this.attachmentMediaRepository.create({
        active_storage_attachment_id: result.id as any,
        created_at: new Date(),
        mediable_type: body.mediable_type,
        mediable_id: body.mediable_id,
        file_type: null,
      });
      await this.attachmentMediaRepository.save(media);

      return {
        message: 'Successfully added to library and attached',
      };
    } catch (error) {
      console.log('🚀 ~ MediaService ~ createMedia ~ error:', error);
      throw new BadRequestException({
        is_sucess: false,
        message: 'Something went wrong, please try again later!',
      });
    }
  }

  async receiveInChunk(file: Express.Multer.File) {
    try {
      const fileName = crypto.randomBytes(4).toString('hex').toUpperCase();

      if (!fs.existsSync(this.tmpDir)) {
        fs.mkdirSync(this.tmpDir, { recursive: true });
      }
      const tmpFilePath = path.join(this.tmpDir, fileName);

      if (fs.existsSync(tmpFilePath)) {
        throw new BadRequestException('File already exists');
      }

      fs.writeFileSync(tmpFilePath, file.buffer, 'utf-8');

      return { file_name: fileName, is_sucess: true };
    } catch (error) {
      throw new BadRequestException({
        is_sucess: false,
        message: error.message,
      });
    }
  }

  private removeTempFile(json: string[]) {
    for (const fileName of json) {
      const filePath = path.join(this.tmpDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  async complete(body: string[], query: UploadFileParams) {
    try {
      const { original_file_name, media_title, media_type } = query;
      const tmpFilePath = path.join(this.tmpDir, original_file_name);

      // Ensure public uploads directory exists
      const finalFilePath = path.join(this.publicFolder, original_file_name);

      const destinationDir = path.dirname(finalFilePath);
      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
      }

      // Merge chunks into the final file
      const finalFile = fs.createWriteStream(tmpFilePath, { flags: 'a' });
      for (const chunk of body) {
        const chunkPath = path.join(this.tmpDir, chunk);
        if (fs.existsSync(chunkPath)) {
          const chunkData = fs.readFileSync(chunkPath);
          finalFile.write(chunkData);
          // fs.unlinkSync(chunkPath); // Delete the chunk after writing
        } else {
          throw new BadRequestException(`Chunk file ${chunk} not found`);
        }
      }

      await new Promise((resolve, reject) => {
        finalFile.on('finish', resolve);
        finalFile.on('error', reject);
        finalFile.end();
      });

      if (!fs.existsSync(tmpFilePath)) {
        throw new Error(
          `Temporary file not found after merging: ${tmpFilePath}`,
        );
      }
      // Move the file to the public folder
      fs.renameSync(tmpFilePath, finalFilePath);

      const fileBuffer = fs.readFileSync(finalFilePath);
      const checksum = crypto
        .createHash('md5')
        .update(fileBuffer)
        .digest('hex');

      const mime_type =
        mime.lookup(finalFilePath) || 'application/octet-stream';

      const config = this.configService.getMachineInfo();

      const blob = this.blobRepository.create({
        created_at: new Date(),
        key: original_file_name,
        filename: original_file_name,
        service_name: config.mode === 'OFFLINE' ? 'local' : 'amazon',
        content_type: mime_type,
        byte_size: fileBuffer.length,
        checksum,
        metadata: {},
        title: media_title,
        file_type: media_type || 'other',
      });
      await this.blobRepository.save(blob);

      const attachment = this.attachmentRepository.create({
        created_at: new Date(),
        blob_id: blob.id,
        record_id: query.organization_id,
        record_type: 'Organization',
        name: 'medias',
      });
      await this.attachmentRepository.save(attachment);

      this.removeTempFile([...body, original_file_name]);

      // Return success response with public file URL
      const fileUrl = `/uploads/${original_file_name}`;
      return { is_success: true, file_url: fileUrl };
    } catch (error) {
      console.log('🚀 ~ MediaController ~ complete ~ error:', error);
      throw new BadRequestException({
        is_sucess: false,
        message: error.message,
      });
    }
  }

  async clearTmpFiles(json: string[]) {
    try {
      this.removeTempFile(json);
      return { message: 'Successfully cleared the files' };
    } catch (error) {
      throw new BadRequestException({
        message: error.message,
      });
    }
  }

  async moveAllFilesToOneFolder(): Promise<void> {
    const sourceDir = path.join(__dirname, '..', 'public', 'attachments'); // Replace with your source directory path
    const destDir = path.join(__dirname, '..', 'public', 'uploads'); // Replace with your destination directory path

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true }); // Ensure destination folder exists
    }

    const moveFiles = async (dir: string): Promise<void> => {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        console.log('🚀 ~ MediaService ~ moveFiles ~ item:', item);
        if (item.includes('.DS_Store')) {
          // Skip .DS_Store files
          continue;
        }

        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // If the item is a folder, recursively traverse
          await moveFiles(fullPath);
        } else {
          // If the item is a file, move it to the destination folder
          const destFilePath = path.join(destDir, item);

          // Ensure no filename conflict in destination folder
          let uniqueDestFilePath = destFilePath;
          let counter = 1;

          while (fs.existsSync(uniqueDestFilePath)) {
            const ext = path.extname(item);
            const baseName = path.basename(item, ext);
            uniqueDestFilePath = path.join(
              destDir,
              `${baseName}(${counter})${ext}`,
            );
            counter++;
          }

          fs.renameSync(fullPath, uniqueDestFilePath); // Move file
          console.log(`Moved: ${fullPath} -> ${uniqueDestFilePath}`);
        }
      }
    };

    await moveFiles(sourceDir);
    console.log('All files have been moved to the destination folder.');
  }

  async getRecordById(id: string): Promise<MediaDTO | null> {
    const queryBuilder = this.attachmentRepository
      .createQueryBuilder('attachment')
      .leftJoinAndSelect('attachment.blob', 'blob')
      .where('attachment.id = :id', { id });

    const attachment = await queryBuilder.getOne();

    if (!attachment) {
      return null;
    }

    const { blob } = attachment;

    return {
      id: attachment.id,
      title: blob.title,
      content_type: blob.content_type,
      file_name: blob.filename,
      file_type: blob.file_type,
      url:
        blob.service_name === 'local'
          ? `${this.publicFolder}/${blob.key}`
          : blob.key,
      thumb_url: await this.getThumbnailUrl(blob.file_type, blob),
    };
  }

  async downloadCSVFromURL(csv_link: string): Promise<string> {
    try {
      const responseData = await axios.get(csv_link, {
        responseType: 'stream',
      });
      if (!responseData.headers['content-type'].startsWith('text/csv')) {
        throw new BadRequestException(
          responseData.headers['content-type'] + 'File is not csv format',
        );
      }

      const tmpFilePath = this.tmpDir + '/tempfile.csv'; // Temporary path for the file
      responseData.data.pipe(fs.createWriteStream(tmpFilePath));
      return tmpFilePath;
    } catch (error) {
      throw new BadRequestException(
        error + 'Unable to download file or file is not CSV format',
      );
    }
  }

  async saveMedia(
    file: Express.Multer.File,
    data: SaveMediaDTO,
    service_name?: 'local' | 'amazon',
  ) {
    const fileData = await this.uploadFile(file);
    const config = this.configService.getMachineInfo();

    const mime_type =
      mime.lookup(file.originalname) || 'application/octet-stream';
    const checksum = crypto.createHash('md5').update(file.buffer).digest('hex');
    const blob = this.blobRepository.create({
      created_at: new Date(),
      key: fileData.file_name,
      filename: fileData.file_name,
      service_name:
        service_name || config.mode === 'OFFLINE' ? 'local' : 'amazon',
      content_type: mime_type,
      byte_size: file.buffer.length,
      checksum,
      metadata: {},
      title: data.media_title,
      file_type: data.media_type || 'other',
    });
    await this.blobRepository.save(blob);

    const attachment = this.attachmentRepository.create({
      created_at: new Date(),
      blob_id: blob.id,
      record_id: data.record_id,
      record_type: data.record_type,
      name: data.name,
    });
    return await this.attachmentRepository.save(attachment);
  }

  async deleteRecordMedia(recordId: string, recordType: string) {
    const attachment = await this.attachmentRepository.find({
      where: {
        record_id: recordId,
        record_type: recordType,
      },
    });

    for (let index = 0; index < attachment.length; index++) {
      const element = attachment[index];
      await this.attachmentRepository.delete({ id: element.id });
      await this.blobRepository.delete({ id: element.blob_id });
    }
  }
}
