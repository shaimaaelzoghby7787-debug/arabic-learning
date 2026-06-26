import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Student
  studentId: string | null;
  studentName: string;
  studentAvatar: string;
  xp: number;
  stars: number;
  level: number;

  // Navigation
  currentView:
    | 'home'
    | 'units'
    | 'lesson'
    | 'quiz'
    | 'exam'
    | 'results'
    | 'achievements'
    | 'teacher'
    | 'certificate'
    | 'leaderboard';

  // Lesson state
  currentUnitId: string | null;
  currentUnitTitle: string;
  currentLessonId: string | null;
  currentLessonTitle: string;
  currentLetter: string;

  // Quiz state
  quizType: 'lesson_quiz' | 'unit_exam' | 'final_exam';
  quizQuestions: Array<{
    id: string;
    type: string;
    question: string;
    options: string[];
    correctAnswer: string;
    imageUrl: string | null;
    difficulty: number;
    hint: string | null;
  }>;
  currentQuestionIndex: number;
  quizAnswers: Array<{ questionId: string; answer: string }>;
  quizStartTime: number;
  lastResult: Record<string, unknown> | null;

  // Curriculum data
  units: Array<Record<string, unknown>>;

  // Actions
  setStudent: (id: string, name: string, avatar: string) => void;
  updateXP: (xp: number) => void;
  updateStars: (stars: number) => void;
  setLevel: (level: number) => void;
  navigate: (view: AppState['currentView']) => void;
  setLesson: (
    unitId: string,
    unitTitle: string,
    lessonId: string,
    lessonTitle: string,
    letter: string
  ) => void;
  setQuiz: (
    questions: Array<{
      id: string;
      type: string;
      question: string;
      options: string[];
      correctAnswer: string;
      imageUrl: string | null;
      difficulty: number;
      hint: string | null;
    }>,
    type: string
  ) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
  setResult: (result: Record<string, unknown>) => void;
  setUnits: (units: Array<Record<string, unknown>>) => void;
  loadStudentData: (data: {
    id: string;
    name: string;
    avatar: string;
    xp: number;
    stars: number;
    level: number;
  }) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Student defaults
      studentId: null,
      studentName: '',
      studentAvatar: '🧒',
      xp: 0,
      stars: 0,
      level: 1,

      // Navigation default
      currentView: 'home',

      // Lesson defaults
      currentUnitId: null,
      currentUnitTitle: '',
      currentLessonId: null,
      currentLessonTitle: '',
      currentLetter: '',

      // Quiz defaults
      quizType: 'lesson_quiz',
      quizQuestions: [],
      currentQuestionIndex: 0,
      quizAnswers: [],
      quizStartTime: 0,
      lastResult: null,

      // Curriculum
      units: [],

      // Actions
      setStudent: (id, name, avatar) =>
        set({
          studentId: id,
          studentName: name,
          studentAvatar: avatar,
        }),

      updateXP: (xp) => set({ xp }),
      updateStars: (stars) => set({ stars }),
      setLevel: (level) => set({ level }),

      navigate: (view) => set({ currentView: view }),

      setLesson: (unitId, unitTitle, lessonId, lessonTitle, letter) =>
        set({
          currentUnitId: unitId,
          currentUnitTitle: unitTitle,
          currentLessonId: lessonId,
          currentLessonTitle: lessonTitle,
          currentLetter: letter,
        }),

      setQuiz: (questions, type) =>
        set({
          quizQuestions: questions,
          quizType: type as AppState['quizType'],
          currentQuestionIndex: 0,
          quizAnswers: [],
          quizStartTime: Date.now(),
        }),

      answerQuestion: (questionId, answer) =>
        set((state) => ({
          quizAnswers: [...state.quizAnswers, { questionId, answer }],
        })),

      nextQuestion: () =>
        set((state) => ({
          currentQuestionIndex: Math.min(
            state.currentQuestionIndex + 1,
            state.quizQuestions.length - 1
          ),
        })),

      resetQuiz: () =>
        set({
          quizQuestions: [],
          currentQuestionIndex: 0,
          quizAnswers: [],
          quizStartTime: 0,
          lastResult: null,
          quizType: 'lesson_quiz',
        }),

      setResult: (result) => set({ lastResult: result }),
      setUnits: (units) => set({ units }),

      loadStudentData: (data) =>
        set({
          studentId: data.id,
          studentName: data.name,
          studentAvatar: data.avatar,
          xp: data.xp,
          stars: data.stars,
          level: data.level,
        }),
    }),
    {
      name: 'arabic-learning-storage',
      partialize: (state) => ({
        studentId: state.studentId,
        studentName: state.studentName,
        studentAvatar: state.studentAvatar,
        xp: state.xp,
        stars: state.stars,
        level: state.level,
        currentView: state.currentView,
      }),
    }
  )
);