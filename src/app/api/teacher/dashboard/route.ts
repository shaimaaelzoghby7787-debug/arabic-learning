import { NextResponse } from "next/server";
import { getTotalLessonCount, getTotalUnitCount } from "@/lib/curriculum-data";

// Teacher dashboard - no shared data available without DB
export async function GET() {
  try {
    return NextResponse.json({
      overallStats: {
        totalStudents: 0,
        totalLessons: getTotalLessonCount(),
        totalUnits: getTotalUnitCount(),
        averageCompletion: 0,
        averageXp: 0,
        averageLevel: 0,
      },
      students: [],
      mostMissedQuestions: [],
    });
  } catch (error) {
    console.error("Error fetching teacher dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}