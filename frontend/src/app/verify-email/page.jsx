"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Mail, ArrowRight, Loader2, Send } from "lucide-react";
import { api } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenParam = searchParams.get("token") || "";

  const [tokenInput, setTokenInput] = useState(tokenParam);
  const [resendEmail, setResendEmail] = useState("");
  const [loading, setLoading] = useState(Boolean(tokenParam));
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState(tokenParam ? "loading" : "idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (tokenParam) {
      verifyToken(tokenParam);
    }
  }, [tokenParam]);

  const verifyToken = async (tok) => {
    setLoading(true);
    setStatus("loading");
    setMessage("");
    try {
      const res = await api.verifyEmail(tok.trim());
      setStatus("success");
      setMessage(res.detail || "Email manzilingiz muvaffaqiyatli tasdiqlandi!");
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Tasdiqlash kodi yaroqsiz yoki muddati o'tgan.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToken = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    verifyToken(tokenInput.trim());
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendMessage("");
    try {
      const res = await api.resendVerification(resendEmail.trim());
      setResendMessage(res.detail || "Tasdiqlash xabari pochtangizga yuborildi.");
    } catch (err) {
      setResendMessage(err.message || "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center">
        {status === "loading" && (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Email tasdiqlanmoqda...
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Iltimos, kuting. So'rovingiz ko'rib chiqilmoqda.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Email tasdiqlandi!
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {message}
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/problems"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
              >
                Masalalarni yechish
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
              >
                Bosh sahifaga qaytish / Kirish
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-5 py-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Tasdiqlashda xatolik
              </h2>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                {message}
              </p>
            </div>

            <form onSubmit={handleResend} className="pt-2 text-left space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Yangi tasdiqlash xatini so'rash:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Yuborish
                </button>
              </div>
              {resendMessage && (
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {resendMessage}
                </p>
              )}
            </form>
          </div>
        )}

        {status === "idle" && (
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
              <Mail className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Emailni tasdiqlash
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Pochtanggizga yuborilgan tasdiqlash tokenini kiriting yoki yangi xat so'rang.
              </p>
            </div>

            <form onSubmit={handleSubmitToken} className="space-y-3 text-left">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tasdiqlash tokeni:
              </label>
              <input
                type="text"
                required
                placeholder="Masalan: e90b6..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-mono outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20"
              >
                Tasdiqlash
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleResend} className="space-y-3 text-left">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tasdiqlash xatini qayta yuborish:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={resending}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Yuborish
                  </button>
                </div>
                {resendMessage && (
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    {resendMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

