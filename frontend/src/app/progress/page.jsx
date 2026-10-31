"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Flame, 
  Code2, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  Zap, 
  User, 
  LogIn,
  X,
  FileCode2
} from "lucide-react";
import { api } from "@/lib/api";
import AuthModal from "@/components/AuthModal";

export default function ProgressPage() {
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const learningPath = [
    { title: "Python Asoslari", progress: 100, topics: "2/2 mavzu" },
    { title: "Python OOP", progress: 75, topics: "1/1 mavzu" },
    { title: "Ma'lumotlar Tuzilmalari", progress: 50, topics: "1/1 mavzu" },
    { title: "Algoritmlar", progress: 40, topics: "2/2 mavzu" },
    { title: "Murakkab Mavzular", progress: 20, topics: "1/1 mavzu" },
  ];

  useEffect(() => {
    async function loadMe() {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (!token) {
        setIsAuthenticated(false);
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        if (data && data.username) {
          setIsAuthenticated(true);
          setUserData(data);
        } else {
          setIsAuthenticated(false);
          setUserData(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Natijalar yuklanmoqda...</p>
      </div>
    );
  }

  if (!isAuthenticated || !userData) {
    return (
      <>
        <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Natijalarni ko'rish uchun kiring</h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Siz tizimga kirmagansiz. Natijalar, reyting, yechilgan masalalar va shaxsiy faollik tarixingizni ko'rish uchun akkauntingizga kiring.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Tizimga kirish / Ro'yxatdan o'tish
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={(me) => {
            setUserData(me);
            setIsAuthenticated(true);
          }}
        />
      </>
    );
  }

  const tutorialsCompleted = userData.tutorials_progress?.completed || 0;
  const tutorialsTotal = userData.tutorials_progress?.total || 1;
  const problemsSolved = userData.problems_progress?.solved || userData.solved_problems_count || 0;
  const problemsTotal = userData.problems_progress?.total || 1;
  const contestsJoined = userData.contests_progress?.joined || userData.contests_joined_count || 0;
  const contestsTotal = userData.contests_progress?.total || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-blue-500/20 uppercase">
            {userData.username ? userData.username.charAt(0) : "U"}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {userData.username}
              </h1>
              <span className="px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900">
                {userData.level || 1}-Daraja Python O'rganuvchisi
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Keyingi darajagacha {100 - (userData.level_progress_percent || 0)}% qoldi
            </p>

            <div className="w-48 sm:w-64 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${userData.level_progress_percent || 20}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-8">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-orange-500" />
              Faollik zanjiri
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {userData.streak_days || 0} kun
            </p>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-500" />
              Tajriba (XP)
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {userData.xp || 0} XP
            </p>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-blue-500" />
              Reyting
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {userData.rating || 1200}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Qo'llanmalar</h3>
                <p className="text-xs text-slate-400">Tugallangan darslar</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {tutorialsCompleted}/{tutorialsTotal}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.round((tutorialsCompleted / (tutorialsTotal || 1)) * 100))}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Masalalar</h3>
                <p className="text-xs text-slate-400">To'liq yechilgan</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {problemsSolved}/{problemsTotal}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.round((problemsSolved / (problemsTotal || 1)) * 100))}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Musobaqalar</h3>
                <p className="text-xs text-slate-400">Qatnashilgan soni</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-500">
              {contestsJoined}/{contestsTotal}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.round((contestsJoined / (contestsTotal || 1)) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              O'quv yo'nalishlari holati
            </h3>
            <Link
              href="/tutorials"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
            >
              Barcha darslar
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-5">
            {learningPath.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{item.title}</span>
                  <span className="text-slate-400 font-mono">{item.topics}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              So'nggi yuborilgan yechimlar
            </h3>
            <Link
              href="/problems"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
            >
              Yangi masala
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(userData.recent_activity || []).length > 0 ? (
              userData.recent_activity.map((act) => (
                <div
                  key={act.id}
                  onClick={() => setSelectedSubmission(act)}
                  className="py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-3">
                    {act.status === "Accepted" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                        {act.problem_title || "Masala"}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {act.passed_cases}/{act.total_cases} test • {act.runtime_ms}ms • {act.language || "python3"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold group-hover:underline shrink-0">
                    Batafsil &rarr;
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Hozircha yuborilgan yechimlar mavjud emas.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-slate-900 dark:text-white max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                {selectedSubmission.status === "Accepted" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-500" />
                )}
                <div>
                  <h3 className="font-extrabold text-base">
                    Urinish #{selectedSubmission.id || ""} tafsilotlari
                  </h3>
                  <p className="text-xs text-slate-400" suppressHydrationWarning>
                    {new Date(selectedSubmission.created_at || Date.now()).toLocaleString("uz-UZ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Holat</p>
                <p className={`font-bold mt-0.5 ${selectedSubmission.status === "Accepted" ? "text-emerald-600" : "text-rose-600"}`}>
                  {selectedSubmission.status === "Accepted" ? "Qabul qilindi" : selectedSubmission.status}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Bajarilish vaqti</p>
                <p className="font-bold mt-0.5 text-slate-800 dark:text-slate-200 font-mono">
                  {selectedSubmission.runtime_ms} ms
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Test holatlari</p>
                <p className="font-bold mt-0.5 text-slate-800 dark:text-slate-200 font-mono">
                  {selectedSubmission.passed_cases}/{selectedSubmission.total_cases}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Dasturlash tili</p>
                <p className="font-bold mt-0.5 text-blue-600 dark:text-blue-400 font-mono">
                  {selectedSubmission.language || "python3"}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Yuborilgan manba kodi
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedSubmission.code || "");
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold"
                >
                  {copiedCode ? "Nusxalandi!" : "Kodni nusxalash"}
                </button>
              </div>
              <div className="flex-1 overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-200 border border-slate-800">
                <pre className="whitespace-pre">
                  <code>{selectedSubmission.code}</code>
                </pre>
              </div>
            </div>

            {selectedSubmission.error_output && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-mono text-xs max-h-32 overflow-auto">
                <p className="font-bold mb-1 uppercase text-[10px]">Xatolik xabari:</p>
                <pre className="whitespace-pre-wrap">{selectedSubmission.error_output}</pre>
              </div>
            )}

            <button
              onClick={() => setSelectedSubmission(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
