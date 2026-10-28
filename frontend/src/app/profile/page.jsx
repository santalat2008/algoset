"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Award, 
  Zap, 
  Flame, 
  BookOpen, 
  Code2, 
  Trophy, 
  LogOut, 
  ShieldCheck, 
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit,
  X,
  Save,
  Check
} from "lucide-react";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const me = await api.getMe();
        setUser(me);
        setEditForm({
          first_name: me.first_name || "",
          last_name: me.last_name || "",
          email: me.email || "",
          password: "",
        });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.push("/");
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }
      const updated = await api.updateMe(payload);
      setUser(updated);
      setMessage("Profilingiz muvaffaqiyatli yangilandi!");
      setTimeout(() => {
        setMessage("");
        setShowEditModal(false);
      }, 1500);
    } catch (err) {
      setMessage(`Xatolik: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Profil ma'lumotlari yuklanmoqda...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tizimga kiring</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Profil sahifasini ko'rish va natijalaringizni boshqarish uchun tizimga kirishingiz lozim.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={async () => {
              await api.login("student", "algoset123");
              const me = await api.getMe();
              setUser(me);
            }}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
          >
            Talaba (student) hisobi bilan kirish
          </button>
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-center"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    );
  }

  const roleName = {
    superadmin: "Super Admin",
    admin: "Administrator",
    author: "Muallif",
    student: "Talaba"
  }[user.role] || "Talaba";

  const tutorialsPercent = user.tutorials_progress?.total
    ? Math.round((user.tutorials_progress.completed / user.tutorials_progress.total) * 100)
    : 0;
  const problemsPercent = user.problems_progress?.total
    ? Math.round((user.problems_progress.solved / user.problems_progress.total) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-blue-500/20 uppercase">
            {user.username ? user.username.charAt(0) : "U"}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {user.first_name || user.last_name
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : user.username}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900">
                {roleName}
              </span>
              {user.is_email_verified && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tasdiqlangan
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              {user.email || "student@algoset.uz"}
            </p>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pt-1">
              <Calendar className="w-3.5 h-3.5" />
              Taxallus: <span className="font-mono text-slate-600 dark:text-slate-300">@{user.username}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-all"
          >
            <Edit className="w-4 h-4" />
            Tahrirlash
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Chiqish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Musobaqa Reytingi</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{user.rating ?? 1500}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Tajriba (XP)</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{user.xp ?? 0}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Faollik zanjiri</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{user.streak_days ?? 0} kun</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Yechilgan</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{user.solved_problems_count ?? 0} masala</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Qo'llanmalar progressi</h3>
            </div>
            <span className="text-xs font-bold text-blue-600">
              {user.tutorials_progress ? `${user.tutorials_progress.completed}/${user.tutorials_progress.total}` : "0/0"}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${tutorialsPercent}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dasturlash asoslari va algoritmlar bo'yicha amaliy darsliklar.
          </p>
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Darslarni davom ettirish
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Code2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Masalalar progressi</h3>
            </div>
            <span className="text-xs font-bold text-emerald-600">
              {user.problems_progress ? `${user.problems_progress.solved}/${user.problems_progress.total}` : "0/0"}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${problemsPercent}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Massivlar, Satrlar, Dinamik dasturlash va boshqa toifalar.
          </p>
          <Link
            href="/problems"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Masalalarni yechish
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Musobaqalar</h3>
            </div>
            <span className="text-xs font-bold text-amber-500">
              {user.contests_progress ? `${user.contests_progress.joined} ta` : "0 ta"}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (user.contests_progress?.joined || 0) * 20)}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Haftalik va oylik reytingli musobaqalardagi ishtirok.
          </p>
          <Link
            href="/contests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700"
          >
            Musobaqalar ro'yxati
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">So'nggi yechilgan masalalar</h3>
        
        {user.recent_activity && user.recent_activity.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {user.recent_activity.map((sub, i) => (
              <div key={sub.id || i} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <Link href={`/problems/${sub.problem_slug || "two-sum"}`} className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600">
                    {sub.problem_title || "Masala"}
                  </Link>
                  <span className="text-slate-400 font-mono text-[11px]">({sub.language || "python3"})</span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                  <span className="font-semibold text-emerald-600">{sub.status || "Accepted"}</span>
                  <span>{sub.runtime_ms || 35}ms</span>
                  <span suppressHydrationWarning>{new Date(sub.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-400">
            Hozircha yechilgan masalalar tarixi mavjud emas. Masalalar bo'limidan birinchi masalangizni yeching!
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Profilni tahrirlash</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                message.includes("Xatolik") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Ism</label>
                  <input
                    type="text"
                    placeholder="Ismingiz"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Familiya</label>
                  <input
                    type="text"
                    placeholder="Familiyangiz"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Email manzili</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Yangi parol (ixtiyoriy)</label>
                <input
                  type="password"
                  placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
