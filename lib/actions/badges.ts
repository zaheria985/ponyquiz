"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";

// ─── Badge Schemas ──────────────────────────────────────────

const createBadgeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(255).optional(),
  criteria: z.string().min(1, "Criteria is required"),
});

const updateBadgeSchema = z.object({
  id: z.string().uuid("Invalid badge ID"),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(255).optional(),
  criteria: z.string().min(1, "Criteria is required"),
});

const deleteBadgeSchema = z.object({
  id: z.string().uuid("Invalid badge ID"),
});

// ─── Badge Actions ──────────────────────────────────────────

export async function createBadge(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = createBadgeSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    criteria: formData.get("criteria"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { name, description, icon, criteria } = parsed.data;

  let criteriaJson: unknown;
  try {
    criteriaJson = JSON.parse(criteria);
  } catch {
    return { error: "Criteria must be valid JSON." };
  }

  try {
    await pool.query(
      `INSERT INTO badges (name, description, icon, criteria)
       VALUES ($1, $2, $3, $4)`,
      [name, description || null, icon || null, JSON.stringify(criteriaJson)]
    );
  } catch {
    return { error: "Failed to create badge." };
  }

  revalidatePath("/admin/badges");
  return { success: true };
}

export async function updateBadge(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = updateBadgeSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    criteria: formData.get("criteria"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { id, name, description, icon, criteria } = parsed.data;

  let criteriaJson: unknown;
  try {
    criteriaJson = JSON.parse(criteria);
  } catch {
    return { error: "Criteria must be valid JSON." };
  }

  try {
    const res = await pool.query(
      `UPDATE badges SET name = $1, description = $2, icon = $3, criteria = $4
       WHERE id = $5`,
      [name, description || null, icon || null, JSON.stringify(criteriaJson), id]
    );
    if (res.rowCount === 0) {
      return { error: "Badge not found." };
    }
  } catch {
    return { error: "Failed to update badge." };
  }

  revalidatePath("/admin/badges");
  return { success: true };
}

export async function deleteBadge(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = deleteBadgeSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { id } = parsed.data;

  try {
    const res = await pool.query(`DELETE FROM badges WHERE id = $1`, [id]);
    if (res.rowCount === 0) {
      return { error: "Badge not found." };
    }
  } catch {
    return { error: "Failed to delete badge." };
  }

  revalidatePath("/admin/badges");
  return { success: true };
}

// ─── Unlockable Schemas ─────────────────────────────────────

const createUnlockableSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.string().min(1, "Type is required"),
  criteria: z.string().min(1, "Criteria is required"),
  asset_path: z.string().max(500).optional(),
});

const updateUnlockableSchema = z.object({
  id: z.string().uuid("Invalid unlockable ID"),
  name: z.string().min(1, "Name is required").max(100),
  type: z.string().min(1, "Type is required"),
  criteria: z.string().min(1, "Criteria is required"),
  asset_path: z.string().max(500).optional(),
});

const deleteUnlockableSchema = z.object({
  id: z.string().uuid("Invalid unlockable ID"),
});

// ─── Unlockable Actions ─────────────────────────────────────

export async function createUnlockable(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = createUnlockableSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    criteria: formData.get("criteria"),
    asset_path: formData.get("asset_path"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { name, type, criteria, asset_path } = parsed.data;

  if (!["avatar", "theme", "title"].includes(type)) {
    return { error: "Type must be avatar, theme, or title." };
  }

  let criteriaJson: unknown;
  try {
    criteriaJson = JSON.parse(criteria);
  } catch {
    return { error: "Criteria must be valid JSON." };
  }

  try {
    await pool.query(
      `INSERT INTO unlockables (name, type, criteria, asset_path)
       VALUES ($1, $2, $3, $4)`,
      [name, type, JSON.stringify(criteriaJson), asset_path || null]
    );
  } catch {
    return { error: "Failed to create unlockable." };
  }

  revalidatePath("/admin/badges");
  return { success: true };
}

export async function updateUnlockable(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = updateUnlockableSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
    criteria: formData.get("criteria"),
    asset_path: formData.get("asset_path"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { id, name, type, criteria, asset_path } = parsed.data;

  if (!["avatar", "theme", "title"].includes(type)) {
    return { error: "Type must be avatar, theme, or title." };
  }

  let criteriaJson: unknown;
  try {
    criteriaJson = JSON.parse(criteria);
  } catch {
    return { error: "Criteria must be valid JSON." };
  }

  try {
    const res = await pool.query(
      `UPDATE unlockables SET name = $1, type = $2, criteria = $3, asset_path = $4
       WHERE id = $5`,
      [name, type, JSON.stringify(criteriaJson), asset_path || null, id]
    );
    if (res.rowCount === 0) {
      return { error: "Unlockable not found." };
    }
  } catch {
    return { error: "Failed to update unlockable." };
  }

  revalidatePath("/admin/badges");
  return { success: true };
}

export async function deleteUnlockable(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = deleteUnlockableSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { id } = parsed.data;

  try {
    const res = await pool.query(`DELETE FROM unlockables WHERE id = $1`, [id]);
    if (res.rowCount === 0) {
      return { error: "Unlockable not found." };
    }
  } catch {
    return { error: "Failed to delete unlockable." };
  }

  revalidatePath("/admin/badges");
  return { success: true };
}

// ─── Equip Unlockable ───────────────────────────────────────

const equipSchema = z.object({
  unlockable_id: z.string().uuid("Invalid unlockable ID"),
  user_id: z.string().uuid("Invalid user ID"),
});

export async function equipUnlockable(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const parsed = equipSchema.safeParse({
    unlockable_id: formData.get("unlockable_id"),
    user_id: formData.get("user_id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { unlockable_id, user_id } = parsed.data;

  // Check user owns this unlockable
  const ownershipRes = await pool.query(
    `SELECT su.id, u.type, u.name, u.asset_path
     FROM student_unlockables su
     INNER JOIN unlockables u ON u.id = su.unlockable_id
     WHERE su.user_id = $1 AND su.unlockable_id = $2`,
    [user_id, unlockable_id]
  );

  if (ownershipRes.rows.length === 0) {
    return { error: "You have not earned this unlockable." };
  }

  const unlockable = ownershipRes.rows[0];

  try {
    // Unequip any other items of the same type
    await pool.query(
      `UPDATE student_unlockables su
       SET equipped = false
       FROM unlockables u
       WHERE su.unlockable_id = u.id
         AND su.user_id = $1
         AND u.type = $2
         AND su.equipped = true`,
      [user_id, unlockable.type]
    );

    // Equip this one
    await pool.query(
      `UPDATE student_unlockables
       SET equipped = true
       WHERE user_id = $1 AND unlockable_id = $2`,
      [user_id, unlockable_id]
    );

    // Update user profile for avatar/title
    if (unlockable.type === "avatar") {
      await pool.query(
        `UPDATE users SET avatar = $1 WHERE id = $2`,
        [unlockable.asset_path || unlockable.name, user_id]
      );
    } else if (unlockable.type === "title") {
      await pool.query(
        `UPDATE users SET title = $1 WHERE id = $2`,
        [unlockable.name, user_id]
      );
    }
  } catch {
    return { error: "Failed to equip unlockable." };
  }

  revalidatePath("/profile");
  return { success: true };
}
