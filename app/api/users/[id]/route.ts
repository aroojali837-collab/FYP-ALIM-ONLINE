import { NextRequest, NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export const runtime = "nodejs";

type UserRow = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  city: string | null;
  phone_number: string | null;
  fiqh: string | null;
  created_at: Date;
};

// GET user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const pool = await getDbPool();
    const result = await pool
      .request()
      .input("id", sql.Int, userId)
      .query<UserRow>(
        `SELECT id, full_name, email, role, city, phone_number, fiqh, created_at
         FROM dbo.users WHERE id = @id`
      );

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result.recordset[0];
    return NextResponse.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      city: user.city,
      phoneNumber: user.phone_number,
      fiqh: user.fiqh,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// UPDATE user profile
type UpdateBody = {
  fullName?: string;
  phoneNumber?: string;
  city?: string;
  fiqh?: string;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body = (await request.json()) as UpdateBody;

    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { fullName, phoneNumber, city, fiqh } = body;

    const pool = await getDbPool();
    await pool
      .request()
      .input("id", sql.Int, userId)
      .input("fullName", sql.NVarChar(100), fullName || null)
      .input("phoneNumber", sql.NVarChar(30), phoneNumber || null)
      .input("city", sql.NVarChar(80), city || null)
      .input("fiqh", sql.NVarChar(20), fiqh || null)
      .query(
        `UPDATE dbo.users 
         SET full_name = COALESCE(@fullName, full_name),
             phone_number = COALESCE(@phoneNumber, phone_number),
             city = COALESCE(@city, city),
             fiqh = COALESCE(@fiqh, fiqh)
         WHERE id = @id`
      );

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
