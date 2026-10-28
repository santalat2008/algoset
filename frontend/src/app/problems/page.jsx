"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  Filter,
  Code2
} from "lucide-react";
import { api } from "@/lib/api";

export default function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const defaultSidebarTags = [
    { name: "Massivlar (Arrays)", count: 82, slug: "arrays" },
    { name: "Satrlar (Strings)", count: 64, slug: "strings" },
    { name: "Bog'langan ro'yxat (Linked List)", count: 48, slug: "linked-list" },
    { name: "Stek va Navbat (Stack & Queue)", count: 44, slug: "stack-queue" },
    { name: "Daraxtlar (Tree)", count: 52, slug: "tree" },
    { name: "Graflar (Graph)", count: 68, slug: "graph" },
    { name: "Dinamik dasturlash (DP)", count: 49, slug: "dp" },
    { name: "Ochko'z (Greedy)", count: 32, slug: "greedy" },
    { name: "Ikkilik qidiruv (Binary Search)", count: 28, slug: "binary-search" },
    { name: "Ikki ko'rsatkich (Two Pointers)", count: 24, slug: "two-pointers" },
    { name: "Xesh-jadval (Hash Table)", count: 38, slug: "hash-table" },
  ];

  const defaultProblems = [
    {
      id: 1,
      slug: "two-sum",
      title_uz: "Two Sum (Ikkita son yig'indisi)",
      title_en: "Two Sum",
      difficulty: "Oson",
      tags: ["Massivlar", "Xesh-jadval"],
      solved_count: 1250,
      acceptance_rate: 98,
      user_status: "solved",
    },
    {
      id: 2,
      slug: "reverse-integer",
      title_uz: "Butun sonni teskari qilish",
      title_en: "Reverse Integer",
      difficulty: "Oson",
      tags: ["Matematika", "Satrlar"],
      solved_count: 980,
      acceptance_rate: 92,
      user_status: "unsolved",
    },
    {
      id: 3,
      slug: "longest-substring-without-repeating-characters",
      title_uz: "Takrorlanuvchi belgilar bo'lmagan eng uzun qism-satr",
      title_en: "Longest Substring Without Repeating Characters",
      difficulty: "O'rtacha",
      tags: ["Satrlar", "Sliding Window"],
      solved_count: 762,
      acceptance_rate: 86,
      user_status: "attempted",
    },
    {
      id: 4,
      slug: "merge-intervals",
      title_uz: "Intervallarni birlashtirish",
      title_en: "Merge Intervals",
      difficulty: "O'rtacha",
      tags: ["Massivlar", "Saralash"],
      solved_count: 403,
      acceptance_rate: 81,
      user_status: "unsolved",
    },
    {
      id: 5,
      slug: "binary-search",
      title_uz: "Ikkilik qidiruv (Binary Search)",
      title_en: "Binary Search",
      difficulty: "Oson",
      tags: ["Ikkilik qidiruv", "Massivlar"],
      solved_count: 621,
      acceptance_rate: 94,
      user_status: "solved",
    },
    {
      id: 6,
      slug: "maximum-subarray",
      title_uz: "Maksimal qism-massiv yig'indisi (Kadane algoritmi)",
      title_en: "Maximum Subarray",
      difficulty: "O'rtacha",
      tags: ["Massivlar", "Dinamik dasturlash"],
      solved_count: 512,
      acceptance_rate: 88,
      user_status: "unsolved",
    },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const [probsRes, tagsRes] = await Promise.all([
          api.getProblems(),
          api.getProblemTags(),
        ]);
        if (probsRes && probsRes.results && probsRes.results.length > 0) {
          setProblems(probsRes.results);
        } else if (Array.isArray(probsRes) && probsRes.length > 0) {
          setProblems(probsRes);
        } else {
          setProblems(defaultProblems);
        }

        if (tagsRes && tagsRes.length > 0) {
          setTags(tagsRes);
        } else {
          setTags(defaultSidebarTags);
        }
      } catch (err) {
        setProblems(defaultProblems);
        setTags(defaultSidebarTags);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (p.title_uz || p.title_en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDiff =
      selectedDifficulty === "all" ||
      (p.difficulty || "").toLowerCase() === selectedDifficulty.toLowerCase() ||
      (selectedDifficulty === "easy" && (p.difficulty === "Oson" || p.difficulty === "Easy")) ||
      (selectedDifficulty === "medium" && (p.difficulty === "O'rtacha" || p.difficulty === "Medium")) ||
      (selectedDifficulty === "hard" && (p.difficulty === "Qiyin" || p.difficulty === "Hard"));

    const matchesTag =
      selectedTag === "all" ||
      (p.tags || []).some((t) => t.toLowerCase() === selectedTag.toLowerCase());

    return matchesSearch && matchesDiff && matchesTag;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm h-fit">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Mavzular (Teglar)
          </div>

          <button
            onClick={() => setSelectedTag("all")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              selectedTag === "all"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span>Barcha mavzular</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              selectedTag === "all" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}>
              {problems.length || 500}
            </span>
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1">
            {tags.map((tag) => {
              const isSelected = selectedTag === tag.slug || selectedTag === tag.name;
              return (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTag(tag.slug || tag.name)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span className="truncate">{tag.name}</span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      isSelected ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400"
                    }`}
                  >
                    {tag.problem_count || tag.count || 24}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="lg:col-span-9 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masalalarni qidirish..."
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              >
                <option value="all">Barcha darajalar</option>
                <option value="easy">Oson</option>
                <option value="medium">O'rtacha</option>
                <option value="hard">Qiyin</option>
              </select>

              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              >
                <option value="all">Barcha teglar</option>
                {tags.map((t) => (
                  <option key={t.name} value={t.slug || t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProblems.map((prob, idx) => {
                const diffLabel = prob.difficulty === "Easy" ? "Oson" : prob.difficulty === "Medium" ? "O'rtacha" : prob.difficulty === "Hard" ? "Qiyin" : prob.difficulty;
                const isSolved = prob.user_status === "solved";

                return (
                  <Link
                    key={prob.slug}
                    href={`/problems/${prob.slug}`}
                    className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="shrink-0">
                        {isSolved ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : prob.user_status === "attempted" ? (
                          <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {idx + 1}. {prob.title_uz || prob.title_en}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {(prob.tags || []).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 pl-3">
                      <div className="hidden sm:block text-right">
                        <span className="text-xs text-slate-400 font-mono">
                          {prob.acceptance_rate || 90}% qabul
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          diffLabel === "Oson"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                            : diffLabel === "O'rtacha"
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                            : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {diffLabel}
                      </span>

                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}

              {filteredProblems.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <Code2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mos keluvchi masalalar topilmadi</p>
                  <p className="text-xs text-slate-400 mt-1">Filtrlarni o'zgartirib qayta urinib ko'ring.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
