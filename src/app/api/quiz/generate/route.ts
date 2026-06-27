import { NextRequest, NextResponse } from "next/server";
import { getQuestionsByLesson, getLessonById } from "@/lib/curriculum-data";

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
    const { lessonId, count, type } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    const lesson = getLessonById(lessonId);
    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    const questionCount = Math.min(Math.max(count || 20, 1), 200);

    // Get all matching questions
    let allQuestions = getQuestionsByLesson(lessonId);
    if (type && typeof type === "string") {
      allQuestions = allQuestions.filter((q) => q.type === type);
    }

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this lesson" },
        { status: 404 }
      );
    }

    // Fisher-Yates shuffle and pick requested count
    const shuffled = shuffleArray(allQuestions);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    // Format questions to match expected API structure
    const questions = selected.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      imageUrl: null,
      difficulty: q.difficulty,
      hint: q.hint,
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