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
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get all achievements with unlock status
    const allAchievements = await db.achievement.findMany({
      orderBy: { id: "asc" },
    });

    const unlockedMap = new Map(
      (
        await db.studentAchievement.findMany({
          where: { studentId: id },
          select: { achievementId: true, unlockedAt: true },
        })
      ).map((sa) => [sa.achievementId, sa.unlockedAt])
    );

    const achievements = allAchievements.map((a) => ({
      id: a.id,
      key: a.key,
      title: a.title,
      description: a.description,
      icon: a.icon,
      xpReward: a.xpReward,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) ?? null,
    }));

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}