import { NextRequest, NextResponse } from "next/server";
import { getLessonById, getQuestionsByLesson, getUnitById, UNITS } from "@/lib/curriculum-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    const lesson = getLessonById(lessonId);

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    const unit = getUnitById(lesson.unitId);

    // Get question count and type breakdown
    const lessonQuestions = getQuestionsByLesson(lessonId);
    const questionCount = lessonQuestions.length;

    const typeAgg = new Map<string, number>();
    for (const q of lessonQuestions) {
      typeAgg.set(q.type, (typeAgg.get(q.type) ?? 0) + 1);
    }
    const questionTypes = Array.from(typeAgg.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    return NextResponse.json({
      id: lesson.id,
      unitId: lesson.unitId,
      order: lesson.order,
      title: lesson.title,
      letter: lesson.letter,
      objectives: lesson.objectives,
      content: lesson.content,
      words: lesson.words,
      tip: lesson.tip,
      isIntro: lesson.isIntro,
      introWords: lesson.introWords,
      introMeanings: lesson.introMeanings,
      unit: unit ? { id: unit.id, title: unit.title, order: unit.order } : null,
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