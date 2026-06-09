import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppError } from "../middleware/errorHandler.js";
import { db } from "../db/index.js";

export class AuthService {
  async register(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    role: "customer" | "retailer" | "brand" | "admin",
    extraFields?: Record<string, any>
  ) {
    try {
      console.log('🔐 Auth service register:', {
        email,
        fullName,
        role,
        extraFields,
      });

      // Check if user exists
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (existingUser.length > 0) {
        throw new AppError(400, "Email already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ CREATE USER WITH ROLE (not hardcoded!)
      const newUser = await db
        .insert(schema.users)
        .values({
          email,
          password_hash: hashedPassword,
          full_name: fullName,
          phone,
          role: role, // ✅ USE THE ROLE PARAMETER
          is_active: true,
        })
        .returning();

      console.log('✓ User created:', {
        id: newUser[0].id,
        role: newUser[0].role,
      });

      // ✅ HANDLE RETAILER-SPECIFIC DATA
      if (role === 'retailer' && extraFields) {
        try {
          await db
            .insert(schema.retailers)
            .values({
              user_id: newUser[0].id,
              business_name: extraFields.businessName || '',
              business_license: extraFields.businessLicense || '',
              latitude: extraFields.latitude?.toString() || '0',
              longitude: extraFields.longitude?.toString() || '0',
              address: extraFields.address || '',
              phone: phone,
              brand: '',
              stock_quantity: 0,
              cylinder_size: '13kg',
              tier: 'retail',
              rating: '0',
              total_reviews: 0,
              is_verified: false,
              is_active: true,
            })
            .returning();

          console.log('✓ Retailer profile created');
        } catch (err) {
          console.error('Error creating retailer profile:', err);
          // Don't throw - user was created successfully
        }
      }

      // ✅ HANDLE BRAND MARKETER-SPECIFIC DATA
      if (role === 'brand' && extraFields) {
        try {
          // You'll need to create a brands table in your schema if it doesn't exist
          // For now, we'll just log it
          console.log('✓ Brand marketer data:', {
            companyName: extraFields.companyName,
            productCategory: extraFields.productCategory,
            taxId: extraFields.taxId,
          });
          // Uncomment when you have a brands table:
          // await db
          //   .insert(schema.brands)
          //   .values({
          //     user_id: newUser[0].id,
          //     company_name: extraFields.companyName,
          //     product_category: extraFields.productCategory,
          //     tax_id: extraFields.taxId,
          //   });
        } catch (err) {
          console.error('Error creating brand profile:', err);
        }
      }

      const token = this.generateJWT(newUser[0].id, email, role);

      return {
        token,
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          fullName: newUser[0].full_name,
          phone: newUser[0].phone,
          role: newUser[0].role, // ✅ RETURN ROLE
        },
      };
    } catch (error) {
      console.error('❌ Register error:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      const user = users[0];

      if (!user) {
        throw new AppError(401, "Invalid email or password");
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        throw new AppError(401, "Invalid email or password");
      }

      if (!user.is_active) {
        throw new AppError(403, "Account is deactivated");
      }

      const token = this.generateJWT(user.id, user.email, user.role);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role, // ✅ RETURN ROLE
        },
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  generateJWT(userId: number, email: string, role: string): string {
    return jwt.sign(
      {
        userId,
        email,
        role,
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
  }

  verifyJWT(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      return decoded;
    } catch (error) {
      throw new AppError(401, "Invalid token");
    }
  }
}

export const authService = new AuthService();