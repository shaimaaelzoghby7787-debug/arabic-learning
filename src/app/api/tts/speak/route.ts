import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice, speed } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    // Limit text length to prevent abuse
    const trimmedText = text.trim().slice(0, 500);

    const zai = await ZAI.create();

    const ttsResponse = await zai.audio.tts.create({
      input: trimmedText,
      voice: voice || "alloy",
      response_format: "mp3",
      speed: speed || 1.0,
    });

    // The SDK may return base64 audio data or a buffer in various shapes
    let audioBase64 = "";
    let audioUrl: string | null = null;

    if (Buffer.isBuffer(ttsResponse)) {
      audioBase64 = ttsResponse.toString("base64");
    } else if (ttsResponse instanceof Uint8Array) {
      audioBase64 = Buffer.from(ttsResponse.buffer, ttsResponse.byteOffset, ttsResponse.byteLength).toString("base64");
    } else if (ttsResponse instanceof ArrayBuffer) {
      audioBase64 = Buffer.from(new Uint8Array(ttsResponse)).toString("base64");
    } else if (typeof ttsResponse === "string") {
      if (ttsResponse.startsWith("http")) {
        audioUrl = ttsResponse;
      } else {
        audioBase64 = ttsResponse;
      }
    } else if (ttsResponse && typeof ttsResponse === "object") {
      const resp = ttsResponse as Record<string, unknown>;
      if (typeof resp.audio === "string") {
        audioBase64 = resp.audio;
      } else if (typeof resp.data === "string") {
        audioBase64 = resp.data;
      } else if (typeof resp.url === "string") {
        audioUrl = resp.url;
      } else if (resp.data && Buffer.isBuffer(resp.data)) {
        audioBase64 = (resp.data as Buffer).toString("base64");
      } else {
        audioBase64 = Buffer.from(JSON.stringify(ttsResponse)).toString("base64");
      }
    }

    return NextResponse.json({
      audio: audioBase64,
      audioUrl,
      format: "mp3",
      text: trimmedText,
    });
  } catch (error) {
    console.error("Error generating TTS:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}