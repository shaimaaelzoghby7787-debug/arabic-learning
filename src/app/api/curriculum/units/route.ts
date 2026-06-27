import { NextResponse } from "next/server";
import { UNITS, getLessonsByUnit } from "@/lib/curriculum-data";

export async function GET() {
  try {
    const unitsWithLessons = UNITS.map((unit) => ({
      id: unit.id,
      order: unit.order,
      title: unit.title,
      description: unit.description,
      lessons: getLessonsByUnit(unit.id).map((l) => ({
        id: l.id,
        order: l.order,
        title: l.title,
        letter: l.letter,
        objectives: l.objectives,
        tip: l.tip,
      })),
    }));

    return NextResponse.json({ units: unitsWithLessons });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}