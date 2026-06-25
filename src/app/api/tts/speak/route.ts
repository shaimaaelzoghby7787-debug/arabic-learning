import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// Simple in-memory cache for TTS audio (key: text, value: buffer)
const ttsCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 200;

// Track recent requests per text to avoid duplicate concurrent calls
const pendingRequests = new Map<string, Promise<Buffer | null>>();

async function generateTTS(text: string, speed: number): Promise<Buffer | null> {
  // Check cache first
  const cached = ttsCache.get(text);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.buffer;
  }

  // Check if there's already a pending request for this text
  const pending = pendingRequests.get(text);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const zai = await ZAI.create();
      const response = await zai.audio.tts.create({
        input: text,
        voice: "tongtong",
        speed: speed,
        response_format: "wav",
        stream: false,
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(arrayBuffer));

      if (buffer.length < 100) return null;

      // Store in cache
      if (ttsCache.size >= MAX_CACHE_SIZE) {
        // Evict oldest entry
        const oldestKey = [...ttsCache.entries()].sort(
          (a, b) => a[1].timestamp - b[1].timestamp
        )[0][0];
        ttsCache.delete(oldestKey);
      }
      ttsCache.set(text, { buffer, timestamp: Date.now() });

      return buffer;
    } catch (error) {
      console.error("TTS generation error:", error);
      return null;
    } finally {
      pendingRequests.delete(text);
    }
  })();

  pendingRequests.set(text, promise);
  return promise;
}

// Retry wrapper with exponential backoff for 429 errors
async function generateWithRetry(
  text: string,
  speed: number,
  maxRetries = 2
): Promise<Buffer | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await generateTTS(text, speed);
    if (result) return result;

    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, speed } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    const trimmedText = text.trim().slice(0, 1024);
    const buffer = await generateWithRetry(trimmedText, speed || 0.8);

    if (!buffer) {
      return NextResponse.json(
        { error: "Failed to generate speech. Please try again in a moment." },
        { status: 503 }
      );
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("TTS route error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}