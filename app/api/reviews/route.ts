import { NextRequest, NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export const runtime = "nodejs";

type ReviewRow = {
  id: number;
  alim_id: number;
  customer_id: number;
  appointment_id: number | null;
  rating: number;
  review_text: string | null;
  created_at: Date;
};

// GET reviews
export async function GET(request: NextRequest) {
  try {
    const alimId = request.nextUrl.searchParams.get("alimId");

    const pool = await getDbPool();
    let query =
      "SELECT id, alim_id, customer_id, appointment_id, rating, review_text, created_at FROM dbo.reviews WHERE 1=1";

    const req = pool.request();

    if (alimId) {
      query += " AND alim_id = @alimId";
      req.input("alimId", sql.Int, parseInt(alimId));
    }

    query += " ORDER BY created_at DESC";

    const result = await req.query<ReviewRow>(query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// CREATE review
type CreateReviewBody = {
  alimId: number;
  customerId: number;
  appointmentId?: number;
  rating: number;
  reviewText?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateReviewBody;
    const { alimId, customerId, appointmentId, rating, reviewText } = body;

    if (!alimId || !customerId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const result = await pool
      .request()
      .input("alimId", sql.Int, alimId)
      .input("customerId", sql.Int, customerId)
      .input("appointmentId", sql.Int, appointmentId || null)
      .input("rating", sql.Decimal(2, 1), rating)
      .input("reviewText", sql.NVarChar(sql.MAX), reviewText || null)
      .query<{ id: number }>(
        `INSERT INTO dbo.reviews (alim_id, customer_id, appointment_id, rating, review_text)
         OUTPUT inserted.id
         VALUES (@alimId, @customerId, @appointmentId, @rating, @reviewText)`
      );

    // Update alim rating
    await pool
      .request()
      .input("alimId", sql.Int, alimId)
      .query(
        `UPDATE dbo.alims 
         SET rating = (SELECT AVG(CAST(rating AS FLOAT)) FROM dbo.reviews WHERE alim_id = @alimId),
             reviews = (SELECT COUNT(*) FROM dbo.reviews WHERE alim_id = @alimId)
         WHERE id = @alimId`
      );

    return NextResponse.json(
      { message: "Review created", id: result.recordset[0].id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
