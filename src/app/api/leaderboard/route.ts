import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const students = await db.student.findMany({
      where: { isTeacher: false },
      select: {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        stars: true,
        level: true,
        createdAt: true,
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { xp: "desc" },
    });

    // Get completed lesson counts for each student
    const progressAgg = await db.progress.groupBy({
      by: ["studentId"],
      where: { completed: true },
      _count: { studentId: true },
    });

    const completedMap = new Map(
      progressAgg.map((p) => [p.studentId, p._count.studentId])
    );

    // Get total lessons for percentage
    const totalLessons = await db.lesson.count();

    const leaderboard = students.map((s, index) => ({
      rank: index + 1,
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      xp: s.xp,
      stars: s.stars,
      level: s.level,
      levelTitle: getLevelTitle(s.level),
      completedLessons: completedMap.get(s.id) ?? 0,
      totalLessons,
      completionPercent:
        totalLessons > 0
          ? Math.round(((completedMap.get(s.id) ?? 0) / totalLessons) * 100)
          : 0,
      totalAttempts: s._count.attempts,
      joinedAt: s.createdAt,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
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