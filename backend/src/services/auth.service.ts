import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

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
      const user = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (user.length === 0) {
        throw new AppError(401, "Invalid email or password");
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user[0].password_hash
      );

      if (!isPasswordValid) {
        throw new AppError(401, "Invalid email or password");
      }

      if (!user[0].is_active) {
        throw new AppError(403, "Account is deactivated");
      }

      const token = this.generateJWT(user[0].id, user[0].email, user[0].role);

      return {
        token,
        user: {
          id: user[0].id,
          email: user[0].email,
          fullName: user[0].full_name,
          role: user[0].role,
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