import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get all students (non-teacher)
    const students = await db.student.findMany({
      where: { isTeacher: false },
      include: {
        progress: true,
        achievements: {
          include: { achievement: true },
        },
        certificates: true,
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get total lessons for percentages
    const totalLessons = await db.lesson.count();
    const totalUnits = await db.unit.count();

    // Find most missed questions across all students
    const allAttempts = await db.attempt.findMany({
      select: { answers: true },
    });

    const wrongCountMap = new Map<string, number>();
    const questionMap = new Map<string, { question: string; correctAnswer: string; type: string }>();

    for (const attempt of allAttempts) {
      let answers: Array<{ questionId: string; correct: boolean }>;
      try {
        answers = JSON.parse(attempt.answers);
      } catch {
        continue;
      }

      for (const a of answers) {
        if (!a.correct) {
          wrongCountMap.set(a.questionId, (wrongCountMap.get(a.questionId) ?? 0) + 1);
        }
      }
    }

    // Get top wrong questions
    const topWrongIds = Array.from(wrongCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    const wrongQuestions = await db.questionBank.findMany({
      where: { id: { in: topWrongIds } },
      select: { id: true, question: true, correctAnswer: true, type: true },
    });

    const mostMissedQuestions = topWrongIds
      .map((id) => {
        const q = wrongQuestions.find((wq) => wq.id === id);
        if (!q) return null;
        return {
          ...q,
          wrongCount: wrongCountMap.get(id) ?? 0,
          options: safeParseJson(
            (q as unknown as { options: string }).options,
            []
          ),
        };
      })
      .filter(Boolean);

    // Student summaries
    const studentSummaries = students.map((s) => {
      const completedLessons = s.progress.filter((p) => p.completed).length;
      const totalXpEarned = s.progress.reduce((sum, p) => sum + p.xpEarned, 0);
      const totalStarsEarned = s.progress.reduce((sum, p) => sum + p.starsEarned, 0);

      return {
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        level: s.level,
        levelTitle: getLevelTitle(s.level),
        xp: s.xp,
        stars: s.stars,
        completedLessons,
        totalLessons,
        completionPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        totalXpEarned,
        totalStarsEarned,
        totalAttempts: s._count.attempts,
        achievementsCount: s.achievements.length,
        certificatesCount: s.certificates.length,
      };
    });

    // Overall stats
    const overallStats = {
      totalStudents: students.length,
      totalLessons,
      totalUnits,
      averageCompletion:
        students.length > 0
          ? Math.round(
              students.reduce((sum, s) => {
                const comp = s.progress.filter((p) => p.completed).length;
                return sum + (totalLessons > 0 ? (comp / totalLessons) * 100 : 0);
              }, 0) / students.length
            )
          : 0,
      averageXp:
        students.length > 0
          ? Math.round(students.reduce((sum, s) => sum + s.xp, 0) / students.length)
          : 0,
      averageLevel:
        students.length > 0
          ? Math.round(
              (students.reduce((sum, s) => sum + s.level, 0) / students.length) * 10
            ) / 10
          : 0,
    };

    return NextResponse.json({
      overallStats,
      students: studentSummaries,
      mostMissedQuestions,
    });
  } catch (error) {
    console.error("Error fetching teacher dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

function getLevelTitle(level: number): string {
  switch (level) {
    case 5:
      return "نجم الصف الأول";
    case 4:
      return "بطل اللغة العربية";
    case 3:
      return "متعلم نشيط";
    case 2:
      return "قارئ صغير";
    default:
      return "مبتدئ";
  }
}

function safeParseJson(str: string, fallback: unknown) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}