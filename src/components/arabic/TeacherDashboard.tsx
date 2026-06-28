'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Static data - no imports from curriculum-data to keep the bundle tiny
const UNITS = [
  { title: 'أسرتي', desc: 'الحروف ب م ح ج د', lessons: 6, icon: '👨‍👩‍👧‍👦' },
  { title: 'حيواناتي', desc: 'الحروف ل ن ر ق ك', lessons: 6, icon: '🦁' },
  { title: 'أجزاء جسمي', desc: 'الحروف و ه ذ ظ', lessons: 5, icon: '🤸' },
  { title: 'مدرستي', desc: 'الحروف ط ص ض ث', lessons: 5, icon: '🏫' },
];

const LETTERS = ['ب','م','ح','ج','د','ل','ن','ر','ق','ك','و','ه','ذ','ظ','ط','ص','ض','ث'];

export default function TeacherDashboard() {
  const [tab, setTab] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir="rtl">
      <header className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'} className="rounded-xl text-gray-500">
            <span className="text-lg">→</span>
          </Button>
          <h1 className="text-lg font-bold text-gray-800">
            <span className="ml-1">👨‍🏫</span> لوحة المعلم
          </h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-3xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {['نظرة عامة', 'المحتوى', 'معلومات'].map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === i ? 'bg-white shadow-md text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab 0: Overview */}
        {tab === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-violet-200 bg-violet-50">
                <CardContent className="p-4 text-center">
                  <span className="text-2xl">📚</span>
                  <p className="text-2xl font-bold text-violet-700">{UNITS.length}</p>
                  <p className="text-xs text-violet-600">وحدة</p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 text-center">
                  <span className="text-2xl">📖</span>
                  <p className="text-2xl font-bold text-emerald-700">{UNITS.reduce((a, u) => a + u.lessons, 0)}</p>
                  <p className="text-xs text-emerald-600">درس</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <span className="text-2xl">🔤</span>
                  <p className="text-2xl font-bold text-amber-700">{LETTERS.length}</p>
                  <p className="text-xs text-amber-600">حرف</p>
                </CardContent>
              </Card>
              <Card className="border-rose-200 bg-rose-50">
                <CardContent className="p-4 text-center">
                  <span className="text-2xl">📊</span>
                  <p className="text-xl font-bold text-rose-700">+2000</p>
                  <p className="text-xs text-rose-600">سؤال</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-blue-100 bg-blue-50">
              <CardContent className="p-5">
                <h3 className="font-bold text-blue-800 mb-2">📋 عن المنصة</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  منصة تعلّم العربية للصف الأول الابتدائي - تحتوي على {UNITS.length} وحدات تعليمية
                  و {UNITS.reduce((a, u) => a + u.lessons, 0)} درس تفاعلي مع أكثر من 2000 سؤال متنوّع.
                </p>
                <p className="text-sm text-blue-600 mt-3 font-medium">
                  💡 ملاحظة: بيانات الطلاب محفوظة على أجهزتهم. كل طالب يلعب على جهازه ويتقدّم بسرعته.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 1: Curriculum */}
        {tab === 1 && (
          <div className="space-y-4">
            {UNITS.map((unit) => (
              <Card key={unit.title} className="border-gray-200">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{unit.icon}</span>
                      <h3 className="font-bold text-gray-800">{unit.title}</h3>
                    </div>
                    <span className="text-sm text-gray-500">{unit.lessons} درس</span>
                  </div>
                  <p className="text-xs text-gray-500 mr-9">{unit.desc}</p>
                </div>
              </Card>
            ))}

            <Card className="border-orange-100 bg-orange-50">
              <CardContent className="p-5">
                <h3 className="font-bold text-orange-800 mb-2">🔤 الحروف المُدرّسة</h3>
                <div className="flex flex-wrap gap-2">
                  {LETTERS.map(l => (
                    <span key={l} className="w-10 h-10 rounded-xl bg-white border border-orange-200 flex items-center justify-center text-lg font-bold text-orange-700">{l}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Info */}
        {tab === 2 && (
          <div className="space-y-4">
            <Card className="border-gray-200">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-gray-800 text-lg">ℹ️ كيف تستخدم المنصة؟</h3>
                {[
                  'شاركي رابط المنصة مع الطلاب',
                  'كل طالب يفتح الرابط على جهازه ويدخل اسمه',
                  'يبدأ الطالب بتعلم الحروف والكلمات تفاعلياً',
                  'يختبر نفسه في أسئلة متنوّعة بعد كل درس',
                  'يجمع النجوم والنقاط ويتقدّم في المستويات',
                ].map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xl">{['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'][i]}</span>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-5">
                <h3 className="font-bold text-amber-800 mb-2">⚠️ ملاحظة مهمة</h3>
                <p className="text-sm text-amber-700 leading-relaxed">
                  المنصة الحالية تخزن بيانات كل طالب على جهازه (localStorage).
                  البيانات مش متشاركة بين الأجهزة.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="mt-auto py-3 text-center border-t bg-white">
        <p className="text-xs text-gray-400">👨‍🏫 لوحة المعلم - منصة تعلّم العربية</p>
      </footer>
    </div>
  );
}