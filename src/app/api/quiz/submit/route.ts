import { NextRequest, NextResponse } from "next/server";
import {
  calculateLevel,
  getLevelInfo,
  ALL_QUESTIONS,
  ACHIEVEMENTS,
  UNITS,
  getLessonsByUnit,
  getAchievementByKey,
} from "@/lib/curriculum-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentId,
      lessonId,
      type,
      answers,
      timeSpent,
      currentXp = 0,
      currentStars = 0,
      currentLevel = 1,
      completedLessons = [] as string[],
    } = body;

    // Validate required fields
    if (!studentId || !lessonId || !type || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "studentId, lessonId, type, and answers are required" },
        { status: 400 }
      );
    }

    if (!["lesson_quiz", "unit_exam", "final_exam"].includes(type)) {
      return NextResponse.json(
        { error: "type must be lesson_quiz, unit_exam, or final_exam" },
        { status: 400 }
      );
    }

    // Build question map from static data
    const questionIds = answers.map((a: { questionId: string }) => a.questionId);
    const questionMap = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

    // Calculate score
    let correct = 0;
    let wrong = 0;
    for (const a of answers as Array<{ questionId: string; answer: string }>) {
      const q = questionMap.get(a.questionId);
      const isCorrect = q ? q.correctAnswer === a.answer : false;
      if (isCorrect) correct++;
      else wrong++;
    }

    const totalQuestions = answers.length;
    const scorePercent = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    // Calculate XP
    let xpEarned = correct * 5; // 5 XP per correct answer

    // Calculate stars
    let starsEarned = 0;
    if (scorePercent >= 100) starsEarned = 3;
    else if (scorePercent >= 90) starsEarned = 2;
    else if (scorePercent >= 80) starsEarned = 1;

    // Bonus XP for scores
    if (type === "lesson_quiz") {
      if (scorePercent >= 90) xpEarned += 30;
      else if (scorePercent >= 80) xpEarned += 20;
    } else if (type === "unit_exam" && scorePercent >= 70) {
      xpEarned += 50;
    } else if (type === "final_exam" && scorePercent >= 70) {
      xpEarned += 100;
    }

    // Calculate new student state
    const newTotalXp = currentXp + xpEarned;
    const newTotalStars = currentStars + starsEarned;
    const newLevel = calculateLevel(newTotalXp);

    // Check achievements
    const newAchievements = checkAchievements(
      completedLessons,
      lessonId,
      newTotalXp,
      newLevel,
      scorePercent,
      type,
      correct
    );

    return NextResponse.json({
      score: scorePercent,
      totalQuestions,
      correct,
      wrong,
      starsEarned,
      xpEarned,
      newLevel,
      newXp: newTotalXp,
      newStars: newTotalStars,
      newAchievements,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}

function checkAchievements(
  completedLessons: string[],
  _lessonId: string,
  totalXp: number,
  level: number,
  scorePercent: number,
  type: string,
  _correctThisAttempt: number
) {
  const unlocked: Array<{ id: string; key: string; title: string; icon: string }> = [];

  function tryUnlock(key: string) {
    const ach = getAchievementByKey(key);
    if (!ach) return;
    // In a real multi-user system we'd check if already unlocked.
    // Here we return it and let the client deduplicate.
    unlocked.push({
      id: ach.id,
      key: ach.key,
      title: ach.title,
      icon: ach.icon,
    });
  }

  // أول حرف: Complete first lesson
  if (completedLessons.length >= 1) tryUnlock("أول حرف");

  // أول 100 نقطة: Reach 100 XP
  if (totalXp >= 100) tryUnlock("أول 100 نقطة");

  // أول درس: Complete any lesson with 80%+ score
  if (type === "lesson_quiz" && scorePercent >= 80) {
    tryUnlock("أول درس");
  }

  // Check unit completions
  for (const unit of UNITS) {
    const unitLessons = getLessonsByUnit(unit.id);
    const unitLessonIds = new Set(unitLessons.map((l) => l.id));
    const completedInUnit = completedLessons.filter((id) => unitLessonIds.has(id)).length;

    if (unitLessonIds.size > 0 && completedInUnit >= unitLessonIds.size) {
      // Unit fully completed
      if (unit.order === 1) {
        tryUnlock("أول وحدة");
        tryUnlock("إكمال الوحدة الأولى");
      }
      if (unit.order === 2) tryUnlock("إكمال الوحدة الثانية");
      if (unit.order === 3) tryUnlock("إكمال الوحدة الثالثة");
      if (unit.order === 4) tryUnlock("إكمال الوحدة الرابعة");
    }
  }

  // إكمال المنهج: Complete all units
  const totalLessons = UNITS.reduce(
    (sum, u) => sum + getLessonsByUnit(u.id).length,
    0
  );
  if (completedLessons.length >= totalLessons) {
    tryUnlock("إكمال المنهج");
  }

  // نجم الصف الأول: Reach Level 5
  if (level >= 5) tryUnlock("نجم الصف الأول");

  // بطل الاختبار: Get 100% on any exam
  if ((type === "unit_exam" || type === "final_exam") && scorePercent === 100) {
    tryUnlock("بطل الاختبار");
  }

  return unlocked;
}