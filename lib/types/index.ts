export type UserRole = "admin" | "student";

export type SessionUser = {
  id?: string;
  role?: UserRole;
  email?: string | null;
  name?: string | null;
};

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { error: string };
