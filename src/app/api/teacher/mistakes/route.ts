import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get all attempts and parse their answers
    const attempts = await db.attempt.findMany({
      select: {
        id: true,
        studentId: true,
        type: true,
        answers: true,
        score: true,
        student: {
          select: { name: true, avatar: true },
        },
      },
    });

    // Track wrong counts per question
    const wrongMap = new Map<
      string,
      {
        questionId: string;
        wrongCount: number;
        totalAttempts: number;
        studentIds: Set<string>;
      }
    >();

    for (const attempt of attempts) {
      let answers: Array<{ questionId: string; correct: boolean }>;
      try {
        answers = JSON.parse(attempt.answers);
      } catch {
        continue;
      }

      for (const a of answers) {
        if (!wrongMap.has(a.questionId)) {
          wrongMap.set(a.questionId, {
            questionId: a.questionId,
            wrongCount: 0,
            totalAttempts: 0,
            studentIds: new Set(),
          });
        }

        const entry = wrongMap.get(a.questionId)!;
        entry.totalAttempts++;
        entry.studentIds.add(attempt.studentId);
        if (!a.correct) {
          entry.wrongCount++;
        }
      }
    }

    // Sort by wrong count descending
    const sorted = Array.from(wrongMap.values())
      .sort((a, b) => b.wrongCount - a.wrongCount);

    // Get the top 20 wrong questions
    const topWrong = sorted.slice(0, 20);

    if (topWrong.length === 0) {
      return NextResponse.json({ mistakes: [] });
    }

    // Fetch question details
    const questionIds = topWrong.map((t) => t.questionId);
    const questions = await db.questionBank.findMany({
      where: { id: { in: questionIds } },
      include: {
        lesson: {
          select: {
            title: true,
            letter: true,
            unit: {
              select: { title: true, order: true },
            },
          },
        },
      },
    });

    const questionDetailMap = new Map(questions.map((q) => [q.id, q]));

    const mistakes = topWrong
      .map((t) => {
        const q = questionDetailMap.get(t.questionId);
        if (!q) return null;

        return {
          questionId: q.id,
          question: q.question,
          type: q.type,
          correctAnswer: q.correctAnswer,
          options: safeParseJson(q.options, []),
          wrongCount: t.wrongCount,
          totalAttempts: t.totalAttempts,
          errorRate: t.totalAttempts > 0 ? Math.round((t.wrongCount / t.totalAttempts) * 100) : 0,
          uniqueStudentsAffected: t.studentIds.size,
          lessonTitle: q.lesson.title,
          lessonLetter: q.lesson.letter,
          unitTitle: q.lesson.unit.title,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      mistakes,
      totalQuestionsAnalyzed: sorted.length,
    });
  } catch (error) {
    console.error("Error fetching mistakes:", error);
    return NextResponse.json(
      { error: "Failed to fetch mistakes" },
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