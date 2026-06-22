import { NextRequest, NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export const runtime = "nodejs";

type UpdateAppointmentBody = {
  status?: string;
  notes?: string;
  rating?: number;
  review?: string;
};

// UPDATE appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointmentId = parseInt(id);

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as UpdateAppointmentBody;
    const { status, notes, rating, review } = body;

    const pool = await getDbPool();
    await pool
      .request()
      .input("id", sql.Int, appointmentId)
      .input("status", sql.NVarChar(20), status || null)
      .input("notes", sql.NVarChar(sql.MAX), notes || null)
      .input("rating", sql.Decimal(2, 1), rating || null)
      .input("review", sql.NVarChar(sql.MAX), review || null)
      .query(
        `UPDATE dbo.appointments 
         SET status = COALESCE(@status, status),
             notes = COALESCE(@notes, notes),
             rating = COALESCE(@rating, rating),
             review = COALESCE(@review, review),
             updated_at = SYSUTCDATETIME()
         WHERE id = @id`
      );

    return NextResponse.json({ message: "Appointment updated" });
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointmentId = parseInt(id);

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    await pool
      .request()
      .input("id", sql.Int, appointmentId)
      .query("DELETE FROM dbo.appointments WHERE id = @id");

    return NextResponse.json({ message: "Appointment deleted" });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
