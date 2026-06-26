import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, score } = body;

    if (!studentId || score === undefined) {
      return NextResponse.json(
        { error: "studentId and score are required" },
        { status: 400 }
      );
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, level: true, xp: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (score < 70) {
      return NextResponse.json({
        error: "Certificate requires a score of 70 or higher",
        required: 70,
        achieved: score,
      }, { status: 400 });
    }

    // Generate a certificate number
    const certCount = await db.certificate.count();
    const certNo = `AR-${String(certCount + 1).padStart(4, "0")}`;

    const levelLabel =
      student.level >= 5
        ? "نجم الصف الأول"
        : student.level >= 4
        ? "بطل اللغة العربية"
        : student.level >= 3
        ? "متعلم نشيط"
        : student.level >= 2
        ? "قارئ صغير"
        : "مبتدئ";

    const certificate = await db.certificate.create({
      data: {
        studentId,
        certificateNo: certNo,
        score,
        level: levelLabel,
      },
    });

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error) {
    console.error("Error generating certificate:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}