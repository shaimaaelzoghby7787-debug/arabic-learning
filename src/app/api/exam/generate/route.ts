import { NextRequest, NextResponse } from "next/server";
import { getQuestionsByLessons, getLessonsByUnit, UNITS } from "@/lib/curriculum-data";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
      const unitLessons = getLessonsByUnit(unitId);
      if (unitLessons.length === 0) {
        return NextResponse.json(
          { error: "No lessons found in this unit" },
          { status: 404 }
        );
      }
      lessonIds = unitLessons.map((l) => l.id);
    } else {
      // Final exam: all lessons from all units
      lessonIds = UNITS.flatMap((u) =>
        getLessonsByUnit(u.id).map((l) => l.id)
      );
      if (lessonIds.length === 0) {
        return NextResponse.json(
          { error: "No lessons found" },
          { status: 404 }
        );
      }
    }

    // Fetch all questions from these lessons
    const allQuestions = getQuestionsByLessons(lessonIds);

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for exam" },
        { status: 404 }
      );
    }

    // Shuffle and pick 50 (or all if fewer available)
    const shuffled = shuffleArray(allQuestions);
    const targetCount = 50;
    const selected = shuffled.slice(0, Math.min(targetCount, shuffled.length));

    // Format questions
    const questions = selected.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      imageUrl: null,
      difficulty: q.difficulty,
      hint: q.hint,
      lessonId: q.lessonId,
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