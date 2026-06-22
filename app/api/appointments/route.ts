import { NextRequest, NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export const runtime = "nodejs";

type AppointmentRow = {
  id: number;
  customer_id: number;
  alim_id: number;
  service_id: number | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  rating: number | null;
  review: string | null;
  created_at: Date;
};

// GET appointments with filters
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId");
    const alimId = request.nextUrl.searchParams.get("alimId");
    const status = request.nextUrl.searchParams.get("status");

    const pool = await getDbPool();
    let query =
      "SELECT id, customer_id, alim_id, service_id, appointment_date, appointment_time, status, notes, rating, review, created_at FROM dbo.appointments WHERE 1=1";

    const request2 = pool.request();

    if (customerId) {
      query += " AND customer_id = @customerId";
      request2.input("customerId", sql.Int, parseInt(customerId));
    }

    if (alimId) {
      query += " AND alim_id = @alimId";
      request2.input("alimId", sql.Int, parseInt(alimId));
    }

    if (status) {
      query += " AND status = @status";
      request2.input("status", sql.NVarChar(20), status);
    }

    query += " ORDER BY appointment_date DESC, appointment_time DESC";

    const result = await request2.query<AppointmentRow>(query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// CREATE appointment
type CreateAppointmentBody = {
  customerId: number;
  alimId: number;
  serviceId?: number;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateAppointmentBody;
    const {
      customerId,
      alimId,
      serviceId,
      appointmentDate,
      appointmentTime,
      notes,
    } = body;

    if (!customerId || !alimId || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const result = await pool
      .request()
      .input("customerId", sql.Int, customerId)
      .input("alimId", sql.Int, alimId)
      .input("serviceId", sql.Int, serviceId || null)
      .input("appointmentDate", sql.Date, appointmentDate)
      .input("appointmentTime", sql.Time, appointmentTime)
      .input("notes", sql.NVarChar(sql.MAX), notes || null)
      .query<{ id: number }>(
        `INSERT INTO dbo.appointments (customer_id, alim_id, service_id, appointment_date, appointment_time, notes)
         OUTPUT inserted.id
         VALUES (@customerId, @alimId, @serviceId, @appointmentDate, @appointmentTime, @notes)`
      );

    return NextResponse.json(
      { message: "Appointment created", id: result.recordset[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
