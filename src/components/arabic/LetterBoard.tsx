'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { LESSONS } from '@/lib/curriculum-data';

// Letter data with forms, colors, and metadata
interface LetterInfo {
  letter: string;
  name: string;
  forms: { isolated: string; initial: string; medial: string; final: string };
  color: string;
  bg: string;
  border: string;
  tip: string;
}

const LETTER_DATA: LetterInfo[] = [
  {
    letter: 'ب', name: 'الباء',
    forms: { isolated: 'بـ', initial: 'بـ', medial: 'ـبـ', final: 'ـب' },
    color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-300',
    tip: 'حرف الباء يُكتب من أسفل إلى أعلى. له نقطة واحدة في الأسفل.',
  },
  {
    letter: 'م', name: 'الميم',
    forms: { isolated: 'مـ', initial: 'مـ', medial: 'ـمـ', final: 'ـم' },
    color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300',
    tip: 'حرف الميم له ثلاثة أشكال حسب موقعه في الكلمة. يمتاز بدائرة في الأسفل.',
  },
  {
    letter: 'ح', name: 'الحاء',
    forms: { isolated: 'حـ', initial: 'حـ', medial: 'ـحـ', final: 'ـح' },
    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300',
    tip: 'حرف الحاء يُنطق من أعمق الحلق. يشبه الهاء لكن أقوى في النطق.',
  },
  {
    letter: 'ج', name: 'الجيم',
    forms: { isolated: 'جـ', initial: 'جـ', medial: 'ـجـ', final: 'ـج' },
    color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-300',
    tip: 'حرف الجيم يُكتب برأس صغير في الأعلى. له نقطة واحدة في المنتصف.',
  },
  {
    letter: 'د', name: 'الدال',
    forms: { isolated: 'د', initial: 'د', medial: 'ـد', final: 'ـد' },
    color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300',
    tip: 'حرف الدال لا ي连接 مع الحرف التالي. يشبه كأس مقلوب.',
  },
  {
    letter: 'ل', name: 'اللام',
    forms: { isolated: 'لـ', initial: 'لـ', medial: 'ـلـ', final: 'ـل' },
    color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-300',
    tip: 'حرف اللام يُكتب بشكل مستقيم. من أكثر الحروف استخداماً في العربية.',
  },
  {
    letter: 'ن', name: 'النون',
    forms: { isolated: 'نـ', initial: 'نـ', medial: 'ـنـ', final: 'ـن' },
    color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-300',
    tip: 'حرف النون له نقطة واحدة في المنتصف فوق الجسم.',
  },
  {
    letter: 'ر', name: 'الراء',
    forms: { isolated: 'ر', initial: 'ر', medial: 'ـر', final: 'ـر' },
    color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300',
    tip: 'حرف الراء يُكتب برأس صغير ومقدّم. انتبه لشكله!',
  },
  {
    letter: 'ق', name: 'القاف',
    forms: { isolated: 'قـ', initial: 'قـ', medial: 'ـقـ', final: 'ـق' },
    color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-300',
    tip: 'حرف القاف له نقطتان فوقه. لا تخلطه بحرف الفاء!',
  },
  {
    letter: 'ك', name: 'الكاف',
    forms: { isolated: 'كـ', initial: 'كـ', medial: 'ـكـ', final: 'ـك' },
    color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-300',
    tip: 'حرف الكاف يشبه حرف الباء لكن بدون نقطة. فرّق بينهما!',
  },
  {
    letter: 'و', name: 'الواو',
    forms: { isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو' },
    color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-300',
    tip: 'حرف الواو يُكتب مثل حرف صغير دائري. حرف لا يلتحم.',
  },
  {
    letter: 'ه', name: 'الهاء',
    forms: { isolated: 'هـ', initial: 'هـ', medial: 'ـهـ', final: 'ـه' },
    color: 'text-lime-600', bg: 'bg-lime-50', border: 'border-lime-300',
    tip: 'حرف الهاء يُنطق من الحلق. له شكل دائري مميز.',
  },
  {
    letter: 'ذ', name: 'الذال',
    forms: { isolated: 'ذ', initial: 'ذ', medial: 'ـذ', final: 'ـذ' },
    color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-300',
    tip: 'حرف الذال يشبه الدال لكن له نقطة أعلاه. يُنطق من بين الثنايا.',
  },
  {
    letter: 'ظ', name: 'الظاء',
    forms: { isolated: 'ظ', initial: 'ظ', medial: 'ـظ', final: 'ـظ' },
    color: 'text-stone-600', bg: 'bg-stone-50', border: 'border-stone-300',
    tip: 'حرف الظاء يشبه الطاء لكن له نقطة أعلاه. من الحروف المميزة.',
  },
  {
    letter: 'ط', name: 'الطاء',
    forms: { isolated: 'طـ', initial: 'طـ', medial: 'ـطـ', final: 'ـط' },
    color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300',
    tip: 'حرف الطاء له رأس دائري وذيل طويل. يُنطق ببطء.',
  },
  {
    letter: 'ص', name: 'الصاد',
    forms: { isolated: 'صـ', initial: 'صـ', medial: 'ـصـ', final: 'ـص' },
    color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300',
    tip: 'حرف الصاد يُنطق من الحلق. فرّق بينه وبين السين!',
  },
  {
    letter: 'ض', name: 'الضاد',
    forms: { isolated: 'ضـ', initial: 'ضـ', medial: 'ـضـ', final: 'ـض' },
    color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300',
    tip: 'حرف الضاد حرف عربي فريد لا يوجد في غيرها من اللغات!',
  },
  {
    letter: 'ث', name: 'الثاء',
    forms: { isolated: 'ثـ', initial: 'ثـ', medial: 'ـثـ', final: 'ـث' },
    color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-300',
    tip: 'حرف الثاء يشبه التاء لكن له ثلاث نقاط. فرّق بينهما!',
  },
];

function speakLetter(letter: string, name: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(`حرف ${name} ${letter}`);
  utterance.lang = 'ar-SA';
  utterance.rate = 0.7;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}

function speakWord(word: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'ar-SA';
  utterance.rate = 0.7;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}

export default function LetterBoard() {
  const { navigate, studentName, studentAvatar, xp, stars, level } = useAppStore();
  const [selectedLetter, setSelectedLetter] = useState<LetterInfo | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const allLessons = LESSONS;
  const completedLessons = useAppStore((s) => s.completedLessons);

  const getLetterProgress = useCallback((letter: string) => {
    const lesson = allLessons.find(l => l.letter === letter);
    if (!lesson) return false;
    return completedLessons.includes(lesson.id);
  }, [allLessons, completedLessons]);

  const getLetterWords = useCallback((letter: string) => {
    const lesson = allLessons.find(l => l.letter === letter);
    if (!lesson) return [];
    return lesson.words || [];
  }, [allLessons]);

  const handleSpeak = useCallback((letter: string, name: string) => {
    setIsSpeaking(true);
    speakLetter(letter, name);
    setTimeout(() => setIsSpeaking(false), 1500);
  }, []);

  const handleSpeakWord = useCallback((word: string) => {
    setIsSpeaking(true);
    speakWord(word);
    setTimeout(() => setIsSpeaking(false), 1500);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 via-white to-orange-50" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('units')}
              className="text-gray-500 hover:text-amber-600"
            >
              <span className="text-lg">→</span>
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-gray-800">
                <span className="ml-1">🔤</span>
                لوحة الحروف
              </h1>
              <p className="text-xs text-gray-400">{LETTER_DATA.length} حرف عربي</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">💎{xp}</span>
              <span className="text-2xl">{studentAvatar}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 max-w-3xl mx-auto w-full">
        {/* Letters Grid */}
        <motion.div
          className="grid grid-cols-4 sm:grid-cols-6 gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {LETTER_DATA.map((info, idx) => {
            const isCompleted = getLetterProgress(info.letter);
            const isSelected = selectedLetter?.letter === info.letter;

            return (
              <motion.button
                key={info.letter}
                variants={{
                  hidden: { opacity: 0, scale: 0.5 },
                  visible: { opacity: 1, scale: 1 },
                }}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedLetter(isSelected ? null : info)}
                className={`
                  relative flex flex-col items-center justify-center
                  p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer
                  ${isSelected
                    ? `${info.bg} ${info.border} shadow-lg ring-2 ring-offset-2 ring-amber-300`
                    : isCompleted
                      ? 'bg-white border-green-200 shadow-md'
                      : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                  }
                `}
              >
                {isCompleted && (
                  <span className="absolute -top-1.5 -left-1.5 text-sm bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                )}
                <span className={`text-3xl sm:text-4xl font-bold ${isSelected ? info.color : 'text-gray-800'}`}>
                  {info.letter}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 mt-1">{info.name}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Letter Detail Panel */}
        <AnimatePresence mode="wait">
          {selectedLetter && (
            <motion.div
              key={selectedLetter.letter}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="mt-6"
            >
              <Card className={`border-2 ${selectedLetter.border} shadow-xl overflow-hidden`}>
                {/* Letter Hero Section */}
                <div className={`${selectedLetter.bg} p-6 text-center relative overflow-hidden`}>
                  {/* Decorative circles */}
                  <div className="absolute top-2 left-2 w-20 h-20 rounded-full opacity-10 bg-current" />
                  <div className="absolute bottom-2 right-2 w-32 h-32 rounded-full opacity-10 bg-current" />

                  <motion.div
                    className="relative z-10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                  >
                    <span className={`text-7xl sm:text-8xl font-bold ${selectedLetter.color} block mb-2`}>
                      {selectedLetter.letter}
                    </span>
                    <h2 className={`text-xl font-bold ${selectedLetter.color} mb-1`}>
                      {selectedLetter.name}
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSpeak(selectedLetter.letter, selectedLetter.name)}
                      disabled={isSpeaking}
                      className={`mt-2 rounded-full px-5 ${selectedLetter.border} ${selectedLetter.color} hover:${selectedLetter.bg} transition-all`}
                    >
                      {isSpeaking ? (
                        <motion.span
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="text-lg"
                        >
                          🔊
                        </motion.span>
                      ) : (
                        '🔊 استمع'
                      )}
                    </Button>
                  </motion.div>
                </div>

                <CardContent className="p-5 space-y-5">
                  {/* Letter Forms */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span>✏️</span> أشكال الحرف
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'أول الكلمة', form: selectedLetter.forms.initial },
                        { label: 'وسط الكلمة', form: selectedLetter.forms.medial },
                        { label: 'آخر الكلمة', form: selectedLetter.forms.final },
                        { label: 'منفصل', form: selectedLetter.forms.isolated },
                      ].map((form, i) => (
                        <motion.div
                          key={form.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + i * 0.05 }}
                          className="text-center p-2 rounded-xl bg-gray-50 border border-gray-100"
                        >
                          <span className={`text-2xl font-bold ${selectedLetter.color} block`}>
                            {form.form}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-1 block">{form.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Tip */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-3 rounded-xl bg-amber-50 border border-amber-200"
                  >
                    <p className="text-sm text-amber-800 flex items-start gap-2">
                      <span className="text-base flex-shrink-0">💡</span>
                      {selectedLetter.tip}
                    </p>
                  </motion.div>

                  {/* Example Words */}
                  {getLetterWords(selectedLetter.letter).length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span>📚</span> كلمات تبدأ بالحرف
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {getLetterWords(selectedLetter.letter).slice(0, 8).map((word, i) => (
                          <motion.button
                            key={word}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 + i * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSpeakWord(word)}
                            className="p-3 rounded-xl bg-white border-2 border-gray-100 hover:border-amber-200 hover:bg-amber-50 transition-all text-center cursor-pointer"
                          >
                            <span className="text-lg font-bold text-gray-800 block">{word}</span>
                            <span className="text-[10px] text-gray-400">🔊</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Progress indicator */}
                  <div className="flex items-center justify-between pt-2">
                    <Badge
                      variant={getLetterProgress(selectedLetter.letter) ? 'default' : 'secondary'}
                      className={getLetterProgress(selectedLetter.letter)
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-100'
                      }
                    >
                      {getLetterProgress(selectedLetter.letter) ? '✅ تم التعلم' : '📖 لم يُتعلم بعد'}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      الحرف {LETTER_DATA.findIndex(l => l.letter === selectedLetter.letter) + 1} من {LETTER_DATA.length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Summary (when no letter selected) */}
        {!selectedLetter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 space-y-3"
          >
            <Card className="border-0 shadow-md bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-amber-600">
                    {LETTER_DATA.filter(l => getLetterProgress(l.letter)).length}/{LETTER_DATA.length}
                  </span>
                  <span className="text-sm font-medium text-gray-600">📊 تقدم الحروف</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-l from-amber-400 to-orange-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(LETTER_DATA.filter(l => getLetterProgress(l.letter)).length / LETTER_DATA.length) * 100}%`
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <p className="text-sm text-amber-800 text-center">
                  🎯 اضغط على أي حرف لعرض تفاصيله والاستماع لنطقه!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Sticky Footer */}
      <footer className="mt-auto py-4 text-center">
        <p className="text-xs text-muted-foreground">
          🌟 تعلّم العربية - الصف الأول الابتدائي 🌟
        </p>
      </footer>
    </div>
  );
}