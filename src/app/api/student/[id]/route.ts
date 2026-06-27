import { NextRequest, NextResponse } from "next/server";
import {
  getLevelInfo,
  ACHIEVEMENTS,
  UNITS,
  getLessonsByUnit,
} from "@/lib/curriculum-data";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const student = {
      id,
      name: body.name || "",
      avatar: body.avatar || "🧒",
      xp: body.xp ?? 0,
      stars: body.stars ?? 0,
      level: body.level ?? 1,
    };

    const completedLessons: string[] = body.completedLessons || [];
    const lessonProgress: Record<string, { bestScore: number; starsEarned: number; attempts: number; xpEarned: number }> =
      body.lessonProgress || {};
    const unlockedAchievementKeys: string[] = body.unlockedAchievements || [];

    // Enrich progress with lesson details
    const enrichedProgress = Object.entries(lessonProgress)
      .map(([lessonId, prog]) => {
        // Find the lesson in our static data
        for (const unit of UNITS) {
          const lesson = getLessonsByUnit(unit.id).find((l) => l.id === lessonId);
          if (lesson) {
            return {
              lessonId,
              completed: completedLessons.includes(lessonId),
              bestScore: prog.bestScore,
              starsEarned: prog.starsEarned,
              attempts: prog.attempts,
              xpEarned: prog.xpEarned,
              lesson: {
                id: lesson.id,
                title: lesson.title,
                letter: lesson.letter,
                order: lesson.order,
                unit: { id: unit.id, title: unit.title, order: unit.order },
              },
            };
          }
        }
        return null;
      })
      .filter(Boolean)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        ((a as Record<string, unknown>).lesson as Record<string, unknown>).order >
        ((b as Record<string, unknown>).lesson as Record<string, unknown>).order
          ? 1
          : -1
      );

    // Compute level info
    const levelInfo = getLevelInfo(student.xp);

    // Count completed lessons
    const completedCount = completedLessons.length;

    // Map achievements
    const achievements = unlockedAchievementKeys
      .map((key) => ACHIEVEMENTS.find((a) => a.key === key))
      .filter(Boolean)
      .map((a) => ({
        id: a!.id,
        key: a!.key,
        title: a!.title,
        description: a!.description,
        icon: a!.icon,
        unlockedAt: new Date().toISOString(), // approximate
      }));

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        xp: student.xp,
        stars: student.stars,
        level: student.level,
        levelTitle: levelInfo.title,
        nextLevelXp: levelInfo.nextLevelXp,
        completedLessons: completedCount,
        totalAttempts: Object.values(lessonProgress).reduce(
          (sum: number, p: Record<string, unknown>) => sum + ((p.attempts as number) || 0),
          0
        ),
        progress: enrichedProgress,
        achievements,
        certificates: [],
      },
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}