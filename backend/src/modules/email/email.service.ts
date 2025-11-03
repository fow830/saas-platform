import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<number>('SMTP_PORT') === 465,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    try {
      const from = this.configService.get<string>('EMAIL_FROM') || 'noreply@saas-platform.com';

      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, firstName?: string) {
    const subject = 'Добро пожаловать в SaaS Platform!';
    const html = `
      <h1>Добро пожаловать${firstName ? `, ${firstName}` : ''}!</h1>
      <p>Спасибо за регистрацию в нашей платформе.</p>
      <p>Мы рады приветствовать вас!</p>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendSubscriptionCreatedEmail(email: string, planName: string) {
    const subject = 'Подписка успешно оформлена';
    const html = `
      <h1>Подписка активирована</h1>
      <p>Ваша подписка на план "${planName}" успешно активирована.</p>
      <p>Теперь у вас есть доступ ко всем функциям выбранного плана.</p>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendPaymentSuccessEmail(email: string, amount: number, invoiceId: string) {
    const subject = 'Платеж успешно выполнен';
    const html = `
      <h1>Платеж выполнен</h1>
      <p>Ваш платеж на сумму ${amount} RUB успешно обработан.</p>
      <p>Номер счета: ${invoiceId}</p>
      <p>Спасибо за использование нашего сервиса!</p>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendSubscriptionExpiringEmail(email: string, daysLeft: number) {
    const subject = 'Подписка скоро истечет';
    const html = `
      <h1>Внимание!</h1>
      <p>Ваша подписка истечет через ${daysLeft} ${daysLeft === 1 ? 'день' : 'дней'}.</p>
      <p>Пожалуйста, продлите подписку, чтобы продолжить использование сервиса.</p>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${this.configService.get<string>('APP_URL')}/reset-password?token=${resetToken}`;
    const subject = 'Восстановление пароля';
    const html = `
      <h1>Восстановление пароля</h1>
      <p>Вы запросили восстановление пароля.</p>
      <p>Перейдите по ссылке для сброса пароля:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Ссылка действительна в течение 1 часа.</p>
    `;

    return this.sendEmail(email, subject, html);
  }
}

