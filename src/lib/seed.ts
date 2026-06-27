import { db } from "@/lib/db";

// ============================================================================
// TYPES
// ============================================================================

interface UnitData {
  order: number;
  title: string;
  description: string;
  lessons: LessonData[];
}

interface LessonData {
  order: number;
  title: string;
  letter: string;
  objectives: string;
  content: string;
  words: string[];
  tip: string;
  isIntro: boolean;
  introWords?: string[];
  introMeanings?: Record<string, string>;
}

interface QuestionData {
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: number;
  hint: string;
}

// ============================================================================
// HELPER: Shuffle and pick N items from array
// ============================================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

// ============================================================================
// QUESTION GENERATORS
// ============================================================================

const ALL_DISTRACTOR_LETTERS = [
  "أ","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","هـ","و","ي"
];

const EXTRA_DISTRACTOR_WORDS = [
  "شمس","قمر","نجم","بحر","جبل","شجرة","سماء","أرض","نهر","سحاب",
  "مطر","ثلج","رعد","برق","ظل","ضوء","صوت","ريح","رمل","حجر",
  "ذهب","فضة","حديد","نحاس","قطن","حرير","صوف","خشب","زجاج","ماء",
  "تفاح","موز","عنب","برتقال","مانجو","فراولة","خوخ","مشمش","تمر","تين",
  "سيارة","قطار","طائرة","سفينة","دراجة","حافلة","ترام","مترو","مركب","زورق"
];

function getDistractorWords(words: string[], count: number, exclude?: string[]): string[] {
  const excluded = new Set([...words, ...(exclude || [])]);
  const available = EXTRA_DISTRACTOR_WORDS.filter(w => !excluded.has(w));
  return pick(available, Math.min(count, available.length));
}

function getDistractorLetters(letter: string, count: number): string[] {
  const available = ALL_DISTRACTOR_LETTERS.filter(l => l !== letter);
  return pick(available, count);
}

// --- Generate letter-at-start questions ---
function genLetterAtStart(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  for (const word of words) {
    if (questions.length >= count) break;
    const distractors = getDistractorLetters(letter, 3);
    questions.push({
      type: "multiple_choice",
      question: `ما الحرف الأول في كلمة "${word}"؟`,
      options: shuffle([letter, ...distractors]),
      correctAnswer: letter,
      difficulty: 1,
      hint: `انظر إلى أول حرف في الكلمة`,
    });
  }
  return questions;
}

// --- Generate which-word-starts-with-letter questions ---
function genWhichWordStartsWith(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  const shuffled = shuffle(words);
  for (let i = 0; i < shuffled.length && questions.length < count; i++) {
    const correct = shuffled[i];
    const distractors = getDistractorWords(words, 3, [correct]);
    questions.push({
      type: "multiple_choice",
      question: `أي كلمة من التالية تبدأ بحرف ${letterName}؟`,
      options: shuffle([correct, ...distractors]),
      correctAnswer: correct,
      difficulty: 1,
      hint: `ابحث عن كلمة تبدأ بحرف ${letterName}`,
    });
  }
  return questions;
}

// --- Generate complete-word questions ---
function genCompleteWord(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  for (const word of words) {
    if (questions.length >= count) break;
    const masked = letter + " " + "_ ".repeat(word.length - 2).trim() + " " + word[word.length - 1];
    const distractors = getDistractorWords(words, 3, [word]);
    questions.push({
      type: "complete_word",
      question: `أكمل الكلمة: ${letter} _ ${word[word.length - 1]}`,
      options: shuffle([word, ...distractors]),
      correctAnswer: word,
      difficulty: 2,
      hint: `الكلمة تبدأ بحرف ${letterName} وتنتهي بحرف ${word[word.length - 1]}`,
    });
  }
  return questions;
}

// --- Generate true/false questions about letter position ---
function genTrueFalse(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  const startsWithLetter = words.filter(w => w[0] === letter);
  const otherWords = EXTRA_DISTRACTOR_WORDS.filter(w => w[0] !== letter);

  for (const word of startsWithLetter) {
    if (questions.length >= count) break;
    questions.push({
      type: "true_false",
      question: `كلمة "${word}" تبدأ بحرف ${letterName}`,
      options: ["صح", "خطأ"],
      correctAnswer: "صح",
      difficulty: 1,
      hint: `اقرأ أول حرف في كلمة "${word}"`,
    });
  }

  for (const word of otherWords) {
    if (questions.length >= count) break;
    questions.push({
      type: "true_false",
      question: `كلمة "${word}" تبدأ بحرف ${letterName}`,
      options: ["صح", "خطأ"],
      correctAnswer: "خطأ",
      difficulty: 2,
      hint: `اقرأ أول حرف في كلمة "${word}"`,
    });
  }

  return questions;
}

// --- Generate match-word-to-meaning questions ---
function genMatchWordToMeaning(words: string[], meanings: Record<string, string>, count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  for (const [word, meaning] of Object.entries(meanings)) {
    if (questions.length >= count) break;
    const otherMeanings = Object.values(meanings).filter(m => m !== meaning);
    const distractors = shuffle(otherMeanings).slice(0, 3);
    questions.push({
      type: "match_word",
      question: `ما معنى كلمة "${word}"؟`,
      options: shuffle([meaning, ...distractors]),
      correctAnswer: meaning,
      difficulty: 1,
      hint: `فكّر في معنى الكلمة`,
    });
  }
  return questions;
}

// --- Generate choose-the-letter questions ---
function genChooseLetter(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  for (const word of words) {
    if (questions.length >= count) break;
    const distractors = getDistractorLetters(letter, 3);
    questions.push({
      type: "choose_letter",
      question: `ما هو الحرف الناقص في كلمة "${word}"؟`,
      options: shuffle([letter, ...distractors]),
      correctAnswer: letter,
      difficulty: 2,
      hint: `انظر إلى الكلمة وتعرّف على الحرف الناقص`,
    });
  }
  return questions;
}

// --- Generate which-word-contains-letter questions ---
function genWhichWordContains(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  const shuffled = shuffle(words);
  for (let i = 0; i < shuffled.length && questions.length < count; i++) {
    const correct = shuffled[i];
    const distractors = getDistractorWords(words, 3, [correct]);
    questions.push({
      type: "multiple_choice",
      question: `أي كلمة من التالية تحتوي على حرف ${letterName}؟`,
      options: shuffle([correct, ...distractors]),
      correctAnswer: correct,
      difficulty: 2,
      hint: `اقرأ كل كلمة وابحث عن حرف ${letterName}`,
    });
  }
  return questions;
}

// --- Generate simple reading comprehension questions ---
function genReadingComprehension(letter: string, words: string[], meanings: Record<string, string>, count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  const sentences = [
    { s: `أرى ${words[0]} في ${words[1]}`, q: `أين يوجد ${words[0]}؟`, a: words[1] },
    { s: `أكلت ${words[2]} وكانت لذيذة`, q: `ماذا أكلت؟`, a: words[2] },
    { s: `${words[3]} جميل جداً`, q: `ما الذي وُصف بأنه جميل؟`, a: words[3] },
    { s: `ذهبت إلى ${words[0]} مع ${words[1]}`, q: `إلى أين ذهبت؟`, a: words[0] },
    { s: `لعب ${words[2]} مع ${words[3]} في الحديقة`, q: `من لعب في الحديقة؟`, a: words[2] },
  ];

  for (const item of sentences) {
    if (questions.length >= count) break;
    if (!item.s || !item.q || !item.a) continue;
    if (!words.includes(item.a)) continue;
    const distractors = getDistractorWords(words, 3, [item.a]);
    questions.push({
      type: "multiple_choice",
      question: `اقرأ الجملة واختر الإجابة الصحيحة:\n"${item.s}"\n${item.q}`,
      options: shuffle([item.a, ...distractors]),
      correctAnswer: item.a,
      difficulty: 3,
      hint: `اقرأ الجملة بعناية وابحث عن الكلمة المطلوبة`,
    });
  }
  return questions;
}

// --- Generate letter-position questions ---
function genLetterPosition(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  for (const word of words) {
    if (questions.length >= count) break;
    const positions: { pos: string; check: boolean }[] = [
      { pos: "أول", check: word[0] === letter },
      { pos: "وسط", check: word.length > 2 && word.includes(letter) && word[0] !== letter },
      { pos: "آخر", check: word[word.length - 1] === letter },
    ];
    for (const p of positions) {
      if (questions.length >= count) break;
      questions.push({
        type: "true_false",
        question: `حرف ${letterName} يأتي في ${p.pos} كلمة "${word}"`,
        options: ["صح", "خطأ"],
        correctAnswer: p.check ? "صح" : "خطأ",
        difficulty: 2,
        hint: `اقرأ كلمة "${word}" حرفاً بحرف`,
      });
    }
  }
  return questions;
}

// --- Generate "what letter does word start with" as choose_letter ---
function genIdentifyLetterInWord(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  for (const word of words) {
    if (questions.length >= count) break;
    const distractors = getDistractorLetters(letter, 3);
    questions.push({
      type: "choose_letter",
      question: `حرف ${letterName} هو الحرف الأول في أي كلمة؟`,
      options: shuffle([word, ...getDistractorWords(words, 3, [word])]),
      correctAnswer: word,
      difficulty: 1,
      hint: `ابحث عن كلمة تبدأ بحرف ${letterName}`,
    });
  }
  return questions;
}

// --- Generate "find the odd one out" questions ---
function genOddOneOut(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  for (let i = 0; i < count && questions.length < count; i++) {
    const correctWords = pick(words, 3);
    const oddWord = getDistractorWords(words, 1, correctWords)[0];
    if (!oddWord) continue;
    const options = shuffle([...correctWords, oddWord]);
    questions.push({
      type: "multiple_choice",
      question: `أي كلمة لا تبدأ بحرف ${letterName}؟`,
      options,
      correctAnswer: oddWord,
      difficulty: 2,
      hint: `اقرأ أول حرف من كل كلمة`,
    });
  }
  return questions;
}

// ============================================================================
// LETTER NAME MAP
// ============================================================================

function getLetterName(letter: string): string {
  const names: Record<string, string> = {
    "ب": "الباء", "م": "الميم", "ح": "الحاء", "ج": "الجيم", "د": "الدال",
    "ل": "اللام", "ن": "النون", "ر": "الراء", "ق": "القاف", "ك": "الكاف",
    "و": "الواو", "ه": "الهاء", "ذ": "الذال", "ظ": "الظاء",
    "ط": "الطاء", "ص": "الصاد", "ض": "الضاد", "ث": "الثاء",
  };
  return names[letter] || letter;
}

// ============================================================================
// COMBINED QUESTION GENERATOR FOR LETTER LESSONS (target: 100+)
// ============================================================================

function generateLetterQuestions(letter: string, words: string[], meanings: Record<string, string>): QuestionData[] {
  const allQuestions: QuestionData[] = [
    ...genLetterAtStart(letter, words, 8),
    ...genWhichWordStartsWith(letter, words, 8),
    ...genCompleteWord(letter, words, 8),
    ...genTrueFalse(letter, words, 15),
    ...genMatchWordToMeaning(words, meanings, 8),
    ...genChooseLetter(letter, words, 8),
    ...genWhichWordContains(letter, words, 8),
    ...genReadingComprehension(letter, words, meanings, 5),
    ...genLetterPosition(letter, words, 12),
    ...genIdentifyLetterInWord(letter, words, 8),
    ...genOddOneOut(letter, words, 5),
    ...genExtraQuestions(letter, words, meanings, 12),
  ];

  // Ensure we have at least 100
  if (allQuestions.length < 100) {
    const extra = 100 - allQuestions.length;
    for (let i = 0; i < extra; i++) {
      const word = words[i % words.length];
      const distractors = getDistractorLetters(letter, 3);
      allQuestions.push({
        type: "multiple_choice",
        question: `ما الحرف الأول في كلمة "${word}"؟ (${i + 1})`,
        options: shuffle([letter, ...distractors]),
        correctAnswer: letter,
        difficulty: 1,
        hint: `انظر إلى أول حرف في الكلمة`,
      });
    }
  }

  return allQuestions.slice(0, 110);
}

// --- Extra variety questions ---
function genExtraQuestions(letter: string, words: string[], meanings: Record<string, string>, count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);

  // "How many letters" questions
  for (const word of words) {
    if (questions.length >= count / 2) break;
    const correct = String(word.length);
    const wrong1 = String(word.length + 1);
    const wrong2 = String(Math.max(1, word.length - 1));
    questions.push({
      type: "multiple_choice",
      question: `كم عدد حروف كلمة "${word}"؟`,
      options: shuffle([correct, wrong1, wrong2, "٥"]),
      correctAnswer: correct,
      difficulty: 1,
      hint: `عدّ حروف كلمة "${word}" واحداً واحداً`,
    });
  }

  // "Which letter is in the middle" questions
  for (const word of words) {
    if (questions.length >= count) break;
    if (word.length < 3) continue;
    const midIdx = Math.floor(word.length / 2);
    const midLetter = word[midIdx];
    const distractors = getDistractorLetters(midLetter, 3);
    questions.push({
      type: "choose_letter",
      question: `ما الحرف الذي يأتي في وسط كلمة "${word}"؟`,
      options: shuffle([midLetter, ...distractors]),
      correctAnswer: midLetter,
      difficulty: 3,
      hint: `عدّ الحروف وابحث عن الحرف الأوسط`,
    });
  }

  return questions;
}

// ============================================================================
// INTRO LESSON QUESTION GENERATOR (target: 50+)
// ============================================================================

function generateIntroQuestions(unitTitle: string, introWords: string[], introMeanings: Record<string, string>): QuestionData[] {
  const questions: QuestionData[] = [];

  // Multiple choice: what does this word mean?
  for (const [word, meaning] of Object.entries(introMeanings)) {
    if (questions.length >= 15) break;
    const otherMeanings = Object.values(introMeanings).filter(m => m !== meaning);
    const distractors = shuffle(otherMeanings).slice(0, 3);
    questions.push({
      type: "multiple_choice",
      question: `ما معنى كلمة "${word}"؟`,
      options: shuffle([meaning, ...distractors]),
      correctAnswer: meaning,
      difficulty: 1,
      hint: `فكّر في معنى الكلمة في سياق ${unitTitle}`,
    });
  }

  // True/False about topic words
  for (const [word, meaning] of Object.entries(introMeanings)) {
    if (questions.length >= 30) break;
    questions.push({
      type: "true_false",
      question: `كلمة "${word}" تعني ${meaning}`,
      options: ["صح", "خطأ"],
      correctAnswer: "صح",
      difficulty: 1,
      hint: `هل هذا المعنى صحيح لكلمة "${word}"؟`,
    });
  }

  // Match word to meaning
  for (const [word, meaning] of Object.entries(introMeanings)) {
    if (questions.length >= 40) break;
    const otherWords = Object.keys(introMeanings).filter(w => w !== word);
    const distractorWords = shuffle(otherWords).slice(0, 3);
    questions.push({
      type: "match_word",
      question: `وصل الكلمة بمعناها الصحيح: "${word}"`,
      options: shuffle([meaning, ...distractorWords.map(w => introMeanings[w])]),
      correctAnswer: meaning,
      difficulty: 1,
      hint: `ابحث عن المعنى الصحيح لكلمة "${word}"`,
    });
  }

  // Choose letter for intro words
  for (const word of introWords) {
    if (questions.length >= 50) break;
    const firstLetter = word[0];
    const distractors = getDistractorLetters(firstLetter, 3);
    questions.push({
      type: "choose_letter",
      question: `ما الحرف الأول في كلمة "${word}"؟`,
      options: shuffle([firstLetter, ...distractors]),
      correctAnswer: firstLetter,
      difficulty: 1,
      hint: `انظر إلى أول حرف في الكلمة`,
    });
  }

  // Ensure at least 50
  if (questions.length < 50) {
    const extra = 50 - questions.length;
    for (let i = 0; i < extra; i++) {
      const word = introWords[i % introWords.length];
      const distractors = getDistractorWords(introWords, 3, [word]);
      questions.push({
        type: "multiple_choice",
        question: `أي كلمة التالية مرتبطة بـ${unitTitle}؟`,
        options: shuffle([word, ...distractors]),
        correctAnswer: word,
        difficulty: 1,
        hint: `فكّر في كلمات ترتبط بـ${unitTitle}`,
      });
    }
  }

  return questions.slice(0, 55);
}

// ============================================================================
// ALL DATA: UNITS, LESSONS, WORDS, MEANINGS
// ============================================================================

const UNITS: UnitData[] = [
  // ===== UNIT 1: أسرتي =====
  {
    order: 1,
    title: "أسرتي",
    description: "في هذا الوحدة سنتعلم عن الأسره والحروف ب م ح ج د",
    lessons: [
      // --- Intro ---
      {
        order: 0,
        title: "تمهيد: أسرتي",
        letter: "",
        objectives: "التعرف على مفهوم الأسرة وأهمية العائلة في حياتنا",
        content: "الأسرة هي مجموعة من الأشخاص يعيشون معاً و يحبون بعضهم البعض. الأسرة تتكون من أب وأم وأطفال. نحن نحب أسرتنا ونحترمها. في هذا الوحدة سنتعلم حروفاً جديدة تساعدنا على قراءة كلمات عن أسرتنا.",
        words: ["أب", "أم", "بيت", "عائلة", "أخ", "أخت"],
        tip: "الأسرة هي أغلى ما نملك، تعلّم كلمات عن أسرتك!",
        isIntro: true,
        introWords: ["أب", "أم", "بيت", "عائلة", "أخ", "أخت"],
        introMeanings: {
          "أب": "والد الطفل",
          "أم": "والدة الطفل",
          "بيت": "المكان الذي نعيش فيه",
          "عائلة": "مجموعة الأقارب",
          "أخ": "ابن الأم والأب (ذكر)",
          "أخت": "ابنة الأم والأب (أنثى)",
        },
      },
      // --- ب ---
      {
        order: 1,
        title: "حرف الباء",
        letter: "ب",
        objectives: "التعرف على حرف الباء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الباء",
        content: "حرف الباء هو الحرف الثاني في اللغة العربية. يُنطق باء. نجد حرف الباء في بداية كلمات كثيرة مثل: باب، بيت، بطة. تدرّب على كتابة حرف الباء وقراءة الكلمات التي تبدأ به.",
        words: ["باب", "بيت", "بطة", "بقرة", "أب", "أبي", "برتقال", "بسمة"],
        tip: "حرف الباء يُكتب من أسفل إلى أعلى. تدرّب على كتابته!",
        isIntro: false,
      },
      // --- م ---
      {
        order: 2,
        title: "حرف الميم",
        letter: "م",
        objectives: "التعرف على حرف الميم وأصواته وقراءة وكتابة كلمات تحتوي على حرف الميم",
        content: "حرف الميم هو حرف مهم في اللغة العربية. يُنطق ميماً. نجد حرف الميم في كلمات مثل: ماء، مدرسة، أمّي. تعلّم كيف تكتب حرف الميم وتقرأ الكلمات التي تحتوي عليه.",
        words: ["ماء", "مدرسة", "أم", "أمي", "ممتاز", "منزل", "موزة", "مسطرة"],
        tip: "حرف الميم له ثلاثة أشكال حسب موقعه في الكلمة",
        isIntro: false,
      },
      // --- ح ---
      {
        order: 3,
        title: "حرف الحاء",
        letter: "ح",
        objectives: "التعرف على حرف الحاء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الحاء",
        content: "حرف الحاء حرف رقيق يُنطق من الحلق. نجد حرف الحاء في كلمات مثل: حديقة، حصان، حوت. تعلّم كيف تميّز حرف الحاء وتقرأ الكلمات التي تحتوي عليه.",
        words: ["حديقة", "حصان", "حوت", "حليب", "أحمد", "حجرة", "حقيبة", "حرف"],
        tip: "حرف الحاء يُنطق من أعمق الحلق. مارس نطقه!",
        isIntro: false,
      },
      // --- ج ---
      {
        order: 4,
        title: "حرف الجيم",
        letter: "ج",
        objectives: "التعرف على حرف الجيم وأصواته وقراءة وكتابة كلمات تحتوي على حرف الجيم",
        content: "حرف الجيم حرف جميل يُنطق جيماً. نجد حرف الجيم في كلمات مثل: جمل، جار، جدار. تعلّم كيف تكتب حرف الجيم وتقرأ الكلمات التي تبدأ به.",
        words: ["جمل", "جار", "جدار", "جدي", "جزيرة", "جمال", "جنيه", "جداول"],
        tip: "حرف الجيم يُكتب برأس صغير في الأعلى. انتبه لشكله!",
        isIntro: false,
      },
      // --- د ---
      {
        order: 5,
        title: "حرف الدال",
        letter: "د",
        objectives: "التعرف على حرف الدال وأصواته وقراءة وكتابة كلمات تحتوي على حرف الدال",
        content: "حرف الدال حرف مهم يُنطق دالاً. نجد حرف الدال في كلمات مثل: دب، دجاجة، دراجة. تعلّم كيف تكتب حرف الدال وتقرأ الكلمات التي تحتوي عليه.",
        words: ["دب", "دجاجة", "دراجة", "دادا", "دمية", "دلو", "دكان", "ديك"],
        tip: "حرف الدال يشبه حرف الراء لكن له بطن مختلف. فرّق بينهما!",
        isIntro: false,
      },
    ],
  },
  // ===== UNIT 2: حيواناتي =====
  {
    order: 2,
    title: "حيواناتي",
    description: "في هذا الوحدة سنتعلم عن الحيوانات والحروف ل ن ر ق ك",
    lessons: [
      // --- Intro ---
      {
        order: 0,
        title: "تمهيد: حيواناتي",
        letter: "",
        objectives: "التعرف على الحيوانات المختلفة وأسمائها باللغة العربية",
        content: "الله خلق لنا الكثير من الحيوانات الجميلة. هناك حيوانات تعيش في المزرعة مثل البقرة والديك. وهناك حيوانات تعيش في الغابة مثل الأسد والنمر. تعلّم أسماء الحيوانات باللغة العربية!",
        words: ["قطة", "كلب", "حصان", "بقرة", "ديك", "أرنب"],
        tip: "الحيوانات كائنات جميلة، تعلّم أسماءها بالعربية!",
        isIntro: true,
        introWords: ["قطة", "كلب", "حصان", "بقرة", "ديك", "أرنب"],
        introMeanings: {
          "قطة": "حيوان صغير ينمو",
          "كلب": "حيوان أليف يحرس المنزل",
          "حصان": "حيوان كبير يركبه الإنسان",
          "بقرة": "حيوان يعطينا الحليب",
          "ديك": "ذكر الدجاجة يصيح صباحاً",
          "أرنب": "حيوان صغير له أذنان طويلتان",
        },
      },
      // --- ل ---
      {
        order: 1,
        title: "حرف اللام",
        letter: "ل",
        objectives: "التعرف على حرف اللام وأصواته وقراءة وكتابة كلمات تحتوي على حرف اللام",
        content: "حرف اللام حرف مهم جداً في اللغة العربية. يُنطق لاماً. نجد حرف اللام في كلمات مثل: لعب، ليمون، كلب. تعلّم كيف تكتب حرف اللام وتقرأ الكلمات التي تحتوي عليه.",
        words: ["لعب", "ليمون", "كلب", "لؤلؤ", "لحم", "ليل", "لطيف", "لسان"],
        tip: "حرف اللام يُكتب بشكل مستقيم. مارس كتابته!",
        isIntro: false,
      },
      // --- ن ---
      {
        order: 2,
        title: "حرف النون",
        letter: "ن",
        objectives: "التعرف على حرف النون وأصواته وقراءة وكتابة كلمات تحتوي على حرف النون",
        content: "حرف النون حرف جميل يُنطق نوناً. نجد حرف النون في كلمات مثل: نار، نحلة، نجم. تعلّم كيف تميّز حرف النون وتقرأ الكلمات التي تحتوي عليه.",
        words: ["نار", "نحلة", "نجم", "أنا", "نمر", "نافذة", "نشيط", "نعامة"],
        tip: "حرف النون له نقطة في المنتصف. تعرّف على شكله!",
        isIntro: false,
      },
      // --- ر ---
      {
        order: 3,
        title: "حرف الراء",
        letter: "ر",
        objectives: "التعرف على حرف الراء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الراء",
        content: "حرف الراء حرف مميز يُنطق راءً. نجد حرف الراء في كلمات مثل: ربيع، رسم، رجل. تعلّم كيف تكتب حرف الراء وتقرأ الكلمات التي تبدأ به.",
        words: ["ربيع", "رسم", "رجل", "قرية", "رمان", "روزم", "رمل", "روز"],
        tip: "حرف الراء يُكتب برأس صغير. انتبه لشكله!",
        isIntro: false,
      },
      // --- ق ---
      {
        order: 4,
        title: "حرف القاف",
        letter: "ق",
        objectives: "التعرف على حرف القاف وأصواته وقراءة وكتابة كلمات تحتوي على حرف القاف",
        content: "حرف القاف حرف قوي يُنطق قافاً. نجد حرف القاف في كلمات مثل: قمر، قلم، قط. تعلّم كيف تكتب حرف القاف وتقرأ الكلمات التي تحتوي عليه.",
        words: ["قمر", "قلم", "قط", "قرد", "قصر", "قرآن", "قهوة", "قطار"],
        tip: "حرف القاف له نقطتان فوقه. لا تخلطه بحرف الفاء!",
        isIntro: false,
      },
      // --- ك ---
      {
        order: 5,
        title: "حرف الكاف",
        letter: "ك",
        objectives: "التعرف على حرف الكاف وأصواته وقراءة وكتابة كلمات تحتوي على حرف الكاف",
        content: "حرف الكاف حرف مهم يُنطق كافاً. نجد حرف الكاف في كلمات مثل: كتاب، كرة، كلب. تعلّم كيف تكتب حرف الكاف وتقرأ الكلمات التي تحتوي عليه.",
        words: ["كتاب", "كرة", "كلب", "كرسي", "كنز", "كنغر", "كوب", "كعك"],
        tip: "حرف الكاف يشبه حرف الباء لكن بدون نقطة. فرّق بينهما!",
        isIntro: false,
      },
    ],
  },
  // ===== UNIT 3: أجزاء جسمي =====
  {
    order: 3,
    title: "أجزاء جسمي",
    description: "في هذا الوحدة سنتعلم عن أجزاء الجسم والحروف و ه ذ ظ",
    lessons: [
      // --- Intro ---
      {
        order: 0,
        title: "تمهيد: أجزاء جسمي",
        letter: "",
        objectives: "التعرف على أجزاء الجسم المختلفة وأسمائها باللغة العربية",
        content: "جسم الإنسان مكون من أجزاء كثيرة مهمة. الرأس فيه العينان والأذنان والأنف والفم. والجسم فيه اليدان والقدمان. تعلّم أسماء أجزاء جسمك باللغة العربية!",
        words: ["رأس", "عين", "أذن", "أنف", "فم", "يد"],
        tip: "تعرّف على أجزاء جسمك وتعلّم أسماءها بالعربية!",
        isIntro: true,
        introWords: ["رأس", "عين", "أذن", "أنف", "فم", "يد"],
        introMeanings: {
          "رأس": "أعلى جزء في جسم الإنسان",
          "عين": "عضو الإبصار الذي نرى به",
          "أذن": "عضو السمع الذي نسمع به",
          "أنف": "عضو الشم الذي نتنفس به",
          "فم": "عضو الكلام والأكل",
          "يد": "عضو الإمساك الذي نكتب ونعمل به",
        },
      },
      // --- و ---
      {
        order: 1,
        title: "حرف الواو",
        letter: "و",
        objectives: "التعرف على حرف الواو وأصواته وقراءة وكتابة كلمات تحتوي على حرف الواو",
        content: "حرف الواو حرف مهم يُنطق واواً. نجد حرف الواو في كلمات مثل: ورد، وجه، ولد. تعلّم كيف تكتب حرف الواو وتقرأ الكلمات التي تحتوي عليه.",
        words: ["ورد", "وجه", "ولد", "ورقة", "وردة", "وطن", "وسادة", "وصف"],
        tip: "حرف الواو يُكتب مثل حرفين صغيرين متصلين. تعرّف على شكله!",
        isIntro: false,
      },
      // --- ه ---
      {
        order: 2,
        title: "حرف الهاء",
        letter: "ه",
        objectives: "التعرف على حرف الهاء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الهاء",
        content: "حرف الهاء حرف مهم يُنطق هاً. نجد حرف الهاء في كلمات مثل: هلال، هدية، هرّة. تعلّم كيف تميّز حرف الهاء وتقرأ الكلمات التي تحتوي عليه.",
        words: ["هلال", "هدية", "هرّة", "هدوء", "هامش", "هرم", "هاتف", "هرة"],
        tip: "حرف الهاء يُنطق من الحلق. مارس نطقه!",
        isIntro: false,
      },
      // --- ذ ---
      {
        order: 3,
        title: "حرف الذال",
        letter: "ذ",
        objectives: "التعرف على حرف الذال وأصواته وقراءة وكتابة كلمات تحتوي على حرف الذال",
        content: "حرف الذال حرف جميل يُنطق ذالاً. نجد حرف الذال في كلمات مثل: ذئب، ذهب، ذراع. تعلّم كيف تكتب حرف الذال وتقرأ الكلمات التي تحتوي عليه.",
        words: ["ذئب", "ذهب", "ذراع", "ذرة", "ذكية", "ذكر", "ذوق", "ذباب"],
        tip: "حرف الذال يشبه حرف الدال لكن له نقطة أعلاه. فرّق بينهما!",
        isIntro: false,
      },
      // --- ظ ---
      {
        order: 4,
        title: "حرف الظاء",
        letter: "ظ",
        objectives: "التعرف على حرف الظاء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الظاء",
        content: "حرف الظاء حرف مميز يُنطق ظاءً. نجد حرف الظاء في كلمات مثل: ظرف، ظل، ظاهر. تعلّم كيف تكتب حرف الظاء وتقرأ الكلمات التي تحتوي عليه.",
        words: ["ظرف", "ظل", "ظاهر", "ظريف", "نظر", "ظهر", "وظيفة", "ظلمة"],
        tip: "حرف الظاء يشبه حرف الطاء لكن له نقطة أعلاه. فرّق بينهما!",
        isIntro: false,
      },
    ],
  },
  // ===== UNIT 4: مدرستي =====
  {
    order: 4,
    title: "مدرستي",
    description: "في هذا الوحدة سنتعلم عن المدرسة والحروف ط ص ض ث",
    lessons: [
      // --- Intro ---
      {
        order: 0,
        title: "تمهيد: مدرستي",
        letter: "",
        objectives: "التعرف على بيئة المدرسة وأدوات الدراسة وأسمائها باللغة العربية",
        content: "المدرسة مكان جميل نتعلم فيه. في المدرسة نجد فصولاً ومعلمين وزملاء. نستخدم أدوات مثل القلم والكتاب والمسطرة. المدرسة تساعدنا على التعلم والنمو. تعلّم كلمات عن مدرستك!",
        words: ["مدرسة", "فصل", "معلم", "كتاب", "قلم", "مكتب"],
        tip: "المدرسة مكان رائع للتعلم، تعلّم كلمات عنها!",
        isIntro: true,
        introWords: ["مدرسة", "فصل", "معلم", "كتاب", "قلم", "مكتب"],
        introMeanings: {
          "مدرسة": "مكان نتعلم فيه",
          "فصل": "الغرفة التي ندرس فيها",
          "معلم": "الشخص الذي يعلّمنا",
          "كتاب": "موضوع نقرأ منه",
          "قلم": "أداة نكتب بها",
          "مكتب": "مكان نجلس عليه للدراسة",
        },
      },
      // --- ط ---
      {
        order: 1,
        title: "حرف الطاء",
        letter: "ط",
        objectives: "التعرف على حرف الطاء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الطاء",
        content: "حرف الطاء حرف قوي يُنطق طاءً. نجد حرف الطاء في كلمات مثل: طائر، طاولة، طالب. تعلّم كيف تكتب حرف الطاء وتقرأ الكلمات التي تحتوي عليه.",
        words: ["طائر", "طاولة", "طالب", "طريق", "طباشير", "طابور", "طفل", "طيران"],
        tip: "حرف الطاء له رأس دائري وذيل طويل. تعرّف على شكله!",
        isIntro: false,
      },
      // --- ص ---
      {
        order: 2,
        title: "حرف الصاد",
        letter: "ص",
        objectives: "التعرف على حرف الصاد وأصواته وقراءة وكتابة كلمات تحتوي على حرف الصاد",
        content: "حرف الصاد حرف مميز يُنطق صاداً. نجد حرف الصاد في كلمات مثل: صقر، صباح، صندوق. تعلّم كيف تميّز حرف الصاد وتقرأ الكلمات التي تحتوي عليه.",
        words: ["صقر", "صباح", "صندوق", "صديق", "صفر", "صف", "صومعة", "صوت"],
        tip: "حرف الصاد يُنطق من الحلق. فرّق بينه وبين حرف السين!",
        isIntro: false,
      },
      // --- ض ---
      {
        order: 3,
        title: "حرف الضاد",
        letter: "ض",
        objectives: "التعرف على حرف الضاد وأصواته وقراءة وكتابة كلمات تحتوي على حرف الضاد",
        content: "حرف الضاد هو حرف فريد في اللغة العربية لا يوجد في معظم اللغات الأخرى. يُنطق ضاداً. نجد حرف الضاد في كلمات مثل: ضفدع، ضوء، ضحك. تعلّم كيف تكتب حرف الضاد وتقرأ الكلمات التي تحتوي عليه.",
        words: ["ضفدع", "ضوء", "ضحك", "ضربة", "ضخم", "ضغط", "ضعف", "ضجيج"],
        tip: "حرف الضاد حرف عربي فريد. مارس نطقه كثيراً!",
        isIntro: false,
      },
      // --- ث ---
      {
        order: 4,
        title: "حرف الثاء",
        letter: "ث",
        objectives: "التعرف على حرف الثاء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الثاء",
        content: "حرف الثاء حرف جميل يُنطق ثاءً. نجد حرف الثاء في كلمات مثل: ثعلب، ثلج، ثوب. تعلّم كيف تكتب حرف الثاء وتقرأ الكلمات التي تحتوي عليه.",
        words: ["ثعلب", "ثلج", "ثوب", "ثريا", "ثابت", "ثقيل", "ثمن", "ثمار"],
        tip: "حرف الثاء يشبه حرف التاء لكن له ثلاث نقاط. فرّق بينهما!",
        isIntro: false,
      },
    ],
  },
];

// ============================================================================
// WORD MEANINGS FOR LETTER LESSONS
// ============================================================================

const LETTER_MEANINGS: Record<string, Record<string, string>> = {
  "ب": {
    "باب": "بوابة البيت", "بيت": "المكان الذي نعيش فيه", "بطة": "طائر مائي",
    "بقرة": "حيوان يعطينا الحليب", "أب": "والدي", "أبي": "والدي (مضاف إليه)",
    "برتقال": "فكرة برتقالية اللون", "بسمة": "ابتسامة",
  },
  "م": {
    "ماء": "سائل الحياة", "مدرسة": "مكان نتعلم فيه", "أم": "والدتي",
    "أمي": "والدتي (مضافة إليها)", "ممتاز": "جيد جداً", "منزل": "البيت",
    "موزة": "فاكهة صفراء", "مسطرة": "أداة لقياس الخطوط",
  },
  "ح": {
    "حديقة": "مكان فيه نباتات وأشجار", "حصان": "حيوان يركبه الإنسان",
    "حوت": "سمك كبير جداً", "حليب": "شراب أبيض مغذي",
    "أحمد": "اسم شخص", "حجرة": "غرفة", "حقيبة": "حقيبة الظهر",
    "حرف": "رمز من رموز الكتابة",
  },
  "ج": {
    "جمل": "حيوان الصحراء", "جار": "الذي يسكن بجوارنا",
    "جدار": "حائط البيت", "جدي": "والد أبي أو أمي",
    "جزيرة": "أرض محاطة بالماء", "جمال": "حسن المنظر",
    "جنيه": "وحدة نقدية مصرية", "جداول": "جداول المياه الصغيرة",
  },
  "د": {
    "دب": "حيوان كبير ضخم", "دجاجة": "طائر يبيض البيض",
    "دراجة": "مركبة بعجلتين", "دادا": "لقب أب أو جد",
    "دمية": "لعبة للأطفال", "دلو": "وعاء لحمل الماء",
    "دكان": "محل صغير", "ديك": "ذكر الدجاج",
  },
  "ل": {
    "لعب": "تسلّى", "ليمون": "فاكهة حامضة",
    "كلب": "حيوان أليف", "لؤلؤ": "حجر كريم في البحر",
    "لحم": "طعام من الحيوانات", "ليل": "وقت الظلام",
    "لطيف": "طيب القلب", "لسان": "عضو في الفم",
  },
  "ن": {
    "نار": "لهيب وقود", "نحلة": "حشرة تنتج العسل",
    "نجم": "جرم سماوي مضيء", "أنا": "ضمير المتكلم",
    "نمر": "حيوان مفترس مخطط", "نافذة": "فتحة في الحائط",
    "نشيط": "فعّال حيوي", "نعامة": "طائر كبير لا يطير",
  },
  "ر": {
    "ربيع": "فصل من فصول السنة", "رسم": "صوّر شيئاً",
    "رجل": "إنسان ذكر بالغ", "قرية": "مكان سكني صغير",
    "رمان": "فاكهة حمراء", "رمل": "حبيبات صغيرة على الشاطئ",
    "روز": "نوع من الزهور", "روزم": "وردة جميلة",
  },
  "ق": {
    "قمر": "جرم سماوي في الليل", "قلم": "أداة للكتابة",
    "قط": "حيوان أليف صغير", "قرد": "حيوان يشبه الإنسان",
    "قصر": "بناء فخم كبير", "قرآن": "الكتاب المقدس للمسلمين",
    "قهوة": "مشروب ساخن", "قطار": "مركبة تسير على القضبان",
  },
  "ك": {
    "كتاب": "مجموعة صفحات مكتوبة", "كرة": "أداة للّعب",
    "كلب": "حيوان أليف", "كرسي": "مكان للجلوس",
    "كنز": "مال وذهب مدفون", "كنغر": "حيوان يقفز",
    "كوب": "وعاء للشرب", "كعك": "نوع من الحلويات",
  },
  "و": {
    "ورد": "زهور جميلة", "وجه": "جزء الرأس الأمامي",
    "ولد": "صبي صغير", "ورقة": "صفحة من الورق",
    "وردة": "زهرة جميلة", "وطن": "البلد الذي نعيش فيه",
    "وسادة": "ما نضع عليه الرأس", "وصف": "بيان وشرح",
  },
  "ه": {
    "هلال": "شكل القمر الأول", "هدية": "شيء يُهدى",
    "هرّة": "قطّة صغيرة", "هدوء": "سكون وطمأنينة",
    "هامش": "جانب الصفحة", "هرم": "بناء أهرامات مصر",
    "هاتف": "جهاز للاتصال", "هرة": "أنثى القط",
  },
  "ذ": {
    "ذئب": "حيوان مفترس", "ذهب": "معدن ثمين",
    "ذراع": "جزء من الجسم", "ذرة": "حب صغير",
    "ذكية": "سريعة الفهم", "ذكر": "جنس ليس بأنثى",
    "ذوق": "إحساس بالجمال", "ذباب": "حشرة تطير",
  },
  "ظ": {
    "ظرف": "غلاف للرسائل", "ظل": "ما يظهر خلف الشيء من الضوء",
    "ظاهر": "ما يُرى من الخارج", "ظريف": "مضحك لطيف",
    "نظر": "أبصر", "ظهر": "جزء خلفي من الجسم",
    "وظيفة": "عمل أو مهنة", "ظلمة": "انعدام النور",
  },
  "ط": {
    "طائر": "حيوان له جناحان ويطير", "طاولة": "أثاث نضع عليه الأشياء",
    "طالب": "شخص يتعلم في المدرسة", "طريق": "مسار للمشي أو السير",
    "طباشير": "أداة للكتابة على السبورة", "طابور": "صف من الأشخاص",
    "طفل": "صبي أو صبية صغيرة", "طيران": "حركة الطائر في السماء",
  },
  "ص": {
    "صقر": "طائر جارح سريع", "صباح": "أول النهار",
    "صندوق": "وعاء من الخشب أو المعدن", "صديق": "الشخص الذي نحبه",
    "صفر": "الرقم الذي لا قيمة له", "صف": "مجموعة طلاب يدرسون معاً",
    "صومعة": "مكان تخزين الحبوب", "صوت": "ما نسمعه",
  },
  "ض": {
    "ضفدع": "حيوان صغير يقفز", "ضوء": "نور يضيء المكان",
    "ضحك": "صوت السرور", "ضربة": "هجمة أو ضرب",
    "ضخم": "كبير الحجم جداً", "ضغط": "قوة على شيء",
    "ضعف": "قلة القوة", "ضجيج": "صوت عالٍ مزعج",
  },
  "ث": {
    "ثعلب": "حيوان ماكر ذكي", "ثلج": "ماء متجمد بارد",
    "ثوب": "ملابس نرتديها", "ثريا": "مصباح معلّق في السقف",
    "ثابت": "لا يتغير", "ثقيل": "ذو وزن كبير",
    "ثمن": "سعر الشيء", "ثمار": "فواكه مختلفة",
  },
};

// ============================================================================
// ACHIEVEMENTS DATA
// ============================================================================

const ACHIEVEMENTS = [
  { key: "first_letter", title: "أول حرف", description: "تعلم أول حرف عربي", icon: "🔤", xpReward: 10 },
  { key: "first_word", title: "أول كلمة", description: "تعلم أول كلمة عربية", icon: "📖", xpReward: 15 },
  { key: "first_lesson", title: "أول درس", description: "أكمل أول درس بنجاح", icon: "✅", xpReward: 20 },
  { key: "first_unit", title: "أول وحدة", description: "أكمل أول وحدة بالكامل", icon: "🏆", xpReward: 50 },
  { key: "first_100_xp", title: "أول 100 نقطة", description: "اجمع 100 نقطة خبرة", icon: "💯", xpReward: 0 },
  { key: "unit1_complete", title: "إكمال الوحدة الأولى", description: "أكمل وحدة أسرتي بالكامل", icon: "👨‍👩‍👧‍👦", xpReward: 50 },
  { key: "unit2_complete", title: "إكمال الوحدة الثانية", description: "أكمل وحدة حيواناتي بالكامل", icon: "🦁", xpReward: 50 },
  { key: "unit3_complete", title: "إكمال الوحدة الثالثة", description: "أكمل وحدة أجزاء جسمي بالكامل", icon: "🧍", xpReward: 50 },
  { key: "unit4_complete", title: "إكمال الوحدة الرابعة", description: "أكمل وحدة مدرستي بالكامل", icon: "🏫", xpReward: 50 },
  { key: "all_units_complete", title: "إكمال المنهج", description: "أكمل جميع وحدات المنهج", icon: "🎓", xpReward: 200 },
  { key: "grade1_star", title: "نجم الصف الأول", description: "حصل على نجوم في كل الدروس", icon: "⭐", xpReward: 100 },
  { key: "quiz_hero", title: "بطل الاختبار", description: "حصل على درجة كاملة في اختبار", icon: "🥇", xpReward: 30 },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log("🗑️  حذف البيانات القديمة...");
  
  // Delete in correct order (respect foreign keys)
  await db.studentAchievement.deleteMany();
  await db.certificate.deleteMany();
  await db.attempt.deleteMany();
  await db.progress.deleteMany();
  await db.questionBank.deleteMany();
  await db.lesson.deleteMany();
  await db.unit.deleteMany();
  await db.achievement.deleteMany();
  await db.student.deleteMany();

  console.log("✅ تم حذف البيانات القديمة\n");

  // ===================== SEED ACHIEVEMENTS =====================
  console.log("🏆 إنشاء الإنجازات...");
  for (const ach of ACHIEVEMENTS) {
    await db.achievement.upsert({
      where: { key: ach.key },
      update: ach,
      create: ach,
    });
  }
  console.log(`   ✅ تم إنشاء ${ACHIEVEMENTS.length} إنجاز\n`);

  // ===================== SEED TEACHER STUDENT =====================
  console.log("👨‍🏫 إنشاء حساب المعلم...");
  await db.student.upsert({
    where: { id: "teacher-default" },
    update: {},
    create: {
      id: "teacher-default",
      name: "المعلم",
      isTeacher: true,
      avatar: "👨‍🏫",
      xp: 0,
      stars: 0,
      level: 1,
    },
  });
  console.log("   ✅ تم إنشاء حساب المعلم\n");

  // ===================== SEED UNITS & LESSONS & QUESTIONS =====================
  let totalUnits = 0;
  let totalLessons = 0;
  let totalQuestions = 0;

  for (const unitData of UNITS) {
    console.log(`📚 إنشاء الوحدة ${unitData.order}: ${unitData.title}...`);

    const unit = await db.unit.create({
      data: {
        order: unitData.order,
        title: unitData.title,
        description: unitData.description,
      },
    });
    totalUnits++;

    for (const lessonData of unitData.lessons) {
      console.log(`   📖 الدرس ${lessonData.order + 1}: ${lessonData.title}...`);

      const isIntro = lessonData.isIntro;
      const wordsJson = JSON.stringify(lessonData.words);

      const lesson = await db.lesson.create({
        data: {
          unitId: unit.id,
          order: lessonData.order,
          title: lessonData.title,
          letter: lessonData.letter,
          objectives: lessonData.objectives,
          content: lessonData.content,
          words: wordsJson,
          tip: lessonData.tip,
        },
      });
      totalLessons++;

      // Generate questions
      let questions: QuestionData[];
      if (isIntro) {
        questions = generateIntroQuestions(
          unitData.title,
          lessonData.introWords || lessonData.words,
          lessonData.introMeanings || {}
        );
      } else {
        const meanings = LETTER_MEANINGS[lessonData.letter] || {};
        questions = generateLetterQuestions(lessonData.letter, lessonData.words, meanings);
      }

      // Insert questions in batches
      const BATCH_SIZE = 50;
      for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        await db.questionBank.createMany({
          data: batch.map(q => ({
            lessonId: lesson.id,
            type: q.type,
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            hint: q.hint,
          })),
        });
      }

      totalQuestions += questions.length;
      console.log(`      ✅ ${questions.length} سؤال`);
    }

    console.log("");
  }

  // ===================== SUMMARY =====================
  console.log("═══════════════════════════════════════════");
  console.log("🎉 تم إنشاء البيانات بنجاح!");
  console.log(`   📚 الوحدات: ${totalUnits}`);
  console.log(`   📖 الدروس: ${totalLessons}`);
  console.log(`   ❓ الأسئلة: ${totalQuestions}`);
  console.log(`   🏆 الإنجازات: ${ACHIEVEMENTS.length}`);
  console.log("═══════════════════════════════════════════");
}

export async function seedDatabase() {
  await main();
}