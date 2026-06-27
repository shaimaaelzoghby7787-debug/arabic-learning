import { NextResponse } from "next/server";

// Teacher mistakes - no shared data available without DB
export async function GET() {
  try {
    return NextResponse.json({ mistakes: [], totalQuestionsAnalyzed: 0 });
  } catch (error) {
    console.error("Error fetching mistakes:", error);
    return NextResponse.json(
      { error: "Failed to fetch mistakes" },
      { status: 500 }
    );
  }
}