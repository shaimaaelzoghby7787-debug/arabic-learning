'use client';

import { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';

/* ─── Shared loading component ─── */
function AppLoader() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-violet-50 via-white to-purple-50">
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="text-6xl animate-bounce">✏️</div>
          <div className="absolute -top-1 -right-1 text-2xl animate-ping">⭐</div>
        </div>
        <p className="text-lg font-bold text-purple-600 animate-pulse">
          جاري التحميل...
        </p>
      </div>
      <footer className="mt-auto py-4 text-center">
        <p className="text-xs text-muted-foreground">
          🌟 تعلّم العربية - الصف الأول الابتدائي 🌟
        </p>
      </footer>
    </div>
  );
}

/* ─── Dynamic imports with SSR disabled ─── */
const Home = dynamic(() => import('@/components/arabic/Home'), {
  ssr: false,
  loading: () => <AppLoader />,
});
const UnitsView = dynamic(() => import('@/components/arabic/UnitsView'), {
  ssr: false,
  loading: () => <AppLoader />,
});
const LessonView = dynamic(() => import('@/components/arabic/LessonView'), {
  ssr: false,
  loading: () => <AppLoader />,
});
const QuizView = dynamic(() => import('@/components/arabic/QuizView'), {
  ssr: false,
  loading: () => <AppLoader />,
});
const ResultsView = dynamic(() => import('@/components/arabic/ResultsView'), {
  ssr: false,
  loading: () => <AppLoader />,
});
const AchievementsView = dynamic(() => import('@/components/arabic/AchievementsView'), {
  ssr: false,
  loading: () => <AppLoader />,
});
const TeacherDashboard = dynamic(() => import('@/components/arabic/TeacherDashboard'), {
  ssr: false,
  loading: () => <AppLoader />,
});
const LeaderboardView = dynamic(() => import('@/components/arabic/LeaderboardView'), {
  ssr: false,
  loading: () => <AppLoader />,
});

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

  const ViewComponent = useMemo(
    () => views[currentView] || Home,
    [currentView]
  );

  return (
    <Suspense fallback={<AppLoader />}>
      <ViewComponent />
    </Suspense>
  );
}