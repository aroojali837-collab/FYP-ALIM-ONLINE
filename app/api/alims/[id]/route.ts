import { NextRequest, NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export const runtime = "nodejs";

type AlimRow = {
  id: number;
  user_id: number | null;
  name: string;
  initials: string | null;
  fiqh: string;
  experience: string | null;
  languages: string | null;
  bio: string | null;
  rating: number;
  reviews: number;
  distance_km: number | null;
  available_time: string | null;
  area: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

// GET alim profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alimId = parseInt(id);

    if (!alimId) {
      return NextResponse.json({ error: "Invalid alim ID" }, { status: 400 });
    }

    const pool = await getDbPool();
    const result = await pool
      .request()
      .input("id", sql.Int, alimId)
      .query<AlimRow>(
        `SELECT id, user_id, name, initials, fiqh, experience, languages, bio, rating, reviews, 
                distance_km, available_time, area, city, latitude, longitude
         FROM dbo.alims WHERE id = @id`
      );

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Alim not found" }, { status: 404 });
    }

    const alim = result.recordset[0];
    return NextResponse.json({
      id: alim.id,
      userId: alim.user_id,
      name: alim.name,
      initials: alim.initials,
      fiqh: alim.fiqh,
      experience: alim.experience,
      languages: alim.languages,
      bio: alim.bio,
      rating: alim.rating,
      reviews: alim.reviews,
      distanceKm: alim.distance_km,
      availableTime: alim.available_time,
      area: alim.area,
      city: alim.city,
      latitude: alim.latitude,
      longitude: alim.longitude,
    });
  } catch (error) {
    console.error("Get alim error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alim" },
      { status: 500 }
    );
  }
}

// UPDATE alim profile
type UpdateAlimBody = {
  experience?: string;
  languages?: string;
  bio?: string;
  availableTime?: string;
  area?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const alimId = parseInt(id);

    if (!alimId) {
      return NextResponse.json({ error: "Invalid alim ID" }, { status: 400 });
    }

    const body = (await request.json()) as UpdateAlimBody;
    const {
      experience,
      languages,
      bio,
      availableTime,
      area,
      city,
      latitude,
      longitude,
    } = body;

    const pool = await getDbPool();
    await pool
      .request()
      .input("id", sql.Int, alimId)
      .input("experience", sql.NVarChar(50), experience || null)
      .input("languages", sql.NVarChar(150), languages || null)
      .input("bio", sql.NVarChar(sql.MAX), bio || null)
      .input("availableTime", sql.NVarChar(80), availableTime || null)
      .input("area", sql.NVarChar(120), area || null)
      .input("city", sql.NVarChar(80), city || null)
      .input("latitude", sql.Decimal(10, 7), latitude || null)
      .input("longitude", sql.Decimal(10, 7), longitude || null)
      .query(
        `UPDATE dbo.alims 
         SET experience = COALESCE(@experience, experience),
             languages = COALESCE(@languages, languages),
             bio = COALESCE(@bio, bio),
             available_time = COALESCE(@availableTime, available_time),
             area = COALESCE(@area, area),
             city = COALESCE(@city, city),
             latitude = COALESCE(@latitude, latitude),
             longitude = COALESCE(@longitude, longitude)
         WHERE id = @id`
      );

    return NextResponse.json({ message: "Alim profile updated" });
  } catch (error) {
    console.error("Update alim error:", error);
    return NextResponse.json(
      { error: "Failed to update alim" },
      { status: 500 }
    );
  }
}
