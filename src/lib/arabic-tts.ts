/**
 * Arabic TTS using the browser's built-in SpeechSynthesis API.
 * The z-ai-web-dev-sdk TTS voices do not support Arabic,
 * so we use the native Web Speech API which has Arabic voice support.
 */

// Letter names map for sukun pronunciation
const LETTER_NAMES: Record<string, string> = {
  'ا': 'ألف', 'أ': 'ألف', 'إ': 'ألف', 'آ': 'ألف',
  'ب': 'باء', 'ت': 'تاء', 'ث': 'ثاء', 'ج': 'جيم',
  'ح': 'حاء', 'خ': 'خاء', 'د': 'دال', 'ذ': 'ذال',
  'ر': 'راء', 'ز': 'زاي', 'س': 'سين', 'ش': 'شين',
  'ص': 'صاد', 'ض': 'ضاد', 'ط': 'طاء', 'ظ': 'ظاء',
  'ع': 'عين', 'غ': 'غين', 'ف': 'فاء', 'ق': 'قاف',
  'ك': 'كاف', 'ل': 'لام', 'م': 'ميم', 'ن': 'نون',
  'ه': 'هاء', 'و': 'واو', 'ي': 'ياء',
};

/**
 * Enhance Arabic text for clearer diacritic pronunciation.
 *
 * Browser TTS often doesn't clearly pronounce isolated diacritical marks.
 * This function adds context letters to make each harakat obvious:
 *
 * - فتحة (َ) → adds ألف:   "بَ" → "بَا"  (bā)
 * - ضمة  (ُ) → adds واو:   "بُ" → "بُو"  (bū)
 * - كسرة (ِ) → adds ياء:   "بِ" → "بِي"  (bī)
 * - سكون (ْ) → letter name + "ساكنة":  "بْ" → "باء ساكنة"
 * - تنوين (ً ٌ ٍ) → same vowel logic + nun
 * - Plain letter → letter name: "ب" → "باء"
 */
export function enhanceArabicPronunciation(text: string): string {
  // Strip leading/trailing whitespace
  const trimmed = text.trim();
  if (!trimmed) return text;

  // Handle sukun (سكون): "بْ" → "باء ساكنة"
  if (trimmed.endsWith('ْ')) {
    const baseLetter = trimmed.replace('ْ', '').trim();
    if (baseLetter.length === 1 && LETTER_NAMES[baseLetter]) {
      return `${LETTER_NAMES[baseLetter]} ساكنة`;
    }
    // Fallback: repeat the letter with a pause for emphasis
    return `${trimmed}، ${trimmed}`;
  }

  // Handle damma (ضمة): "بُ" → "بُو" — add واو to make the 'u' sound clear
  if (trimmed.endsWith('ُ')) {
    const base = trimmed.replace('ُ', '');
    return `${trimmed}و`;
  }

  // Handle kasra (كسرة): "بِ" → "بِي" — add ياء to make the 'i' sound clear
  if (trimmed.endsWith('ِ')) {
    const base = trimmed.replace('ِ', '');
    return `${trimmed}ي`;
  }

  // Handle fatḥa tanween (ً): "بً" → "بًان" — add ألف + نون
  if (trimmed.endsWith('ً')) {
    return `${trimmed}ن`;
  }

  // Handle ḍamma tanween (ٌ): "بٌ" → "بٌون"
  if (trimmed.endsWith('ٌ')) {
    return `${trimmed}ن`;
  }

  // Handle kasra tanween (ٍ): "بٍ" → "بٍين"
  if (trimmed.endsWith('ٍ')) {
    return `${trimmed}ن`;
  }

  // Handle fatḥa (فتحة): "بَ" → "بَا" — add ألف to make the 'a' sound clear
  if (trimmed.endsWith('َ')) {
    return `${trimmed}ا`;
  }

  // Handle shadda (ّ): "بّ" → "بّ" (repeat for emphasis)
  if (trimmed.endsWith('ّ')) {
    return `${trimmed}، ${trimmed}`;
  }

  // Plain letter without diacritic: use letter name
  if (trimmed.length === 1 && LETTER_NAMES[trimmed]) {
    return LETTER_NAMES[trimmed];
  }

  // For words or multi-character text, return as-is
  return text;
}

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
    /** If true, skip enhanceArabicPronunciation (for full words/sentences) */
    raw?: boolean;
  }
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  // Auto-enhance short text (letters + diacritics) for clearer pronunciation
  const textToSpeak = options?.raw ? text : enhanceArabicPronunciation(text);

  const utterance = new SpeechSynthesisUtterance(textToSpeak);

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