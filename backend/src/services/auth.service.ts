// backend/src/services/auth.service.ts

import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema.js";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AppError } from "../middleware/errorHandler.js";
import { db } from "../db/index.js";
import { emailService } from "./email.service.js";

export class AuthService {
  /**
   * STEP 1: USER SIGNUP with email verification
   */
  async registerWithEmailVerification(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: "customer" | "retailer" | "brand" | "admin",
    extraFields?: Record<string, any>
  ) {
    try {
      console.log('🔐 [SIGNUP] Starting registration for:', email);

      // Check if user already exists in users table
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (existingUser.length > 0) {
        throw new AppError(400, "Email already registered");
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save/Update OTP record (using onConflictDoUpdate to prevent duplicate key error 23505)
      const emailVerification = await db
        .insert(schema.emailVerifications)
        .values({
          email,
          otp_code: otpCode,
          otp_attempts: 0,
          otp_expires_at: otpExpires,
          is_verified: false,
        })
        .onConflictDoUpdate({
          target: schema.emailVerifications.email,
          set: {
            otp_code: otpCode,
            otp_attempts: 0,
            otp_expires_at: otpExpires,
            is_verified: false,
          },
        })
        .returning();

      console.log(`✓ Email verification record created`);

      // Wrap email sending safely so network/SMTP errors on Render don't crash the signup flow (HTTP 500)
      try {
        await emailService.sendOTPEmail(email, otpCode);
        console.log(`✓ OTP sent to ${email}`);
      } catch (emailErr) {
        console.error('❌ Failed to send OTP email on cloud server:', emailErr);
        // Do NOT rethrow; allow signup initiation response to finish cleanly
      }

      await this.logAuthEvent(email, null, 'signup_initiated', 'success');

      return {
        message: 'OTP sent to your email. Please verify to complete signup.',
        verificationId: emailVerification[0].id,
        email,
      };
    } catch (error) {
      console.error('❌ Signup error:', error);
      throw error;
    }
  }

  /**
   * STEP 2: VERIFY OTP and complete signup
   */
  async verifyOTPAndCompleteSignup(
    email: string,
    otpCode: string,
    password: string,
    fullName: string,
    phone: string,
    role: "customer" | "retailer" | "brand" | "admin",
    extraFields?: Record<string, any>
  ) {
    try {
      console.log(`🔐 [OTP VERIFY] Verifying OTP for ${email}`);

      const verification = await db
        .select()
        .from(schema.emailVerifications)
        .where(eq(schema.emailVerifications.email, email));

      if (verification.length === 0) {
        throw new AppError(404, "Verification record not found");
      }

      const verif = verification[0];

      if (new Date() > new Date(verif.otp_expires_at!)) {
        throw new AppError(400, "OTP has expired. Please request a new one.");
      }

      if ((verif.otp_attempts ?? 0) >= 5) {
        throw new AppError(429, "Too many OTP attempts. Request a new OTP.");
      }

      if (verif.otp_code !== otpCode) {
        await db
          .update(schema.emailVerifications)
          .set({ otp_attempts: (verif.otp_attempts ?? 0) + 1 })
          .where(eq(schema.emailVerifications.email, email));

        throw new AppError(400, "Invalid OTP code");
      }

      console.log(`✓ OTP verified`);

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await db
        .insert(schema.users)
        .values({
          email,
          password_hash: hashedPassword,
          full_name: fullName,
          phone,
          role,
          is_active: true,
          email_verified: true,
        })
        .returning();

      console.log(`✓ User created with ID: ${newUser[0].id}`);

      await db
        .update(schema.emailVerifications)
        .set({ is_verified: true, user_id: newUser[0].id })
        .where(eq(schema.emailVerifications.email, email));

      if (role === 'retailer' && extraFields) {
        await db
          .insert(schema.retailers)
          .values({
            user_id: newUser[0].id,
            business_name: extraFields.businessName || '',
            business_license: extraFields.businessLicense || '',
            latitude: extraFields.latitude?.toString() || '0',
            longitude: extraFields.longitude?.toString() || '0',
            address: extraFields.address || '',
            phone,
            brand: '',
            stock_quantity: 0,
            cylinder_size: '13kg',
            tier: 'retail',
            rating: '0',
            total_reviews: 0,
            is_verified: false,
            is_active: true,
          });

        console.log(`✓ Retailer profile created`);
      }

      // Safely send welcome email
      try {
        await emailService.sendWelcomeEmail(email, fullName);
      } catch (welcomeErr) {
        console.error('⚠️ Failed to send welcome email:', welcomeErr);
      }

      await this.logAuthEvent(email, newUser[0].id, 'signup_completed', 'success');

      const accessToken = this.generateJWT(newUser[0].id, email, role, '15m');
      const refreshToken = await this.createRefreshToken(newUser[0].id, {}, false);

      return {
        token: accessToken,
        refreshToken,
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          fullName: newUser[0].full_name,
          phone: newUser[0].phone,
          role: newUser[0].role,
          emailVerified: true,
        },
      };
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      await this.logAuthEvent(email, null, 'otp_verify', 'failed');
      throw error;
    }
  }

  /**
   * STEP 3: GOOGLE OAUTH LOGIN
   */
  async googleOAuthLogin(googleProfile: {
    id: string;
    email: string;
    displayName: string;
    picture?: string;
  }) {
    try {
      console.log(`🔐 [GOOGLE OAUTH] Processing OAuth for ${googleProfile.email}`);

      const oauthAccount = await db
        .select()
        .from(schema.oauthAccounts)
        .where(
          and(
            eq(schema.oauthAccounts.provider, 'google'),
            eq(schema.oauthAccounts.provider_user_id, googleProfile.id)
          )
        );

      if (oauthAccount.length > 0) {
        console.log(`✓ OAuth account exists`);
        const userId = oauthAccount[0].user_id;

        const user = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, userId));

        if (user.length === 0) throw new AppError(404, "User not found");

        const accessToken = this.generateJWT(user[0].id, user[0].email, user[0].role, '15m');
        const refreshToken = await this.createRefreshToken(user[0].id, {}, false);

        await this.logAuthEvent(user[0].email, user[0].id, 'oauth_login', 'success');

        return {
          isNewUser: false,
          token: accessToken,
          refreshToken,
          user: {
            id: user[0].id,
            email: user[0].email,
            fullName: user[0].full_name,
            phone: user[0].phone,
            role: user[0].role,
          },
        };
      }

      console.log(`✓ Creating new user from Google OAuth`);

      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, googleProfile.email));

      let userId: number;

      if (existingUser.length > 0) {
        userId = existingUser[0].id;
        console.log(`✓ Linking OAuth to existing user`);
      } else {
        const newUser = await db
          .insert(schema.users)
          .values({
            email: googleProfile.email,
            password_hash: '',
            full_name: googleProfile.displayName || '',
            phone: '',
            role: 'customer',
            is_active: true,
            email_verified: true,
          })
          .returning();

        userId = newUser[0].id;
        console.log(`✓ New user created from Google OAuth`);
      }

      await db
        .insert(schema.oauthAccounts)
        .values({
          user_id: userId,
          provider: 'google',
          provider_user_id: googleProfile.id,
          email: googleProfile.email,
          display_name: googleProfile.displayName,
        });

      console.log(`✓ OAuth account linked`);

      const user = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      const accessToken = this.generateJWT(user[0].id, user[0].email, user[0].role, '15m');
      const refreshToken = await this.createRefreshToken(user[0].id, {}, false);

      await this.logAuthEvent(user[0].email, user[0].id, 'oauth_signup', 'success');

      return {
        isNewUser: existingUser.length === 0,
        token: accessToken,
        refreshToken,
        user: {
          id: user[0].id,
          email: user[0].email,
          fullName: user[0].full_name,
          phone: user[0].phone,
          role: user[0].role,
        },
      };
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      throw error;
    }
  }

  /**
   * STEP 4: TRADITIONAL LOGIN (email + password)
   */
  async login(
    email: string,
    password: string,
    rememberMe: boolean = false,
    ipAddress: string = '',
    userAgent: string = ''
  ) {
    try {
      console.log(`🔐 [LOGIN] Attempting login for ${email}`);

      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      const user = users[0];

      if (!user) {
        await this.logAuthEvent(email, null, 'login', 'failed');
        throw new AppError(401, "Invalid email or password");
      }

      if (!user.password_hash) {
        throw new AppError(401, "Please use Google Sign-in for this account");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        await this.logAuthEvent(email, user.id, 'login', 'failed');
        throw new AppError(401, "Invalid email or password");
      }

      if (!user.is_active) {
        throw new AppError(403, "Account is deactivated");
      }

      console.log(`✓ Password verified`);

      const accessToken = this.generateJWT(user.id, user.email, user.role, '15m');
      const refreshToken = await this.createRefreshToken(user.id, { ipAddress, userAgent }, rememberMe);

      await this.logAuthEvent(user.email, user.id, 'login', 'success');

      return {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  /**
   * STEP 5: FORGOT PASSWORD - Request reset
   */
  async requestPasswordReset(email: string) {
    try {
      console.log(`🔐 [FORGOT PASSWORD] Request for ${email}`);

      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (users.length === 0) {
        return { message: 'If an account exists with this email, a reset link has been sent.' };
      }

      const user = users[0];

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = await bcrypt.hash(resetToken, 10);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db
        .insert(schema.passwordResetTokens)
        .values({
          user_id: user.id,
          token: resetTokenHash,
          expires_at: expiresAt,
          is_used: false,
        });

      console.log(`✓ Reset token generated`);

      try {
        await emailService.sendPasswordResetEmail(email, resetToken, user.full_name || 'User');
      } catch (emailErr) {
        console.error('⚠️ Failed to send password reset email:', emailErr);
      }

      await this.logAuthEvent(email, user.id, 'password_reset_requested', 'success');

      return { message: 'Password reset link sent to your email' };
    } catch (error) {
      console.error('❌ Password reset request error:', error);
      throw error;
    }
  }

  /**
   * STEP 6: FORGOT PASSWORD - Complete reset
   */
  async resetPassword(resetToken: string, newPassword: string) {
    try {
      console.log(`🔐 [RESET PASSWORD] Completing password reset`);

      const tokens = await db
        .select()
        .from(schema.passwordResetTokens)
        .where(eq(schema.passwordResetTokens.is_used, false));

      let matchingToken = null;
      for (const token of tokens) {
        const isValid = await bcrypt.compare(resetToken, token.token);
        if (isValid) {
          if (new Date() > new Date(token.expires_at!)) continue;
          matchingToken = token;
          break;
        }
      }

      if (!matchingToken) {
        throw new AppError(400, "Invalid or expired reset token");
      }

      console.log(`✓ Reset token validated`);

      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, matchingToken.user_id));

      const user = users[0];
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db
        .update(schema.users)
        .set({ password_hash: hashedPassword })
        .where(eq(schema.users.id, user.id));

      await db
        .update(schema.passwordResetTokens)
        .set({ is_used: true })
        .where(eq(schema.passwordResetTokens.id, matchingToken.id));

      console.log(`✓ Password updated`);

      await this.logAuthEvent(user.email, user.id, 'password_reset_completed', 'success');

      // Invalidate all refresh tokens — force re-login everywhere
      await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.user_id, user.id));

      return { message: 'Password has been reset. Please login with your new password.' };
    } catch (error) {
      console.error('❌ Password reset error:', error);
      throw error;
    }
  }

  /**
   * STEP 7: CREATE REFRESH TOKEN
   */
  async createRefreshToken(
    userId: number,
    metadata: { ipAddress?: string; userAgent?: string } = {},
    rememberMe: boolean = false
  ): Promise<string> {
    try {
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const expiresIn = rememberMe ? 30 : 7;
      const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);

      await db
        .insert(schema.refreshTokens)
        .values({
          user_id: userId,
          token: refreshToken,
          expires_at: expiresAt,
          ip_address: metadata.ipAddress || '',
          user_agent: metadata.userAgent || '',
        });

      console.log(`✓ Refresh token created (expires in ${expiresIn} days)`);
      return refreshToken;
    } catch (error) {
      console.error('❌ Refresh token creation error:', error);
      throw error;
    }
  }

  /**
   * STEP 8: USE REFRESH TOKEN to get new access token
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      console.log(`🔐 [REFRESH TOKEN] Attempting token refresh`);

      const tokens = await db
        .select()
        .from(schema.refreshTokens)
        .where(eq(schema.refreshTokens.token, refreshToken));

      if (tokens.length === 0) {
        throw new AppError(401, "Invalid refresh token");
      }

      const token = tokens[0];

      if (new Date() > new Date(token.expires_at!)) {
        await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.id, token.id));
        throw new AppError(401, "Refresh token expired");
      }

      console.log(`✓ Refresh token valid`);

      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, token.user_id));

      const user = users[0];
      const newAccessToken = this.generateJWT(user.id, user.email, user.role, '15m');

      // Rotate refresh token
      await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.id, token.id));
      const newRefreshToken = await this.createRefreshToken(user.id, {}, false);

      console.log(`✓ Tokens refreshed and rotated`);

      return { token: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      throw error;
    }
  }

  /**
   * STEP 9: PASSKEYS (WebAuthn) - Register
   */
  async registerPasskey(
    userId: number,
    credentialId: string,
    publicKey: string,
    deviceName: string = 'Unknown device'
  ) {
    try {
      console.log(`🔐 [PASSKEY] Registering passkey for user ${userId}`);

      await db
        .insert(schema.passkeys)
        .values({
          user_id: userId,
          credential_id: credentialId,
          public_key: publicKey,
          counter: 0,
          device_name: deviceName,
        });

      console.log(`✓ Passkey registered`);
      await this.logAuthEvent(null, userId, 'passkey_register', 'success');

      return { message: 'Passkey registered successfully' };
    } catch (error) {
      console.error('❌ Passkey registration error:', error);
      throw error;
    }
  }

  /**
   * STEP 10: PASSKEYS (WebAuthn) - Authenticate
   */
  async authenticatePasskey(credentialId: string, newCounter: number) {
    try {
      console.log(`🔐 [PASSKEY] Authenticating with passkey`);

      const passkeys = await db
        .select()
        .from(schema.passkeys)
        .where(eq(schema.passkeys.credential_id, credentialId));

      if (passkeys.length === 0) {
        throw new AppError(404, "Passkey not found");
      }

      const passkey = passkeys[0];
      const currentCounter = passkey.counter ?? 0;

      // Check counter (prevent replay attacks)
      if (newCounter <= currentCounter) {
        throw new AppError(401, "Passkey counter mismatch (possible cloned authenticator)");
      }

      await db
        .update(schema.passkeys)
        .set({ counter: newCounter })
        .where(eq(schema.passkeys.id, passkey.id));

      console.log(`✓ Passkey authenticated`);

      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, passkey.user_id));

      const user = users[0];
      const accessToken = this.generateJWT(user.id, user.email, user.role, '15m');
      const refreshToken = await this.createRefreshToken(user.id, {}, false);

      await this.logAuthEvent(user.email, user.id, 'passkey_login', 'success');

      return {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('❌ Passkey authentication error:', error);
      throw error;
    }
  }

  /**
   * JWT GENERATION
   */
  generateJWT(
    userId: number,
    email: string,
    role: string,
    expiresIn: string = '15m'
  ): string {
    const secret = process.env.JWT_SECRET || 'jwt123456789';
    const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
    return jwt.sign({ userId, email, role }, secret, options);
  }

  /**
   * AUDIT LOGGING
   */
  private async logAuthEvent(
    email: string | null,
    userId: number | null,
    eventType: string,
    status: 'success' | 'failed',
    ipAddress: string = '',
    userAgent: string = ''
  ): Promise<void> {
    try {
      await db
        .insert(schema.authAuditLog)
        .values({
          user_id: userId,
          email,
          event_type: eventType,
          status,
          ip_address: ipAddress,
          user_agent: userAgent,
        });
    } catch (error) {
      console.error('Failed to log auth event:', error);
    }
  }
}

export const authService = new AuthService();