import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import * as sql from "mssql";


export const runtime = "nodejs";

type ServiceRequestBody = {
  customerId?: number | null;
  alimId: number;
  serviceId: number;
  fiqh?: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  requestDate?: string;
  requestTime?: string;
};

function normalizeRequestDate(input?: string): string | null {
  if (!input) return null;

  // Accept: YYYY-MM-DD (from <input type="date">) or full ISO date.
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const asDate = new Date(trimmed);
  if (Number.isNaN(asDate.getTime())) return null;

  const yyyy = asDate.getUTCFullYear();
  const mm = String(asDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(asDate.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeRequestTime(input?: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Accept HH:mm:ss
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  // Accept HH:mm
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  // Accept H:mm (e.g. 3:00)
  if (/^\d{1}:\d{2}$/.test(trimmed)) {
    const h = trimmed.split(":")[0];
    return `${String(h).padStart(2, "0")}:${trimmed.split(":")[1]}:00`;
  }

  // Accept 12-hour with AM/PM: h:mm AM/PM or hh:mm AM/PM
  const m = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m) {
    let h = Number(m[1]);
    const min = m[2];
    const ap = m[3].toUpperCase();

    if (ap === "AM") {
      if (h === 12) h = 0;
    } else {
      // PM
      if (h !== 12) h += 12;
    }

    return `${String(h).padStart(2, "0")}:${min}:00`;
  }

  return null;
}

function normalizeToSqlTime(timeHHMMSS: string | null): string | null {
  if (!timeHHMMSS) return null;
  // Ensure exactly HH:mm:ss
  if (!/^\d{2}:\d{2}:\d{2}$/.test(timeHHMMSS)) return null;
  return timeHHMMSS;
}


export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ServiceRequestBody;

    // customerId is optional in DB schema, but the API caller should always send it.
    // If not provided, we return a clear error instead of passing null into the mssql driver.
    if (!body.customerId) {
      return NextResponse.json(
        { error: "customerId is required", received: { customerId: body.customerId } },
        { status: 400 },
      );
    }

    if (!body.alimId || !body.serviceId) {
      return NextResponse.json(
        {
          error: "alimId and serviceId are required",
          received: { alimId: body.alimId, serviceId: body.serviceId },
        },
        { status: 400 },
      );
    }


    // customer_id in schema is NULLable, but mssql driver validation can break if we pass null
    // without correct type handling. Require it from frontend for consistent real-time behavior.
    const customerId = body.customerId;



    const requestDate = normalizeRequestDate(body.requestDate);
    const requestTime = normalizeRequestTime(body.requestTime);

    const pool = await getDbPool();
    const result = await pool
      .request()
      .input("customerId", sql.Int, customerId)
      .input("alimId", sql.Int, body.alimId)
      .input("serviceId", sql.Int, body.serviceId)

      .input("fiqh", sql.NVarChar(20), body.fiqh ?? null)
      .input(
        "locationAddress",
        sql.NVarChar(255),
        body.locationAddress ?? null,
      )
      .input("latitude", sql.Decimal(10, 7), body.latitude ?? null)
      .input("longitude", sql.Decimal(10, 7), body.longitude ?? null)
      .input("requestDate", sql.Date, requestDate)
      // sql.Time requires a valid JS Date/ISO time string.
      // Frontend may send "15:00:00"; normalizeRequestTime already returns HH:mm:ss.
      .input("requestTime", sql.Time, requestTime)
      .query<{ id: number }>(`
        INSERT INTO dbo.service_requests (

          customer_id,
          alim_id,
          service_id,
          fiqh,
          location_address,
          latitude,
          longitude,
          request_date,
          request_time,
          status
        )
        OUTPUT INSERTED.id
        VALUES (
          @customerId,
          @alimId,
          @serviceId,
          @fiqh,
          @locationAddress,
          @latitude,
          @longitude,
          @requestDate,
          @requestTime,
          'pending'
        )
      `);

    return NextResponse.json({
      message: "Request sent",
      requestId: result.recordset[0]?.id,
    });
  } catch (error) {
    console.error("Failed to send request", error);
    return NextResponse.json(
      { error: "Failed to send request" },
      { status: 500 },
    );
  }
}

