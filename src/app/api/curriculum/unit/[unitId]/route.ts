import { NextRequest, NextResponse } from "next/server";
import { getUnitById, getLessonsByUnit } from "@/lib/curriculum-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const { unitId } = await params;

    const unit = getUnitById(unitId);

    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      );
    }

    const lessons = getLessonsByUnit(unitId).map((l) => ({
      ...l,
      // words is already string[] from curriculum-data
    }));

    return NextResponse.json({
      ...unit,
      lessons,
    });
  } catch (error) {
    console.error("Error fetching unit:", error);
    return NextResponse.json(
      { error: "Failed to fetch unit" },
      { status: 500 }
    );
  }
}