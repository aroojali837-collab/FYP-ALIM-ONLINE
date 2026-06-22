import { NextRequest, NextResponse } from "next/server";
import { getDbPool, sql } from "@/lib/db";

export const runtime = "nodejs";

type AlimRow = {
  id: number;
  name: string;
  initials: string | null;
  distance_km: number;
  rating: number;
  reviews: number;
  available_time: string;
  area: string;
  fiqh: string;
  experience: string;
  languages: string;
  bio: string;
};

export async function GET(request: NextRequest) {
  const sort = request.nextUrl.searchParams.get("sort");
  const city = request.nextUrl.searchParams.get("city");
  const fiqh = request.nextUrl.searchParams.get("fiqh");
  
  const orderBy =
    sort === "rating"
      ? "rating DESC, reviews DESC, distance_km ASC"
      : "distance_km ASC, rating DESC";

  try {
    const pool = await getDbPool();
    let query = `
      SELECT
        id,
        name,
        initials,
        distance_km,
        rating,
        reviews,
        available_time,
        area,
        fiqh,
        experience,
        languages,
        bio
      FROM dbo.alims
      WHERE 1=1
    `;

    const request2 = pool.request();
    
    if (city) {
      query += " AND city = @city";
      request2.input("city", sql.NVarChar(80), city);
    }
    
    if (fiqh) {
      query += " AND fiqh = @fiqh";
      request2.input("fiqh", sql.NVarChar(20), fiqh);
    }
    
    query += ` ORDER BY ${orderBy}`;
    
    const result = await request2.query<AlimRow>(query);

    const alims = result.recordset.map((alim) => ({
      id: alim.id,
      name: alim.name,
      initials: alim.initials ?? getInitials(alim.name),
      distance: `${Number(alim.distance_km).toFixed(1)} KM`,
      rating: Number(alim.rating),
      reviews: alim.reviews,
      time: alim.available_time,
      area: alim.area,
      fiqh: alim.fiqh,
      experience: alim.experience,
      languages: alim.languages,
      bio: alim.bio,
    }));

    return NextResponse.json({ alims });
  } catch (error) {
    console.error("Failed to load Alims", error);
    return NextResponse.json(
      { error: "Failed to load nearby Alims" },
      { status: 500 },
    );
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
