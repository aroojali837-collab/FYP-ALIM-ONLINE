import { NextRequest, NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

type LoginBody = {
  email: string;
  password: string;
};

type UserRow = {
  id: number;
  full_name: string;
  email: string;
  password: string;
  role: string;
  city: string | null;
  phone_number: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const pool = await getDbPool();

    const result = await pool
      .request()
      .input("email", sql.NVarChar(120), email)
      .query<UserRow>(
        `SELECT id, full_name, email, password, role, city, phone_number
         FROM dbo.users WHERE email = @email`
      );

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = result.recordset[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create response with user data (password excluded)
    const response = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      city: user.city,
      phoneNumber: user.phone_number,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Login error:", {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Login failed", details: errorMsg },
      { status: 500 }
    );
  }
}
