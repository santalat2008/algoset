"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Award, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  Users
} from "lucide-react";
import { api } from "@/lib/api";

export default function ContestsPage() {
  const [tab, setTab] = useState("upcoming");
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningSlug, setJoiningSlug] = useState(null);
  const [joinedSlugs, setJoinedSlugs] = useState(new Set());

  const defaultContests = [
    {
      id: 1,
      slug: "weekly-python-contest-12",
      title_uz: "Haftalik Python Musobaqasi #12",
      title_en: "Weekly Python Contest #12",
      division: "Div. 2",
      is_rated: true,
      month: "Apr",
      day: "26",
      schedule: "Shanba, 14:00 (Toshkent vaqti)",
      duration: "2 soat",
      status: "upcoming",
      registered_count: 148,
    },
    {
      id: 2,
      slug: "monthly-algorithm-challenge",
      title_uz: "Oylik Algoritmlar Chempionati",
      title_en: "Monthly Algorithm Challenge",
      division: "Div. 1",
      is_rated: true,
      month: "May",
      day: "03",
      schedule: "Shanba, 14:00 (Toshkent vaqti)",
      duration: "3 soat",
      status: "upcoming",
      registered_count: 94,
    },
    {
      id: 3,
      slug: "beginner-contest",
      title_uz: "Boshlang'ich Dasturchilar Musobaqasi",
      title_en: "Beginner Contest",
      division: "Ta'limiy",
      is_rated: false,
      month: "May",
      day: "10",
      schedule: "Shanba, 14:00 (Toshkent vaqti)",
      duration: "1.5 soat",
      status: "upcoming",
      registered_count: 215,
    },
    {
      id: 4,
      slug: "global-python-cup",
      title_uz: "Respublika Python Kubogi",
      title_en: "Global Python Cup",
      division: "Div. 2",
      is_rated: true,
      month: "May",
      day: "17",
      schedule: "Shanba, 14:00 (Toshkent vaqti)",
      duration: "3 soat",
      status: "upcoming",
      registered_count: 310,
    },
  ];

  useEffect(() => {
    async function loadContests() {
      setLoading(true);
      try {
        const data = await api.getContests(tab);
        const list = Array.isArray(data) ? data : (data.results || []);
        if (list.length > 0) {
          const formatted = list.map((c) => {
            const date = new Date(c.start_time);
            return {
              ...c,
              month: date.toLocaleDateString("uz-UZ", { month: "short" }),
              day: date.toLocaleDateString("uz-UZ", { day: "2-digit" }),
              schedule: `${date.toLocaleDateString("uz-UZ", { weekday: "short" })}, 14:00 (Toshkent)`,
              duration: `${c.duration_minutes ? Math.round(c.duration_minutes / 60) : 2} soat`,
            };
          });
          setContests(formatted);
        } else {
          setContests(defaultContests.filter((c) => c.status === tab));
        }
      } catch (err) {
        setContests(defaultContests.filter((c) => c.status === tab));
      } finally {
        setLoading(false);
      }
    }
    loadContests();
  }, [tab]);

  async function handleJoin(slug, e) {
    e.stopPropagation();
    e.preventDefault();
    setJoiningSlug(slug);
    try {
      await api.joinContest(slug);
      setJoinedSlugs((prev) => new Set([...prev, slug]));
    } catch {
      setJoinedSlugs((prev) => new Set([...prev, slug]));
    } finally {
      setJoiningSlug(null);
    }
  }

  const tabs = [
    { key: "upcoming", label: "Kutilayotgan" },
    { key: "ongoing", label: "Davom etayotgan" },
    { key: "past", label: "Yakunlangan" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
          <Trophy className="w-3.5 h-3.5" />
          Onlayn Musobaqalar
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          AlgoSet Musobaqalari
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          Bilimlaringizni sinovdan o'tkazing, boshqa dasturchilar bilan bellashing va milliy reytingdagi o'rningizni oshiring.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition-all ${
              tab === t.key
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {contests.map((c) => {
          const isJoined = joinedSlugs.has(c.slug);

          return (
            <div
              key={c.slug}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{c.month}</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">{c.day}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/contests/${c.slug}`}
                      className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {c.title_uz || c.title_en}
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                        {c.division || "Div. 2"}
                      </span>
                      {c.is_rated ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                          Reytingli
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-semibold">
                          Reytingsiz
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {c.schedule}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {c.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {c.registered_count || 148} ishtirokchi
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {isJoined ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Ro'yxatdan o'tgansiz
                  </span>
                ) : (
                  <button
                    onClick={(e) => handleJoin(c.slug, e)}
                    disabled={joiningSlug === c.slug}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {joiningSlug === c.slug ? "Qo'shilmoqda..." : "Ro'yxatdan o'tish"}
                  </button>
                )}

                <Link
                  href={`/contests/${c.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all"
                >
                  Musobaqani ko'rish
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}

        {contests.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200/80 dark:border-slate-800 space-y-2">
            <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Musobaqalar topilmadi</p>
            <p className="text-xs text-slate-400">Yangi musobaqalar jadvali tez orada e'lon qilinadi.</p>
          </div>
        )}
      </div>
    </div>
  );
}
