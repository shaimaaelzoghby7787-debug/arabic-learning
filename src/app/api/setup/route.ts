import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

// This route seeds the database on first deployment.
// Call: GET /api/setup?secret=arabic-platform-setup

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== "arabic-platform-setup") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if already seeded
    const unitCount = await db.unit.count();
    if (unitCount > 0) {
      return NextResponse.json({
        ok: true,
        message: "Database already seeded",
        units: unitCount,
      });
    }

    // Run seed logic
    await seedDatabase();

    const newCount = await db.unit.count();
    return NextResponse.json({
      ok: true,
      message: "Database seeded successfully!",
      units: newCount,
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Setup failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}