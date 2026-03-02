"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerStudent(formData: FormData): Promise<{ success: true } | { error: string }> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid input. Name, valid email, and password (min 6 chars) required." };
  }

  const { name, email, password } = parsed.data;

  // Check if email already exists
  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existing.rows.length > 0) {
    return { error: "An account with this email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // First user becomes admin automatically
  const userCount = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  const role = userCount.rows[0].count === 0 ? "admin" : "student";

  await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
    [name, email, hashedPassword, role]
  );

  return { success: true as const };
}
