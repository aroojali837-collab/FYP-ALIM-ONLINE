import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { getDbPool } = await import("@/lib/db");
    const pool = await getDbPool();
    
    const result = await pool.request().query("SELECT 1 as connected");
    
    if (result.recordset.length > 0) {
      return NextResponse.json({
        status: "✅ Connected",
        message: "Database connection successful",
        database: "alim_online",
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      status: "❌ Error",
      message: "Database query returned no results"
    }, { status: 500 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      status: "❌ Failed",
      message: errorMessage,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
