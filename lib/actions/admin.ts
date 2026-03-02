"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";

const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const resetPasswordSchema = z.object({
  id: z.string().uuid("Invalid student ID"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const deleteStudentSchema = z.object({
  id: z.string().uuid("Invalid student ID"),
});

export async function createStudentAccount(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = createStudentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { name, email, password } = parsed.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'student')`,
      [name, email, hashedPassword]
    );
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.message.includes("unique") &&
      err.message.includes("email")
    ) {
      return { error: "A user with this email already exists." };
    }
    return { error: "Failed to create student account." };
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { success: true };
}

export async function resetStudentPassword(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = resetPasswordSchema.safeParse({
    id: formData.get("id"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { id, password } = parsed.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const res = await pool.query(
      `UPDATE users SET password = $1 WHERE id = $2 AND role = 'student'`,
      [hashedPassword, id]
    );
    if (res.rowCount === 0) {
      return { error: "Student not found." };
    }
  } catch {
    return { error: "Failed to reset password." };
  }

  revalidatePath("/admin/students");
  return { success: true };
}

export async function deleteStudentAccount(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = deleteStudentSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { id } = parsed.data;

  try {
    const res = await pool.query(
      `DELETE FROM users WHERE id = $1 AND role = 'student'`,
      [id]
    );
    if (res.rowCount === 0) {
      return { error: "Student not found." };
    }
  } catch {
    return { error: "Failed to delete student account." };
  }

  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return { success: true };
}
