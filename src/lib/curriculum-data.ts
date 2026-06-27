// ============================================================================
// STATIC CURRICULUM DATA — All units, lessons, questions, achievements
// Generated deterministically using a seeded PRNG (mulberry32)
// ============================================================================

// --- Seeded PRNG for deterministic question generation ---
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seededRandom = mulberry32(42);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

// ============================================================================
// TYPES
// ============================================================================

export interface Unit {
  id: string;
  order: number;
  title: string;
  description: string;
}

export interface Lesson {
  id: string;
  unitId: string;
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

export interface Question {
  id: string;
  lessonId: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: number;
  hint: string;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

// ============================================================================
// QUESTION GENERATION HELPERS
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

function getLetterName(letter: string): string {
  const names: Record<string, string> = {
    "ب": "الباء", "م": "الميم", "ح": "الحاء", "ج": "الجيم", "د": "الدال",
    "ل": "اللام", "ن": "النون", "ر": "الراء", "ق": "القاف", "ك": "الكاف",
    "و": "الواو", "ه": "الهاء", "ذ": "الذال", "ظ": "الظاء",
    "ط": "الطاء", "ص": "الصاد", "ض": "الضاد", "ث": "الثاء",
  };
  return names[letter] || letter;
}

interface QuestionData {
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: number;
  hint: string;
}

function genLetterAtStart(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
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

function genCompleteWord(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  for (const word of words) {
    if (questions.length >= count) break;
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

function genReadingComprehension(letter: string, words: string[], meanings: Record<string, string>, count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  const sentences = [
    { s: `أرى ${words[0]} في ${words[1]}`, q: `أين يوجد ${words[0]}؟`, a: words[0] },
    { s: `أكلت ${words[2 % words.length]} وكانت لذيذة`, q: `ماذا أكلت؟`, a: words[2 % words.length] },
    { s: `${words[3 % words.length]} جميل جداً`, q: `ما الذي وُصف بأنه جميل؟`, a: words[3 % words.length] },
    { s: `ذهبت إلى ${words[0]} مع ${words[1]}`, q: `إلى أين ذهبت؟`, a: words[0] },
    { s: `لعب ${words[2 % words.length]} مع ${words[3 % words.length]} في الحديقة`, q: `من لعب في الحديقة؟`, a: words[2 % words.length] },
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

function genIdentifyLetterInWord(letter: string, words: string[], count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);
  for (const word of words) {
    if (questions.length >= count) break;
    const distractors = getDistractorWords(words, 3, [word]);
    questions.push({
      type: "choose_letter",
      question: `حرف ${letterName} هو الحرف الأول في أي كلمة؟`,
      options: shuffle([word, ...distractors]),
      correctAnswer: word,
      difficulty: 1,
      hint: `ابحث عن كلمة تبدأ بحرف ${letterName}`,
    });
  }
  return questions;
}

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

function genExtraQuestions(letter: string, words: string[], meanings: Record<string, string>, count: number): QuestionData[] {
  const questions: QuestionData[] = [];
  const letterName = getLetterName(letter);

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

function generateIntroQuestions(unitTitle: string, introWords: string[], introMeanings: Record<string, string>): QuestionData[] {
  const questions: QuestionData[] = [];

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
// UNIT & LESSON DEFINITIONS
// ============================================================================

interface UnitDef {
  order: number;
  title: string;
  description: string;
  lessons: LessonDef[];
}

interface LessonDef {
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

const UNIT_DEFS: UnitDef[] = [
  {
    order: 1,
    title: "أسرتي",
    description: "في هذا الوحدة سنتعلم عن الأسره والحروف ب م ح ج د",
    lessons: [
      {
        order: 0, title: "تمهيد: أسرتي", letter: "",
        objectives: "التعرف على مفهوم الأسرة وأهمية العائلة في حياتنا",
        content: "الأسرة هي مجموعة من الأشخاص يعيشون معاً و يحبون بعضهم البعض. الأسرة تتكون من أب وأم وأطفال. نحن نحب أسرتنا ونحترمها. في هذا الوحدة سنتعلم حروفاً جديدة تساعدنا على قراءة كلمات عن أسرتنا.",
        words: ["أب", "أم", "بيت", "عائلة", "أخ", "أخت"],
        tip: "الأسرة هي أغلى ما نملك، تعلّم كلمات عن أسرتك!",
        isIntro: true,
        introWords: ["أب", "أم", "بيت", "عائلة", "أخ", "أخت"],
        introMeanings: {
          "أب": "والد الطفل", "أم": "والدة الطفل",
          "بيت": "المكان الذي نعيش فيه", "عائلة": "مجموعة الأقارب",
          "أخ": "ابن الأم والأب (ذكر)", "أخت": "ابنة الأم والأب (أنثى)",
        },
      },
      {
        order: 1, title: "حرف الباء", letter: "ب",
        objectives: "التعرف على حرف الباء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الباء",
        content: "حرف الباء هو الحرف الثاني في اللغة العربية. يُنطق باء. نجد حرف الباء في بداية كلمات كثيرة مثل: باب، بيت، بطة. تدرّب على كتابة حرف الباء وقراءة الكلمات التي تبدأ به.",
        words: ["باب", "بيت", "بطة", "بقرة", "أب", "أبي", "برتقال", "بسمة"],
        tip: "حرف الباء يُكتب من أسفل إلى أعلى. تدرّب على كتابته!",
        isIntro: false,
      },
      {
        order: 2, title: "حرف الميم", letter: "م",
        objectives: "التعرف على حرف الميم وأصواته وقراءة وكتابة كلمات تحتوي على حرف الميم",
        content: "حرف الميم هو حرف مهم في اللغة العربية. يُنطق ميماً. نجد حرف الميم في كلمات مثل: ماء، مدرسة، أمّي. تعلّم كيف تكتب حرف الميم وتقرأ الكلمات التي تحتوي عليه.",
        words: ["ماء", "مدرسة", "أم", "أمي", "ممتاز", "منزل", "موزة", "مسطرة"],
        tip: "حرف الميم له ثلاثة أشكال حسب موقعه في الكلمة",
        isIntro: false,
      },
      {
        order: 3, title: "حرف الحاء", letter: "ح",
        objectives: "التعرف على حرف الحاء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الحاء",
        content: "حرف الحاء حرف رقيق يُنطق من الحلق. نجد حرف الحاء في كلمات مثل: حديقة، حصان، حوت. تعلّم كيف تميّز حرف الحاء وتقرأ الكلمات التي تحتوي عليه.",
        words: ["حديقة", "حصان", "حوت", "حليب", "أحمد", "حجرة", "حقيبة", "حرف"],
        tip: "حرف الحاء يُنطق من أعمق الحلق. مارس نطقه!",
        isIntro: false,
      },
      {
        order: 4, title: "حرف الجيم", letter: "ج",
        objectives: "التعرف على حرف الجيم وأصواته وقراءة وكتابة كلمات تحتوي على حرف الجيم",
        content: "حرف الجيم حرف جميل يُنطق جيماً. نجد حرف الجيم في كلمات مثل: جمل، جار، جدار. تعلّم كيف تكتب حرف الجيم وتقرأ الكلمات التي تبدأ به.",
        words: ["جمل", "جار", "جدار", "جدي", "جزيرة", "جمال", "جنيه", "جداول"],
        tip: "حرف الجيم يُكتب برأس صغير في الأعلى. انتبه لشكله!",
        isIntro: false,
      },
      {
        order: 5, title: "حرف الدال", letter: "د",
        objectives: "التعرف على حرف الدال وأصواته وقراءة وكتابة كلمات تحتوي على حرف الدال",
        content: "حرف الدال حرف مهم يُنطق دالاً. نجد حرف الدال في كلمات مثل: دب، دجاجة، دراجة. تعلّم كيف تكتب حرف الدال وتقرأ الكلمات التي تحتوي عليه.",
        words: ["دب", "دجاجة", "دراجة", "دادا", "دمية", "دلو", "دكان", "ديك"],
        tip: "حرف الدال يشبه حرف الراء لكن له بطن مختلف. فرّق بينهما!",
        isIntro: false,
      },
    ],
  },
  {
    order: 2,
    title: "حيواناتي",
    description: "في هذا الوحدة سنتعلم عن الحيوانات والحروف ل ن ر ق ك",
    lessons: [
      {
        order: 0, title: "تمهيد: حيواناتي", letter: "",
        objectives: "التعرف على الحيوانات المختلفة وأسمائها باللغة العربية",
        content: "الله خلق لنا الكثير من الحيوانات الجميلة. هناك حيوانات تعيش في المزرعة مثل البقرة والديك. وهناك حيوانات تعيش في الغابة مثل الأسد والنمر. تعلّم أسماء الحيوانات باللغة العربية!",
        words: ["قطة", "كلب", "حصان", "بقرة", "ديك", "أرنب"],
        tip: "الحيوانات كائنات جميلة، تعلّم أسماءها بالعربية!",
        isIntro: true,
        introWords: ["قطة", "كلب", "حصان", "بقرة", "ديك", "أرنب"],
        introMeanings: {
          "قطة": "حيوان صغير ينمو", "كلب": "حيوان أليف يحرس المنزل",
          "حصان": "حيوان كبير يركبه الإنسان", "بقرة": "حيوان يعطينا الحليب",
          "ديك": "ذكر الدجاجة يصيح صباحاً", "أرنب": "حيوان صغير له أذنان طويلتان",
        },
      },
      {
        order: 1, title: "حرف اللام", letter: "ل",
        objectives: "التعرف على حرف اللام وأصواته وقراءة وكتابة كلمات تحتوي على حرف اللام",
        content: "حرف اللام حرف مهم جداً في اللغة العربية. يُنطق لاماً. نجد حرف اللام في كلمات مثل: لعب، ليمون، كلب. تعلّم كيف تكتب حرف اللام وتقرأ الكلمات التي تحتوي عليه.",
        words: ["لعب", "ليمون", "كلب", "لؤلؤ", "لحم", "ليل", "لطيف", "لسان"],
        tip: "حرف اللام يُكتب بشكل مستقيم. مارس كتابته!",
        isIntro: false,
      },
      {
        order: 2, title: "حرف النون", letter: "ن",
        objectives: "التعرف على حرف النون وأصواته وقراءة وكتابة كلمات تحتوي على حرف النون",
        content: "حرف النون حرف جميل يُنطق نوناً. نجد حرف النون في كلمات مثل: نار، نحلة، نجم. تعلّم كيف تميّز حرف النون وتقرأ الكلمات التي تحتوي عليه.",
        words: ["نار", "نحلة", "نجم", "أنا", "نمر", "نافذة", "نشيط", "نعامة"],
        tip: "حرف النون له نقطة في المنتصف. تعرّف على شكله!",
        isIntro: false,
      },
      {
        order: 3, title: "حرف الراء", letter: "ر",
        objectives: "التعرف على حرف الراء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الراء",
        content: "حرف الراء حرف مميز يُنطق راءً. نجد حرف الراء في كلمات مثل: ربيع، رسم، رجل. تعلّم كيف تكتب حرف الراء وتقرأ الكلمات التي تبدأ به.",
        words: ["ربيع", "رسم", "رجل", "قرية", "رمان", "روزم", "رمل", "روز"],
        tip: "حرف الراء يُكتب برأس صغير. انتبه لشكله!",
        isIntro: false,
      },
      {
        order: 4, title: "حرف القاف", letter: "ق",
        objectives: "التعرف على حرف القاف وأصواته وقراءة وكتابة كلمات تحتوي على حرف القاف",
        content: "حرف القاف حرف قوي يُنطق قافاً. نجد حرف القاف في كلمات مثل: قمر، قلم، قط. تعلّم كيف تكتب حرف القاف وتقرأ الكلمات التي تحتوي عليه.",
        words: ["قمر", "قلم", "قط", "قرد", "قصر", "قرآن", "قهوة", "قطار"],
        tip: "حرف القاف له نقطتان فوقه. لا تخلطه بحرف الفاء!",
        isIntro: false,
      },
      {
        order: 5, title: "حرف الكاف", letter: "ك",
        objectives: "التعرف على حرف الكاف وأصواته وقراءة وكتابة كلمات تحتوي على حرف الكاف",
        content: "حرف الكاف حرف مهم يُنطق كافاً. نجد حرف الكاف في كلمات مثل: كتاب، كرة، كلب. تعلّم كيف تكتب حرف الكاف وتقرأ الكلمات التي تحتوي عليه.",
        words: ["كتاب", "كرة", "كلب", "كرسي", "كنز", "كنغر", "كوب", "كعك"],
        tip: "حرف الكاف يشبه حرف الباء لكن بدون نقطة. فرّق بينهما!",
        isIntro: false,
      },
    ],
  },
  {
    order: 3,
    title: "أجزاء جسمي",
    description: "في هذا الوحدة سنتعلم عن أجزاء الجسم والحروف و ه ذ ظ",
    lessons: [
      {
        order: 0, title: "تمهيد: أجزاء جسمي", letter: "",
        objectives: "التعرف على أجزاء الجسم المختلفة وأسمائها باللغة العربية",
        content: "جسم الإنسان مكون من أجزاء كثيرة مهمة. الرأس فيه العينان والأذنان والأنف والفم. والجسم فيه اليدان والقدمان. تعلّم أسماء أجزاء جسمك باللغة العربية!",
        words: ["رأس", "عين", "أذن", "أنف", "فم", "يد"],
        tip: "تعرّف على أجزاء جسمك وتعلّم أسماءها بالعربية!",
        isIntro: true,
        introWords: ["رأس", "عين", "أذن", "أنف", "فم", "يد"],
        introMeanings: {
          "رأس": "أعلى جزء في جسم الإنسان", "عين": "عضو الإبصار الذي نرى به",
          "أذن": "عضو السمع الذي نسمع به", "أنف": "عضو الشم الذي نتنفس به",
          "فم": "عضو الكلام والأكل", "يد": "عضو الإمساك الذي نكتب ونعمل به",
        },
      },
      {
        order: 1, title: "حرف الواو", letter: "و",
        objectives: "التعرف على حرف الواو وأصواته وقراءة وكتابة كلمات تحتوي على حرف الواو",
        content: "حرف الواو حرف مهم يُنطق واواً. نجد حرف الواو في كلمات مثل: ورد، وجه، ولد. تعلّم كيف تكتب حرف الواو وتقرأ الكلمات التي تحتوي عليه.",
        words: ["ورد", "وجه", "ولد", "ورقة", "وردة", "وطن", "وسادة", "وصف"],
        tip: "حرف الواو يُكتب مثل حرفين صغيرين متصلين. تعرّف على شكله!",
        isIntro: false,
      },
      {
        order: 2, title: "حرف الهاء", letter: "ه",
        objectives: "التعرف على حرف الهاء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الهاء",
        content: "حرف الهاء حرف مهم يُنطق هاً. نجد حرف الهاء في كلمات مثل: هلال، هدية، هرّة. تعلّم كيف تميّز حرف الهاء وتقرأ الكلمات التي تحتوي عليه.",
        words: ["هلال", "هدية", "هرّة", "هدوء", "هامش", "هرم", "هاتف", "هرة"],
        tip: "حرف الهاء يُنطق من الحلق. مارس نطقه!",
        isIntro: false,
      },
      {
        order: 3, title: "حرف الذال", letter: "ذ",
        objectives: "التعرف على حرف الذال وأصواته وقراءة وكتابة كلمات تحتوي على حرف الذال",
        content: "حرف الذال حرف جميل يُنطق ذالاً. نجد حرف الذال في كلمات مثل: ذئب، ذهب، ذراع. تعلّم كيف تكتب حرف الذال وتقرأ الكلمات التي تحتوي عليه.",
        words: ["ذئب", "ذهب", "ذراع", "ذرة", "ذكية", "ذكر", "ذوق", "ذباب"],
        tip: "حرف الذال يشبه حرف الدال لكن له نقطة أعلاه. فرّق بينهما!",
        isIntro: false,
      },
      {
        order: 4, title: "حرف الظاء", letter: "ظ",
        objectives: "التعرف على حرف الظاء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الظاء",
        content: "حرف الظاء حرف مميز يُنطق ظاءً. نجد حرف الظاء في كلمات مثل: ظرف، ظل، ظاهر. تعلّم كيف تكتب حرف الظاء وتقرأ الكلمات التي تحتوي عليه.",
        words: ["ظرف", "ظل", "ظاهر", "ظريف", "نظر", "ظهر", "وظيفة", "ظلمة"],
        tip: "حرف الظاء يشبه حرف الطاء لكن له نقطة أعلاه. فرّق بينهما!",
        isIntro: false,
      },
    ],
  },
  {
    order: 4,
    title: "مدرستي",
    description: "في هذا الوحدة سنتعلم عن المدرسة والحروف ط ص ض ث",
    lessons: [
      {
        order: 0, title: "تمهيد: مدرستي", letter: "",
        objectives: "التعرف على بيئة المدرسة وأدوات الدراسة وأسمائها باللغة العربية",
        content: "المدرسة مكان جميل نتعلم فيه. في المدرسة نجد فصولاً ومعلمين وزملاء. نستخدم أدوات مثل القلم والكتاب والمسطرة. المدرسة تساعدنا على التعلم والنمو. تعلّم كلمات عن مدرستك!",
        words: ["مدرسة", "فصل", "معلم", "كتاب", "قلم", "مكتب"],
        tip: "المدرسة مكان رائع للتعلم، تعلّم كلمات عنها!",
        isIntro: true,
        introWords: ["مدرسة", "فصل", "معلم", "كتاب", "قلم", "مكتب"],
        introMeanings: {
          "مدرسة": "مكان نتعلم فيه", "فصل": "الغرفة التي ندرس فيها",
          "معلم": "الشخص الذي يعلّمنا", "كتاب": "موضوع نقرأ منه",
          "قلم": "أداة نكتب بها", "مكتب": "مكان نجلس عليه للدراسة",
        },
      },
      {
        order: 1, title: "حرف الطاء", letter: "ط",
        objectives: "التعرف على حرف الطاء وأصواته وقراءة وكتابة كلمات تحتوي على حرف الطاء",
        content: "حرف الطاء حرف قوي يُنطق طاءً. نجد حرف الطاء في كلمات مثل: طائر، طاولة، طالب. تعلّم كيف تكتب حرف الطاء وتقرأ الكلمات التي تحتوي عليه.",
        words: ["طائر", "طاولة", "طالب", "طريق", "طباشير", "طابور", "طفل", "طيران"],
        tip: "حرف الطاء له رأس دائري وذيل طويل. تعرّف على شكله!",
        isIntro: false,
      },
      {
        order: 2, title: "حرف الصاد", letter: "ص",
        objectives: "التعرف على حرف الصاد وأصواته وقراءة وكتابة كلمات تحتوي على حرف الصاد",
        content: "حرف الصاد حرف مميز يُنطق صاداً. نجد حرف الصاد في كلمات مثل: صقر، صباح، صندوق. تعلّم كيف تميّز حرف الصاد وتقرأ الكلمات التي تحتوي عليه.",
        words: ["صقر", "صباح", "صندوق", "صديق", "صفر", "صف", "صومعة", "صوت"],
        tip: "حرف الصاد يُنطق من الحلق. فرّق بينه وبين حرف السين!",
        isIntro: false,
      },
      {
        order: 3, title: "حرف الضاد", letter: "ض",
        objectives: "التعرف على حرف الضاد وأصواته وقراءة وكتابة كلمات تحتوي على حرف الضاد",
        content: "حرف الضاد هو حرف فريد في اللغة العربية لا يوجد في معظم اللغات الأخرى. يُنطق ضاداً. نجد حرف الضاد في كلمات مثل: ضفدع، ضوء، ضحك. تعلّم كيف تكتب حرف الضاد وتقرأ الكلمات التي تحتوي عليه.",
        words: ["ضفدع", "ضوء", "ضحك", "ضربة", "ضخم", "ضغط", "ضعف", "ضجيج"],
        tip: "حرف الضاد حرف عربي فريد. مارس نطقه كثيراً!",
        isIntro: false,
      },
      {
        order: 4, title: "حرف الثاء", letter: "ث",
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
// ACHIEVEMENTS DATA
// ============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  { id: "ach-1", key: "أول حرف", title: "أول حرف", description: "تعلم أول حرف عربي", icon: "🔤", xpReward: 10 },
  { id: "ach-2", key: "أول كلمة", title: "أول كلمة", description: "تعلم أول كلمة عربية", icon: "📖", xpReward: 15 },
  { id: "ach-3", key: "أول درس", title: "أول درس", description: "أكمل أول درس بنجاح", icon: "✅", xpReward: 20 },
  { id: "ach-4", key: "أول وحدة", title: "أول وحدة", description: "أكمل أول وحدة بالكامل", icon: "🏆", xpReward: 50 },
  { id: "ach-5", key: "أول 100 نقطة", title: "أول 100 نقطة", description: "اجمع 100 نقطة خبرة", icon: "💯", xpReward: 0 },
  { id: "ach-6", key: "إكمال الوحدة الأولى", title: "إكمال الوحدة الأولى", description: "أكمل وحدة أسرتي بالكامل", icon: "👨‍👩‍👧‍👦", xpReward: 50 },
  { id: "ach-7", key: "إكمال الوحدة الثانية", title: "إكمال الوحدة الثانية", description: "أكمل وحدة حيواناتي بالكامل", icon: "🦁", xpReward: 50 },
  { id: "ach-8", key: "إكمال الوحدة الثالثة", title: "إكمال الوحدة الثالثة", description: "أكمل وحدة أجزاء جسمي بالكامل", icon: "🧍", xpReward: 50 },
  { id: "ach-9", key: "إكمال الوحدة الرابعة", title: "إكمال الوحدة الرابعة", description: "أكمل وحدة مدرستي بالكامل", icon: "🏫", xpReward: 50 },
  { id: "ach-10", key: "إكمال المنهج", title: "إكمال المنهج", description: "أكمل جميع وحدات المنهج", icon: "🎓", xpReward: 200 },
  { id: "ach-11", key: "نجم الصف الأول", title: "نجم الصف الأول", description: "حصل على نجوم في كل الدروس", icon: "⭐", xpReward: 100 },
  { id: "ach-12", key: "بطل الاختبار", title: "بطل الاختبار", description: "حصل على درجة كاملة في اختبار", icon: "🥇", xpReward: 30 },
];

// ============================================================================
// BUILD UNITS, LESSONS, QUESTIONS AT MODULE LOAD TIME
// ============================================================================

const units: Unit[] = [];
const lessons: Lesson[] = [];
const questions: Question[] = [];
let questionCounter = 0;

for (const unitDef of UNIT_DEFS) {
  const unitId = `unit-${unitDef.order}`;
  units.push({
    id: unitId,
    order: unitDef.order,
    title: unitDef.title,
    description: unitDef.description,
  });

  for (const lessonDef of unitDef.lessons) {
    const lessonId = `lesson-u${unitDef.order}-l${lessonDef.order}`;
    lessons.push({
      id: lessonId,
      unitId,
      order: lessonDef.order,
      title: lessonDef.title,
      letter: lessonDef.letter,
      objectives: lessonDef.objectives,
      content: lessonDef.content,
      words: lessonDef.words,
      tip: lessonDef.tip,
      isIntro: lessonDef.isIntro,
      introWords: lessonDef.introWords,
      introMeanings: lessonDef.introMeanings,
    });

    // Generate questions
    let generatedQuestions: QuestionData[];
    if (lessonDef.isIntro) {
      generatedQuestions = generateIntroQuestions(
        unitDef.title,
        lessonDef.introWords || lessonDef.words,
        lessonDef.introMeanings || {}
      );
    } else {
      const meanings = LETTER_MEANINGS[lessonDef.letter] || {};
      generatedQuestions = generateLetterQuestions(lessonDef.letter, lessonDef.words, meanings);
    }

    for (const q of generatedQuestions) {
      questions.push({
        id: `q-${lessonId}-${questionCounter++}`,
        lessonId,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        hint: q.hint,
      });
    }
  }
}

// Sort by order
units.sort((a, b) => a.order - b.order);
lessons.sort((a, b) => a.order - b.order);

// ============================================================================
// EXPORTED CONSTANTS AND LOOKUP FUNCTIONS
// ============================================================================

export const UNITS = units;
export const LESSONS = lessons;
export const ALL_QUESTIONS = questions;

const unitMap = new Map(units.map(u => [u.id, u]));
const lessonMap = new Map(lessons.map(l => [l.id, l]));
const questionsByLesson = new Map<string, Question[]>();
for (const q of questions) {
  if (!questionsByLesson.has(q.lessonId)) questionsByLesson.set(q.lessonId, []);
  questionsByLesson.get(q.lessonId)!.push(q);
}

export function getUnitById(id: string): Unit | undefined {
  return unitMap.get(id);
}

export function getLessonById(id: string): Lesson | undefined {
  return lessonMap.get(id);
}

export function getLessonsByUnit(unitId: string): Lesson[] {
  return lessons.filter(l => l.unitId === unitId).sort((a, b) => a.order - b.order);
}

export function getQuestionsByLesson(lessonId: string): Question[] {
  return questionsByLesson.get(lessonId) || [];
}

export function getQuestionsByLessons(lessonIds: string[]): Question[] {
  const idSet = new Set(lessonIds);
  return questions.filter(q => idSet.has(q.lessonId));
}

export function getTotalLessonCount(): number {
  return lessons.length;
}

export function getTotalUnitCount(): number {
  return units.length;
}

// ============================================================================
// LEVEL HELPERS
// ============================================================================

export function calculateLevel(xp: number): number {
  if (xp >= 1000) return 5;
  if (xp >= 600) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
}

export function getLevelTitle(level: number): string {
  switch (level) {
    case 5: return "نجم الصف الأول";
    case 4: return "بطل اللغة العربية";
    case 3: return "متعلم نشيط";
    case 2: return "قارئ صغير";
    default: return "مبتدئ";
  }
}

export function getLevelInfo(xp: number) {
  const level = calculateLevel(xp);
  if (xp >= 1000) return { title: "نجم الصف الأول", level: 5, nextLevelXp: null as number | null };
  if (xp >= 600) return { title: "بطل اللغة العربية", level: 4, nextLevelXp: 1000 };
  if (xp >= 300) return { title: "متعلم نشيط", level: 3, nextLevelXp: 600 };
  if (xp >= 100) return { title: "قارئ صغير", level: 2, nextLevelXp: 300 };
  return { title: "مبتدئ", level: 1, nextLevelXp: 100 };
}

// Achievement lookup by key (Arabic key)
const achievementByKey = new Map(ACHIEVEMENTS.map(a => [a.key, a]));

export function getAchievementByKey(key: string): Achievement | undefined {
  return achievementByKey.get(key);
}
