import { NextResponse } from "next/server";
import { getLevelTitle } from "@/lib/curriculum-data";

// Leaderboard with no shared DB returns empty (single-user localStorage)
export async function GET() {
  try {
    return NextResponse.json({ leaderboard: [] });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}