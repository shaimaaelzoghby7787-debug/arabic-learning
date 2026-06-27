'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

const STEPS = [
  {
    id: 1,
    title: 'إنشاء حساب GitHub',
    icon: '🐙',
    color: 'from-gray-700 to-gray-900',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'GitHub هو المكان اللي بتخزني فيه الكود (مجاني)',
    actions: [
      { text: '1. افتح المتصفح وادخل على', link: 'https://github.com/signup', linkText: 'github.com/signup' },
      { text: '2. سجّل حساب جديد بالبريد الإلكتروني (مجاني تماماً)' },
      { text: '3. بعد التسجيل، اضغط على "New repository"' },
      { text: '4. سمّيه مثلاً: arabic-learning' },
      { text: '5. اختر "Private" (خاص) واضغط "Create repository"' },
    ],
  },
  {
    id: 2,
    title: 'رفع الكود على GitHub',
    icon: '📤',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'رفع ملفات المنصة من جهازك لـ GitHub',
    actions: [
      { text: '1. حمّل ملف المشروع المضغوط' },
      { text: '2. فك الضغط على جهازك' },
      { text: '3. افتح Terminal أو CMD في مجلد المشروع' },
      { text: '4. انسخ الأوامر التالية واحد واحد:' },
    ],
    code: `git init
git add .
git commit -m "منصة تعلّم العربية"
git remote add origin https://github.com/USERNAME/arabic-learning.git
git branch -M main
git push -u origin main`,
    codeNote: '⚠️ استبدل USERNAME باسم مستخدمك على GitHub',
  },
  {
    id: 3,
    title: 'إنشاء قاعدة بيانات Turso',
    icon: '🗄️',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'قاعدة البيانات هي اللي بتخزن بيانات الطلاب (مجانية)',
    actions: [
      { text: '1. ادخل على', link: 'https://turso.tech/app', linkText: 'turso.tech' },
      { text: '2. سجّل حساب جديد بالبريد (مجاني)' },
      { text: '3. اضغط "Create Database"' },
      { text: '4. سمّيها: arabic-learning' },
      { text: '5. اختر Location: eu-west-1 (الأقرب لمصر)' },
      { text: '6. اضغط "Create Auth Token" وانسخه (هتحتاجه)' },
      { text: '7. انسخ Database URL (شكلها: libsql://arabic-learning-xxx.turso.io)' },
    ],
  },
  {
    id: 4,
    title: 'نشر المنصة على Vercel',
    icon: '🚀',
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    description: 'Vercel هي اللي بتخلي الموقع متاح على الإنترنت (مجاني)',
    actions: [
      { text: '1. ادخل على', link: 'https://vercel.com/signup', linkText: 'vercel.com' },
      { text: '2. سجّل بـ GitHub (سهل - اضغط Continue with GitHub)' },
      { text: '3. اضغط "Add New > Project"' },
      { text: '4. اختر Repository: arabic-learning' },
      { text: '5. في Environment Variables أضف متغيرين:' },
    ],
    envVars: [
      { name: 'TURSO_DATABASE_URL', value: 'libsql://arabic-learning-xxx.turso.io' },
      { name: 'TURSO_AUTH_TOKEN', value: 'الـ token اللي نسخته من Turso' },
    ],
    finalActions: [
      { text: '6. اضغط "Deploy" وانتظر دقيقتين' },
      { text: '7. هيديك رابط زي: https://arabic-learning.vercel.app ✅' },
    ],
  },
  {
    id: 5,
    title: 'تفعيل قاعدة البيانات',
    icon: '⚙️',
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    description: 'أول مرة تفتح الموقع، لازم تعمل إعداد سريع',
    actions: [
      { text: 'بعد النشر، افتح الرابط ده في المتصفح:' },
    ],
    code: 'https://YOUR-APP.vercel.app/api/setup?secret=arabic-platform-setup',
    codeNote: '⚠️ استبدل YOUR-APP باسم تطبيقك على Vercel',
    successCheck: 'لو ظهر: {"ok":true,"units":4} يبقى كل حاجة تمام! ✅',
  },
];

export default function DeployGuide() {
  const { navigate } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('home')}
            className="text-gray-600 hover:text-gray-900"
          >
            → رجوع للمنصة
          </Button>
          <h1 className="text-lg font-bold text-gray-800">
            🚀 دليل النشر
          </h1>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={`flex-1 h-2 rounded-full transition-all cursor-pointer ${
                  i <= currentStep
                    ? 'bg-gradient-to-l from-violet-500 to-purple-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            الخطوة {currentStep + 1} من {STEPS.length}
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-4 mb-6" dir="rtl">
              <div className={`text-5xl w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br ${step.color} shadow-lg`}>
                {step.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{step.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{step.description}</p>
              </div>
            </div>

            <Card className={`border ${step.borderColor} ${step.bgColor}`}>
              <CardContent className="p-5 space-y-4" dir="rtl">
                {step.actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-sm mt-0.5 text-gray-400 font-mono min-w-[24px] text-left">
                      {action.text.split('.')[0]}
                    </span>
                    <p className="text-gray-700 leading-relaxed">
                      {action.text.replace(/^\d+\.\s*/, '')}
                      {'link' in action && action.link && (
                        <a
                          href={action.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 font-medium underline mr-1 hover:text-violet-800"
                        >
                          {action.linkText}
                        </a>
                      )}
                    </p>
                  </div>
                ))}

                {step.code && (
                  <div className="mt-4" dir="ltr">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto font-mono leading-relaxed">
                      {step.code}
                    </pre>
                    {step.codeNote && (
                      <p className="text-xs text-amber-600 mt-2 font-medium" dir="rtl">
                        {step.codeNote}
                      </p>
                    )}
                  </div>
                )}

                {step.envVars && (
                  <div className="mt-4 space-y-2" dir="ltr">
                    {step.envVars.map((v, i) => (
                      <div key={i} className="bg-white border border-amber-200 rounded-lg p-3">
                        <p className="text-xs font-mono text-amber-700 font-bold">{v.name}</p>
                        <p className="text-sm text-gray-600 font-mono mt-1">{v.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {step.finalActions?.map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-sm mt-0.5 text-gray-400 font-mono min-w-[24px] text-left">
                      {action.text.split('.')[0]}
                    </span>
                    <p className="text-gray-700 leading-relaxed">
                      {action.text.replace(/^\d+\.\s*/, '')}
                    </p>
                  </div>
                ))}

                {step.successCheck && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-emerald-700 font-medium">{step.successCheck}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {currentStep === STEPS.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card className="border-2 border-emerald-200 bg-emerald-50">
              <CardContent className="p-5">
                <h3 className="text-lg font-bold text-emerald-800 text-center mb-3">
                  💰 التكلفة الإجمالية
                </h3>
                <div className="space-y-2 text-center" dir="rtl">
                  <p className="text-emerald-700">🐙 GitHub: <strong>مجاني</strong></p>
                  <p className="text-emerald-700">🗄️ Turso: <strong>مجاني</strong> (9GB تخزين)</p>
                  <p className="text-emerald-700">🚀 Vercel: <strong>مجاني</strong></p>
                  <div className="border-t border-emerald-200 pt-2 mt-2">
                    <p className="text-xl font-bold text-emerald-800">الإجمالي: ٠ جنيه! 🎉</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="disabled:opacity-30"
          >
            → السابق
          </Button>
          <Button
            onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
            disabled={currentStep === STEPS.length - 1}
            className="bg-gradient-to-l from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 disabled:opacity-30"
          >
            التالي ←
          </Button>
        </div>
      </footer>
    </div>
  );
}