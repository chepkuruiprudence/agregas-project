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

// backend/src/services/email.service.ts

import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.EMAIL_FROM || 'AGREGAS <agregaske@gmail.com>';

    // Configure Nodemailer with Google OAuth2
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER || 'agregaske@gmail.com',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });

    console.log('📧 Google OAuth2 Email Service initialized');
  }

  /**
   * Send OTP Verification Email
   */
  async sendOTPEmail(email: string, otpCode: string): Promise<void> {
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

      await this.transporter.sendMail({
        from: this.defaultFrom,
        to: email,
        subject: `Your AGREGAS verification code: ${otpCode}`,
        html: htmlContent,
      });

      console.log(`✓ OTP email sent via Google OAuth2 to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send OTP email via Google OAuth2:', error);
      throw error;
    }
  }

  /**
   * Send Password Reset Link
   */
  async sendPasswordResetEmail(
    email: string,
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

      await this.transporter.sendMail({
        from: this.defaultFrom,
        to: email,
        subject: 'Reset your AGREGAS password',
        html: htmlContent,
      });

      console.log(`✓ Password reset email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Send Welcome Email
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
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

      await this.transporter.sendMail({
        from: this.defaultFrom,
        to: email,
        subject: 'Welcome to AGREGAS',
        html: htmlContent,
      });

      console.log(`✓ Welcome email sent to ${email}`);
    } catch (error) {
      console.error('⚠️ Failed to send welcome email:', error);
    }
  }

  /**
   * Send Security Alert (new device login)
   */
  async sendSecurityAlertEmail(
    email: string,
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

      await this.transporter.sendMail({
        from: this.defaultFrom,
        to: email,
        subject: 'AGREGAS security alert: New login',
        html: htmlContent,
      });

      console.log(`✓ Security alert sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send security alert:', error);
    }
  }
}

export const emailService = new EmailService();