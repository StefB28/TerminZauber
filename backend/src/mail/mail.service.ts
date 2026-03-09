import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') || 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('SMTP Mail transporter initialized');
    } else {
      this.logger.warn('SMTP not configured. Emails will be logged only.');
    }
  }

  async sendWaitlistNotification(params: {
    to: string;
    practiceName: string;
    practiceId: string;
    slotDate: string;
    slotTime: string;
  }) {
    const subject = `Freier Termin bei ${params.practiceName}`;
    const bookingUrl = `${this.configService.get<string>('FRONTEND_URL') || 'https://localhost'}/practices/${params.practiceId}`;

    const text = `Gute Nachrichten!\n\nBei ${params.practiceName} ist ein freier Termin verfügbar:\nDatum: ${params.slotDate}\nUhrzeit: ${params.slotTime}\n\nJetzt buchen: ${bookingUrl}\n\nIhr PhysioMatch Team`;

    if (!this.transporter) {
      this.logger.log(`EMAIL_SIMULATION to=${params.to} subject="${subject}" body="${text}"`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@physiomatch.de',
      to: params.to,
      subject,
      text,
    });
  }
}
