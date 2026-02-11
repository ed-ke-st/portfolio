import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminFromRequest } from "@/lib/server/super-admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdminFromRequest(req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ detail: msg }, { status: msg === "Super admin access required" ? 403 : 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { detail: "Blob upload not configured (set BLOB_READ_WRITE_TOKEN)." },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ detail: "No file uploaded" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathname = `platform/hero/${Date.now()}-${safeName}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type || "application/octet-stream",
  });

  return NextResponse.json({ url: blob.url, pathname: blob.pathname });
}
