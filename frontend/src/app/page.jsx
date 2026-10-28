"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  ArrowRight, 
  Terminal, 
  Box, 
  Share2, 
  Cpu, 
  Trophy, 
  BookOpen, 
  Code2, 
  Users,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";

export default function HomePage() {
  const [stats, setStats] = useState({
    tutorials_count: 100,
    problems_count: 500,
    contests_count: 50,
    active_learners_count: 1000,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const statsData = await api.getStats();
        if (statsData) setStats(statsData);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const pathSteps = [
    {
      title: "Python Asoslari",
      desc: "1. O'zgaruvchilar, ma'lumot turlari, tezkor I/O",
      icon: Terminal,
      progress: "0/12",
      href: "/tutorials/variables-and-data-types",
    },
    {
      title: "Python OOP",
      desc: "2. Obyektlar, klasslar, dunder metodlar",
      icon: Box,
      progress: "0/8",
      href: "/tutorials/oop-fundamentals",
    },
    {
      title: "Ma'lumotlar Tuzilmalari",
      desc: "3. Massivlar, stek, navbat, xesh-jadvallar",
      icon: Share2,
      progress: "0/15",
      href: "/tutorials/arrays-and-hash-tables",
    },
    {
      title: "Algoritmlar",
      desc: "4. Ikkilik qidiruv, ikki ko'rsatkich, DP",
      icon: Cpu,
      progress: "0/14",
      href: "/tutorials/binary-search-and-two-pointers",
    },
    {
      title: "Amaliyot va Masalalar",
      desc: "5. Real musobaqa masalalarini yeching",
      icon: Trophy,
      progress: "0/—",
      href: "/problems",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      <section className="grid lg:grid-cols-12 gap-8 items-center pt-4">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            O'rganing • Mashq qiling • Bellashing • O'sing
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
            Python va Algoritmlarni <br />
            <span className="text-blue-600 dark:text-blue-500">Mukammal O'rganing</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            Interaktiv darslar, amaliy masalalar va real musobaqalar orqali dasturlash mahoratingizni oshiring. 
            AlgoSet — zamonaviy dasturchilar uchun mukammal bilimlar maskani.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/tutorials"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/25 transition-all hover:gap-3 text-sm"
            >
              Darslarni boshlash
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/problems"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm shadow-sm"
            >
              Masalalarni ko'rish
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="relative mx-auto max-w-md bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-transparent rounded-3xl p-6 sm:p-8 border border-blue-100 dark:border-blue-900/50 shadow-2xl">
            <div className="bg-slate-950 rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span className="text-blue-400 font-bold">solution.py</span>
                <span>Python 3.11</span>
              </div>
              <pre className="font-mono text-xs text-slate-300 py-4 leading-relaxed overflow-x-auto">
                <code>{`class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []

# Natija: O(N) vaqt, O(N) xotira`}</code>
              </pre>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Qabul qilindi (Accepted)
                </div>
                <Link
                  href="/problems/two-sum"
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all"
                >
                  Kodni sinash &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">100+</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Interaktiv Darsliklar</p>
          </div>

          <div className="space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <Code2 className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">500+</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Amaliy Masalalar</p>
          </div>

          <div className="space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">50k+</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Faol Foydalanuvchilar</p>
          </div>

          <div className="space-y-1">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">24/7</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Musobaqalar va Amaliyot</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sizning Ta'lim Yo'nalishingiz
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dasturlashni noldan boshlab yuqori darajagacha tizimli ravishda bosqichma-bosqich o'rganing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {pathSteps.map((step, idx) => (
            <Link
              key={idx}
              href={step.href}
              className="group bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-600 group-hover:text-white text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors">
                  <step.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {step.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>{step.progress}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
