import { NextRequest, NextResponse } from "next/server";
import { UNITS, getLessonsByUnit } from "@/lib/curriculum-data";

function buildProgressResponse(
  studentId: string,
  completedLessons: string[],
  lessonProgress: Record<string, { bestScore: number; starsEarned: number; attempts: number; xpEarned: number }>,
  name: string = "",
  avatar: string = "🧒"
) {
  const student = {
    id: studentId,
    name,
    avatar,
  };

  const byUnit: Array<{
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
  }> = [];

  for (const unit of UNITS) {
    const unitLessons = getLessonsByUnit(unit.id);
    const unitEntry = {
      unitId: unit.id,
      unitTitle: unit.title,
      unitOrder: unit.order,
      lessons: unitLessons.map((l) => {
        const prog = lessonProgress[l.id];
        return {
          lessonId: l.id,
          lessonTitle: l.title,
          lessonOrder: l.order,
          letter: l.letter,
          completed: completedLessons.includes(l.id),
          bestScore: prog?.bestScore ?? 0,
          starsEarned: prog?.starsEarned ?? 0,
          attempts: prog?.attempts ?? 0,
          xpEarned: prog?.xpEarned ?? 0,
          lastAttemptAt: prog && prog.attempts > 0 ? new Date().toISOString() : null,
        };
      }),
    };
    byUnit.push(unitEntry);
  }

  byUnit.sort((a, b) => a.unitOrder - b.unitOrder);

  const totalLessons = UNITS.reduce(
    (sum, u) => sum + getLessonsByUnit(u.id).length,
    0
  );
  const totalCompleted = completedLessons.length;
  const totalXp = Object.values(lessonProgress).reduce(
    (sum, p) => sum + p.xpEarned,
    0
  );
  const totalStars = Object.values(lessonProgress).reduce(
    (sum, p) => sum + p.starsEarned,
    0
  );

  return NextResponse.json({
    student,
    totalLessons,
    totalCompleted,
    totalXp,
    totalStars,
    overallProgress:
      totalLessons > 0
        ? Math.round((totalCompleted / totalLessons) * 100)
        : 0,
    units: byUnit,
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    return buildProgressResponse(studentId, [], {});
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const body = await request.json().catch(() => ({}));

    const completedLessons: string[] = body.completedLessons || [];
    const lessonProgress: Record<string, { bestScore: number; starsEarned: number; attempts: number; xpEarned: number }> =
      body.lessonProgress || {};
    const name: string = body.name || "";
    const avatar: string = body.avatar || "🧒";

    return buildProgressResponse(studentId, completedLessons, lessonProgress, name, avatar);
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}