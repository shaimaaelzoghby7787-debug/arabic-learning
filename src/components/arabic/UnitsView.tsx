'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/lib/store';
import { UNITS, LESSONS, getLessonsByUnit } from '@/lib/curriculum-data';

interface UnitData {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Array<{
    id: string;
    order: number;
    title: string;
    letter: string;
  }>;
}

const UNIT_COLORS: Record<number, { bg: string; border: string; header: string; text: string; light: string; icon: string }> = {
  1: { bg: 'from-blue-500 to-blue-600', border: 'border-blue-300', header: 'bg-blue-50', text: 'text-blue-700', light: 'bg-blue-50', icon: '👨‍👩‍👧‍👦' },
  2: { bg: 'from-emerald-500 to-emerald-600', border: 'border-emerald-300', header: 'bg-emerald-50', text: 'text-emerald-700', light: 'bg-emerald-50', icon: '🦁' },
  3: { bg: 'from-purple-500 to-purple-600', border: 'border-purple-300', header: 'bg-purple-50', text: 'text-purple-700', light: 'bg-purple-50', icon: '🤸' },
  4: { bg: 'from-orange-500 to-orange-600', border: 'border-orange-300', header: 'bg-orange-50', text: 'text-orange-700', light: 'bg-orange-50', icon: '🏫' },
};

export default function UnitsView() {
  const {
    studentName,
    studentAvatar,
    xp,
    stars,
    level,
    navigate,
    setLesson,
    completedLessons,
    lessonProgress,
  } = useAppStore();

  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  // Build units data from static curriculum
  const units: UnitData[] = useMemo(() => {
    return UNITS.map(u => ({
      id: u.id,
      title: u.title,
      description: u.description,
      order: u.order,
      lessons: getLessonsByUnit(u.id).map(l => ({
        id: l.id,
        order: l.order,
        title: l.title,
        letter: l.letter,
      })),
    }));
  }, []);

  // Calculate progress from store
  const totalLessons = LESSONS.length;
  const totalCompleted = completedLessons.length;
  const overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  const getUnitProgress = useCallback(
    (unitId: string) => {
      const unitLessons = getLessonsByUnit(unitId);
      const total = unitLessons.length;
      const completed = unitLessons.filter(l => completedLessons.includes(l.id)).length;
      const unitStars = unitLessons.reduce((s, l) => {
        const prog = lessonProgress[l.id];
        return s + (prog?.starsEarned ?? 0);
      }, 0);
      return {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        unitStars,
      };
    },
    [completedLessons, lessonProgress]
  );

  const getLessonStatus = useCallback(
    (lessonId: string) => {
      const prog = lessonProgress[lessonId];
      return {
        completed: completedLessons.includes(lessonId),
        bestScore: prog?.bestScore ?? 0,
        starsEarned: prog?.starsEarned ?? 0,
      };
    },
    [completedLessons, lessonProgress]
  );

  const handleLessonClick = useCallback(
    (unit: UnitData, lesson: { id: string; order: number; title: string; letter: string }) => {
      setLesson(unit.id, unit.title, lesson.id, lesson.title, lesson.letter);
      navigate('lesson');
    },
    [setLesson, navigate]
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('home')}
              className="text-gray-500 hover:text-indigo-600"
            >
              <span className="text-lg">🏠</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-gray-800">{studentName}</span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>💎 {xp}</span>
                  <span>⭐ {stars}</span>
                  <span>🏆 {level}</span>
                </div>
              </div>
              <span className="text-3xl">{studentAvatar}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full">
        {/* Action buttons row */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('letterboard')}
            className="flex-1 h-10 rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50 text-sm"
          >
            <span className="ml-1">🔤</span>
            لوحة الحروف
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('achievements')}
            className="flex-1 h-10 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 text-sm"
          >
            <span className="ml-1">🏅</span>
            الإنجازات
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('leaderboard')}
            className="flex-1 h-10 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50 text-sm"
          >
            <span className="ml-1">📊</span>
            المتصدرين
          </Button>
        </div>

        {/* Overall progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="border-0 shadow-md bg-white/70 backdrop-blur-sm">
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-600">
                  {overallProgress}%
                </span>
                <span className="text-sm font-medium text-gray-600">التقدم الكلي 🎯</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-l from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>⭐ {stars} نجمة</span>
                <span>💎 {xp} نقطة خبرة</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Units grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {units.map((unit, index) => {
            const colors = UNIT_COLORS[unit.order] || UNIT_COLORS[1];
            const prog = getUnitProgress(unit.id);
            const isExpanded = expandedUnit === unit.id;

            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-2 ${colors.border} shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white/80 backdrop-blur-sm`}>
                  {/* Unit header - clickable */}
                  <div
                    onClick={() => setExpandedUnit(isExpanded ? null : unit.id)}
                    className="block"
                  >
                    <div className={`${colors.header} px-5 pt-4 pb-3`}>
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">{colors.icon}</span>
                        <div className="flex-1 text-right mr-3">
                          <h3 className={`font-bold text-lg ${colors.text}`}>{unit.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{unit.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="pt-3 pb-4 px-5">
                    {/* Stats row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>⭐ {prog.unitStars}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{prog.completed}/{prog.total} دروس</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <Progress
                      value={prog.percentage}
                      className="h-2.5 mb-2"
                    />

                    {/* Expand/collapse indicator */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedUnit(isExpanded ? null : unit.id)}
                      className={`w-full mt-1 h-9 rounded-xl text-xs ${colors.text} hover:${colors.light}`}
                    >
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={isExpanded ? 'collapse' : 'expand'}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                        >
                          {isExpanded ? '▲ إخفاء الدروس' : '▼ عرض الدروس'}
                        </motion.span>
                      </AnimatePresence>
                    </Button>

                    {/* Lessons list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <ScrollArea className="max-h-64 mt-2">
                            <div className="space-y-1.5">
                              {unit.lessons.map((lesson, li) => {
                                const status = getLessonStatus(lesson.id);
                                return (
                                  <motion.div
                                    key={lesson.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: li * 0.05 }}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLessonClick(unit, lesson);
                                      }}
                                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
                                        status.completed
                                          ? 'border-green-200 bg-green-50/80'
                                          : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50'
                                      }`}
                                    >
                                      {/* Status icon */}
                                      <div className="flex-shrink-0">
                                        {status.completed ? (
                                          <span className="text-xl">✅</span>
                                        ) : (
                                          <span className="text-xl">📖</span>
                                        )}
                                      </div>

                                      {/* Lesson info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-sm text-gray-800 truncate">
                                            {lesson.title}
                                          </span>
                                          {lesson.letter && (
                                            <Badge
                                              variant="secondary"
                                              className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0"
                                            >
                                              {lesson.letter}
                                            </Badge>
                                          )}
                                        </div>
                                        {status.completed && (
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-green-600">
                                              {status.bestScore}%
                                            </span>
                                            <span className="text-xs text-amber-500">
                                              {'⭐'.repeat(status.starsEarned)}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Arrow */}
                                      <span className="text-gray-400 text-sm flex-shrink-0">◀</span>
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Sticky footer */}
      <footer className="mt-auto py-4 text-center">
        <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
      </footer>
    </div>
  );
}