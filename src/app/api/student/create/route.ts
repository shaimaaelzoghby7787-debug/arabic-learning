import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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

    // Generate a unique student ID
    const id = `student-${crypto.randomUUID().slice(0, 8)}`;

    const student = {
      id,
      name: name.trim(),
      avatar: studentAvatar,
      xp: 0,
      stars: 0,
      level: 1,
      isTeacher: false,
    };

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}