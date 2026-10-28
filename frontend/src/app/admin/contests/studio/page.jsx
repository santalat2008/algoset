"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  ArrowLeft,
  Plus,
  Search,
  Sliders,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Layers,
  Award,
  BookOpen,
  Filter,
  Check,
  RefreshCw,
  HelpCircle,
  FileText
} from "lucide-react";
import { api } from "@/lib/api";

function ContestStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams ? (searchParams.get("edit") || searchParams.get("slug")) : null;
  const actionParam = searchParams ? searchParams.get("action") : null;

  // Current user & RBAC
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Studio Mode: "list" (Dashboard & table) | "editor" (Create or Edit)
  const [studioMode, setStudioMode] = useState("list");
  const [editorId, setEditorId] = useState(null); // contest slug or null for new

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    draft: 0,
    pending: 0,
    rejected: 0,
    upcoming: 0,
    ongoing: 0,
    past: 0,
  });

  // Contest list data
  const [contests, setContests] = useState([]);
  const [loadingContests, setLoadingContests] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, upcoming, ongoing, past
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // all, public, private, pending
  const [divisionFilter, setDivisionFilter] = useState("all"); // all, Div. 1, Div. 2, Educational
  const [sortBy, setSortBy] = useState("start_time_desc"); // start_time_desc, start_time_asc, title

  // Notification / Feedback
  const [actionNotice, setActionNotice] = useState({ text: "", type: "info" });

  // Available Problems for Picker
  const [availableProblems, setAvailableProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problemSearch, setProblemSearch] = useState("");
  const [problemDifficultyFilter, setProblemDifficultyFilter] = useState("all");

  // Form State
  const defaultFormState = {
    title_uz: "",
    title_en: "",
    slug: "",
    division: "Div. 2",
    is_rated: true,
    start_time: "",
    duration_minutes: 120,
    announcement_uz: "",
    announcement_en: "",
    rules_uz: "1. Barcha yechimlar avtomatik tizim tomonidan tekshiriladi.\n2. Boshqa ishtirokchilar bilan kod almashish taqiqlanadi.\n3. Har bir noto'g'ri urinish uchun jarima vaqti qo'shiladi.",
    rules_en: "1. All submissions are automatically evaluated.\n2. Sharing code with other contestants is strictly prohibited.\n3. Penalty time is added for each rejected submission.",
    selectedProblems: [], // array of { id, title_uz, title_en, slug, difficulty, points, order, author, visibility }
  };

  const [mounted, setMounted] = useState(false);
  const [contestForm, setContestForm] = useState(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorActiveTab, setEditorActiveTab] = useState("general"); // general, problems, rules, preview

  useEffect(() => {
    setMounted(true);
    setContestForm((prev) => ({
      ...prev,
      start_time: prev.start_time || new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    }));
  }, []);

  // Review Modal state (Admin approve/deny)
  const [reviewModalContest, setReviewModalContest] = useState(null);
  const [reviewDecision, setReviewDecision] = useState("approve");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Delete confirmation modal
  const [deleteModalContest, setDeleteModalContest] = useState(null);
  const [deletingContest, setDeletingContest] = useState(false);

  // Language display toggle (uz/en)
  const [activeLang, setActiveLang] = useState("uz");

  // Helper notification
  function showNotification(text, type = "success") {
    setActionNotice({ text, type });
    setTimeout(() => {
      setActionNotice({ text: "", type: "info" });
    }, 4500);
  }

  // Load User & Check Auth
  useEffect(() => {
    async function initUser() {
      try {
        setLoadingUser(true);
        const me = await api.getMe();
        setCurrentUser(me);
        if (!me || (me.role !== "author" && me.role !== "admin" && me.role !== "superadmin")) {
          // not authorized
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setLoadingUser(false);
      }
    }
    initUser();
  }, []);

  // Load Stats & Contests
  async function loadStudioData() {
    try {
      setLoadingContests(true);
      const [statsData, contestsRes] = await Promise.all([
        api.getContestStudioStats(),
        api.getContests("all"),
      ]);
      if (statsData) setStats(statsData);
      const list = Array.isArray(contestsRes) ? contestsRes : (contestsRes?.results || []);
      setContests(list);
    } catch (err) {
      console.error(err);
      showNotification("Musobaqa ma'lumotlarini yuklashda xatolik yuz berdi", "error");
    } finally {
      setLoadingContests(false);
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadStudioData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && editSlug) {
      handleOpenEdit(editSlug);
    } else if (currentUser && actionParam === "create") {
      handleOpenCreate();
    }
  }, [currentUser, editSlug, actionParam]);

  // Load problems for problem picker
  async function loadProblems() {
    try {
      setLoadingProblems(true);
      const data = await api.getProblems({ page_size: 150 });
      const list = Array.isArray(data) ? data : (data.results || []);
      setAvailableProblems(list);
    } catch (err) {
      console.error("Failed to load problems", err);
    } finally {
      setLoadingProblems(false);
    }
  }

  // Start creating new contest
  function handleOpenCreate() {
    setEditorId(null);
    setContestForm({
      ...defaultFormState,
      start_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    });
    setHasUnsavedChanges(false);
    setEditorActiveTab("general");
    setStudioMode("editor");
    loadProblems();
  }

  // Start editing existing contest
  async function handleOpenEdit(slug) {
    try {
      setStudioMode("editor");
      setEditorId(slug);
      setHasUnsavedChanges(false);
      setEditorActiveTab("general");
      loadProblems();

      const c = await api.getContest(slug);
      let localStartTime = "";
      if (c.start_time) {
        try {
          const d = new Date(c.start_time);
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
          localStartTime = localISOTime;
        } catch {
          localStartTime = c.start_time.slice(0, 16);
        }
      }

      // Map selected problems with points and order from problem_order or problems_detail
      const orderMap = {};
      if (Array.isArray(c.problem_order)) {
        c.problem_order.forEach((item) => {
          if (item && item.problem_id) {
            orderMap[item.problem_id] = item;
          }
        });
      }

      const selected = (c.problems_detail || []).map((p, idx) => {
        const itemConfig = orderMap[p.id] || {};
        return {
          id: p.id,
          title_uz: p.title_uz,
          title_en: p.title_en,
          slug: p.slug,
          difficulty: p.difficulty,
          author: p.author,
          author_username: p.author_username,
          visibility: p.visibility,
          points: itemConfig.points !== undefined ? itemConfig.points : 100,
          order: itemConfig.order !== undefined ? itemConfig.order : idx + 1,
        };
      });

      selected.sort((a, b) => (a.order || 0) - (b.order || 0));

      setContestForm({
        id: c.id,
        title_uz: c.title_uz || "",
        title_en: c.title_en || "",
        slug: c.slug || "",
        division: c.division || "Div. 2",
        is_rated: c.is_rated !== undefined ? c.is_rated : true,
        start_time: localStartTime,
        duration_minutes: c.duration_minutes || 120,
        announcement_uz: c.announcement_uz || "",
        announcement_en: c.announcement_en || "",
        rules_uz: c.rules_uz || defaultFormState.rules_uz,
        rules_en: c.rules_en || defaultFormState.rules_en,
        selectedProblems: selected,
        status: c.status,
        visibility: c.visibility,
        ratings_calculated: c.ratings_calculated,
      });
    } catch (err) {
      console.error(err);
      showNotification(`Musobaqa ma'lumotlarini yuklab bo'lmadi: ${err.message}`, "error");
      setStudioMode("list");
    }
  }

  function handleBackToList() {
    if (hasUnsavedChanges && !confirm("Saqlanmagan o'zgarishlar bor. Bekor qilib ro'yxatga qaytasizmi?")) {
      return;
    }
    setStudioMode("list");
    setEditorId(null);
    setHasUnsavedChanges(false);
    if (typeof window !== "undefined" && window.location.search) {
      router.replace("/admin/contests/studio");
    }
    loadStudioData();
  }

  // Auto-slug generator
  function generateSlug(text) {
    if (!text || !text.trim()) return `contest-${Date.now().toString(36)}`;
    return text
      .toLowerCase()
      .replace(/['`’"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Add problem to contest
  function handleAddProblem(prob) {
    const isOwner = prob.author === currentUser.id || prob.author_username === currentUser.username;
    const isPublic = prob.visibility === "public";
    const isAdmin = currentUser.role === "admin" || currentUser.role === "superadmin";

    if (!isPublic && !isOwner && !isAdmin) {
      showNotification(
        `"${prob.title_uz || prob.title_en}" masalasi boshqa muallifning xususiy masalasi. Faqat ommaviy yoki o'zingizning masalalaringizni qo'sha olasiz.`,
        "error"
      );
      return;
    }

    if (contestForm.selectedProblems.some((p) => p.id === prob.id)) {
      showNotification("Ushbu masala allaqachon tanlangan", "info");
      return;
    }

    const nextOrder = contestForm.selectedProblems.length + 1;
    // Default points based on difficulty
    let defaultPts = 100;
    if (prob.difficulty === "Medium") defaultPts = 200;
    if (prob.difficulty === "Hard") defaultPts = 300;

    const newSelected = [
      ...contestForm.selectedProblems,
      {
        id: prob.id,
        title_uz: prob.title_uz,
        title_en: prob.title_en,
        slug: prob.slug,
        difficulty: prob.difficulty,
        author: prob.author,
        author_username: prob.author_username,
        visibility: prob.visibility,
        points: defaultPts,
        order: nextOrder,
      },
    ];

    setContestForm({ ...contestForm, selectedProblems: newSelected });
    setHasUnsavedChanges(true);
    showNotification(`"${prob.title_uz || prob.title_en}" qo'shildi`, "success");
  }

  // Remove problem from contest
  function handleRemoveProblem(problemId) {
    const filtered = contestForm.selectedProblems
      .filter((p) => p.id !== problemId)
      .map((p, idx) => ({ ...p, order: idx + 1 }));
    setContestForm({ ...contestForm, selectedProblems: filtered });
    setHasUnsavedChanges(true);
  }

  // Move problem up/down in order
  function handleMoveProblem(index, direction) {
    const list = [...contestForm.selectedProblems];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reordered = list.map((p, idx) => ({ ...p, order: idx + 1 }));
    setContestForm({ ...contestForm, selectedProblems: reordered });
    setHasUnsavedChanges(true);
  }

  // Update points for problem
  function handlePointsChange(problemId, points) {
    const pts = Math.max(0, parseInt(points) || 0);
    const updated = contestForm.selectedProblems.map((p) =>
      p.id === problemId ? { ...p, points: pts } : p
    );
    setContestForm({ ...contestForm, selectedProblems: updated });
    setHasUnsavedChanges(true);
  }

  // Save Contest (Create or Update)
  async function handleSaveContest(e) {
    if (e) e.preventDefault();

    const titleUz = (contestForm.title_uz || contestForm.title_en || "").trim();
    const titleEn = (contestForm.title_en || titleUz).trim();

    if (!titleUz && !titleEn) {
      showNotification("Musobaqa nomini kiriting", "error");
      return;
    }

    if (!contestForm.start_time) {
      showNotification("Musobaqa boshlanish vaqtini tanlang", "error");
      return;
    }

    if (!contestForm.duration_minutes || contestForm.duration_minutes <= 0) {
      showNotification("Musobaqa davomiyligi kamida 1 daqiqa bo'lishi kerak", "error");
      return;
    }

    const slugVal = (contestForm.slug || "").trim() || generateSlug(titleEn || titleUz);

    // Build problem_order and problem_ids
    const problemIds = contestForm.selectedProblems.map((p) => p.id);
    const problemOrder = contestForm.selectedProblems.map((p, idx) => ({
      problem_id: p.id,
      order: p.order || idx + 1,
      points: p.points || 100,
    }));

    // Convert local start time to ISO
    let startIso = "";
    try {
      startIso = new Date(contestForm.start_time).toISOString();
    } catch {
      startIso = contestForm.start_time;
    }

    const payload = {
      title_uz: titleUz,
      title_en: titleEn,
      slug: slugVal,
      division: contestForm.division,
      is_rated: contestForm.is_rated,
      start_time: startIso,
      duration_minutes: parseInt(contestForm.duration_minutes, 10),
      announcement_uz: contestForm.announcement_uz || titleUz,
      announcement_en: contestForm.announcement_en || titleEn,
      rules_uz: contestForm.rules_uz,
      rules_en: contestForm.rules_en,
      problem_ids: problemIds,
      problem_order: problemOrder,
    };

    setIsSubmitting(true);
    try {
      if (editorId) {
        // Update
        const updated = await api.updateContest(editorId, payload);
        showNotification("Musobaqa muvaffaqiyatli yangilandi!", "success");
        setEditorId(updated.slug);
      } else {
        // Create
        const created = await api.createContest(payload);
        showNotification("Yangi musobaqa yaratildi va xususiy holatda saqlandi!", "success");
        setEditorId(created.slug);
      }
      setHasUnsavedChanges(false);
      loadStudioData();
    } catch (err) {
      console.error(err);
      showNotification(`Xatolik: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Request Publication
  async function handleRequestPublication(slug) {
    try {
      await api.requestContestPublic(slug);
      showNotification("Musobaqani ommaviy qilish so'rovi adminga yuborildi!", "success");
      loadStudioData();
      if (editorId === slug) {
        setContestForm((prev) => ({ ...prev, visibility: "pending" }));
      }
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`, "error");
    }
  }

  // Review Publication (Admin)
  async function handleSubmitReview() {
    if (!reviewModalContest) return;
    try {
      setSubmittingReview(true);
      await api.reviewContest(reviewModalContest.slug, reviewDecision, reviewFeedback);
      showNotification(
        reviewDecision === "approve"
          ? "Musobaqa ommaviy qilindi va tasdiqlandi!"
          : "Musobaqa so'rovi rad etildi va xususiy holatda qoldirildi.",
        reviewDecision === "approve" ? "success" : "info"
      );
      setReviewModalContest(null);
      setReviewFeedback("");
      loadStudioData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`, "error");
    } finally {
      setSubmittingReview(false);
    }
  }

  // Finalize Ratings
  async function handleFinalizeRatings(slug) {
    if (!confirm("Haqiqatan ham ushbu musobaqa natijalari bo'yicha reytinglarni hisoblamoqchimisiz?")) {
      return;
    }
    try {
      await api.finalizeContestRatings(slug);
      showNotification("Reytinglar muvaffaqiyatli hisoblandi va yangilandi!", "success");
      loadStudioData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`, "error");
    }
  }

  // Delete Contest
  async function handleConfirmDelete() {
    if (!deleteModalContest) return;
    try {
      setDeletingContest(true);
      await api.deleteContest(deleteModalContest.slug);
      showNotification("Musobaqa muvaffaqiyatli o'chirildi.", "success");
      setDeleteModalContest(null);
      if (editorId === deleteModalContest.slug) {
        setStudioMode("list");
      }
      loadStudioData();
    } catch (err) {
      showNotification(`O'chirishda xatolik: ${err.message}`, "error");
    } finally {
      setDeletingContest(false);
    }
  }

  // Filtered contests
  const filteredContests = useMemo(() => {
    return contests
      .filter((c) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (c.title_uz || "").toLowerCase().includes(q) || (c.title_en || "").toLowerCase().includes(q);
          const matchAuthor = (c.author_username || "").toLowerCase().includes(q);
          const matchSlug = (c.slug || "").toLowerCase().includes(q);
          if (!matchTitle && !matchAuthor && !matchSlug) return false;
        }

        // Status Filter
        if (statusFilter !== "all" && c.status !== statusFilter) return false;

        // Visibility Filter
        if (visibilityFilter !== "all" && c.visibility !== visibilityFilter) return false;

        // Division Filter
        if (divisionFilter !== "all" && c.division !== divisionFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "start_time_desc") {
          return new Date(b.start_time || 0) - new Date(a.start_time || 0);
        }
        if (sortBy === "start_time_asc") {
          return new Date(a.start_time || 0) - new Date(b.start_time || 0);
        }
        if (sortBy === "title") {
          return (a.title_uz || a.title_en || "").localeCompare(b.title_uz || b.title_en || "");
        }
        return 0;
      });
  }, [contests, searchQuery, statusFilter, visibilityFilter, divisionFilter, sortBy]);

  // Filtered problems for problem picker modal / tab
  const filteredAvailableProblems = useMemo(() => {
    return availableProblems.filter((p) => {
      if (problemSearch.trim()) {
        const q = problemSearch.toLowerCase();
        const matchTitle = (p.title_uz || "").toLowerCase().includes(q) || (p.title_en || "").toLowerCase().includes(q);
        const matchSlug = (p.slug || "").toLowerCase().includes(q);
        if (!matchTitle && !matchSlug) return false;
      }
      if (problemDifficultyFilter !== "all" && p.difficulty !== problemDifficultyFilter) {
        return false;
      }
      return true;
    });
  }, [availableProblems, problemSearch, problemDifficultyFilter]);

  // Auth gate
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Foydalanuvchi ma'lumotlari tekshirilmoqda...
        </div>
      </div>
    );
  }

  const isAdminOrSuper = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const isAuthor = currentUser?.role === "author";

  if (!currentUser || (!isAuthor && !isAdminOrSuper)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Kirish ruxsati yo'q</h2>
          <p className="text-xs text-slate-500 mb-6">
            Contest Studio faqat mualliflar (Author), adminlar (Admin) va superadminlar uchun mo'ljallangan.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Studio Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition"
            title="Admin panelga qaytish"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-sm">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight">Contest Studio</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400">
                  AlgoSet CP
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Dasturlash musobaqalarini yaratish va boshqarish</p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {studioMode === "editor" ? (
            <>
              <button
                onClick={handleBackToList}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Orqaga
              </button>
              <button
                onClick={handleSaveContest}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSubmitting ? "Saqlanmoqda..." : editorId ? "O'zgarishlarni saqlash" : "Musobaqani yaratish"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                Yangi musobaqa
              </button>
            </>
          )}

          {/* Language Toggle */}
          <button
            onClick={() => setActiveLang(activeLang === "uz" ? "en" : "uz")}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase"
            title="Tilni almashtirish"
          >
            {activeLang}
          </button>
        </div>
      </header>

      {/* Action Notification Alert */}
      {actionNotice.text && (
        <div
          className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
            actionNotice.type === "error"
              ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900"
              : actionNotice.type === "info"
              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
          }`}
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            {actionNotice.type === "error" ? (
              <XCircle className="w-4 h-4 shrink-0 text-red-500" />
            ) : actionNotice.type === "info" ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-blue-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button onClick={() => setActionNotice({ text: "", type: "info" })}>
            <X className="w-4 h-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Main Studio View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {studioMode === "list" ? (
          /* ========================================================
             DASHBOARD & CONTEST LIST VIEW
             ======================================================== */
          <div className="space-y-6">
            {/* Dashboard Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Jami</div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Ommaviy</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.public}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Xususiy</div>
                <div className="text-xl font-black text-slate-600 dark:text-slate-300 mt-1">{stats.private}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase">Kutilmoqda</div>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase">Kutilayotgan</div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.upcoming}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase">Hozirda faol</div>
                <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.ongoing}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase">Yakunlangan</div>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{stats.past}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Qoralama</div>
                <div className="text-xl font-black text-slate-500 mt-1">{stats.draft}</div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Musobaqa nomi, URL yoki muallif bo'yicha qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                >
                  <option value="all">Barcha holatlar</option>
                  <option value="upcoming">Kutilayotgan (Upcoming)</option>
                  <option value="ongoing">Davom etayotgan (Ongoing)</option>
                  <option value="past">Yakunlangan (Past)</option>
                </select>

                {/* Visibility Filter */}
                <select
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                >
                  <option value="all">Barcha ko'rinishlar</option>
                  <option value="public">Ommaviy (Public)</option>
                  <option value="private">Xususiy (Private)</option>
                  <option value="pending">Kutilmoqda (Pending)</option>
                  <option value="rejected">Rad etilgan (Rejected)</option>
                </select>

                {/* Division Filter */}
                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                >
                  <option value="all">Barcha divizionlar</option>
                  <option value="Div. 1">Div. 1</option>
                  <option value="Div. 2">Div. 2</option>
                  <option value="Educational">Educational</option>
                </select>

                {/* Sorting */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                >
                  <option value="start_time_desc">Vaqti bo'yicha: Yangi</option>
                  <option value="start_time_asc">Vaqti bo'yicha: Qadimgi</option>
                  <option value="title">Nomi bo'yicha (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Contests Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
              {loadingContests ? (
                <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  Musobaqalar yuklanmoqda...
                </div>
              ) : filteredContests.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hech qanday musobaqa topilmadi</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Qidiruv filtrlarini o'zgartiring yoki yangi musobaqa yaratib Contest Studio imkoniyatlaridan foydalaning.
                  </p>
                  <button
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Musobaqa yaratish
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-3.5 px-4">Musobaqa</th>
                        <th className="py-3.5 px-4">Holati</th>
                        <th className="py-3.5 px-4">Ko'rinish</th>
                        <th className="py-3.5 px-4">Boshlanish vaqti</th>
                        <th className="py-3.5 px-4">Davomiyligi</th>
                        <th className="py-3.5 px-4">Masalalar</th>
                        <th className="py-3.5 px-4">Muallif</th>
                        <th className="py-3.5 px-4 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredContests.map((c) => {
                        const isOwner = c.author === currentUser.id || c.author_username === currentUser.username;
                        const canManage = isOwner || isAdminOrSuper;

                        const startDateFormatted = c.start_time
                          ? new Date(c.start_time).toLocaleString("uz-UZ", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—";

                        return (
                          <tr key={c.slug} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{activeLang === "uz" ? (c.title_uz || c.title_en) : (c.title_en || c.title_uz)}</span>
                                {c.is_rated && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                    RATED
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                <span>{c.slug}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-500">{c.division}</span>
                              </div>
                            </td>

                            {/* Status badge */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.status === "upcoming"
                                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                                    : c.status === "ongoing"
                                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 animate-pulse"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                }`}
                              >
                                {c.status === "upcoming"
                                  ? "Kutilmoqda"
                                  : c.status === "ongoing"
                                  ? "Davom etmoqda"
                                  : "Yakunlangan"}
                              </span>
                            </td>

                            {/* Visibility badge */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.visibility === "public"
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                    : c.visibility === "pending"
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                    : c.visibility === "rejected"
                                    ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                }`}
                              >
                                {c.visibility === "public"
                                  ? "Ommaviy"
                                  : c.visibility === "pending"
                                  ? "Ko'rib chiqilmoqda"
                                  : c.visibility === "rejected"
                                  ? "Rad etilgan"
                                  : "Xususiy (Private)"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium" suppressHydrationWarning>
                              {startDateFormatted}
                            </td>

                            <td className="py-3.5 px-4 text-slate-500">
                              {c.duration_minutes} daq ({Math.round((c.duration_minutes / 60) * 10) / 10} soat)
                            </td>

                            <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                              {c.problems_detail ? c.problems_detail.length : (c.problems?.length || 0)} ta
                            </td>

                            <td className="py-3.5 px-4 text-slate-500">{c.author_username || "Muallif"}</td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Preview link */}
                                <Link
                                  href={`/contests/${c.slug}`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                                  title="Musobaqani ko'rish"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>

                                {/* Request publication button for author if private/rejected */}
                                {(c.visibility === "private" || c.visibility === "rejected") && canManage && (
                                  <button
                                    onClick={() => handleRequestPublication(c.slug)}
                                    className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 text-[10px]"
                                    title="Nashr so'rovini yuborish"
                                  >
                                    Nashr so'rovi
                                  </button>
                                )}

                                {/* Admin review request button */}
                                {c.visibility === "pending" && isAdminOrSuper && (
                                  <button
                                    onClick={() => {
                                      setReviewModalContest(c);
                                      setReviewDecision("approve");
                                      setReviewFeedback("");
                                    }}
                                    className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-100 text-[10px]"
                                    title="So'rovni ko'rib chiqish"
                                  >
                                    Ko'rib chiqish
                                  </button>
                                )}

                                {/* Finalize ratings for finished rated contests */}
                                {c.status === "past" && c.is_rated && !c.ratings_calculated && isAdminOrSuper && (
                                  <button
                                    onClick={() => handleFinalizeRatings(c.slug)}
                                    className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 text-[10px]"
                                    title="Reytinglarni yakunlash"
                                  >
                                    Reyting hisoblash
                                  </button>
                                )}

                                {/* Edit Contest */}
                                {canManage && (
                                  <button
                                    onClick={() => handleOpenEdit(c.slug)}
                                    className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 font-bold"
                                    title="Tahrirlash"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete Contest */}
                                {canManage && c.status !== "past" && !c.ratings_calculated && (
                                  <button
                                    onClick={() => setDeleteModalContest(c)}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                    title="O'chirish"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================
             CONTEST EDITOR VIEW (CREATE / EDIT)
             ======================================================== */
          <div className="space-y-6">
            {/* Editor Sub-header & Tabs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base">
                    {editorId ? (contestForm.title_uz || contestForm.title_en || "Musobaqani tahrirlash") : "Yangi musobaqa yaratish"}
                  </span>
                  {contestForm.visibility && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        contestForm.visibility === "public"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                          : contestForm.visibility === "pending"
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {contestForm.visibility === "public" ? "Ommaviy" : contestForm.visibility === "pending" ? "Kutilmoqda" : "Xususiy (Draft)"}
                    </span>
                  )}
                  {hasUnsavedChanges && (
                    <span className="text-[10px] text-amber-600 font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 rounded-full">
                      Saqlanmagan o'zgarishlar
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Musobaqa parametrlari, qoidalari va masalalar to'plamini sozlash
                </p>
              </div>

              {/* Editor Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditorActiveTab("general")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    editorActiveTab === "general"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Asosiy sozlamalar
                </button>
                <button
                  type="button"
                  onClick={() => setEditorActiveTab("problems")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    editorActiveTab === "problems"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <span>Masalalar</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-600">
                    {contestForm.selectedProblems.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorActiveTab("rules")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    editorActiveTab === "rules"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Qoidalar va Tavsif
                </button>
                <button
                  type="button"
                  onClick={() => setEditorActiveTab("preview")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                    editorActiveTab === "preview"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ko'rib chiqish
                </button>
              </div>
            </div>

            {/* TAB 1: General Settings */}
            {editorActiveTab === "general" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Musobaqa nomi (O'zbekcha) *
                    </label>
                    <input
                      type="text"
                      placeholder="masalan: Haftalik Python Musobaqasi #15"
                      value={contestForm.title_uz}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContestForm((prev) => ({
                          ...prev,
                          title_uz: val,
                          slug: prev.slug || generateSlug(val),
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Musobaqa nomi (Inglizcha)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Weekly Python Contest #15"
                      value={contestForm.title_en}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContestForm((prev) => ({
                          ...prev,
                          title_en: val,
                          slug: prev.slug || generateSlug(val),
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      URL identifikatori (Slug) *
                    </label>
                    <input
                      type="text"
                      value={contestForm.slug}
                      onChange={(e) => {
                        setContestForm({ ...contestForm, slug: generateSlug(e.target.value) });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Divizion
                    </label>
                    <select
                      value={contestForm.division}
                      onChange={(e) => {
                        setContestForm({ ...contestForm, division: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                    >
                      <option value="Div. 1">Div. 1 (Kuchli dasturchilar)</option>
                      <option value="Div. 2">Div. 2 (O'rtacha daraja)</option>
                      <option value="Educational">Educational (O'quv/Sinov)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reytingli musobaqa (Rated)
                    </label>
                    <div className="flex items-center gap-3 pt-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contestForm.is_rated}
                          onChange={(e) => {
                            setContestForm({ ...contestForm, is_rated: e.target.checked });
                            setHasUnsavedChanges(true);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <span className="text-xs text-slate-500 font-medium">
                        {contestForm.is_rated ? "Reyting o'zgaradi" : "Reytingsiz"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      Boshlanish vaqti (Mahalliy vaqt) *
                    </label>
                    <input
                      type="datetime-local"
                      value={contestForm.start_time}
                      onChange={(e) => {
                        setContestForm({ ...contestForm, start_time: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      Davomiyligi (Daqiqalarda) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10080"
                      value={contestForm.duration_minutes}
                      onChange={(e) => {
                        setContestForm({ ...contestForm, duration_minutes: parseInt(e.target.value, 10) || 0 });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-blue-500"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">
                      Standart: 120 daqiqa (2 soat). Maksimal: 10080 daqiqa (7 kun).
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Problems Selector & Reordering */}
            {editorActiveTab === "problems" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Selected Problems Column */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Tanlangan masalalar</h3>
                      <p className="text-[10px] text-slate-400">
                        Masalalar tartibi va beriladigan ball/ochkolarni moslang
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-blue-600">
                        {contestForm.selectedProblems.reduce((sum, p) => sum + (p.points || 0), 0)} ball
                      </span>
                      <div className="text-[10px] text-slate-400">{contestForm.selectedProblems.length} ta masala</div>
                    </div>
                  </div>

                  {contestForm.selectedProblems.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Musobaqaga hali masala qo'shilmagan. O'ng tarafdagi ro'yxatdan kerakli masalalarni tanlang.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {contestForm.selectedProblems.map((prob, idx) => (
                        <div
                          key={prob.id}
                          className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl gap-3"
                        >
                          <div className="flex items-center gap-3">
                            {/* Order index */}
                            <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center">
                              {String.fromCharCode(65 + idx)}
                            </span>

                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{prob.title_uz || prob.title_en}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    prob.difficulty === "Easy"
                                      ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950"
                                      : prob.difficulty === "Medium"
                                      ? "text-amber-500 bg-amber-50 dark:bg-amber-950"
                                      : "text-red-500 bg-red-50 dark:bg-red-950"
                                  }`}
                                >
                                  {prob.difficulty}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{prob.slug}</div>
                            </div>
                          </div>

                          {/* Points Input & Controls */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-xl">
                              <span className="text-[10px] text-slate-400 font-bold">Ball:</span>
                              <input
                                type="number"
                                min="0"
                                max="5000"
                                value={prob.points || 100}
                                onChange={(e) => handlePointsChange(prob.id, e.target.value)}
                                className="w-12 bg-transparent text-xs font-bold text-right outline-none"
                              />
                            </div>

                            {/* Up / Down Order */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveProblem(idx, "up")}
                                className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 disabled:opacity-30 text-slate-700 dark:text-slate-200"
                                title="Yuqoriga"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === contestForm.selectedProblems.length - 1}
                                onClick={() => handleMoveProblem(idx, "down")}
                                className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 disabled:opacity-30 text-slate-700 dark:text-slate-200"
                                title="Pastga"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveProblem(prob.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Problems Search & Picker Column */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Masalalar banki</h3>
                    <p className="text-[10px] text-slate-400">
                      Ommaviy yoki o'zingiz yaratgan xususiy masalalardan tanlang
                    </p>
                  </div>

                  {/* Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Masalalarni qidirish..."
                        value={problemSearch}
                        onChange={(e) => setProblemSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <select
                      value={problemDifficultyFilter}
                      onChange={(e) => setProblemDifficultyFilter(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                    >
                      <option value="all">Barcha qiyinliklar</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  {/* Problem items list */}
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                    {loadingProblems ? (
                      <div className="p-8 text-center text-xs text-slate-400">Masalalar yuklanmoqda...</div>
                    ) : filteredAvailableProblems.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">Mos masala topilmadi.</div>
                    ) : (
                      filteredAvailableProblems.map((prob) => {
                        const isSelected = contestForm.selectedProblems.some((p) => p.id === prob.id);
                        const isOwner = prob.author === currentUser.id || prob.author_username === currentUser.username;
                        const isPublic = prob.visibility === "public";
                        const canSelect = isPublic || isOwner || isAdminOrSuper;

                        return (
                          <div
                            key={prob.id}
                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 transition ${
                              isSelected
                                ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60"
                                : canSelect
                                ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300"
                                : "opacity-40 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate">
                                {prob.title_uz || prob.title_en}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="font-semibold text-slate-500">{prob.difficulty}</span>
                                <span>•</span>
                                <span>{prob.visibility === "public" ? "Ommaviy" : "Xususiy"}</span>
                                {isOwner && <span className="text-blue-500 font-bold">• Sizniki</span>}
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={!canSelect || isSelected}
                              onClick={() => handleAddProblem(prob)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition shrink-0 ${
                                isSelected
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 cursor-default"
                                  : canSelect
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                  : "bg-slate-200 text-slate-400"
                              }`}
                            >
                              {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Rules and Announcements */}
            {editorActiveTab === "rules" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    Musobaqa qoidalari va yo'riqnomasi
                  </h3>
                  <p className="text-xs text-slate-400">
                    Qatnashchilar uchun musobaqa jarayoni, jarima vaqti va talablar
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Qoidalar (O'zbekcha)
                    </label>
                    <textarea
                      rows={6}
                      value={contestForm.rules_uz}
                      onChange={(e) => {
                        setContestForm({ ...contestForm, rules_uz: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Qoidalar (Inglizcha)
                    </label>
                    <textarea
                      rows={6}
                      value={contestForm.rules_en}
                      onChange={(e) => {
                        setContestForm({ ...contestForm, rules_en: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      E'lon va Tavsif (O'zbekcha)
                    </label>
                    <textarea
                      rows={5}
                      value={contestForm.announcement_uz}
                      onChange={(e) => {
                        setContestForm({ ...contestForm, announcement_uz: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Musobaqa haqida umumiy ma'lumot..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      E'lon va Tavsif (Inglizcha)
                    </label>
                    <textarea
                      rows={5}
                      value={contestForm.announcement_en}
                      onChange={(e) => {
                        setContestForm({ ...contestForm, announcement_en: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="General contest announcement in English..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Live Preview */}
            {editorActiveTab === "preview" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-600">
                      {contestForm.division}
                    </span>
                    {contestForm.is_rated && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600">
                        RATED
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {activeLang === "uz" ? (contestForm.title_uz || contestForm.title_en) : (contestForm.title_en || contestForm.title_uz)}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span suppressHydrationWarning>{contestForm.start_time ? new Date(contestForm.start_time).toLocaleString("uz-UZ") : "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{contestForm.duration_minutes} daqiqa</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-slate-400" />
                      <span>
                        Jami ball: {contestForm.selectedProblems.reduce((sum, p) => sum + (p.points || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Announcement Preview */}
                <div>
                  <h4 className="font-bold text-xs text-slate-400 uppercase mb-2">E'lon</h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {activeLang === "uz" ? (contestForm.announcement_uz || contestForm.announcement_en) : (contestForm.announcement_en || contestForm.announcement_uz)}
                  </div>
                </div>

                {/* Rules Preview */}
                <div>
                  <h4 className="font-bold text-xs text-slate-400 uppercase mb-2">Qoidalar</h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs whitespace-pre-line text-slate-700 dark:text-slate-300">
                    {activeLang === "uz" ? contestForm.rules_uz : contestForm.rules_en}
                  </div>
                </div>

                {/* Problems Preview List */}
                <div>
                  <h4 className="font-bold text-xs text-slate-400 uppercase mb-2">
                    Masalalar ro'yxati ({contestForm.selectedProblems.length})
                  </h4>
                  <div className="space-y-2">
                    {contestForm.selectedProblems.map((prob, idx) => (
                      <div
                        key={prob.id}
                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 font-black text-blue-600 text-xs flex items-center justify-center">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {prob.title_uz || prob.title_en}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-blue-600">{prob.points || 100} ball</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{prob.difficulty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Admin Review Request Modal */}
      {reviewModalContest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Nashr so'rovini ko'rib chiqish
              </h3>
              <button onClick={() => setReviewModalContest(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Musobaqa:</div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {reviewModalContest.title_uz || reviewModalContest.title_en}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">Muallif: {reviewModalContest.author_username}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Qaror</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewDecision("approve")}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    reviewDecision === "approve"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-600"
                      : "border-slate-200 dark:border-slate-700 text-slate-500"
                  }`}
                >
                  Tasdiqlash (Ommaviy)
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDecision("deny")}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    reviewDecision === "deny"
                      ? "bg-red-50 dark:bg-red-950/60 border-red-500 text-red-600"
                      : "border-slate-200 dark:border-slate-700 text-slate-500"
                  }`}
                >
                  Rad etish (Xususiy)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Muallifga xabar / Fikr-mulohaza
              </label>
              <textarea
                rows={3}
                placeholder="Qaror sababi yoki takliflar..."
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReviewModalContest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleSubmitReview}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {submittingReview ? "Bajarilmoqda..." : "Qarorni saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalContest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Musobaqani o'chirish</h3>
              <p className="text-xs text-slate-500 mt-1">
                Haqiqatan ham <strong className="text-slate-900 dark:text-white">{deleteModalContest.title_uz || deleteModalContest.title_en}</strong> musobaqasini o'chirib tashlamoqchimisiz?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalContest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={deletingContest}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {deletingContest ? "O'chirilmoqda..." : "Ha, o'chirilsin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContestStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            Contest Studio yuklanmoqda...
          </div>
        </div>
      }
    >
      <ContestStudioContent />
    </Suspense>
  );
}


