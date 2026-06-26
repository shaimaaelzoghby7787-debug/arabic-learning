import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: {
          select: { id: true, title: true, order: true },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Get question count for this lesson
    const questionCount = await db.questionBank.count({
      where: { lessonId: lesson.id },
    });

    // Get unique question types
    const typeAgg = await db.questionBank.groupBy({
      by: ["type"],
      where: { lessonId: lesson.id },
      _count: { type: true },
    });
    const questionTypes = typeAgg.map((t) => ({
      type: t.type,
      count: t._count.type,
    }));

    return NextResponse.json({
      ...lesson,
      words: safeParseJson(lesson.words, []),
      questionCount,
      questionTypes,
    });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
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