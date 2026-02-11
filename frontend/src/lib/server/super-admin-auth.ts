import { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AuthenticatedUser {
  id: number;
  username: string;
  is_admin: boolean;
  super_admin: boolean;
  email?: string;
}

export async function requireSuperAdminFromRequest(req: NextRequest): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing auth token");
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: authHeader,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Invalid auth token");
  }

  const user = (await res.json()) as AuthenticatedUser;
  if (!user.super_admin) {
    throw new Error("Super admin access required");
  }
  return user;
}
