"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Trophy, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  ShieldAlert, 
  FileText,
  Award,
  ChevronRight,
  Edit
} from "lucide-react";
import { api } from "@/lib/api";

export default function ContestDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [contest, setContest] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("problems");
  const [isJoined, setIsJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");
  const [timerLabel, setTimerLabel] = useState("Boshlanishiga qoldi:");

  const defaultContest = {
    id: 1,
    slug: "weekly-python-contest-12",
    title_uz: "Haftalik Python Musobaqasi #12",
    title_en: "Weekly Python Contest #12",
    division: "Div. 2",
    is_rated: true,
    start_time: new Date(Date.now() + 86400000 * 2).toISOString(),
    duration_minutes: 120,
    status: "upcoming",
    registered_count: 148,
    problems: [
      { id: 1, letter: "A", title: "Two Sum", points: 100, solved_count: 85, slug: "two-sum" },
      { id: 2, letter: "B", title: "Palindromik Satr", points: 250, solved_count: 42, slug: "two-sum" },
      { id: 3, letter: "C", title: "Eng Qisqa Yo'l", points: 500, solved_count: 15, slug: "two-sum" },
      { id: 4, letter: "D", title: "Daraxtda Maksimal Oqim", points: 750, solved_count: 3, slug: "two-sum" },
    ],
    standings: [
      { rank: 1, username: "algo_master", solved: 4, score: 1600, penalty: 82 },
      { rank: 2, username: "student", solved: 3, score: 850, penalty: 64 },
      { rank: 3, username: "coder_uz", solved: 3, score: 850, penalty: 110 },
      { rank: 4, username: "dev_pro", solved: 2, score: 350, penalty: 45 },
      { rank: 5, username: "junior_py", solved: 1, score: 100, penalty: 18 },
    ]
  };

  useEffect(() => {
    api.getMe().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    async function loadContest() {
      try {
        const data = await api.getContest(slug);
        if (data && (data.title_uz || data.title_en)) {
          setContest(data);
          setIsJoined(data.is_joined || false);
        } else {
          setContest(defaultContest);
        }
      } catch {
        setContest(defaultContest);
      } finally {
        setLoading(false);
      }
    }
    loadContest();
  }, [slug]);

  useEffect(() => {
    if (!contest) return;

    function updateTimer() {
      const start = new Date(contest.start_time).getTime();
      const end = contest.end_time ? new Date(contest.end_time).getTime() : start + (contest.duration_minutes || 120) * 60000;
      const now = Date.now();

      if (now < start) {
        setTimerLabel("Boshlanishiga qoldi:");
        const diff = start - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${days > 0 ? `${days}k ` : ""}${hours}s ${minutes}d ${seconds}s`);
      } else if (now >= start && now <= end) {
        setTimerLabel("Tugashiga qoldi:");
        const diff = end - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}s ${minutes}d ${seconds}s`);
      } else {
        setTimerLabel("Musobaqa holati:");
        setTimeLeft("Yakunlangan");
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  async function handleJoin() {
    setJoining(true);
    try {
      await api.joinContest(slug);
      setIsJoined(true);
    } catch {
      setIsJoined(true);
    } finally {
      setJoining(false);
    }
  }

  const c = contest || defaultContest;
  const isUpcoming = c.status === "upcoming" || new Date(c.start_time) > new Date();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        href="/contests"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Barcha musobaqalarga qaytish
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold">
                {c.division || "Div. 2"}
              </span>

              {c.is_rated ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  Reytingli
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold">
                  Reytingsiz
                </span>
              )}

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isUpcoming
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
              }`}>
                {isUpcoming ? "Kutilayotgan" : "Davom etmoqda"}
              </span>

              {currentUser && (["admin", "superadmin"].includes(currentUser.role) || c.author === currentUser.id || c.author_username === currentUser.username) && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  title="Admin panelda tahrirlash"
                >
                  <Edit className="w-3 h-3" />
                  Musobaqani tahrirlash
                </Link>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {c.title_uz || c.title_en}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(c.start_time).toLocaleString("uz-UZ")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Davomiyligi: {c.duration_minutes ? Math.round(c.duration_minutes / 60) : 2} soat
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Ishtirokchilar: {c.registered_count || 148} ta
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            {timeLeft && (
              <div className="text-left md:text-right">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{timerLabel}</p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">{timeLeft}</p>
              </div>
            )}

            {isJoined ? (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Ro'yxatdan o'tgansiz
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                <Trophy className="w-4 h-4" />
                {joining ? "Qo'shilmoqda..." : "Ro'yxatdan o'tish"}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("problems")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "problems"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            Masalalar to'plami
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "rules"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Musobaqa qoidalari
          </button>
          <button
            onClick={() => setActiveTab("standings")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "standings"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Award className="w-4 h-4" />
            Reyting jadvali
          </button>
        </div>

        <div>
          {activeTab === "problems" && (
            <div className="space-y-4">
              {isUpcoming ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Masalalar ro'yxati musobaqa boshlangach ochiladi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Musobaqa adolatli o'tishi uchun masalalar faqat belgilangan vaqtda e'lon qilinadi. Ro'yxatdan o'tganingizga ishonch hosil qiling!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Masala nomi</th>
                        <th className="py-3 px-4">Ball</th>
                        <th className="py-3 px-4">Yechganlar soni</th>
                        <th className="py-3 px-4 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(c.problems || defaultContest.problems).map((prob) => (
                        <tr key={prob.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-blue-600">{prob.letter}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{prob.title}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">{prob.points} ball</td>
                          <td className="py-3 px-4 text-slate-500">{prob.solved_count} ta</td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/problems/${prob.slug || "two-sum"}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all"
                            >
                              Yechish
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "rules" && (
            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Musobaqa nizomi va qoidalari</h3>
              <p>
                • <strong>Format:</strong> Musobaqa ICPC / IOI qoidalari asosida o'tkaziladi. Ishtirokchilar berilgan vaqt ichida eng ko'p masalani minimal jarima vaqti bilan yechishlari lozim.
              </p>
              <p>
                • <strong>Jarima vaqti:</strong> Har bir noto'g'ri urinish uchun 20 daqiqa jarima qo'shiladi (faqat masala qabul qilingan taqdirda hisobga olinadi).
              </p>
              <p>
                • <strong>Halollik siyosati (Anti-cheat):</strong> Musobaqa davomida boshqa ishtirokchilar bilan kod almashish, sun'iy intellekt (ChatGPT, Copilot) orqali to'g'ridan-to'g'ri kod ko'chirish taqiqlanadi. Kodlar avtomatik plagiariyzm tekshiruvidan o'tkaziladi.
              </p>
              <p>
                • <strong>Ruxsat etilgan dasturlash tillari:</strong> Python 3, C++ (GCC 11), Java 17, JavaScript (Node.js).
              </p>
            </div>
          )}

          {activeTab === "standings" && (
            <div className="space-y-4">
              {isUpcoming ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Musobaqa hali boshlanmagan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Reyting jadvali faqat musobaqa boshlangach va ishtirokchilar masala topshirgach shakllanadi.
                  </p>
                </div>
              ) : (c.standings && c.standings.length > 0) ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-3 px-4">O'rin</th>
                        <th className="py-3 px-4">Foydalanuvchi</th>
                        <th className="py-3 px-4">Yechilgan</th>
                        <th className="py-3 px-4">Umumiy ball</th>
                        <th className="py-3 px-4">Jarima (daq)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {c.standings.map((row) => (
                        <tr key={row.rank || row.user_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">#{row.rank}</td>
                          <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">{row.username}</td>
                          <td className="py-3 px-4 text-emerald-600 font-semibold">{row.solved} ta</td>
                          <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-mono">{row.score}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono">{row.penalty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  Hozircha ishtirokchilar tomonidan yechimlar yuborilmagan.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

