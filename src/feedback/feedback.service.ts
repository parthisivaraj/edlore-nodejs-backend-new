import { Injectable } from '@nestjs/common';
import { FeedbackDTO } from './dto/feedback';
import { JwtUserPayload } from '@app/schema/dto';
import { MailerService } from '@nestjs-modules/mailer';
import { AppConfigService } from '@app/config';
import { User } from '@app/schema';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private mailerService: MailerService,
    private configService: AppConfigService,
  ) {}

  async sendMail(body: FeedbackDTO, user: JwtUserPayload): Promise<any> {
    const userResult = await this.userRepository.findOne({
      where: { id: user.id },
    });

    await this.mailerService.sendMail({
      to: 'javid@edlore.com',
      subject: 'Edlore Feedback',
      template: './feedback.mailer.hbs',
      context: {
        name: userResult.name,
        type: body.type,
        experience: body.experience,
        comment: body.comment,
        media_domain: this.configService.getMailerConfig().media_domain,
        frontEndDomain: this.configService.getMailerConfig().login_domain,
      },
    });
  }
}
