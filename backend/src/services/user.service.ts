import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppError } from "../middleware/errorHandler";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export class UserService {
  async getUserById(userId: number) {
    try {
      const user = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (user.length === 0) {
        throw new AppError(404, "User not found");
      }

      // Don't return password
      const { password_hash, ...userWithoutPassword } = user[0];
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmail(email: string) {
    try {
      const user = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (user.length === 0) {
        return null;
      }

      return user[0];
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers(limit: number = 50, offset: number = 0) {
    try {
      const users = await db
        .select()
        .from(schema.users)
        .orderBy(desc(schema.users.created_at))
        .limit(limit)
        .offset(offset);

      return users.map((u) => {
        const { password_hash, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
    } catch (error) {
      throw error;
    }
  }

  async changeUserRole(userId: number, newRole: string) {
    try {
      const updated = await db
        .update(schema.users)
        .set({ role: newRole as any })
        .where(eq(schema.users.id, userId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "User not found");
      }

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async deactivateUser(userId: number) {
    try {
      const updated = await db
        .update(schema.users)
        .set({ is_active: false })
        .where(eq(schema.users.id, userId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "User not found");
      }

      return updated[0];
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId: number, updates: any) {
    try {
      const updated = await db
        .update(schema.users)
        .set(updates)
        .where(eq(schema.users.id, userId))
        .returning();

      if (updated.length === 0) {
        throw new AppError(404, "User not found");
      }

      const { password_hash, ...userWithoutPassword } = updated[0];
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }
}

export const userService = new UserService();