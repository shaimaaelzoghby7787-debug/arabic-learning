'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/lib/store';
import { getAllUnits, getAllLessons } from '@/lib/curriculum-data';

const LEVEL_TITLES: Record<number, string> = {
  1: 'مبتدئ', 2: 'متعلّم', 3: 'نشيط', 4: 'متقدم', 5: 'محترف', 6: 'بطل', 7: 'أسطورة',
};

export default function TeacherDashboard() {
  const { navigate } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');

  const units = getAllUnits();
  const lessons = getAllLessons();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('units')}
              className="rounded-xl text-gray-500 hover:text-gray-700"
            >
              <span className="text-lg">→</span>
            </Button>
            <h1 className="text-lg font-bold text-gray-800">
              <span className="ml-1">👨‍🏫</span>
              لوحة المعلم
            </h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-4 max-w-5xl mx-auto w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6 bg-gray-200/80 rounded-2xl h-11 p-1">
            <TabsTrigger value="overview" className="rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              المحتوى التعليمي
            </TabsTrigger>
            <TabsTrigger value="info" className="rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
              معلومات
            </TabsTrigger>
          </TabsList>

          {/* ===== Tab 1: Overview ===== */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'الوحدات', value: units.length, icon: '📚', color: 'bg-violet-50 text-violet-700 border-violet-200' },
                { label: 'الدروس', value: lessons.length, icon: '📖', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { label: 'الحروف', value: lessons.filter(l => l.letter).length, icon: '🔤', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { label: 'ملاحظة', value: '📊', icon: '💡', color: 'bg-rose-50 text-rose-700 border-rose-200', isNote: true },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`border ${stat.color}`}>
                    <CardContent className="p-4 text-center">
                      <span className="text-2xl block mb-1">{stat.icon}</span>
                      {stat.isNote ? (
                        <p className="text-xs font-medium mt-1">البيانات محلية</p>
                      ) : (
                        <>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs mt-1">{stat.label}</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="border border-blue-100 bg-blue-50">
              <CardContent className="p-5">
                <h3 className="font-bold text-blue-800 mb-2">📋 عن المنصة</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  منصة تعلّم العربية للصف الأول الابتدائي - تحتوي على {units.length} وحدات تعليمية
                  و {lessons.length} درس تفاعلي مع أكثر من 2000 سؤال متنوّع.
                </p>
                <p className="text-sm text-blue-600 mt-3 font-medium">
                  💡 ملاحظة: بيانات الطلاب محفوظة على أجهزتهم. كل طالب يلعب على جهازه ويتقدّم بسرعته.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Tab 2: Curriculum ===== */}
          <TabsContent value="curriculum" className="space-y-4">
            {units.map((unit, idx) => {
              const unitLessons = lessons.filter(l => l.unitId === unit.id);
              const letterLessons = unitLessons.filter(l => l.letter);
              return (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-gray-800">
                          الوحدة {unit.order}: {unit.title}
                        </CardTitle>
                        <span className="text-sm text-gray-500">
                          {unitLessons.length} درس
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{unit.description}</p>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="space-y-2">
                        {unitLessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-lg font-bold text-violet-600 shrink-0">
                              {lesson.letter || '📋'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {lesson.title}
                              </p>
                              {lesson.letter && (
                                <p className="text-xs text-gray-500">
                                  {lesson.words ? `${lesson.words.length} كلمة` : ''}
                                </p>
                              )}
                            </div>
                            <Progress
                              value={0}
                              className="w-16 h-2"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>

          {/* ===== Tab 3: Info ===== */}
          <TabsContent value="info" className="space-y-4">
            <Card className="border border-gray-200">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-gray-800 text-lg">ℹ️ كيف تستخدم المنصة؟</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex gap-3">
                    <span className="text-xl">1️⃣</span>
                    <p>شاركي رابط المنصة مع الطلاب</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xl">2️⃣</span>
                    <p>كل طالب يفتح الرابط على جهازه ويدخل اسمه</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xl">3️⃣</span>
                    <p>يبدأ الطالب بتعلم الحروف والكلمات تفاعلياً</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xl">4️⃣</span>
                    <p>يختبر نفسه في أسئلة متنوّعة بعد كل درس</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xl">5️⃣</span>
                    <p>يجمع النجوم والنقاط ويتقدّم في المستويات</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-amber-200 bg-amber-50">
              <CardContent className="p-5">
                <h3 className="font-bold text-amber-800 mb-2">⚠️ ملاحظة مهمة</h3>
                <p className="text-sm text-amber-700 leading-relaxed">
                  المنصة الحالية تخزن بيانات كل طالب على جهازه (localStorage).
                  يعني البيانات مش متشاركة بين الأجهزة.
                  لو عايزة تتبّعي تقدّم الطلاب، ممكن تسألهم يرسولك صور من شاشاتهم.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-emerald-200 bg-emerald-50">
              <CardContent className="p-5">
                <h3 className="font-bold text-emerald-800 mb-2">📧 التواصل</h3>
                <p className="text-sm text-emerald-700">
                  لو عندك اقتراح أو عايزة إضافة حاجة جديدة للمنصة، تواصلي معانا!
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-3 text-center border-t bg-white">
        <p className="text-xs text-gray-400">
          👨‍🏫 لوحة المعلم - منصة تعلّم العربية
        </p>
      </footer>
    </div>
  );
}