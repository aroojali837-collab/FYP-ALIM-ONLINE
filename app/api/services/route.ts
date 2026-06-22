import { NextRequest, NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export const runtime = "nodejs";

type ServiceRow = {
  id: number;
  name: string;
  description: string | null;
};

// GET all services
export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool
      .request()
      .query<ServiceRow>("SELECT id, name, description FROM dbo.services");

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Get services error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// CREATE service
type CreateServiceBody = {
  name: string;
  description?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateServiceBody;
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Service name is required" },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const result = await pool
      .request()
      .input("name", sql.NVarChar(80), name)
      .input("description", sql.NVarChar(255), description || null)
      .query<{ id: number }>(
        `INSERT INTO dbo.services (name, description)
         OUTPUT inserted.id
         VALUES (@name, @description)`
      );

    return NextResponse.json(
      { message: "Service created", id: result.recordset[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create service error:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
