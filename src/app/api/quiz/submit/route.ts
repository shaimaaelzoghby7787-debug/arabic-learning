import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, lessonId, type, answers, timeSpent } = body;

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

    // Fetch student
    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Fetch all question answers for the questions in this quiz
    const questionIds = answers.map((a: { questionId: string }) => a.questionId);
    const questions = await db.questionBank.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, correctAnswer: true, lessonId: true },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Calculate score
    let correct = 0;
    let wrong = 0;
    const detailedAnswers = answers.map((a: { questionId: string; answer: string }) => {
      const q = questionMap.get(a.questionId);
      const isCorrect = q ? q.correctAnswer === a.answer : false;
      if (isCorrect) correct++;
      else wrong++;
      return {
        questionId: a.questionId,
        answer: a.answer,
        correct: isCorrect,
      };
    });

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

    // Determine unitId for the attempt
    let unitId = "";
    if (type === "unit_exam" || type === "final_exam") {
      const lesson = await db.lesson.findUnique({
        where: { id: lessonId },
        select: { unitId: true },
      });
      unitId = lesson?.unitId ?? "";
    }

    // Create attempt and update progress in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create Attempt record
      const attempt = await tx.attempt.create({
        data: {
          studentId,
          lessonId: type === "unit_exam" || type === "final_exam" ? "" : lessonId,
          unitId,
          type,
          score: scorePercent,
          totalQuestions,
          correctAnswers: correct,
          wrongAnswers: wrong,
          timeSpent: timeSpent || 0,
          starsEarned,
          xpEarned,
          answers: JSON.stringify(detailedAnswers),
        },
      });

      // Update Progress (only for lesson_quiz)
      if (type === "lesson_quiz") {
        const existing = await tx.progress.findUnique({
          where: { studentId_lessonId: { studentId, lessonId } },
        });

        const isCompleted = scorePercent >= 80;

        await tx.progress.upsert({
          where: { studentId_lessonId: { studentId, lessonId } },
          create: {
            studentId,
            lessonId,
            completed: isCompleted,
            xpEarned,
            starsEarned: Math.max(starsEarned, 0),
            bestScore: scorePercent,
            attempts: 1,
            lastAttemptAt: new Date(),
          },
          update: {
            completed: existing?.completed || isCompleted,
            xpEarned: (existing?.xpEarned ?? 0) + xpEarned,
            starsEarned: Math.max(existing?.starsEarned ?? 0, starsEarned),
            bestScore: Math.max(existing?.bestScore ?? 0, scorePercent),
            attempts: (existing?.attempts ?? 0) + 1,
            lastAttemptAt: new Date(),
          },
        });
      }

      // Update student XP and stars
      const newTotalXp = student.xp + xpEarned;
      const newTotalStars = student.stars + starsEarned;
      const newLevel = calculateLevel(newTotalXp);

      await tx.student.update({
        where: { id: studentId },
        data: {
          xp: newTotalXp,
          stars: newTotalStars,
          level: newLevel,
        },
      });

      // Check achievements
      const newAchievements = await checkAndUnlockAchievements(
        tx,
        studentId,
        newTotalXp,
        newLevel,
        scorePercent,
        type,
        correct
      );

      return { attempt, newAchievements, newLevel };
    });

    // Reload student to get final state
    const updatedStudent = await db.student.findUnique({
      where: { id: studentId },
      select: { xp: true, stars: true, level: true },
    });

    return NextResponse.json({
      score: scorePercent,
      totalQuestions,
      correct,
      wrong,
      starsEarned,
      xpEarned,
      newLevel: updatedStudent?.level ?? result.newLevel,
      newXp: updatedStudent?.xp ?? 0,
      newStars: updatedStudent?.stars ?? 0,
      newAchievements: result.newAchievements,
      attemptId: result.attempt.id,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}

function calculateLevel(xp: number): number {
  if (xp >= 1000) return 5;
  if (xp >= 600) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
}

async function checkAndUnlockAchievements(
  tx: TxClient,
  studentId: string,
  totalXp: number,
  level: number,
  scorePercent: number,
  type: string,
  correctThisAttempt: number
) {
  const newAchievements: Array<{
    id: string;
    key: string;
    title: string;
    icon: string;
  }> = [];

  // Get total correct answers across all attempts
  const totalCorrectResult = await tx.attempt.aggregate({
    where: { studentId },
    _sum: { correctAnswers: true },
  });
  const totalCorrect = (totalCorrectResult._sum.correctAnswers ?? 0) + correctThisAttempt;

  // Helper to try unlocking an achievement
  async function tryUnlock(key: string): Promise<boolean> {
    const achievement = await tx.achievement.findUnique({ where: { key } });
    if (!achievement) return false;

    const existing = await tx.studentAchievement.findUnique({
      where: {
        studentId_achievementId: { studentId, achievementId: achievement.id },
      },
    });

    if (existing) return false;

    await tx.studentAchievement.create({
      data: { studentId, achievementId: achievement.id },
    });

    newAchievements.push({
      id: achievement.id,
      key: achievement.key,
      title: achievement.title,
      icon: achievement.icon,
    });
    return true;
  }

  // أول حرف: Complete first lesson
  const completedCount = await tx.progress.count({
    where: { studentId, completed: true },
  });
  if (completedCount >= 1) await tryUnlock("أول حرف");

  // أول كلمة: Answer 10 questions correctly total
  if (totalCorrect >= 10) await tryUnlock("أول كلمة");

  // أول درس: Complete any lesson with 80%+ score
  if (type === "lesson_quiz" && scorePercent >= 80) {
    await tryUnlock("أول درس");
  }

  // Check unit completions — fetch units with lessons, then check progress separately
  const units = await tx.unit.findMany({
    include: { lessons: true },
    orderBy: { order: "asc" },
  });

  // Fetch all completed progress for this student
  const completedProgress = await tx.progress.findMany({
    where: { studentId, completed: true },
    select: { lessonId: true },
  });
  const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));

  // Helper: check if all lessons in a unit are completed
  function isUnitCompleted(lessons: Array<{ id: string }>): boolean {
    return lessons.length > 0 && lessons.every((l) => completedLessonIds.has(l.id));
  }

  // أول وحدة: Complete all lessons in a unit
  if (units.length > 0 && isUnitCompleted(units[0].lessons)) {
    await tryUnlock("أول وحدة");
  }

  // Unit-specific achievements
  const unitAchievementKeys = [
    "إكمال الوحدة الأولى",
    "إكمال الوحدة الثانية",
    "إكمال الوحدة الثالثة",
    "إكمال الوحدة الرابعة",
  ];

  for (let i = 0; i < units.length && i < unitAchievementKeys.length; i++) {
    if (isUnitCompleted(units[i].lessons)) {
      await tryUnlock(unitAchievementKeys[i]);
    }
  }

  // إكمال المنهج: Complete all units
  if (units.length > 0 && units.every((u) => isUnitCompleted(u.lessons))) {
    await tryUnlock("إكمال المنهج");
  }

  // أول 100 نقطة: Reach 100 XP
  if (totalXp >= 100) await tryUnlock("أول 100 نقطة");

  // نجم الصف الأول: Reach Level 5
  if (level >= 5) await tryUnlock("نجم الصف الأول");

  // بطل الاختبار: Get 100% on any exam
  if ((type === "unit_exam" || type === "final_exam") && scorePercent === 100) {
    await tryUnlock("بطل الاختبار");
  }

  return newAchievements;
}