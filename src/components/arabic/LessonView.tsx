'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { speakArabic, stopSpeaking, preloadVoices } from '@/lib/arabic-tts';

interface WordData {
  word: string;
  meaning?: string;
}

interface LessonData {
  id: string;
  title: string;
  letter: string;
  objectives: string;
  words: WordData[];
  explanation: string;
  tip: string;
  unit: {
    id: string;
    title: string;
    order: number;
  };
  questionCount: number;
  questionTypes: Array<{ type: string; count: number }>;
}

const DIACRITICS = [
  { label: 'فتحة', symbol: 'َ', emoji: '⬆️' },
  { label: 'ضمة', symbol: 'ُ', emoji: '↗️' },
  { label: 'كسرة', symbol: 'ِ', emoji: '⬇️' },
  { label: 'سكون', symbol: 'ْ', emoji: '⏸️' },
];

function FlipCard({ word, meaning, onPlay }: { word: string; meaning?: string; onPlay: (text: string) => void }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      className="perspective-500 cursor-pointer"
      onClick={() => setFlipped(!flipped)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="relative w-full h-28">
        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: 0 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: -90 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md flex flex-col items-center justify-center text-white p-3"
            >
              <span className="text-3xl font-bold mb-1">{word}</span>
              <span className="text-xs opacity-70">اضغط للكشف 🔍</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(word);
                }}
                className="absolute top-2 left-2 text-lg bg-white/20 rounded-full w-7 h-7 flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="استمع للكلمة"
              >
                🔊
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: 90 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: 90 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md flex flex-col items-center justify-center text-white p-3"
            >
              <span className="text-2xl font-bold mb-1">{word}</span>
              {meaning && <span className="text-sm opacity-90">{meaning}</span>}
              <span className="text-xs opacity-70 mt-1">اضغط للرجوع ↩️</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function LessonView() {
  const {
    studentId,
    currentLessonId,
    currentUnitTitle,
    navigate,
    setQuiz,
  } = useAppStore();

  const [lesson, setLessonData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playingTTS, setPlayingTTS] = useState<string | null>(null);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [startingExam, setStartingExam] = useState(false);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLesson = useCallback(async () => {
    if (!currentLessonId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/curriculum/lesson/${currentLessonId}`);
      if (!res.ok) {
        setError('تعذر تحميل الدرس');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLessonData(data);

      // Fetch progress for this lesson
      if (studentId) {
        const progRes = await fetch(`/api/progress/${studentId}`);
        if (progRes.ok) {
          const progData = await progRes.json();
          const allProgressUnits = progData.units as Array<{
            unitId: string;
            lessons: Array<{ lessonId: string; bestScore: number; completed: boolean }>;
          }>;
          let found = false;
          for (const unit of allProgressUnits) {
            for (const l of unit.lessons) {
              if (l.lessonId === currentLessonId) {
                setLessonProgress(l.bestScore || 0);
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [currentLessonId, studentId]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  // Preload Arabic voices on mount
  useEffect(() => {
    preloadVoices();
    return () => {
      stopSpeaking();
    };
  }, []);

  const playTTS = useCallback((text: string, id?: string) => {
    const playId = id || text;
    if (playingTTS === playId) return;
    setPlayingTTS(playId);

    speakArabic(text, {
      rate: 0.75,
      onEnd: () => setPlayingTTS(null),
      onError: () => setPlayingTTS(null),
    });
  }, [playingTTS]);

  // Throttle TTS: prevent rapid consecutive calls
  const throttledPlayTTS = useCallback((text: string, id?: string) => {
    if (throttleRef.current) clearTimeout(throttleRef.current);
    throttleRef.current = window.setTimeout(() => {
      playTTS(text, id);
      throttleRef.current = null;
    }, 300);
  }, [playTTS]);

  const handleStartTraining = useCallback(async () => {
    if (!currentLessonId) return;
    setStartingQuiz(true);
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: currentLessonId, count: 20 }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions) {
        setStartingQuiz(false);
        return;
      }
      setQuiz(data.questions, 'lesson_quiz');
      navigate('quiz');
    } catch {
      setStartingQuiz(false);
    }
  }, [currentLessonId, setQuiz, navigate]);

  const handleStartExam = useCallback(async () => {
    if (!currentLessonId) return;
    setStartingExam(true);
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: currentLessonId, count: 25 }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions) {
        setStartingExam(false);
        return;
      }
      setQuiz(data.questions, 'lesson_quiz');
      navigate('quiz');
    } catch {
      setStartingExam(false);
    }
  }, [currentLessonId, setQuiz, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50">
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="text-6xl"
          >
            ✏️
          </motion.div>
        </div>
        <footer className="mt-auto py-4 text-center">
          <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
        </footer>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50">
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
          <span className="text-6xl">😕</span>
          <p className="text-lg text-gray-600 text-center">{error || 'لم يتم العثور على الدرس'}</p>
          <Button
            onClick={() => navigate('units')}
            className="rounded-xl bg-indigo-500 hover:bg-indigo-600"
          >
            العودة للوحدات
          </Button>
        </main>
        <footer className="mt-auto py-4 text-center">
          <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
        </footer>
      </div>
    );
  }

  const objectives = lesson.objectives
    ? (Array.isArray(lesson.objectives)
        ? lesson.objectives
        : [lesson.objectives]) as string[]
    : [];

  const words: WordData[] = Array.isArray(lesson.words)
    ? lesson.words.map((w: string | WordData) =>
        typeof w === 'string' ? { word: w } : w
      )
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('units')}
              className="text-gray-500 hover:text-indigo-600 flex-shrink-0"
            >
              <span className="text-lg ml-1">→</span>
              <span className="text-sm">رجوع</span>
            </Button>
            <div className="flex-1 min-w-0 text-right">
              <h1 className="text-sm font-bold text-gray-800 truncate">{lesson.title}</h1>
              <p className="text-xs text-gray-400 truncate">{currentUnitTitle}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        <div className="space-y-4">
          {/* 1. Lesson header with large letter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white overflow-hidden">
              <CardContent className="pt-8 pb-8 text-center relative">
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />

                <div className="relative z-10">
                  <motion.h2
                    className="text-2xl font-bold mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {lesson.title}
                  </motion.h2>
                  {lesson.letter && (
                    <motion.div
                      className="text-8xl font-bold my-4 drop-shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                    >
                      {lesson.letter}
                    </motion.div>
                  )}
                  <p className="text-white/70 text-sm">{currentUnitTitle}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 2. Objectives */}
          {objectives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-base flex items-center gap-2 text-indigo-700">
                    <span>🎯</span>
                    أهداف الدرس
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <ul className="space-y-2">
                    {objectives.map((obj, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.05 }}
                      >
                        <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                        <span>{obj}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 3. The Letter with diacritics */}
          {lesson.letter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-base flex items-center gap-2 text-purple-700">
                    <span>🔤</span>
                    الحرف
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="grid grid-cols-4 gap-3">
                    {DIACRITICS.map((d, i) => (
                      <motion.button
                        key={d.label}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b from-purple-50 to-white border-2 border-purple-100 hover:border-purple-300 hover:shadow-md transition-all active:scale-95"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => throttledPlayTTS(lesson.letter + d.symbol, `diacritic-${i}`)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.08 }}
                      >
                        <span className="text-3xl font-bold text-purple-700">
                          {lesson.letter}{d.symbol}
                        </span>
                        <span className="text-[10px] text-gray-500">{d.label}</span>
                        {playingTTS === `diacritic-${i}` ? (
                          <motion.span
                            className="text-sm"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          >
                            🔊
                          </motion.span>
                        ) : (
                          <span className="text-sm">{d.emoji}</span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 4. Pronunciation - TTS */}
          {lesson.letter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-0 shadow-md bg-gradient-to-l from-blue-500 to-indigo-500 text-white overflow-hidden">
                <CardContent className="py-6 flex flex-col items-center gap-3">
                  <span className="text-sm font-medium opacity-90">نطق الحرف 🔊</span>
                  <motion.button
                    onClick={() => throttledPlayTTS(lesson.letter, 'letter-tts')}
                    className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl hover:bg-white/30 transition-colors active:scale-90"
                    whileTap={{ scale: 0.9 }}
                  >
                    {playingTTS === 'letter-tts' ? (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        🔊
                      </motion.span>
                    ) : (
                      '▶️'
                    )}
                  </motion.button>
                  <span className="text-2xl font-bold">{lesson.letter}</span>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 5. Lesson Words - Flip Cards */}
          {words.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
                    <span>📝</span>
                    كلمات الدرس
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {words.map((w, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 + i * 0.06 }}
                      >
                        <FlipCard
                          word={w.word}
                          meaning={w.meaning}
                          onPlay={playTTS}
                        />
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 6. Explanation */}
          {lesson.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                    <span>💡</span>
                    الشرح
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {lesson.explanation}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 7. Tip */}
          {lesson.tip && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Card className="border-0 shadow-md bg-gradient-to-l from-amber-50 to-yellow-50 border-amber-200 border-2">
                <CardContent className="py-4 px-5 flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">💡</span>
                  <p className="text-sm text-amber-800 leading-relaxed">{lesson.tip}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 8. Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-base flex items-center gap-2 text-indigo-700">
                  <span>📋</span>
                  ملخص الدرس
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                    {lesson.letter || '—'}
                  </Badge>
                  <span className="text-gray-500">الحرف</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    {words.length} كلمة
                  </Badge>
                  <span className="text-gray-500">عدد الكلمات</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {lesson.questionCount} سؤال
                  </Badge>
                  <span className="text-gray-500">الأسئلة المتاحة</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 9. Progress */}
          {studentId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-600">
                      {lessonProgress}%
                    </span>
                    <span className="text-sm font-medium text-gray-600">تقدمك في هذا الدرس 📊</span>
                  </div>
                  <Progress value={lessonProgress} className="h-3" />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 10. Action Buttons */}
          <motion.div
            className="space-y-3 pb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              onClick={handleStartTraining}
              disabled={startingQuiz || startingExam}
              className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-l from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {startingQuiz ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-xl"
                >
                  ⏳
                </motion.span>
              ) : (
                <>
                  <span className="text-xl ml-2">✏️</span>
                  ابدأ التدريب (٢٠ سؤال)
                </>
              )}
            </Button>

            <Button
              onClick={handleStartExam}
              disabled={startingQuiz || startingExam}
              className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-l from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {startingExam ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-xl"
                >
                  ⏳
                </motion.span>
              ) : (
                <>
                  <span className="text-xl ml-2">📝</span>
                  اختبار الدرس (٢٥ سؤال)
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Sticky footer */}
      <footer className="mt-auto py-4 text-center">
        <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
      </footer>
    </div>
  );
}

