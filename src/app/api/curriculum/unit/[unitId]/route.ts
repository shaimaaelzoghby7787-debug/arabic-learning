import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const { unitId } = await params;

    const unit = await db.unit.findUnique({
      where: { id: unitId },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      );
    }

    // Parse words JSON for each lesson
    const lessonsWithWords = unit.lessons.map((lesson) => ({
      ...lesson,
      words: safeParseJson(lesson.words, []),
    }));

    return NextResponse.json({
      ...unit,
      lessons: lessonsWithWords,
    });
  } catch (error) {
    console.error("Error fetching unit:", error);
    return NextResponse.json(
      { error: "Failed to fetch unit" },
      { status: 500 }
    );
  }
}

function safeParseJson(str: string, fallback: unknown) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}