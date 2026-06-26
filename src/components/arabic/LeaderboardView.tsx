'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/lib/store';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  xp: number;
  stars: number;
  level: number;
  levelTitle: string;
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  totalAttempts: number;
  joinedAt: string;
}

export default function LeaderboardView() {
  const { studentId, navigate } = useAppStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch {
      setError('تعذر تحميل لوحة المتصدرين');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Podium order: 2nd (right), 1st (center), 3rd (left) — for RTL we reverse
  const podiumOrder = top3.length === 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
    ? [top3[1], top3[0]]
    : top3;

  const PODIUM_STYLES = [
    // Silver (#2)
    { bg: 'from-gray-300 to-gray-400', text: 'text-gray-700', border: 'border-gray-300', medal: '🥈', height: 'h-28 sm:h-32', delay: 0.3 },
    // Gold (#1)
    { bg: 'from-amber-400 to-yellow-500', text: 'text-amber-800', border: 'border-amber-400', medal: '🥇', height: 'h-36 sm:h-44', delay: 0.15 },
    // Bronze (#3)
    { bg: 'from-orange-400 to-orange-500', text: 'text-orange-800', border: 'border-orange-400', medal: '🥉', height: 'h-24 sm:h-28', delay: 0.45 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 via-white to-purple-50">
        <header className="px-4 pt-4 pb-2">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-8 w-44 rounded-lg" />
          </div>
        </header>
        <main className="flex-1 px-4 max-w-2xl mx-auto w-full py-6">
          <div className="flex items-end justify-center gap-3 mb-8">
            <Skeleton className="w-28 h-32 rounded-t-2xl" />
            <Skeleton className="w-28 h-44 rounded-t-2xl" />
            <Skeleton className="w-28 h-28 rounded-t-2xl" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl mb-2" />
          ))}
        </main>
        <footer className="mt-auto py-4 text-center">
          <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
        </footer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 via-white to-purple-50">
        <header className="px-4 pt-4 pb-2">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('units')} className="rounded-xl">
              <span className="text-lg">→</span>
            </Button>
            <h1 className="text-lg font-bold text-gray-800">لوحة المتصدرين</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <span className="text-5xl block mb-3">😞</span>
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchLeaderboard} variant="outline" className="mt-4 rounded-xl">إعادة المحاولة</Button>
          </div>
        </main>
        <footer className="mt-auto py-4 text-center">
          <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 via-white to-purple-50" dir="rtl">
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
                <span className="ml-1">🏆</span>
                لوحة المتصدرين
              </h1>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {leaderboard.length === 0 ? (
          <div className="text-center py-16">
            <motion.span
              className="text-6xl block mb-4"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🏆
            </motion.span>
            <p className="text-gray-500">لا يوجد متصدرين بعد</p>
            <p className="text-xs text-gray-400 mt-1">ابدأ التعلم لتصبح أول متصدر!</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-2 sm:gap-4 mb-8 px-2">
                {podiumOrder.map((entry, i) => {
                  const style = PODIUM_STYLES[i];
                  const isMe = entry.id === studentId;
                  return (
                    <motion.div
                      key={entry.id}
                      className="flex-1 max-w-[140px] flex flex-col items-center"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 150, delay: style.delay }}
                    >
                      {/* Medal */}
                      <motion.div
                        className="text-4xl sm:text-5xl mb-1"
                        animate={{ y: [0, -4, 0], rotate: [0, 3, -3, 0] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: style.delay + 0.5 }}
                      >
                        {style.medal}
                      </motion.div>

                      {/* Avatar */}
                      <motion.div
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-3xl sm:text-4xl bg-gradient-to-br ${style.bg} shadow-lg ${isMe ? 'ring-4 ring-amber-300 ring-offset-2' : ''}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: style.delay + 0.3 }}
                      >
                        {entry.avatar}
                      </motion.div>

                      {/* Name */}
                      <p className={`font-bold text-xs sm:text-sm mt-1.5 text-center truncate w-full ${style.text}`}>
                        {entry.name}
                        {isMe && <span className="mr-1 text-amber-500">(أنت)</span>}
                      </p>

                      {/* Podium base */}
                      <motion.div
                        className={`w-full ${style.height} mt-2 rounded-t-2xl bg-gradient-to-t ${style.bg} flex flex-col items-center justify-end pb-3 shadow-md ${isMe ? 'ring-2 ring-amber-300 ring-offset-2' : ''}`}
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        transition={{ duration: 0.8, delay: style.delay + 0.5, ease: 'easeOut' }}
                      >
                        <p className="text-white font-black text-lg sm:text-xl drop-shadow-md">
                          #{entry.rank}
                        </p>
                        <p className="text-white/80 text-[10px] sm:text-xs mt-0.5">
                          💎 {entry.xp} XP
                        </p>
                        <p className="text-white/70 text-[10px]">
                          ⭐ {entry.stars}
                        </p>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Rest of leaderboard */}
            {rest.length > 0 && (
              <ScrollArea className="max-h-[50vh]">
                <div className="space-y-2">
                  {rest.map((entry, i) => {
                    const isMe = entry.id === studentId;
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.05 }}
                      >
                        <Card
                          className={`border-0 shadow-sm transition-all ${
                            isMe
                              ? 'bg-amber-50 border-2 border-amber-300 shadow-amber-100'
                              : 'bg-white/80 hover:shadow-md'
                          }`}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            {/* Rank */}
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-black text-gray-500">#{entry.rank}</span>
                            </div>

                            {/* Avatar */}
                            <span className="text-2xl flex-shrink-0">{entry.avatar}</span>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-sm text-gray-800 truncate">{entry.name}</p>
                                {isMe && (
                                  <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] px-1.5 py-0">
                                    أنت
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">{entry.levelTitle}</p>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-3 text-xs flex-shrink-0">
                              <div className="text-center">
                                <p className="font-black text-violet-600">{entry.xp}</p>
                                <p className="text-[10px] text-gray-400">XP</p>
                              </div>
                              <div className="text-center">
                                <p className="font-black text-amber-500">{entry.stars}</p>
                                <p className="text-[10px] text-gray-400">نجوم</p>
                              </div>
                              <div className="text-center">
                                <p className="font-black text-gray-600">Lv.{entry.level}</p>
                                <p className="text-[10px] text-gray-400">المستوى</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </main>

      <footer className="mt-auto py-4 text-center">
        <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
      </footer>
    </div>
  );
}