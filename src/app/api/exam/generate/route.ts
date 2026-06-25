import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { unitId, type } = body;

    if (!unitId || !type) {
      return NextResponse.json(
        { error: "unitId and type are required" },
        { status: 400 }
      );
    }

    if (!["unit_exam", "final_exam"].includes(type)) {
      return NextResponse.json(
        { error: "type must be unit_exam or final_exam" },
        { status: 400 }
      );
    }

    let lessonIds: string[];

    if (type === "unit_exam") {
      // Get all lessons in the specified unit
      const lessons = await db.lesson.findMany({
        where: { unitId },
        select: { id: true },
        orderBy: { order: "asc" },
      });

      if (lessons.length === 0) {
        return NextResponse.json(
          { error: "No lessons found in this unit" },
          { status: 404 }
        );
      }

      lessonIds = lessons.map((l) => l.id);
    } else {
      // Final exam: pull questions from all units
      const allLessons = await db.lesson.findMany({
        select: { id: true },
        orderBy: { order: "asc" },
      });

      if (allLessons.length === 0) {
        return NextResponse.json(
          { error: "No lessons found" },
          { status: 404 }
        );
      }

      lessonIds = allLessons.map((l) => l.id);
    }

    // Fetch all questions from these lessons
    const allQuestions = await db.questionBank.findMany({
      where: { lessonId: { in: lessonIds } },
      select: {
        id: true,
        type: true,
        question: true,
        options: true,
        correctAnswer: true,
        imageUrl: true,
        difficulty: true,
        hint: true,
        lessonId: true,
      },
    });

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for exam" },
        { status: 404 }
      );
    }

    // Shuffle and pick 50 (or all if fewer available)
    const shuffled = shuffleArray(allQuestions);
    const targetCount = type === "unit_exam" ? 50 : 50;
    const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));

    // Parse options
    const questions = selected.map((q) => ({
      ...q,
      options: safeParseJson(q.options, []),
    }));

    return NextResponse.json({
      questions,
      type,
      totalAvailable: allQuestions.length,
      returnedCount: questions.length,
      lessonIds,
    });
  } catch (error) {
    console.error("Error generating exam:", error);
    return NextResponse.json(
      { error: "Failed to generate exam" },
      { status: 500 }
    );
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function safeParseJson(str: string, fallback: unknown) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}