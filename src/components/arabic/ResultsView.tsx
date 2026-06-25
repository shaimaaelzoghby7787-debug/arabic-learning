'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

function getLevelTitle(level: number): string {
  switch (level) {
    case 5: return 'نجم الصف الأول';
    case 4: return 'بطل اللغة العربية';
    case 3: return 'متعلم نشيط';
    case 2: return 'قارئ صغير';
    default: return 'مبتدئ';
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function CircularProgress({ percent, color }: { percent: number; color: string }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl sm:text-5xl font-black"
          style={{ color }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 1.2 }}
        >
          {percent}%
        </motion.span>
        <span className="text-xs sm:text-sm text-muted-foreground mt-1">النتيجة</span>
      </div>
    </div>
  );
}

function StarBurst({ count }: { count: number }) {
  return (
    <div className="flex gap-3 justify-center">
      {[1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="text-4xl sm:text-5xl"
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{
            scale: i <= count ? 1 : 0.4,
            rotate: 0,
            opacity: i <= count ? 1 : 0.25,
            filter: i <= count ? 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' : 'none',
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 15,
            delay: 1.5 + i * 0.25,
          }}
        >
          {i <= count ? '⭐' : '☆'}
        </motion.span>
      ))}
    </div>
  );
}

function ConfettiPiece({ index }: { index: number }) {
  const colors = ['#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#14b8a6'];
  const emojis = ['🎉', '🎊', '✨', '🌟', '⭐', '💫', '🏆'];
  const isEmoji = index % 3 === 0;
  const x = Math.random() * 100;
  const delay = Math.random() * 2;
  const duration = Math.random() * 2 + 3;
  const size = Math.random() * 12 + 8;

  return (
    <motion.div
      className="absolute top-0 pointer-events-none"
      style={{ left: `${x}%`, fontSize: isEmoji ? size + 8 : size }}
      initial={{ y: -20, rotate: 0, opacity: 1 }}
      animate={{
        y: '110vh',
        rotate: Math.random() * 720 - 360,
        opacity: [1, 1, 0.5, 0],
        x: [0, Math.random() * 80 - 40],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3,
        ease: 'linear',
      }}
    >
      {isEmoji ? emojis[index % emojis.length] : (
        <div
          className="rounded-sm"
          style={{
            width: size,
            height: size * 0.6,
            backgroundColor: colors[index % colors.length],
          }}
        />
      )}
    </motion.div>
  );
}

export default function ResultsView() {
  const { lastResult, studentId, quizType, currentLessonId, currentUnitId, navigate, loadStudentData, resetQuiz } = useAppStore();
  const result = useMemo(() => {
    if (!lastResult) return null;
    return {
      score: lastResult.score as number,
      totalQuestions: lastResult.totalQuestions as number,
      correct: lastResult.correct as number,
      wrong: lastResult.wrong as number,
      starsEarned: lastResult.starsEarned as number,
      xpEarned: lastResult.xpEarned as number,
      newLevel: lastResult.newLevel as number,
      newXp: lastResult.newXp as number,
      newStars: lastResult.newStars as number,
      newAchievements: (lastResult.newAchievements || []) as Array<{
        id: string;
        key: string;
        title: string;
        icon: string;
      }>,
    };
  }, [lastResult]);

  const showConfetti = (result?.score ?? 0) >= 80;

  useEffect(() => {
    if (studentId) {
      fetch(`/api/student/${studentId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.student) {
            loadStudentData({
              id: data.student.id,
              name: data.student.name,
              avatar: data.student.avatar,
              xp: data.student.xp,
              stars: data.student.stars,
              level: data.student.level,
            });
          }
        })
        .catch(() => {});
    }
  }, [studentId, loadStudentData]);

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 via-white to-orange-50">
        <main className="flex-1 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="text-6xl">
            📊
          </motion.div>
        </main>
        <footer className="mt-auto py-4 text-center">
          <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
        </footer>
      </div>
    );
  }

  const { score, totalQuestions, correct, wrong, starsEarned, xpEarned, newLevel, newAchievements } = result;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const bgGrad = score >= 80
    ? 'from-emerald-50 via-white to-green-50'
    : score >= 60
    ? 'from-amber-50 via-white to-yellow-50'
    : 'from-red-50 via-white to-rose-50';

  const handleRetry = () => {
    navigate('lesson');
  };

  const handleBackToLesson = () => {
    navigate('lesson');
  };

  const handleBackToUnits = () => {
    resetQuiz();
    navigate('units');
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b ${bgGrad} relative overflow-hidden`} dir="rtl">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 z-30 overflow-hidden pointer-events-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-10 pt-6 pb-2 px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.span
            className="text-6xl sm:text-7xl block mb-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            {score >= 80 ? '🎉' : score >= 60 ? '👍' : '💪'}
          </motion.span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800">
            {score >= 80 ? 'ممتاز! أحسنت!' : score >= 60 ? 'جيد! استمر!' : 'حاول مرة أخرى!'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {quizType === 'unit_exam' ? 'نتيجة اختبار الوحدة' : quizType === 'final_exam' ? 'نتيجة الاختبار النهائي' : 'نتيجة الاختبار'}
          </p>
        </motion.div>
      </header>

      {/* Main content */}
      <main className="flex-1 relative z-10 px-4 pb-6 max-w-lg mx-auto w-full">
        {/* Score circle + Stars */}
        <motion.div
          className="flex flex-col items-center gap-4 my-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <CircularProgress percent={score} color={color} />
          <StarBurst count={starsEarned} />
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
        >
          {/* XP Earned */}
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <motion.div
                className="text-3xl mb-1"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                💎
              </motion.div>
              <motion.p
                className="text-2xl font-black text-violet-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 2.2 }}
              >
                +{xpEarned}
              </motion.p>
              <p className="text-xs text-muted-foreground">نقطة خبرة</p>
            </CardContent>
          </Card>

          {/* Correct Answers */}
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-1">✅</div>
              <p className="text-2xl font-black text-emerald-600">{correct}</p>
              <p className="text-xs text-muted-foreground">إجابة صحيحة</p>
            </CardContent>
          </Card>

          {/* Wrong Answers */}
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-1">❌</div>
              <p className="text-2xl font-black text-red-500">{wrong}</p>
              <p className="text-xs text-muted-foreground">إجابة خاطئة</p>
            </CardContent>
          </Card>

          {/* Total Questions */}
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-1">📝</div>
              <p className="text-2xl font-black text-gray-700">{totalQuestions}</p>
              <p className="text-xs text-muted-foreground">إجمالي الأسئلة</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* New Level */}
        <AnimatePresence>
          {newLevel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 2.5, type: 'spring' }}
              className="mb-4"
            >
              <Card className="border-2 border-amber-300 shadow-lg bg-gradient-to-l from-amber-50 to-yellow-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <motion.span
                    className="text-4xl"
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  >
                    🏆
                  </motion.span>
                  <div className="flex-1">
                    <p className="text-xs text-amber-600">ترقية إلى المستوى</p>
                    <p className="text-lg font-black text-amber-700">{getLevelTitle(newLevel)}</p>
                  </div>
                  <Badge className="bg-amber-500 text-white text-lg px-3 py-1">{newLevel}</Badge>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Achievements */}
        <AnimatePresence>
          {newAchievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 2.8 }}
              className="mb-4"
            >
              <h3 className="text-sm font-bold text-gray-600 mb-2">🏅 إنجازات جديدة!</h3>
              <div className="space-y-2">
                {newAchievements.map((ach, i) => (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 3 + i * 0.3, type: 'spring' }}
                  >
                    <Card className="border-2 border-amber-300 shadow-md bg-gradient-to-l from-amber-50 to-orange-50 overflow-hidden">
                      <CardContent className="p-3 flex items-center gap-3">
                        <motion.span
                          className="text-3xl"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        >
                          {ach.icon}
                        </motion.span>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-amber-800">{ach.title}</p>
                          <p className="text-xs text-amber-600">تم فتح الإنجاز! 🎉</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          className="space-y-3 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5 }}
        >
          <Button
            onClick={handleRetry}
            className="w-full h-13 text-base font-bold rounded-2xl bg-gradient-to-l from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-xl ml-2">🔄</span>
            إعادة المحاولة
          </Button>
          <Button
            onClick={handleBackToLesson}
            variant="outline"
            className="w-full h-12 text-base font-bold rounded-2xl border-2 border-violet-300 text-violet-700 hover:bg-violet-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-xl ml-2">📖</span>
            العودة للدرس
          </Button>
          <Button
            onClick={handleBackToUnits}
            variant="ghost"
            className="w-full h-11 text-sm rounded-2xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <span className="text-lg ml-1">📚</span>
            العودة للوحدات
          </Button>
        </motion.div>
      </main>

      <footer className="mt-auto py-4 text-center relative z-10">
        <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
      </footer>
    </div>
  );
}