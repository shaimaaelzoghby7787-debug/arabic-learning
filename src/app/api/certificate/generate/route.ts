import { NextRequest, NextResponse } from "next/server";
import { getLevelTitle } from "@/lib/curriculum-data";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, score, level = 1 } = body;

    if (!studentId || score === undefined) {
      return NextResponse.json(
        { error: "studentId and score are required" },
        { status: 400 }
      );
    }

    if (score < 70) {
      return NextResponse.json(
        {
          error: "Certificate requires a score of 70 or higher",
          required: 70,
          achieved: score,
        },
        { status: 400 }
      );
    }

    // Generate a certificate number (simple incrementing)
    const certNo = `AR-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;

    const certificate = {
      id: crypto.randomUUID().slice(0, 8),
      studentId,
      certificateNo: certNo,
      score,
      level: getLevelTitle(level),
      issuedAt: new Date().toISOString(),
    };

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error) {
    console.error("Error generating certificate:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}