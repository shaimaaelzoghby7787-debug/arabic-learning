'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import { useAppStore } from '@/lib/store';

const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

// Dynamically import all views with SSR disabled to avoid hydration issues
// with framer-motion animations and Zustand persist
const Home = dynamic(() => import('@/components/arabic/Home'), { ssr: false });
const UnitsView = dynamic(() => import('@/components/arabic/UnitsView'), { ssr: false });
const LessonView = dynamic(() => import('@/components/arabic/LessonView'), { ssr: false });
const QuizView = dynamic(() => import('@/components/arabic/QuizView'), { ssr: false });
const ResultsView = dynamic(() => import('@/components/arabic/ResultsView'), { ssr: false });
const AchievementsView = dynamic(() => import('@/components/arabic/AchievementsView'), { ssr: false });
const TeacherDashboard = dynamic(() => import('@/components/arabic/TeacherDashboard'), { ssr: false });
const LeaderboardView = dynamic(() => import('@/components/arabic/LeaderboardView'), { ssr: false });

const views: Record<string, React.ComponentType> = {
  home: Home,
  units: UnitsView,
  lesson: LessonView,
  quiz: QuizView,
  exam: QuizView,
  results: ResultsView,
  achievements: AchievementsView,
  teacher: TeacherDashboard,
  leaderboard: LeaderboardView,
  certificate: UnitsView,
};

export default function Page() {
  const { currentView } = useAppStore();
  const mounted = useHydrated();

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-violet-50 via-white to-purple-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-6xl animate-spin">✏️</div>
        </div>
        <footer className="mt-auto py-4 text-center">
          <p className="text-xs text-muted-foreground">🌟 تعلّم العربية - الصف الأول الابتدائي 🌟</p>
        </footer>
      </div>
    );
  }

  const ViewComponent = views[currentView] || Home;

  return (
    <div className="w-full">
      <ViewComponent />
    </div>
  );
}