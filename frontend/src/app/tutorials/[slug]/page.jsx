"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  Code2, 
  Share2, 
  ChevronRight, 
  Lightbulb, 
  AlertTriangle,
  Play,
  Edit,
  ChevronLeft
} from "lucide-react";
import { api } from "@/lib/api";

const richLessonsData = {
  "variables-and-data-types": {
    title: "O'zgaruvchilar, Ma'lumot turlari va Tezkor Kiritish-Chiqarish (Fast I/O)",
    category: "Python Asoslari",
    duration: "10 daqiqa",
    summary: "Python tilida o'zgaruvchilar dinamik tipga ega. Musobaqa dasturlashda va katta hajmli ma'lumotlar bilan ishlashda standart input() funksiyasi sekin ishlashi mumkin. Ushbu darsda tezkor ma'lumot kiritish usullarini ko'rib chiqamiz.",
    relatedProblemSlug: "two-sum",
    sections: [
      {
        title: "1. Asosiy ma'lumot turlari",
        content: `Python dasturlash tilida quyidagi asosiy ma'lumot turlari mavjud:
• int — butun sonlar (masalan: 42, -100). Python-da butun sonlar xotira ruxsat berganicha cheksiz aniqlikda bo'lishi mumkin.
• float — haqiqiy sonlar (masalan: 3.14159, -0.001).
• str — satrlar (matnlar). Satrlar o'zgarmas (immutable) hisoblanadi.
• bool — mantiqiy qiymat (True yoki False).
• list — dinamik massiv. Elementlarni o'zgartirish, qo'shish va o'chirish mumkin.
• tuple — o'zgarmas ro'yxat (immutable list).
• dict — xesh-jadval (kalit-qiymat juftliklari). Kalitlar bo'yicha qidirish o'rtacha O(1) vaqt oladi.
• set — takrorlanmas elementlar to'plami.`,
        code: `# Ma'lumot turlari namunasi
son = 100
haqiqiy = 3.14
matn = "AlgoSet platformasi"
massiv = [1, 2, 3, 4, 5]
lugat = {"kalit": "qiymat", "algoritm": "tezkor"}

print(type(son))    # <class 'int'>
print(type(lugat))  # <class 'dict'>`
      },
      {
        title: "2. Fast I/O — Katta hajmdagi ma'lumotlarni o'qish",
        content: `Olimpiada va musobaqalarda (masalan, Codeforces, LeetCode, ICPC) test fayllari 100,000 yoki 1,000,000 qatordan iborat bo'lishi mumkin. Bunday hollarda standart \`input()\` funksiyasi ko'p vaqt oladi va 'Time Limit Exceeded' (TLE) xatoligi kelib chiqadi.
Shu sababli \`sys.stdin.readline\` dan foydalanish tavsiya etiladi:`,
        code: `import sys

# Tezkor kiritish uchun standart funksiya
input = sys.stdin.readline

def solve():
    # Bitta qatorda berilgan ikkita sonni o'qish
    a, b = map(int, input().split())
    
    # N ta sondan iborat massivni o'qish
    arr = list(map(int, input().split()))
    
    # Natijani tezkor chiqarish
    sys.stdout.write(f"Yig'indi: {a + b}\\n")`
      },
      {
        title: "3. Amaliy maslahatlar va eng ko'p uchraydigan xatolar",
        content: `• Satr oxiridagi bo'sh joylar: \`sys.stdin.readline()\` satr oxiridagi '\\n' (yangi qator) belgisini ham o'qiydi. Agar sizga faqat toza matn kerak bo'lsa, \`input().strip()\` dan foydalaning.
• Massivlarni ko'paytirish xatosi: \`[[0] * m] * n\` yozsangiz, barcha qatorlar bitta xotira manziliga havola qiladi. Buning o'rniga ro'yxat generatoridan foydalaning: \`[[0] * m for _ in range(n)]\`.`,
        code: `# To'g'ri 2D matritsa yaratish
n, m = 3, 4
matritsa = [[0] * m for _ in range(n)]
matritsa[0][0] = 5
print(matritsa)  # Faqat birinchi katak 5 ga aylanadi`
      }
    ]
  },
  "control-flow-and-loops": {
    title: "Shart operatorlari, Sikllar va Ro'yxat generatorlari",
    category: "Python Asoslari",
    duration: "12 daqiqa",
    summary: "Dasturning boshqaruv oqimi shartlar va sikllar orqali ta'minlanadi. Pythonda sikllarni optimal va qisqa yozish kodning samaradorligini keskin oshiradi.",
    relatedProblemSlug: "two-sum",
    sections: [
      {
        title: "1. if, elif va else bilan shartlarni tekshirish",
        content: `Pythonda bloklar jingalak qavslar o'rniga 4 ta bo'sh joy (indentation) bilan belgilanadi. Shartlar mantiqiy and, or, not operatorlari bilan birlashtiriladi.`,
        code: `ball = 85
if ball >= 90:
    baho = "A"
elif ball >= 80:
    baho = "B"
elif ball >= 70:
    baho = "C"
else:
    baho = "F"`
      },
      {
        title: "2. for sikli, enumerate() va zip() funksiyalari",
        content: `Indeks va qiymatni bir vaqtda olish uchun \`range(len(arr))\` o'rniga \`enumerate(arr)\` dan foydalanish eng yaxshi amaliyot (Pythonic way) hisoblanadi.`,
        code: `mevalar = ["olma", "anor", "shaftoli"]

# enumerate bilan indeks va qiymat
for i, meva in enumerate(mevalar):
    print(f"{i}-indeks: {meva}")

# Ikki massivni parallel aylanib chiqish (zip)
narxlar = [10000, 15000, 12000]
for meva, narx in zip(mevalar, narxlar):
    print(f"{meva}: {narx} so'm")`
      },
      {
        title: "3. Ro'yxat generatorlari (List Comprehensions)",
        content: `Bir necha qatordan iborat for siklini bitta ixcham qatorga aylantirish uchun generatorlardan foydalaniladi:`,
        code: `# Faqat juft sonlarning kvadratini olish
sonlar = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
juft_kvadratlar = [x ** 2 for x in sonlar if x % 2 == 0]
print(juft_kvadratlar)  # [4, 16, 36, 64, 100]`
      }
    ]
  },
  "oop-fundamentals": {
    title: "Obyektga Yo'naltirilgan Dasturlash (OOP) va Dunder Metodlar",
    category: "Python OOP",
    duration: "15 daqiqa",
    summary: "Klasslar, konstruktorlar, xususiy solishtirish metodlari (__lt__, __eq__) va algoritmlarda maxsus ma'lumot tuzilmalarini yaratish.",
    relatedProblemSlug: "two-sum",
    sections: [
      {
        title: "1. Klass va Obyekt tushunchasi",
        content: `Klass — bu obyektning qolipi yoki andozasidir. Unda atributlar (ma'lumotlar) va metodlar (funksiyalar) saqlanadi. \`__init__\` metodi konstruktor bo'lib, yangi obyekt yaratilganda avtomatik chaqiriladi.`,
        code: `class Foydalanuvchi:
    def __init__(self, ism: str, reyting: int):
        self.ism = ism
        self.reyting = reyting

    def reytingni_oshir(self, ball: int):
        self.reyting += ball
        print(f"{self.ism}ning yangi reytingi: {self.reyting}")

talaba = Foydalanuvchi("Aziz", 1450)
talaba.reytingni_oshir(50)`
      },
      {
        title: "2. Dunder metodlar va heapq da solishtirish",
        content: `Heap (prioritetli navbat) yoki sortlash algoritmlarida maxsus obyektlarni solishtirish uchun \`__lt__\` (less than) metodini aniqlash zarur bo'ladi:`,
        code: `class Talaba:
    def __init__(self, ism: str, ball: int):
        self.ism = ism
        self.ball = ball

    def __lt__(self, other):
        # Ballar bo'yicha kamayish tartibida solishtirish
        return self.ball > other.ball

    def __repr__(self):
        return f"{self.ism}: {self.ball}"

talabalar = [Talaba("Ali", 80), Talaba("Vali", 95), Talaba("G'ani", 88)]
talabalar.sort()
print(talabalar)  # [Vali: 95, G'ani: 88, Ali: 80]`
      }
    ]
  },
  "arrays-and-hash-tables": {
    title: "Massivlar, Deque va Xesh-jadvallar (Hash Tables)",
    category: "Ma'lumotlar Tuzilmalari",
    duration: "15 daqiqa",
    summary: "Algoritmlarda massivlar va lug'atlar bilan O(1) vaqtda ishlash, qidirish va Two Sum kabi masalalarni optimal yechish asoslari.",
    relatedProblemSlug: "two-sum",
    sections: [
      {
        title: "1. Massivlar va Vaqt murakkabligi",
        content: `Pythondagi \`list\` dinamik massiv bo'lib:
• Indeks bo'yicha murojaat: O(1)
• Oxiriga element qo'shish (append): amortizatsiyalangan O(1)
• Boshiga yoki o'rtasiga element qo'shish/o'chirish: O(N) (chunki qolgan barcha elementlar suriladi)
Agar sizga navbat (Queue) kerak bo'lsa, \`list\` o'rniga \`collections.deque\` dan foydalaning. \`deque.popleft()\` O(1) vaqt oladi.`,
        code: `from collections import deque

navbat = deque([1, 2, 3])
navbat.append(4)        # O(1)
boshi = navbat.popleft() # O(1)
print(boshi)            # 1`
      },
      {
        title: "2. Xesh-jadval (dict va set) — O(1) Qidiruv",
        content: `Xesh-jadval har qanday kalitni xesh-funksiya orqali indeksga aylantiradi. Bu orqali qiymatni qidirish, qo'shish va o'chirish o'rtacha O(1) vaqtda bajariladi.
Bu xususiyat orqali Two Sum masalasini O(N^2) dan O(N) ga tushirish mumkin:`,
        code: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

print(two_sum([2, 7, 11, 15], 9))  # [0, 1]`
      }
    ]
  },
  "binary-search-and-two-pointers": {
    title: "Ikkilik qidiruv (Binary Search) va Ikki ko'rsatkich (Two Pointers)",
    category: "Algoritmlar",
    duration: "18 daqiqa",
    summary: "Tartiblangan massivlarda O(log N) vaqtda kerakli element yoki optimal javobni topish hamda ikki ko'rsatkich yordamida chiziqli O(N) yechimlar.",
    relatedProblemSlug: "two-sum",
    sections: [
      {
        title: "1. Ikkilik qidiruv (Binary Search) tamoyili",
        content: `Agar massiv tartiblangan bo'lsa, qidiruv maydonini har qadamda ikkiga bo'lish mumkin:
• Chap (left) va o'ng (right) ko'rsatkichlar o'rnatiladi.
• O'rtadagi (mid) element tekshiriladi.
• Agar mid qidirilayotgan qiymatdan kichik bo'lsa, chap ko'rsatkich mid + 1 ga suriladi.
• Aks holda, o'ng ko'rsatkich mid - 1 ga suriladi.
Vaqt murakkabligi: O(log N).`,
        code: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

nums = [1, 3, 5, 7, 9, 11, 15]
print(binary_search(nums, 7))   # 3-indeks
print(binary_search(nums, 10))  # -1 (topilmadi)`
      },
      {
        title: "2. Ikki ko'rsatkich (Two Pointers) uslubi",
        content: `Ikki ko'rsatkich massivning ikki chetidan (yoki bitta yo'nalishda har xil tezlikda) harakatlanib, O(N) vaqt va O(1) xotirada masalani yechish imkonini beradi.
Tartiblangan massivda yig'indi target ga teng bo'lgan juftlikni topish:`,
        code: `def two_sum_sorted(arr, target):
    left, right = 0, len(arr) - 1
    while left < right:
        current_sum = arr[left] + arr[right]
        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1
        else:
            right -= 1
    return []

print(two_sum_sorted([2, 7, 11, 15], 9)) # [0, 1]`
      }
    ]
  }
};

export default function LessonDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [topic, setTopic] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fallbackLesson = richLessonsData[slug] || richLessonsData["variables-and-data-types"];

  useEffect(() => {
    api.getMe().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    async function loadTopicAndLessons() {
      try {
        const topics = await api.getTopics();
        setAllTopics(topics || []);
        const found = topics.find((t) => t.slug === slug);
        if (found) {
          setTopic(found);
          setIsCompleted(found.is_completed || false);
        }

        const lessonsRes = await api.getLessons({ topic_slug: slug });
        if (Array.isArray(lessonsRes) && lessonsRes.length > 0) {
          setLessons(lessonsRes);
          setIsCompleted(lessonsRes[0].is_completed || false);
        } else {
          setLessons([]);
        }
      } catch {
        // fallback to default
      } finally {
        setLoading(false);
      }
    }
    loadTopicAndLessons();
  }, [slug]);

  const currentLesson = lessons[activeLessonIndex] || null;

  async function handleToggleComplete() {
    if (currentLesson) {
      try {
        const res = await api.completeLesson(currentLesson.slug);
        setIsCompleted(res.is_completed);
      } catch {
        setIsCompleted(!isCompleted);
      }
    } else {
      try {
        const res = await api.completeTopic(slug);
        setIsCompleted(res.is_completed);
      } catch {
        setIsCompleted(!isCompleted);
      }
    }
  }

  const currentIndex = allTopics.findIndex((t) => t.slug === slug);
  const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
  const nextTopic = currentIndex >= 0 && currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

  const displayTitle = currentLesson ? (currentLesson.title_uz || currentLesson.title_en) : (topic?.title_uz || fallbackLesson.title);
  const displayCategory = topic?.category_title || fallbackLesson.category;
  const hasCustomContent = topic && topic.content_uz && !richLessonsData[slug];

  const practicalProblemSlug = currentLesson?.related_problems_detail?.[0]?.slug || fallbackLesson.relatedProblemSlug || "two-sum";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/tutorials"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Barcha qo'llanmalarga qaytish
        </Link>

        <div className="flex items-center gap-2">
          {currentUser && ["author", "admin", "superadmin"].includes(currentUser.role) && (
            <Link
              href="/admin/learning/studio"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              title="Learning Studio'da tahrirlash"
            >
              <Edit className="w-3.5 h-3.5" />
              Learning Studio
            </Link>
          )}

          <button
            onClick={handleToggleComplete}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isCompleted
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isCompleted ? "text-emerald-500" : "text-slate-400"}`} />
            {isCompleted ? "Tugallangan" : "Tugallandi deb belgilash"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold">
              {displayCategory}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {fallbackLesson.duration || "10 daqiqa"}
            </span>
            {lessons.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-[11px] font-semibold">
                {lessons.length} ta dars
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {displayTitle}
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {currentLesson
              ? (currentLesson.summary_uz || currentLesson.summary_en || fallbackLesson.summary)
              : fallbackLesson.summary}
          </p>
        </div>

        {lessons.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 dark:border-slate-800">
            {lessons.map((ls, idx) => (
              <button
                key={ls.id || ls.slug}
                onClick={() => {
                  setActiveLessonIndex(idx);
                  setIsCompleted(ls.is_completed || false);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeLessonIndex === idx
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {idx + 1}. {ls.title_uz || ls.title_en}
              </button>
            ))}
          </div>
        )}

        {currentLesson ? (
          <div className="space-y-6">
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: currentLesson.content_uz || currentLesson.content_en }}
            />

            {currentLesson.related_problems_detail && currentLesson.related_problems_detail.length > 0 && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Ushbu darsga oid masalalar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentLesson.related_problems_detail.map((prob) => (
                    <Link
                      key={prob.slug}
                      href={`/problems/${prob.slug}`}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all group"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {prob.title}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {prob.difficulty} • {prob.time_limit}s
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : hasCustomContent ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: topic.content_uz }}
          />
        ) : (
          <div className="space-y-8">
            {fallbackLesson.sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {section.title}
                </h2>

                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {section.content}
                </p>

                {section.code && (
                  <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-3">
                      <span>Python 3 namunasi</span>
                      <span>UTF-8</span>
                    </div>
                    <pre className="leading-relaxed">
                      <code>{section.code}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {prevTopic ? (
              <Link
                href={`/tutorials/${prevTopic.slug}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Oldingi dars
              </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href={`/problems/${practicalProblemSlug}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Amaliy masalani yechish
            </Link>

            {nextTopic ? (
              <Link
                href={`/tutorials/${nextTopic.slug}`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              >
                Keyingi dars
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/tutorials"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              >
                Barcha darslar
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

