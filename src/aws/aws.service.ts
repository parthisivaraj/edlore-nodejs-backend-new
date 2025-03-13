import { AppConfigService } from '@app/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UploadDTO } from './dto/upload';

@Injectable()
export class AwsService {
  s3Client: S3Client;
  bucket: string;

  constructor(private configService: AppConfigService) {
    const config = this.configService.getAWSConfig();
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      region: config.region,
    });
    this.bucket = config.bucket;
  }

  async requestUploadUrl(uploadProps: UploadDTO): Promise<UploadUrl> {
    const Key = uuidv4() + uploadProps.ext;
    const input: any = {
      ...(uploadProps.extras || {}),
      Key,
      ContentType: uploadProps.contentType,
    };
    if (uploadProps.isPublic) input.ACL = 'public-read';
    input.Bucket = this.bucket;
    const putFile = new PutObjectCommand(input);
    const signedUrl = await getSignedUrl(this.s3Client, putFile, {
      expiresIn: 3600,
    });
    return {
      signedUrl: signedUrl,
      keyOrUrl: uploadProps.isPublic
        ? (signedUrl.split('?').shift() as string)
        : Key,
    };
  }

  async getSignedUrl(Key: string, expiresIn = 3600): Promise<string> {
    const temp = new GetObjectCommand({ Key, Bucket: this.bucket });
    return await getSignedUrl(this.s3Client, temp, { expiresIn });
  }

  async generateSignedUrlFromKey(key: string) {
    if (key && !key.startsWith('https')) {
      return this.getSignedUrl(key);
    }
    return key;
  }
}

export interface UploadUrl {
  signedUrl: string;
  keyOrUrl: string;
}
