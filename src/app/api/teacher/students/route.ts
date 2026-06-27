import { NextResponse } from "next/server";

// Teacher students - no shared data available without DB
export async function GET() {
  try {
    return NextResponse.json({ students: [] });
  } catch (error) {
    console.error("Error fetching teacher students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}