import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, avatar } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const studentAvatar = avatar && typeof avatar === "string" ? avatar : "🧒";

    // Get all lessons to create initial progress records
    const lessons = await db.lesson.findMany({
      select: { id: true },
    });

    // Create student with initial progress records in a transaction
    const student = await db.$transaction(async (tx) => {
      const newStudent = await tx.student.create({
        data: {
          name: name.trim(),
          avatar: studentAvatar,
          xp: 0,
          stars: 0,
          level: 1,
          isTeacher: false,
        },
      });

      if (lessons.length > 0) {
        await tx.progress.createMany({
          data: lessons.map((lesson) => ({
            studentId: newStudent.id,
            lessonId: lesson.id,
            completed: false,
            xpEarned: 0,
            starsEarned: 0,
            bestScore: 0,
            attempts: 0,
          })),
        });
      }

      return newStudent;
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}