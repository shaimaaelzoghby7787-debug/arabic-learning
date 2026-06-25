'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useAppStore } from '@/lib/store';

/* ─── Constants ─── */

const ENCOURAGEMENTS = ['ممتاز!', 'أحسنت!', 'رائع!', 'بطل!', 'عبقري!'];

const QUIZ_EMOJIS = ['⭐', '🌟', '✨', '📚', '✏️', '🎓'];

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  multiple_choice: { label: 'اختيار من متعدد', emoji: '📝' },
  choose_letter: { label: 'اختر الحرف', emoji: '🔤' },
  complete_word: { label: 'أكمل الكلمة', emoji: '✏️' },
  true_false: { label: 'صح وخطأ', emoji: '✅' },
  match_word: { label: 'وصل بالمعنى', emoji: '🔗' },
};

const OPTION_LABELS = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح'];

const OPTION_COLORS = [
  { bg: 'bg-rose-50', border: 'border-rose-300', hover: 'hover:bg-rose-100', text: 'text-rose-800' },
  { bg: 'bg-amber-50', border: 'border-amber-300', hover: 'hover:bg-amber-100', text: 'text-amber-800' },
  { bg: 'bg-emerald-50', border: 'border-emerald-300', hover: 'hover:bg-emerald-100', text: 'text-emerald-800' },
  { bg: 'bg-violet-50', border: 'border-violet-300', hover: 'hover:bg-violet-100', text: 'text-violet-800' },
];

const ARABIC_INDICATORS = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح'];

/* ─── Helpers ─── */

function parseOptions(options: string[] | string): string[] {
  if (Array.isArray(options)) return options;
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/* ─── Star Burst Effect ─── */

function StarBurst({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          style={{ left: '50%', top: '40%' }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 240,
            y: (Math.random() - 0.5) * 200,
            scale: [0, 1.5, 0.3],
            opacity: [1, 1, 0],
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1.1, ease: 'easeOut', delay: i * 0.03 }}
        >
          {['⭐', '🌟', '✨', '💫'][Math.floor(Math.random() * 4)]}
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Feedback Banner ─── */

function FeedbackBanner({ isCorrect, encouragement }: { isCorrect: boolean; encouragement: string }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`mt-4 py-3 px-6 rounded-2xl text-lg font-bold inline-block ${
          isCorrect
            ? 'bg-emerald-100 text-emerald-700 shadow-md shadow-emerald-200/50'
            : 'bg-red-100 text-red-600 shadow-md shadow-red-200/50'
        }`}
      >
        <motion.div
          animate={isCorrect ? { scale: [1, 1.1, 1] } : { x: [0, -8, 8, -4, 4, 0] }}
          transition={{ duration: isCorrect ? 0.5 : 0.45, repeat: isCorrect ? 1 : 0 }}
          className="flex items-center justify-center gap-2"
        >
          {isCorrect ? (
            <>
              <span className="text-2xl">🎉</span>
              <span>{encouragement}</span>
              <span className="text-2xl">⭐</span>
            </>
          ) : (
            <>
              <span className="text-2xl">😅</span>
              <span>حاول مرة أخرى في المرة القادمة!</span>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Standard Options (multiple_choice, match_word) ─── */

function StandardOptions({
  options,
  selectedOption,
  isAnswered,
  correctAnswer,
  onSelect,
}: {
  options: string[];
  selectedOption: string | null;
  isAnswered: boolean;
  correctAnswer: string;
  onSelect: (option: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((option, index) => {
        const color = OPTION_COLORS[index % OPTION_COLORS.length];
        const isSelected = selectedOption === option;
        const isCorrectOpt = option === correctAnswer;
        const isWrongSel = isAnswered && isSelected && !isCorrectOpt;

        let borderClass = color.border;
        let bgClass = isAnswered ? color.bg : `${color.bg} ${color.hover}`;
        let textClass = color.text;

        if (isAnswered && isCorrectOpt) {
          borderClass = 'border-emerald-500';
          bgClass = 'bg-emerald-50';
          textClass = 'text-emerald-700';
        } else if (isWrongSel) {
          borderClass = 'border-red-400';
          bgClass = 'bg-red-50';
          textClass = 'text-red-500';
        } else if (isSelected && !isAnswered) {
          borderClass = 'border-orange-400';
          bgClass = 'bg-orange-100';
        }

        return (
          <motion.button
            key={index}
            onClick={() => onSelect(option)}
            disabled={isAnswered}
            whileHover={!isAnswered ? { scale: 1.03, y: -2 } : {}}
            whileTap={!isAnswered ? { scale: 0.97 } : {}}
            animate={
              isWrongSel
                ? { x: [0, -6, 6, -3, 3, 0] }
                : isAnswered && isCorrectOpt
                  ? { scale: [1, 1.04, 1] }
                  : {}
            }
            transition={{ duration: 0.4 }}
            className={`relative w-full p-4 sm:p-5 rounded-2xl border-2 ${borderClass} ${bgClass} transition-colors duration-200 min-h-[56px] flex items-center gap-3 ${
              isAnswered ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            {/* Letter indicator */}
            <span
              className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 ${
                isAnswered && isCorrectOpt
                  ? 'bg-emerald-500 text-white'
                  : isWrongSel
                    ? 'bg-red-400 text-white'
                    : `${color.bg} ${color.text} border ${color.border}`
              }`}
            >
              {ARABIC_INDICATORS[index % ARABIC_INDICATORS.length]}
            </span>

            {/* Option text */}
            <span
              className={`text-base sm:text-lg font-semibold flex-1 text-right ${
                isAnswered && isCorrectOpt
                  ? 'text-emerald-700'
                  : isWrongSel
                    ? 'text-red-500 line-through'
                    : textClass
              }`}
            >
              {option}
            </span>

            {/* Feedback icon */}
            {isAnswered && isCorrectOpt && (
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="text-xl shrink-0"
              >
                ✅
              </motion.span>
            )}
            {isWrongSel && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xl shrink-0"
              >
                ❌
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── True / False Options ─── */

function TrueFalseOptions({
  options,
  selectedOption,
  isAnswered,
  correctAnswer,
  onSelect,
}: {
  options: string[];
  selectedOption: string | null;
  isAnswered: boolean;
  correctAnswer: string;
  onSelect: (option: string) => void;
}) {
  // Identify true and false options from the options array
  const trueOpt =
    options.find((o) => o.includes('صح') || o.includes('✓') || o.includes('صواب')) ||
    options[0];
  const falseOpt =
    options.find((o) => o.includes('خطأ') || o.includes('✗') || o.includes('غلط')) ||
    options[1];

  const buttons = [
    { option: trueOpt, label: 'صح ✓', baseBorder: 'border-emerald-200', baseBg: 'bg-emerald-50/70 hover:bg-emerald-100', baseText: 'text-emerald-700', icon: '✅' },
    { option: falseOpt, label: 'خطأ ✗', baseBorder: 'border-red-200', baseBg: 'bg-red-50/70 hover:bg-red-100', baseText: 'text-red-600', icon: '❌' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {buttons.map(({ option, label, baseBorder, baseBg, baseText, icon }) => {
        const isSelected = selectedOption === option;
        const isCorrectOpt = option === correctAnswer;
        const isWrongSel = isAnswered && isSelected && !isCorrectOpt;

        let borderClass = baseBorder;
        let bgClass = isAnswered ? baseBg.split(' ')[0] : baseBg;
        let textClass = baseText;

        if (isAnswered && isCorrectOpt) {
          borderClass = 'border-emerald-500';
          bgClass = 'bg-emerald-100';
          textClass = 'text-emerald-700';
        } else if (isWrongSel) {
          borderClass = 'border-red-400';
          bgClass = 'bg-red-100';
          textClass = 'text-red-500';
        } else if (isSelected && !isAnswered) {
          borderClass = 'border-orange-400';
          bgClass = 'bg-orange-100';
        }

        return (
          <motion.button
            key={option}
            onClick={() => onSelect(option)}
            disabled={isAnswered}
            whileHover={!isAnswered ? { scale: 1.05, y: -3 } : {}}
            whileTap={!isAnswered ? { scale: 0.93 } : {}}
            animate={
              isWrongSel
                ? { x: [0, -8, 8, -4, 4, 0] }
                : isAnswered && isCorrectOpt
                  ? { scale: [1, 1.08, 1] }
                  : {}
            }
            transition={{ duration: 0.4 }}
            className={`relative border-2 ${borderClass} ${bgClass} rounded-2xl py-6 sm:py-8 flex flex-col items-center justify-center gap-2 min-h-[90px] transition-colors duration-200 ${
              isAnswered ? 'cursor-default' : 'cursor-pointer'
            }`}
          >
            <span className="text-3xl sm:text-4xl">{icon}</span>
            <span className={`text-xl sm:text-2xl font-bold ${textClass}`}>{label}</span>

            {/* Star badge for correct */}
            {isAnswered && isCorrectOpt && (
              <motion.span
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="absolute -top-2 -left-2 text-xl"
              >
                ⭐
              </motion.span>
            )}
            {isWrongSel && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -left-2 text-xl"
              >
                ❌
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Letter Options (choose_letter) ─── */

function LetterOptions({
  options,
  selectedOption,
  isAnswered,
  correctAnswer,
  onSelect,
}: {
  options: string[];
  selectedOption: string | null;
  isAnswered: boolean;
  correctAnswer: string;
  onSelect: (option: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {options.map((option, index) => {
        const isSelected = selectedOption === option;
        const isCorrectOpt = option === correctAnswer;
        const isWrongSel = isAnswered && isSelected && !isCorrectOpt;
        const color = OPTION_COLORS[index % OPTION_COLORS.length];

        let borderClass = color.border;
        let bgClass = isAnswered ? color.bg : `${color.bg} ${color.hover}`;
        let textClass = color.text;

        if (isAnswered && isCorrectOpt) {
          borderClass = 'border-emerald-500';
          bgClass = 'bg-emerald-100';
          textClass = 'text-emerald-700';
        } else if (isWrongSel) {
          borderClass = 'border-red-400';
          bgClass = 'bg-red-100';
          textClass = 'text-red-500';
        } else if (isSelected && !isAnswered) {
          borderClass = 'border-orange-400';
          bgClass = 'bg-orange-100';
          textClass = 'text-orange-700';
        }

        return (
          <motion.button
            key={index}
            onClick={() => onSelect(option)}
            disabled={isAnswered}
            whileHover={!isAnswered ? { scale: 1.15, y: -4 } : {}}
            whileTap={!isAnswered ? { scale: 0.88 } : {}}
            animate={
              isWrongSel
                ? { x: [0, -8, 8, -4, 4, 0] }
                : isAnswered && isCorrectOpt
                  ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                  : {}
            }
            transition={{ duration: 0.4 }}
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 ${borderClass} ${bgClass} flex items-center justify-center text-2xl sm:text-3xl font-bold transition-colors duration-200 ${
              isAnswered ? 'cursor-default' : 'cursor-pointer'
            } ${textClass}`}
          >
            {option}
            {isAnswered && isCorrectOpt && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                className="absolute -top-1 -right-1 text-lg"
              >
                ⭐
              </motion.span>
            )}
            {isWrongSel && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 text-lg"
              >
                ❌
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Complete Word Options ─── */

function CompleteWordOptions({
  options,
  selectedOption,
  isAnswered,
  correctAnswer,
  onSelect,
  question,
}: {
  options: string[];
  selectedOption: string | null;
  isAnswered: boolean;
  correctAnswer: string;
  onSelect: (option: string) => void;
  question: string;
}) {
  // Extract the word display portion (everything after colon or the full question)
  const wordPart = question.includes('：') || question.includes(':')
    ? (question.split(/[:：]/).pop()?.trim() ?? question)
    : question;
  // Render blank dashes more visibly
  const displayWord = wordPart.replace(/[_ـ]{1,}/g, 'ـ');

  return (
    <div className="flex flex-col items-center gap-5">
      {/* The incomplete word */}
      <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl px-8 py-5">
        <span className="text-4xl sm:text-5xl font-bold text-gray-800 tracking-[0.15em]" dir="rtl">
          {displayWord}
        </span>
      </div>

      <p className="text-sm text-gray-500 font-medium">اختر الحرف الناقص ✏️</p>

      {/* Letter choices */}
      <div className="flex flex-wrap justify-center gap-4">
        {options.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrectOpt = option === correctAnswer;
          const isWrongSel = isAnswered && isSelected && !isCorrectOpt;
          const color = OPTION_COLORS[index % OPTION_COLORS.length];

          let borderClass = color.border;
          let bgClass = isAnswered ? color.bg : `${color.bg} ${color.hover}`;
          let textClass = color.text;

          if (isAnswered && isCorrectOpt) {
            borderClass = 'border-emerald-500';
            bgClass = 'bg-emerald-100';
            textClass = 'text-emerald-700';
          } else if (isWrongSel) {
            borderClass = 'border-red-400';
            bgClass = 'bg-red-100';
            textClass = 'text-red-500';
          } else if (isSelected && !isAnswered) {
            borderClass = 'border-orange-400';
            bgClass = 'bg-orange-100';
            textClass = 'text-orange-700';
          }

          return (
            <motion.button
              key={index}
              onClick={() => onSelect(option)}
              disabled={isAnswered}
              whileHover={!isAnswered ? { scale: 1.15, y: -4 } : {}}
              whileTap={!isAnswered ? { scale: 0.88 } : {}}
              animate={
                isWrongSel
                  ? { x: [0, -8, 8, -4, 4, 0] }
                  : isAnswered && isCorrectOpt
                    ? { scale: [1, 1.25, 1], y: [0, -8, 0] }
                    : {}
              }
              transition={{ duration: 0.4 }}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 ${borderClass} ${bgClass} flex items-center justify-center text-2xl sm:text-3xl font-bold transition-colors duration-200 ${
                isAnswered ? 'cursor-default' : 'cursor-pointer'
              } ${textClass}`}
            >
              {option}
              {isAnswered && isCorrectOpt && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                  className="absolute -top-1 -right-1 text-lg"
                >
                  ⭐
                </motion.span>
              )}
              {isWrongSel && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 text-lg"
                >
                  ❌
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main QuizView Component
   ═══════════════════════════════════════════════════════════════ */

export default function QuizView() {
  const {
    studentId,
    currentLessonId,
    currentUnitId,
    quizType,
    quizQuestions,
    currentQuestionIndex,
    quizAnswers,
    quizStartTime,
    answerQuestion,
    nextQuestion,
    navigate,
    resetQuiz,
    setResult,
  } = useAppStore();

  /* ─── Local State ─── */
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showStarBurst, setShowStarBurst] = useState(false);
  const [showSubmitScreen, setShowSubmitScreen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Derived State ─── */
  const currentQuestion = quizQuestions[currentQuestionIndex] ?? null;
  const options = useMemo(
    () => (currentQuestion ? parseOptions(currentQuestion.options) : []),
    [currentQuestion],
  );

  const totalQuestions = quizQuestions.length;
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
  const progressPercent =
    totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  // Stars earned this session (correct answers so far)
  const sessionStars = useMemo(() => {
    let count = 0;
    for (let i = 0; i < quizAnswers.length; i++) {
      const q = quizQuestions[i];
      if (q && quizAnswers[i]?.answer === q.correctAnswer) {
        count++;
      }
    }
    return count;
  }, [quizAnswers, quizQuestions]);

  /* ─── Timer ─── */
  useEffect(() => {
    if (quizStartTime === 0) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - quizStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [quizStartTime]);

  /* ─── Reset local state when question index changes ─── */
  useEffect(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setEncouragement('');
    setShowStarBurst(false);
  }, [currentQuestionIndex]);

  /* ─── Cleanup ─── */
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  /* ─── TTS playback ─── */
  const playEncouragement = useCallback(async (phrase: string) => {
    try {
      const res = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: phrase }),
      });
      const data = await res.json();
      const src = data.audio ? `data:audio/mp3;base64,${data.audio}` : data.audioUrl || '';
      if (!src) return;
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.play().catch(() => {
        /* silently fail – autoplay may be blocked */
      });
    } catch {
      /* silently fail */
    }
  }, []);

  /* ─── Handle selecting an option ─── */
  const handleSelectOption = useCallback(
    (option: string) => {
      if (isAnswered || !currentQuestion) return;

      setSelectedOption(option);
      setIsAnswered(true);

      const correct = option === currentQuestion.correctAnswer;
      setIsCorrect(correct);
      answerQuestion(currentQuestion.id, option);

      if (correct) {
        const phrase = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
        setEncouragement(phrase);
        setShowStarBurst(true);
        playEncouragement(phrase);
      }
    },
    [isAnswered, currentQuestion, answerQuestion, playEncouragement],
  );

  /* ─── Auto-advance after feedback (2 s) ─── */
  useEffect(() => {
    if (!isAnswered) return;
    // On last question → show submit screen instead of advancing
    if (isLastQuestion) {
      const t = setTimeout(() => setShowSubmitScreen(true), 1500);
      return () => clearTimeout(t);
    }
    autoAdvanceRef.current = setTimeout(() => {
      nextQuestion();
    }, 2000);
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, [isAnswered, isLastQuestion, nextQuestion]);

  /* ─── Submit quiz ─── */
  const handleSubmit = useCallback(async () => {
    if (!studentId || !currentLessonId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const timeSpent = Math.round((Date.now() - quizStartTime) / 1000);
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          lessonId: currentLessonId,
          unitId: currentUnitId || '',
          type: quizType,
          answers: quizAnswers,
          timeSpent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        navigate('results');
      } else {
        console.error('Quiz submit failed:', data.error);
      }
    } catch (err) {
      console.error('Quiz submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [studentId, currentLessonId, currentUnitId, quizType, quizAnswers, quizStartTime, isSubmitting, setResult, navigate]);

  /* ─── Exit quiz ─── */
  const handleExit = useCallback(() => {
    resetQuiz();
    navigate(quizType === 'lesson_quiz' ? 'lesson' : 'units');
  }, [resetQuiz, navigate, quizType]);

  /* ─── Guard: no questions ─── */
  if (totalQuestions === 0 || !currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 via-yellow-50 to-rose-50">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-sm w-full">
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
              <motion.span
                className="text-6xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                📝
              </motion.span>
              <p className="text-lg text-gray-600 font-medium">لا توجد أسئلة متاحة</p>
              <Button onClick={handleExit} className="rounded-xl mt-2">
                العودة
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const typeInfo = TYPE_LABELS[currentQuestion.type] || { label: 'سؤال', emoji: '❓' };

  /* ═══════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 via-amber-50/30 to-rose-50 relative overflow-hidden"
      dir="rtl"
    >
      {/* ── Background decorations ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {QUIZ_EMOJIS.map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute opacity-[0.15] text-3xl"
            style={{ left: `${12 + i * 16}%`, top: `${8 + (i % 3) * 32}%` }}
            animate={{ y: [0, -18, 0], rotate: [0, 12, -12, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.6 }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      {/* ═══════ HEADER ═══════ */}
      <header className="relative z-10 px-4 pt-4 pb-2">
        <div className="max-w-2xl mx-auto">
          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowExitDialog(true)}
              className="h-10 w-10 rounded-xl hover:bg-white/60 shrink-0"
              aria-label="العودة"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="rotate-180"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>

            {/* Timer */}
            <Badge
              variant="secondary"
              className="text-sm sm:text-base px-3 py-1.5 rounded-xl font-bold bg-white/80 shadow-sm tabular-nums"
            >
              ⏱️ {formatTime(elapsedTime)}
            </Badge>

            {/* Star counter */}
            <div className="flex items-center gap-1.5 bg-yellow-100 px-3 py-1.5 rounded-xl shadow-sm">
              <motion.span
                className="text-lg"
                animate={
                  showStarBurst ? { scale: [1, 1.6, 1], rotate: [0, 20, -20, 0] } : {}
                }
                transition={{ duration: 0.5 }}
              >
                ⭐
              </motion.span>
              <span className="font-bold text-yellow-700 tabular-nums">{sessionStars}</span>
            </div>
          </div>

          {/* Progress info */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-600">
                {typeInfo.emoji} {typeInfo.label}
              </span>
              <span className="font-bold text-gray-700">
                السؤال {currentQuestionIndex + 1} من {totalQuestions}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-3 rounded-full bg-orange-100 [&>div]:bg-gradient-to-l [&>div]:from-orange-400 [&>div]:to-amber-400 [&>div]:rounded-full"
            />
          </div>
        </div>
      </header>

      {/* ═══════ MAIN QUIZ AREA ═══════ */}
      <main className="flex-1 relative z-10 px-4 py-4 flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="flex-1 flex flex-col"
            >
              {/* ── Question Card ── */}
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm mb-6 relative overflow-visible">
                <CardContent className="pt-6 pb-6 text-center relative">
                  {/* Star burst overlay */}
                  <StarBurst show={showStarBurst} />

                  {/* Question number badge */}
                  <motion.div
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white text-2xl font-bold shadow-lg mb-4"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                  >
                    {currentQuestionIndex + 1}
                  </motion.div>

                  {/* Question text */}
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 leading-relaxed mb-2">
                    {currentQuestion.question}
                  </h2>

                  {/* Hint (before answering) */}
                  {currentQuestion.hint && !isAnswered && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-amber-600 mt-2 bg-amber-50 rounded-lg px-4 py-2 inline-block font-medium"
                    >
                      💡 {currentQuestion.hint}
                    </motion.p>
                  )}

                  {/* Feedback banner */}
                  {isAnswered && (
                    <FeedbackBanner isCorrect={isCorrect} encouragement={encouragement} />
                  )}
                </CardContent>
              </Card>

              {/* ── Options Area ── */}
              <div className="flex-1 flex flex-col justify-center">
                {currentQuestion.type === 'true_false' ? (
                  <TrueFalseOptions
                    options={options}
                    selectedOption={selectedOption}
                    isAnswered={isAnswered}
                    correctAnswer={currentQuestion.correctAnswer}
                    onSelect={handleSelectOption}
                  />
                ) : currentQuestion.type === 'choose_letter' ? (
                  <LetterOptions
                    options={options}
                    selectedOption={selectedOption}
                    isAnswered={isAnswered}
                    correctAnswer={currentQuestion.correctAnswer}
                    onSelect={handleSelectOption}
                  />
                ) : currentQuestion.type === 'complete_word' ? (
                  <CompleteWordOptions
                    options={options}
                    selectedOption={selectedOption}
                    isAnswered={isAnswered}
                    correctAnswer={currentQuestion.correctAnswer}
                    onSelect={handleSelectOption}
                    question={currentQuestion.question}
                  />
                ) : (
                  <StandardOptions
                    options={options}
                    selectedOption={selectedOption}
                    isAnswered={isAnswered}
                    correctAnswer={currentQuestion.correctAnswer}
                    onSelect={handleSelectOption}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Submit Button (after last question) ── */}
          <AnimatePresence>
            {showSubmitScreen && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="mt-6 mb-4"
              >
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-16 text-xl font-bold rounded-2xl bg-gradient-to-l from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="text-2xl"
                    >
                      ⏳
                    </motion.span>
                  ) : (
                    <>
                      <span className="text-2xl ml-2">📤</span>
                      إرسال الإجابات
                    </>
                  )}
                </Button>
                <p className="text-center text-sm text-gray-500 mt-2">
                  أجبت على جميع الأسئلة! {sessionStars} ⭐
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-auto relative z-10 py-3 text-center">
        <p className="text-xs text-muted-foreground">
          🌟 تعلّم العربية - الصف الأول الابتدائي 🌟
        </p>
      </footer>

      {/* ═══════ EXIT CONFIRMATION DIALOG ═══════ */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-2xl" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-right flex items-center gap-2">
              <span>🤔</span>
              <span>هل تريد الخروج من الاختبار؟</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right text-base leading-relaxed">
              إذا خرجت الآن، ستفقد تقدمك في هذا الاختبار ولن يتم حفظ إجاباتك.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 sm:justify-start">
            <AlertDialogAction
              onClick={handleExit}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white px-6 font-medium"
            >
              نعم، أريد الخروج
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl px-6 font-medium">
              لا، أريد المتابعة
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}