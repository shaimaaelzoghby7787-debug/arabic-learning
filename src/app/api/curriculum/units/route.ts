import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const units = await db.unit.findMany({
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            title: true,
            letter: true,
            objectives: true,
            tip: true,
          },
        },
      },
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}