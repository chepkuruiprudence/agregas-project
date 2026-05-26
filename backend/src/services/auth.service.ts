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
    phone: string
  ) {
    try {
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (existingUser.length > 0) {
        throw new AppError(400, "Email already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await db
        .insert(schema.users)
        .values({
          email,
          password_hash: hashedPassword,
          full_name: fullName,
          phone,
          role: "customer",
          is_active: true,
        })
        .returning();

      const token = this.generateJWT(newUser[0].id, email, "customer");

      return {
        token,
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          fullName: newUser[0].full_name,
          role: newUser[0].role,
        },
      };
    } catch (error) {
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
          role: user.role,
        },
      };
    } catch (error) {
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