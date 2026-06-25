/**
 * Arabic TTS using the browser's built-in SpeechSynthesis API.
 * The z-ai-web-dev-sdk TTS voices do not support Arabic,
 * so we use the native Web Speech API which has Arabic voice support.
 */

// Cache the best Arabic voice once found
let cachedArabicVoice: SpeechSynthesisVoice | null = null;
let voiceCacheInitialized = false;

function findArabicVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  // Return cached voice if available
  if (voiceCacheInitialized && cachedArabicVoice) return cachedArabicVoice;

  const voices = window.speechSynthesis.getVoices();

  // Priority 1: Arabic voices (any dialect)
  const arVoice = voices.find(
    (v) => v.lang.startsWith('ar') && v.localService
  );
  if (arVoice) {
    cachedArabicVoice = arVoice;
    voiceCacheInitialized = true;
    return arVoice;
  }

  // Priority 2: Any Arabic voice (including remote)
  const anyArVoice = voices.find((v) => v.lang.startsWith('ar'));
  if (anyArVoice) {
    cachedArabicVoice = anyArVoice;
    voiceCacheInitialized = true;
    return anyArVoice;
  }

  voiceCacheInitialized = true;
  return null;
}

/**
 * Speak Arabic text using the browser's SpeechSynthesis API.
 * Falls back to a generic voice if no Arabic voice is found.
 */
export function speakArabic(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: (e: SpeechSynthesisErrorEvent) => void;
  }
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  const utterance = new SpeechSynthesisUtterance(text);

  // Set language to Arabic (Egyptian Arabic preferred for Egyptian curriculum)
  utterance.lang = 'ar-EG';

  // Try to find and set an Arabic voice
  const voice = findArabicVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang; // Use the voice's exact lang code
  }

  // Configure speech parameters
  utterance.rate = options?.rate ?? 0.75; // Slightly slower for children
  utterance.pitch = options?.pitch ?? 1.0;

  // Event handlers
  if (options?.onEnd) utterance.onend = options.onEnd;
  if (options?.onError) utterance.onerror = options.onError;

  // Cancel any current speech before starting new one
  window.speechSynthesis.cancel();

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Preload voices (call this on component mount to ensure voices are loaded)
 */
export function preloadVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
      return;
    }

    // Voices load asynchronously on some browsers
    window.speechSynthesis.onvoiceschanged = () => {
      resolve();
    };

    // Timeout fallback
    setTimeout(resolve, 1000);
  });
}

/**
 * Check if TTS is currently speaking
 */
export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return window.speechSynthesis.speaking;
}