'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

interface AchievementData {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  letters: { label: 'الحروف', color: 'text-orange-700', bg: 'bg-orange-100' },
  words: { label: 'الكلمات', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  lessons: { label: 'الدروس', color: 'text-violet-700', bg: 'bg-violet-100' },
  units: { label: 'الوحدات', color: 'text-rose-700', bg: 'bg-rose-100' },
  special: { label: 'خاصة', color: 'text-amber-700', bg: 'bg-amber-100' },
};

function getCategory(key: string): string {
  if (key.includes('حرف')) return 'letters';
  if (key.includes('كلمة') || key.includes('نقطة')) return 'words';
  if (key.includes('درس') || key.includes('اختبار')) return 'lessons';
  if (key.includes('وحدة') || key.includes('منهج')) return 'units';
  return 'special';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

const GLOW_COLORS = [
  'shadow-amber-200/60',
  'shadow-emerald-200/60',
  'shadow-violet-200/60',
  'shadow-rose-200/60',
  'shadow-orange-200/60',
  'shadow-teal-200/60',
  'shadow-pink-200/60',
  'shadow-yellow-200/60',
  'shadow-lime-200/60',
  'shadow-cyan-200/60',
  'shadow-red-200/60',
  'shadow-fuchsia-200/60',
];

export default function AchievementsView() {
  const { studentId, navigate, unlockedAchievements } = useAppStore();
  const [achievements, setAchievements] = useState<AchievementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAchievements = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/student/${studentId}/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlockedKeys: unlockedAchievements }),
      });
      if (!res.ok) {
        setError('تعذر تحميل الإنجازات');
        return;
      }
      const data = await res.json();
      setAchievements(data.achievements || []);
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [studentId, unlockedAchievements]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 via-white to-orange-50">
        <header className="px-4 pt-4 pb-2">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-8 w-40 rounded-lg" />
          </div>
        </header>
        <main className="flex-1 px-4 max-w-2xl mx-auto w-full py-4">
          <Skeleton className="h-24 w-full rounded-2xl mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        </main>
        <footer className="mt-auto py-4 text-center">
          <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
        </footer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 via-white to-orange-50">
        <header className="px-4 pt-4 pb-2">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('units')} className="rounded-xl">
              <span className="text-lg">→</span>
            </Button>
            <h1 className="text-lg font-bold text-gray-800">الإنجازات</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <span className="text-5xl block mb-3">😞</span>
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchAchievements} variant="outline" className="mt-4 rounded-xl">
              إعادة المحاولة
            </Button>
          </div>
        </main>
        <footer className="mt-auto py-4 text-center">
          <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
        </footer>
      </div>
    );
  }

  // Group by category
  const categories = ['letters', 'words', 'lessons', 'units', 'special'] as const;
  const grouped = categories
    .map((cat) => ({
      key: cat,
      ...CATEGORY_LABELS[cat],
      items: achievements.filter((a) => getCategory(a.key) === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 via-white to-orange-50" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('units')}
              className="rounded-xl text-gray-500 hover:text-amber-600"
            >
              <span className="text-lg">→</span>
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-gray-800">
                <span className="ml-1">🏅</span>
                الإنجازات
              </h1>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {/* Progress summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-0 shadow-md bg-gradient-to-l from-amber-500 to-orange-500 text-white overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <motion.p
                    className="text-4xl font-black"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    {unlockedCount}/{totalCount}
                  </motion.p>
                  <p className="text-amber-100 text-sm mt-1">إنجاز مفتوح</p>
                </div>
                <motion.div
                  className="text-6xl"
                  animate={{ y: [0, -6, 0], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                >
                  🏆
                </motion.div>
              </div>
              {/* Progress bar */}
              <div className="h-3 bg-white/20 rounded-full overflow-hidden mt-4">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievement categories */}
        {grouped.map((group, gi) => (
          <motion.div
            key={group.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + gi * 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`${group.bg} ${group.color} border-0 text-xs font-bold`}>
                {group.label}
              </Badge>
              <span className="text-xs text-gray-400">
                {group.items.filter((a) => a.unlocked).length}/{group.items.length}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {group.items.map((ach, i) => {
                const glowClass = GLOW_COLORS[i % GLOW_COLORS.length];
                return (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      delay: 0.5 + gi * 0.1 + i * 0.08,
                      type: 'spring',
                      stiffness: 200,
                    }}
                  >
                    <Card
                      className={`h-full overflow-hidden transition-all ${
                        ach.unlocked
                          ? `shadow-lg ${glowClass} bg-white border-2 border-amber-200`
                          : 'bg-gray-50 border-2 border-gray-200 opacity-60'
                      }`}
                    >
                      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        {/* Icon */}
                        <motion.div
                          className="text-4xl"
                          animate={
                            ach.unlocked
                              ? { scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }
                              : {}
                          }
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                        >
                          {ach.unlocked ? ach.icon : '🔒'}
                        </motion.div>

                        {/* Title */}
                        <p className={`font-bold text-sm ${ach.unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                          {ach.title}
                        </p>

                        {/* Description */}
                        <p className={`text-xs leading-relaxed ${ach.unlocked ? 'text-gray-500' : 'text-gray-300'}`}>
                          {ach.description}
                        </p>

                        {/* XP Reward */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs">💎</span>
                          <span className={`text-xs font-bold ${ach.unlocked ? 'text-violet-600' : 'text-gray-300'}`}>
                            +{ach.xpReward} XP
                          </span>
                        </div>

                        {/* Unlock date */}
                        {ach.unlocked && ach.unlockedAt && (
                          <p className="text-[10px] text-gray-400 mt-auto">
                            {formatDate(ach.unlockedAt)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </main>

      <footer className="mt-auto py-4 text-center">
        <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
      </footer>
    </div>
  );
}