import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, avatar: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const progress = await db.progress.findMany({
      where: { studentId },
      orderBy: { createdAt: "asc" },
    });

    // Fetch lessons separately (no direct relation on Progress)
    const lessonIds = progress.map((p) => p.lessonId);
    const lessons = await db.lesson.findMany({
      where: { id: { in: lessonIds } },
      include: {
        unit: {
          select: { id: true, title: true, order: true },
        },
      },
    });
    const lessonMap = new Map(lessons.map((l) => [l.id, l]));

    // Organize by unit
    const byUnit = new Map<string, {
      unitId: string;
      unitTitle: string;
      unitOrder: number;
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        lessonOrder: number;
        letter: string;
        completed: boolean;
        bestScore: number;
        starsEarned: number;
        attempts: number;
        xpEarned: number;
        lastAttemptAt: string | null;
      }>;
    }>();

    for (const p of progress) {
      const lesson = lessonMap.get(p.lessonId);
      if (!lesson) continue;

      const unitId = lesson.unitId;
      if (!byUnit.has(unitId)) {
        byUnit.set(unitId, {
          unitId,
          unitTitle: lesson.unit.title,
          unitOrder: lesson.unit.order,
          lessons: [],
        });
      }

      byUnit.get(unitId)!.lessons.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonOrder: lesson.order,
        letter: lesson.letter,
        completed: p.completed,
        bestScore: p.bestScore,
        starsEarned: p.starsEarned,
        attempts: p.attempts,
        xpEarned: p.xpEarned,
        lastAttemptAt: p.lastAttemptAt?.toISOString() ?? null,
      });
    }

    const units = Array.from(byUnit.values()).sort(
      (a, b) => a.unitOrder - b.unitOrder
    );

    const totalCompleted = progress.filter((p) => p.completed).length;
    const totalLessons = progress.length;
    const totalXp = progress.reduce((sum, p) => sum + p.xpEarned, 0);
    const totalStars = progress.reduce((sum, p) => sum + p.starsEarned, 0);

    return NextResponse.json({
      student,
      totalLessons,
      totalCompleted,
      totalXp,
      totalStars,
      overallProgress: totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0,
      units,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}