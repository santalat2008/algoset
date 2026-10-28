"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Terminal, 
  Box, 
  Share2, 
  Cpu, 
  Sparkles,
  Search
} from "lucide-react";
import { api } from "@/lib/api";

export default function TutorialsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const defaultTopics = [
    {
      id: 1,
      slug: "variables-and-data-types",
      title_uz: "O'zgaruvchilar, Ma'lumot turlari va Tezkor Kiritish-Chiqarish",
      category_slug: "python-basics",
      category_name: "Python Asoslari",
      duration_minutes: 10,
      description: "Python asosiy turlari, butun va haqiqiy sonlar, satrlar hamda musobaqa dasturlashda Fast I/O usullari.",
      is_completed: true,
      difficulty: "Boshlang'ich",
    },
    {
      id: 2,
      slug: "control-flow-and-loops",
      title_uz: "Shart operatorlari, Sikllar va Ro'yxat generatorlari",
      category_slug: "python-basics",
      category_name: "Python Asoslari",
      duration_minutes: 12,
      description: "if/elif/else tarmoqlanishi, for va while sikllari, enumerate(), zip() va list comprehensions.",
      is_completed: true,
      difficulty: "Boshlang'ich",
    },
    {
      id: 3,
      slug: "oop-fundamentals",
      title_uz: "Klasslar, Obyektlar va Dunder Metodlar",
      category_slug: "python-classes",
      category_name: "Python OOP",
      duration_minutes: 15,
      description: "Obyektga yo'naltirilgan dasturlash asoslari, konstruktorlar va heapq da solishtirish uchun __lt__ metodi.",
      is_completed: false,
      difficulty: "O'rtacha",
    },
    {
      id: 4,
      slug: "arrays-and-hash-tables",
      title_uz: "Massivlar, Deque va Xesh-jadvallar (Hash Tables)",
      category_slug: "python-dsa",
      category_name: "Ma'lumotlar Tuzilmalari",
      duration_minutes: 15,
      description: "Dinamik massivlar xususiyatlari, navbat (deque) va lug'at yordamida O(1) vaqtda qidiruv.",
      is_completed: false,
      difficulty: "O'rtacha",
    },
    {
      id: 5,
      slug: "binary-search-and-two-pointers",
      title_uz: "Ikkilik qidiruv (Binary Search) va Ikki ko'rsatkich uslubi",
      category_slug: "algorithms",
      category_name: "Algoritmlar",
      duration_minutes: 18,
      description: "Tartiblangan massivlarda O(log N) qidiruv, pastki/yuqori chegaralar va ikki ko'rsatkich bilan O(N) yechimlar.",
      is_completed: false,
      difficulty: "O'rtacha",
    },
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const topicsData = await api.getTopics();
        if (topicsData && topicsData.length > 0) {
          setTopics(topicsData);
        } else {
          setTopics(defaultTopics);
        }
      } catch {
        setTopics(defaultTopics);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = [
    { slug: "all", label: "Barcha mavzular" },
    { slug: "python-basics", label: "Python Asoslari" },
    { slug: "python-classes", label: "Python OOP" },
    { slug: "python-dsa", label: "Ma'lumotlar Tuzilmalari" },
    { slug: "algorithms", label: "Algoritmlar" },
  ];

  const filtered = topics.filter((t) => {
    const matchesCat = selectedCategory === "all" || t.category_slug === selectedCategory;
    const matchesSearch = !search.trim() || 
      (t.title_uz || t.title_en || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Interaktiv Darsliklar
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AlgoSet Qo'llanmalari
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Boshlang'ich sintaksisdan tortib murakkab algoritmlargacha bo'lgan chuqurlashtirilgan interaktiv darslar. Har bir dars nazariy bilim, amaliy kod va tegishli masalalar bilan to'ldirilgan.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Darslarni qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setSelectedCategory(c.slug)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === c.slug
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((topic) => (
          <div
            key={topic.slug}
            className="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                  {topic.category_name || "Python"}
                </span>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {topic.duration_minutes || 10} daq
                  </span>

                  {topic.lessons_count > 0 && (
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
                      {topic.lessons_count} ta dars
                    </span>
                  )}

                  {topic.is_completed && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Tugallangan
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                  {topic.title_uz || topic.title_en}
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {topic.description || "Ushbu darsda mavzu bo'yicha nazariy va amaliy misollar keltirilgan."}
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                {topic.difficulty || "O'rtacha"}
              </span>

              <Link
                href={`/tutorials/${topic.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-600 text-slate-700 dark:text-slate-300 group-hover:text-white text-xs font-bold transition-all"
              >
                Darsni o'qish
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ushbu toifada darslar topilmadi</p>
            <p className="text-xs text-slate-400 mt-1">Boshqa toifani tanlang yoki qidiruv so'zini o'zgartiring.</p>
          </div>
        )}
      </div>
    </div>
  );
}
