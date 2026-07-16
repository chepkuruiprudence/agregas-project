// // backend/src/services/email.service.ts

// import nodemailer from 'nodemailer';

// /**
//  * Email service for sending OTPs, password resets, and notifications
//  */

// export interface EmailConfig {
//   host: string;
//   port: number;
//   user: string;
//   password: string;
//   from: string;
// }

// export class EmailService {
//   private transporter: any;

//   constructor() {
//     // Configuration from .env
//     const emailConfig: EmailConfig = {
//       host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//       port: parseInt(process.env.EMAIL_PORT || '587'),
//       user: process.env.EMAIL_USER || '',
//       password: process.env.EMAIL_PASSWORD || '',
//       from: process.env.EMAIL_FROM || 'noreply@agregas.com',
//     };

//     // Create transporter
//     this.transporter = nodemailer.createTransport({
//       host: emailConfig.host,
//       port: emailConfig.port,
//       secure: emailConfig.port === 465,
//       auth: {
//         user: emailConfig.user,
//         pass: emailConfig.password,
//       },
//     });

//     console.log('📧 Email service initialized');
//   }

//   /**
//    * Send OTP verification code
//    */
//   async sendOTPEmail(email: string, otpCode: string): Promise<void> {
//     try {
//       const htmlContent = `
//         <!DOCTYPE html>
//         <html>
//           <body style="font-family: Arial, sans-serif;">
//             <h2>Verify your AGREGAS account</h2>
//             <p>Your one-time verification code is:</p>
//             <h1 style="color: #185FA5; font-size: 32px; letter-spacing: 8px;">
//               ${otpCode}
//             </h1>
//             <p style="color: #888;">
//               This code expires in 10 minutes.
//             </p>
//             <p style="color: #888; font-size: 12px;">
//               If you didn't request this code, please ignore this email.
//             </p>
//           </body>
//         </html>
//       `;

//       await this.transporter.sendMail({
//         to: email,
//         subject: 'Your AGREGAS verification code: ' + otpCode,
//         html: htmlContent,
//       });

//       console.log(`✓ OTP email sent to ${email}`);
//     } catch (error) {
//       console.error('❌ Failed to send OTP email:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send password reset link
//    */
//   async sendPasswordResetEmail(
//     email: string,
//     resetToken: string,
//     userName: string
//   ): Promise<void> {
//     try {
//       const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

//       const htmlContent = `
//         <!DOCTYPE html>
//         <html>
//           <body style="font-family: Arial, sans-serif;">
//             <h2>Password Reset Request</h2>
//             <p>Hi ${userName},</p>
//             <p>We received a request to reset your AGREGAS password.</p>
//             <p>
//               <a href="${resetLink}" style="
//                 background-color: #185FA5;
//                 color: white;
//                 padding: 12px 24px;
//                 text-decoration: none;
//                 border-radius: 6px;
//                 display: inline-block;
//               ">
//                 Reset Password
//               </a>
//             </p>
//             <p style="color: #888; font-size: 12px;">
//               Or copy this link: ${resetLink}
//             </p>
//             <p style="color: #888; font-size: 12px;">
//               This link expires in 1 hour.
//             </p>
//             <p style="color: #888; font-size: 12px;">
//               If you didn't request this, please ignore this email.
//             </p>
//           </body>
//         </html>
//       `;

//       await this.transporter.sendMail({
//         to: email,
//         subject: 'Reset your AGREGAS password',
//         html: htmlContent,
//       });

//       console.log(`✓ Password reset email sent to ${email}`);
//     } catch (error) {
//       console.error('❌ Failed to send password reset email:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send welcome email after signup
//    */
//   async sendWelcomeEmail(email: string, userName: string): Promise<void> {
//     try {
//       const htmlContent = `
//         <!DOCTYPE html>
//         <html>
//           <body style="font-family: Arial, sans-serif;">
//             <h2>Welcome to AGREGAS, ${userName}!</h2>
//             <p>Your account has been created successfully.</p>
//             <p>
//               <a href="${process.env.FRONTEND_URL}" style="
//                 background-color: #185FA5;
//                 color: white;
//                 padding: 12px 24px;
//                 text-decoration: none;
//                 border-radius: 6px;
//                 display: inline-block;
//               ">
//                 Go to AGREGAS
//               </a>
//             </p>
//             <p style="color: #888; font-size: 12px;">
//               Questions? Contact us at noreply@agregas.ke
//             </p>
//           </body>
//         </html>
//       `;

//       await this.transporter.sendMail({
//         to: email,
//         subject: 'Welcome to AGREGAS',
//         html: htmlContent,
//       });

//       console.log(`✓ Welcome email sent to ${email}`);
//     } catch (error) {
//       console.error('❌ Failed to send welcome email:', error);
//       throw error;
//     }
//   }

//   /**
//    * Send security alert (new device login)
//    */
//   async sendSecurityAlertEmail(
//     email: string,
//     userName: string,
//     ip: string,
//     device: string
//   ): Promise<void> {
//     try {
//       const htmlContent = `
//         <!DOCTYPE html>
//         <html>
//           <body style="font-family: Arial, sans-serif;">
//             <h2>⚠️ New login detected</h2>
//             <p>Hi ${userName},</p>
//             <p>Your account was accessed from a new device:</p>
//             <p>
//               <strong>Device:</strong> ${device}<br>
//               <strong>IP Address:</strong> ${ip}
//             </p>
//             <p style="color: #D4533E; font-size: 12px;">
//               If this wasn't you, <a href="${process.env.FRONTEND_URL}/security">secure your account</a> immediately.
//             </p>
//           </body>
//         </html>
//       `;

//       await this.transporter.sendMail({
//         to: email,
//         subject: 'AGREGAS security alert: New login',
//         html: htmlContent,
//       });

//       console.log(`✓ Security alert sent to ${email}`);
//     } catch (error) {
//       console.error('❌ Failed to send security alert:', error);
//       // Don't throw - this is optional
//     }
//   }
// }

// export const emailService = new EmailService();


// backend/src/services/email.service.ts

import { Resend } from 'resend';

/**
 * Email service powered by Resend (HTTP API)
 * Avoids SMTP port blocks and IPv6 ENETUNREACH issues on Render.
 */
export class EmailService {
  private resend: Resend;
  private defaultFrom: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY environment variable is not set!');
    }

    this.resend = new Resend(apiKey);
    // Note: onboarding@resend.dev can only send emails to the email associated with your Resend account.
    // Once you verify your custom domain in Resend, update process.env.EMAIL_FROM to something like 'AGREGAS <noreply@yourdomain.com>'
    this.defaultFrom = process.env.EMAIL_FROM || 'AGREGAS <onboarding@resend.dev>';

    console.log('📧 Resend Email service initialized');
  }

  /**
   * Send OTP verification code
   */
  async sendOTPEmail(to: string, otpCode: string): Promise<void> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Verify your AGREGAS account</h2>
            <p>Your one-time verification code is:</p>
            <h1 style="color: #185FA5; font-size: 32px; letter-spacing: 8px;">
              ${otpCode}
            </h1>
            <p style="color: #888;">
              This code expires in 10 minutes.
            </p>
            <p style="color: #888; font-size: 12px;">
              If you didn't request this code, please ignore this email.
            </p>
          </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: this.defaultFrom,
        to: [to],
        subject: `Your AGREGAS verification code: ${otpCode}`,
        text: `Your OTP code is ${otpCode}`,
        html: htmlContent,
      });

      if (error) {
        console.error('❌ Resend delivery error:', error);
        throw new Error(error.message);
      }

      console.log(`✓ OTP email sent via Resend to ${to} (ID: ${data?.id})`);
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      throw error;
    }
  }

  /**
   * Send password reset link
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName: string
  ): Promise<void> {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>Hi ${userName},</p>
            <p>We received a request to reset your AGREGAS password.</p>
            <p>
              <a href="${resetLink}" style="
                background-color: #185FA5;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
              ">
                Reset Password
              </a>
            </p>
            <p style="color: #888; font-size: 12px;">
              Or copy this link: ${resetLink}
            </p>
            <p style="color: #888; font-size: 12px;">
              This link expires in 1 hour.
            </p>
            <p style="color: #888; font-size: 12px;">
              If you didn't request this, please ignore this email.
            </p>
          </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: this.defaultFrom,
        to: [to],
        subject: 'Reset your AGREGAS password',
        html: htmlContent,
      });

      if (error) {
        console.error('❌ Resend password reset error:', error);
        throw new Error(error.message);
      }

      console.log(`✓ Password reset email sent via Resend to ${to} (ID: ${data?.id})`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email after signup
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to AGREGAS, ${userName}!</h2>
            <p>Your account has been created successfully.</p>
            <p>
              <a href="${process.env.FRONTEND_URL}" style="
                background-color: #185FA5;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
              ">
                Go to AGREGAS
              </a>
            </p>
          </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: this.defaultFrom,
        to: [to],
        subject: 'Welcome to AGREGAS',
        html: htmlContent,
      });

      if (error) {
        console.error('⚠️ Resend welcome email error:', error);
        return;
      }

      console.log(`✓ Welcome email sent via Resend to ${to} (ID: ${data?.id})`);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      // Silent catch so welcome email failure doesn't crash signup flow
    }
  }

  /**
   * Send security alert (new device login)
   */
  async sendSecurityAlertEmail(
    to: string,
    userName: string,
    ip: string,
    device: string
  ): Promise<void> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>⚠️ New login detected</h2>
            <p>Hi ${userName},</p>
            <p>Your account was accessed from a new device:</p>
            <p>
              <strong>Device:</strong> ${device}<br>
              <strong>IP Address:</strong> ${ip}
            </p>
            <p style="color: #D4533E; font-size: 12px;">
              If this wasn't you, <a href="${process.env.FRONTEND_URL}/security">secure your account</a> immediately.
            </p>
          </body>
        </html>
      `;

      await this.resend.emails.send({
        from: this.defaultFrom,
        to: [to],
        subject: 'AGREGAS security alert: New login',
        html: htmlContent,
      });

      console.log(`✓ Security alert sent to ${to}`);
    } catch (error) {
      console.error('❌ Failed to send security alert:', error);
    }
  }
}

export const emailService = new EmailService();