import { NextRequest, NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

type RegisterBody = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  city?: string;
  role: "customer" | "alim";
  fiqh?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterBody;

    const { fullName, email, password, phoneNumber, city, role, fiqh } = body;

    // Validation
    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const pool = await getDbPool();

    // Check if email already exists
    const existingUser = await pool
      .request()
      .input("email", sql.NVarChar(120), email)
      .query("SELECT id FROM dbo.users WHERE email = @email");

    if (existingUser.recordset.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Insert user
    const result = await pool
      .request()
      .input("fullName", sql.NVarChar(100), fullName)
      .input("email", sql.NVarChar(120), email)
      .input("password", sql.NVarChar(255), hashedPassword)
      .input("phoneNumber", sql.NVarChar(30), phoneNumber || null)
      .input("city", sql.NVarChar(80), city || null)
      .input("role", sql.NVarChar(20), role)
      .input("fiqh", sql.NVarChar(20), fiqh || null)
      .query<{ id: number }>(
        `INSERT INTO dbo.users (full_name, email, password, phone_number, city, role, fiqh)
         OUTPUT inserted.id
         VALUES (@fullName, @email, @password, @phoneNumber, @city, @role, @fiqh)`
      );

    const userId = result.recordset[0].id;

    // If alim, create alim profile
    if (role === "alim") {
      const initials = fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

      await pool
        .request()
        .input("userId", sql.Int, userId)
        .input("name", sql.NVarChar(100), fullName)
        .input("initials", sql.NVarChar(10), initials)
        .input("fiqh", sql.NVarChar(20), fiqh || "Hanafi")
        .query(
          `INSERT INTO dbo.alims (user_id, name, initials, fiqh)
           VALUES (@userId, @name, @initials, @fiqh)`
        );
    }

    return NextResponse.json(
      { message: "User registered successfully", userId },
      { status: 201 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Registration error:", {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Registration failed", details: errorMsg },
      { status: 500 }
    );
  }
}
