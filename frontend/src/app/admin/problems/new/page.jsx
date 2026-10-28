"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Code2, AlertCircle, Check } from "lucide-react";
import { api } from "@/lib/api";

export default function NewProblemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title_uz: "",
    title_en: "",
    slug: "",
    difficulty: "Easy",
    execution_mode: "function",
    statement_uz: "",
  });

  function generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 50);
  }

  function handleTitleChange(val) {
    setForm((prev) => ({
      ...prev,
      title_uz: val,
      slug: prev.slug || generateSlug(val),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title_uz.trim()) {
      setError("Masala nomi kiritilishi shart.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const titleUz = form.title_uz.trim();
      const titleEn = form.title_en.trim() || titleUz;
      const slugVal = form.slug.trim() || generateSlug(titleEn || titleUz) || `prob-${Date.now().toString(36)}`;

      const created = await api.createProblem({
        title_uz: titleUz,
        title_en: titleEn,
        slug: slugVal,
        difficulty: form.difficulty,
        statement_uz: form.statement_uz || "Masala sharti tez orada to'ldiriladi.",
        statement_en: form.statement_uz || "Statement will be provided.",
      });

      router.push(`/admin/problems/${created.slug || slugVal}`);
    } catch (err) {
      setError(err.message || "Masala yaratishda xatolik yuz berdi.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Admin panelga qaytish
      </Link>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden p-8 sm:p-10">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Yangi masala yaratish</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AlgoSet Problem Authoring Studio orqali masalani to'liq sozlash
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
              Masala nomi (O'zbekcha) *
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: Eng katta elementni topish"
              value={form.title_uz}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                Inglizcha nomi (Ixtiyoriy)
              </label>
              <input
                type="text"
                placeholder="Find Maximum Element"
                value={form.title_en}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                URL identifikator (Slug)
              </label>
              <input
                type="text"
                placeholder="find-maximum-element"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-mono text-[11px] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                Qiyinlik darajasi
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-900 dark:text-white font-semibold"
              >
                <option value="Easy">Easy (Oson)</option>
                <option value="Medium">Medium (O'rta)</option>
                <option value="Hard">Hard (Qiyin)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                Ijro modeli (Execution Model)
              </label>
              <select
                value={form.execution_mode}
                onChange={(e) => setForm({ ...form, execution_mode: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-900 dark:text-white font-semibold"
              >
                <option value="function">Funksiya-asosli (LeetCode-uslubida)</option>
                <option value="standard_io">Standart kiritish-chiqarish (stdin/stdout)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
              Dastlabki qisqacha tavsif (Keyinroq to'ldirish mumkin)
            </label>
            <textarea
              rows={3}
              placeholder="Masalan: Berilgan massivdagi eng katta elementni topuvchi dastur tuzing."
              value={form.statement_uz}
              onChange={(e) => setForm({ ...form, statement_uz: e.target.value })}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
            >
              Bekor qilish
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-lg shadow-blue-500/25 transition-all"
            >
              <Code2 className="w-4 h-4" />
              {loading ? "Yaratilmoqda..." : "Yaratish va Studio'da ochish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

