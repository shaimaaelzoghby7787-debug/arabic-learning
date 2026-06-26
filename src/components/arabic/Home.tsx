'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';

const AVATARS = ['🧒', '👦', '👧', '👶', '🤓', '🌟', '🦁', '🐱', '🐰', '🦊'];

// Deterministic star positions to avoid hydration mismatch
const STAR_SEEDS = [
  { id: 0, size: 15, x: 10, y: 20, delay: 0.5, duration: 5 },
  { id: 1, size: 22, x: 85, y: 15, delay: 1.2, duration: 6 },
  { id: 2, size: 12, x: 45, y: 80, delay: 2.1, duration: 4.5 },
  { id: 3, size: 18, x: 70, y: 60, delay: 0.8, duration: 5.5 },
  { id: 4, size: 25, x: 20, y: 45, delay: 3.0, duration: 4 },
  { id: 5, size: 14, x: 55, y: 10, delay: 1.8, duration: 6.5 },
  { id: 6, size: 20, x: 90, y: 75, delay: 0.3, duration: 5 },
  { id: 7, size: 11, x: 35, y: 55, delay: 2.5, duration: 4.2 },
  { id: 8, size: 17, x: 5, y: 85, delay: 4.0, duration: 5.8 },
  { id: 9, size: 23, x: 60, y: 35, delay: 1.5, duration: 4.8 },
  { id: 10, size: 13, x: 75, y: 90, delay: 3.5, duration: 6.2 },
  { id: 11, size: 19, x: 30, y: 5, delay: 2.8, duration: 5.3 },
];

export default function Home() {
  const { studentId, studentName, studentAvatar, xp, stars, level, setStudent, navigate } = useAppStore();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧒');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isReturningStudent = mounted && !!studentId && !!studentName;

  const handleStartLearning = useCallback(async () => {
    if (!name.trim()) {
      setError('يرجى كتابة اسمك');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/student/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), avatar: selectedAvatar }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حدث خطأ ما');
        setLoading(false);
        return;
      }
      setStudent(data.student.id, data.student.name, data.student.avatar);
      navigate('units');
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [name, selectedAvatar, setStudent, navigate]);

  const handleContinue = useCallback(() => {
    navigate('units');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated floating decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {STAR_SEEDS.map((star) => (
          <motion.div
            key={star.id}
            className="absolute text-yellow-300 opacity-60"
            style={{ left: `${star.x}%`, top: `${star.y}%`, fontSize: star.size }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <AnimatePresence mode="wait">
          {isReturningStudent ? (
            <motion.div
              key="returning"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md"
            >
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6">
                  {/* Avatar */}
                  <motion.div
                    className="text-7xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {studentAvatar}
                  </motion.div>

                  {/* Welcome back message */}
                  <div className="text-center space-y-2">
                    <p className="text-lg text-muted-foreground">مرحباً بعودتك</p>
                    <h1 className="text-3xl font-bold text-indigo-600">
                      {studentName} 👋
                    </h1>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-6 w-full justify-center">
                    <motion.div
                      className="flex flex-col items-center gap-1 bg-amber-50 rounded-2xl px-5 py-3"
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="text-2xl">⭐</span>
                      <span className="text-sm font-semibold text-amber-700">{stars}</span>
                      <span className="text-xs text-amber-600">نجوم</span>
                    </motion.div>
                    <motion.div
                      className="flex flex-col items-center gap-1 bg-violet-50 rounded-2xl px-5 py-3"
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="text-2xl">💎</span>
                      <span className="text-sm font-semibold text-violet-700">{xp}</span>
                      <span className="text-xs text-violet-600">نقطة خبرة</span>
                    </motion.div>
                    <motion.div
                      className="flex flex-col items-center gap-1 bg-emerald-50 rounded-2xl px-5 py-3"
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="text-2xl">🏆</span>
                      <span className="text-sm font-semibold text-emerald-700">{level}</span>
                      <span className="text-xs text-emerald-600">المستوى</span>
                    </motion.div>
                  </div>

                  {/* Continue button */}
                  <Button
                    onClick={handleContinue}
                    className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-l from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    size="lg"
                  >
                    <span className="text-xl ml-2">📚</span>
                    متابعة التعلم
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="new"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full max-w-md"
            >
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8 flex flex-col items-center gap-5">
                  {/* Logo / Title area */}
                  <motion.div
                    className="text-center space-y-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      className="text-6xl mb-2"
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      📖
                    </motion.div>
                    <h1 className="text-3xl font-bold bg-gradient-to-l from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                      تعلّم العربية
                    </h1>
                    <p className="text-base text-muted-foreground">
                      مرحباً بك في عالم الحروف العربية الممتع!
                    </p>
                  </motion.div>

                  {/* Name input */}
                  <motion.div
                    className="w-full space-y-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-sm font-medium text-gray-600 text-right">
                      ما اسمك يا بطل؟ 🦸
                    </label>
                    <Input
                      type="text"
                      placeholder="اكتب اسمك هنا..."
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError('');
                      }}
                      className="h-12 text-lg rounded-xl border-2 border-indigo-200 focus:border-indigo-400 text-right"
                      dir="rtl"
                      maxLength={30}
                    />
                    {error && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-red-500 text-right"
                      >
                        {error}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Avatar selection */}
                  <motion.div
                    className="w-full space-y-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <label className="block text-sm font-medium text-gray-600 text-right">
                      اختر شخصيتك 🎭
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {AVATARS.map((avatar) => (
                        <motion.button
                          key={avatar}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`text-3xl p-2 rounded-xl transition-all border-2 cursor-pointer ${
                            selectedAvatar === avatar
                              ? 'border-indigo-500 bg-indigo-50 shadow-md scale-105'
                              : 'border-transparent bg-gray-50 hover:bg-indigo-50/50'
                          }`}
                        >
                          {avatar}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Start button */}
                  <motion.div
                    className="w-full pt-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Button
                      onClick={handleStartLearning}
                      disabled={loading || !name.trim()}
                      className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-l from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {loading ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="text-xl"
                        >
                          ⏳
                        </motion.span>
                      ) : (
                        <>
                          <span className="text-xl ml-2">🚀</span>
                          ابدأ التعلم
                        </>
                      )}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky footer */}
      <footer className="mt-auto relative z-10 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          🌟 تعلّم العربية - الصف الأول الابتدائي 🌟
        </p>
      </footer>
    </div>
  );
}