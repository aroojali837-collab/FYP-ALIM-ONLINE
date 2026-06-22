import { NextRequest, NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export const runtime = "nodejs";

type AvailabilityRow = {
  id: number;
  alim_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

// GET availability slots
export async function GET(request: NextRequest) {
  try {
    const alimId = request.nextUrl.searchParams.get("alimId");

    if (!alimId) {
      return NextResponse.json(
        { error: "Alim ID is required" },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const result = await pool
      .request()
      .input("alimId", sql.Int, parseInt(alimId))
      .query<AvailabilityRow>(
        `SELECT id, alim_id, day_of_week, start_time, end_time
         FROM dbo.alim_availability WHERE alim_id = @alimId ORDER BY day_of_week`
      );

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Get availability error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

// CREATE availability slot
type CreateAvailabilityBody = {
  alimId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateAvailabilityBody;
    const { alimId, dayOfWeek, startTime, endTime } = body;

    if (!alimId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { error: "Day of week must be 0-6" },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const result = await pool
      .request()
      .input("alimId", sql.Int, alimId)
      .input("dayOfWeek", sql.Int, dayOfWeek)
      .input("startTime", sql.Time, startTime)
      .input("endTime", sql.Time, endTime)
      .query<{ id: number }>(
        `INSERT INTO dbo.alim_availability (alim_id, day_of_week, start_time, end_time)
         OUTPUT inserted.id
         VALUES (@alimId, @dayOfWeek, @startTime, @endTime)`
      );

    return NextResponse.json(
      { message: "Availability slot created", id: result.recordset[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create availability error:", error);
    return NextResponse.json(
      { error: "Failed to create availability" },
      { status: 500 }
    );
  }
}
