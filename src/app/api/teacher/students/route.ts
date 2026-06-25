import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const students = await db.student.findMany({
      where: { isTeacher: false },
      include: {
        progress: true,
        achievements: {
          include: { achievement: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalLessons = await db.lesson.count();

    // Fetch all lessons with units for enrichment
    const allLessons = await db.lesson.findMany({
      include: {
        unit: {
          select: { id: true, title: true, order: true },
        },
      },
    });
    const lessonMap = new Map(allLessons.map((l) => [l.id, l]));

    const studentData = students.map((s) => {
      const completed = s.progress.filter((p) => p.completed).length;

      // Group progress by unit
      const unitProgress = new Map<
        string,
        {
          unitId: string;
          unitTitle: string;
          unitOrder: number;
          completed: number;
          total: number;
        }
      >();

      for (const p of s.progress) {
        const lesson = lessonMap.get(p.lessonId);
        if (!lesson) continue;

        const uId = lesson.unitId;
        if (!unitProgress.has(uId)) {
          unitProgress.set(uId, {
            unitId: uId,
            unitTitle: lesson.unit.title,
            unitOrder: lesson.unit.order,
            completed: 0,
            total: 0,
          });
        }
        const up = unitProgress.get(uId)!;
        up.total++;
        if (p.completed) up.completed++;
      }

      return {
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        xp: s.xp,
        stars: s.stars,
        level: s.level,
        levelTitle: getLevelTitle(s.level),
        completedLessons: completed,
        totalLessons,
        completionPercent: totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0,
        bestScore: s.progress.length > 0 ? Math.max(...s.progress.map((p) => p.bestScore)) : 0,
        totalAttempts: s.progress.reduce((sum, p) => sum + p.attempts, 0),
        achievements: s.achievements.map((sa) => ({
          key: sa.achievement.key,
          title: sa.achievement.title,
          icon: sa.achievement.icon,
        })),
        unitProgress: Array.from(unitProgress.values()).sort(
          (a, b) => a.unitOrder - b.unitOrder
        ),
        createdAt: s.createdAt,
      };
    });

    return NextResponse.json({ students: studentData });
  } catch (error) {
    console.error("Error fetching teacher students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
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