import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import mjml2html from 'mjml';
import * as fs from 'fs';
import * as path from 'path';

export enum EmailTemplate {
  WELCOME = 'welcome',
  VERIFY_EMAIL = 'verify-email',
  RESET_PASSWORD = 'reset-password',
  INVITATION = 'invitation',
  NOTIFICATION_DIGEST = 'notification-digest',
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;
  private readonly templateCache = new Map<string, string>();
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.from = this.configService.get<string>('email.from', 'noreply@qubilt.com');
  }

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.pass'),
      },
    });
  }

  async sendRaw(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err}`);
      throw err;
    }
  }

  async sendTemplate(
    to: string,
    template: EmailTemplate,
    context: Record<string, any>,
  ): Promise<void> {
    const html = this.compileTemplate(template, context);
    const subjectMap: Record<EmailTemplate, string> = {
      [EmailTemplate.WELCOME]: `Welcome to ${context.appName || 'Qubilt'}!`,
      [EmailTemplate.VERIFY_EMAIL]: 'Verify your email address',
      [EmailTemplate.RESET_PASSWORD]: 'Reset your password',
      [EmailTemplate.INVITATION]: `You've been invited to ${context.workspaceName || 'a workspace'}`,
      [EmailTemplate.NOTIFICATION_DIGEST]: 'Your notification digest',
    };

    await this.sendRaw(to, subjectMap[template], html);
  }

  private compileTemplate(
    template: EmailTemplate,
    context: Record<string, any>,
  ): string {
    const defaults = {
      appName: 'Qubilt',
      appUrl: this.configService.get<string>('app.url', 'http://localhost:3000'),
      logoUrl: '',
    };
    const merged = { ...defaults, ...context };

    let mjmlSource = this.loadTemplate(template);

    // Simple variable interpolation: {{ variableName }}
    for (const [key, value] of Object.entries(merged)) {
      mjmlSource = mjmlSource.replace(
        new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'),
        String(value ?? ''),
      );
    }

    const { html, errors } = mjml2html(mjmlSource);
    if (errors.length > 0) {
      this.logger.warn(`MJML errors in template ${template}: ${JSON.stringify(errors)}`);
    }
    return html;
  }

  private loadTemplate(template: EmailTemplate): string {
    if (this.templateCache.has(template)) {
      return this.templateCache.get(template)!;
    }

    const templatePath = path.join(__dirname, 'templates', `${template}.mjml`);
    const source = fs.readFileSync(templatePath, 'utf-8');
    this.templateCache.set(template, source);
    return source;
  }
}
