import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, count, type } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    const questionCount = Math.min(Math.max(count || 20, 1), 200);

    // Build where clause
    const where: Record<string, unknown> = { lessonId };
    if (type && typeof type === "string") {
      where.type = type;
    }

    // Get all matching questions
    const allQuestions = await db.questionBank.findMany({
      where,
      select: {
        id: true,
        type: true,
        question: true,
        options: true,
        correctAnswer: true,
        imageUrl: true,
        difficulty: true,
        hint: true,
      },
    });

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this lesson" },
        { status: 404 }
      );
    }

    // Fisher-Yates shuffle and pick requested count
    const shuffled = shuffleArray(allQuestions);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    // Parse options JSON for each question
    const questions = selected.map((q) => ({
      ...q,
      options: safeParseJson(q.options, []),
    }));

    return NextResponse.json({
      questions,
      totalAvailable: allQuestions.length,
      requestedCount: questionCount,
      returnedCount: questions.length,
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
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