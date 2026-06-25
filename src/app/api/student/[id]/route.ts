import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const student = await db.student.findUnique({
      where: { id },
      include: {
        progress: true,
        achievements: {
          include: {
            achievement: true,
          },
          orderBy: { unlockedAt: "asc" },
        },
        certificates: {
          orderBy: { issuedAt: "desc" },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Fetch all lessons to enrich progress with lesson/unit info
    const allLessons = await db.lesson.findMany({
      include: {
        unit: {
          select: { id: true, title: true, order: true },
        },
      },
    });
    const lessonMap = new Map(allLessons.map((l) => [l.id, l]));

    // Enrich progress with lesson details
    const enrichedProgress = student.progress
      .map((p) => {
        const lesson = lessonMap.get(p.lessonId);
        if (!lesson) return null;
        return {
          ...p,
          lesson: {
            id: lesson.id,
            title: lesson.title,
            letter: lesson.letter,
            order: lesson.order,
            unit: lesson.unit,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.lesson.order - b!.lesson.order);

    // Compute level info
    const levelInfo = getLevelInfo(student.xp);

    // Count completed lessons
    const completedLessons = student.progress.filter((p) => p.completed).length;

    return NextResponse.json({
      id: student.id,
      name: student.name,
      avatar: student.avatar,
      xp: student.xp,
      stars: student.stars,
      level: student.level,
      levelTitle: levelInfo.title,
      nextLevelXp: levelInfo.nextLevelXp,
      completedLessons,
      totalAttempts: student._count.attempts,
      progress: enrichedProgress,
      achievements: student.achievements.map((sa) => ({
        id: sa.achievement.id,
        key: sa.achievement.key,
        title: sa.achievement.title,
        description: sa.achievement.description,
        icon: sa.achievement.icon,
        unlockedAt: sa.unlockedAt,
      })),
      certificates: student.certificates,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

function getLevelInfo(xp: number) {
  if (xp >= 1000) return { title: "نجم الصف الأول", level: 5, nextLevelXp: null };
  if (xp >= 600) return { title: "بطل اللغة العربية", level: 4, nextLevelXp: 1000 };
  if (xp >= 300) return { title: "متعلم نشيط", level: 3, nextLevelXp: 600 };
  if (xp >= 100) return { title: "قارئ صغير", level: 2, nextLevelXp: 300 };
  return { title: "مبتدئ", level: 1, nextLevelXp: 100 };
}