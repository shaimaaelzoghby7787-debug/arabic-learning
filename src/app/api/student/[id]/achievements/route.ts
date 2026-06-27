import { NextRequest, NextResponse } from "next/server";
import { ACHIEVEMENTS } from "@/lib/curriculum-data";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const unlockedKeys: string[] = body.unlockedKeys || [];

    const unlockedSet = new Set(unlockedKeys);

    const achievements = ACHIEVEMENTS.map((a) => ({
      id: a.id,
      key: a.key,
      title: a.title,
      description: a.description,
      icon: a.icon,
      xpReward: a.xpReward,
      unlocked: unlockedSet.has(a.key),
      unlockedAt: unlockedSet.has(a.key) ? new Date().toISOString() : null,
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