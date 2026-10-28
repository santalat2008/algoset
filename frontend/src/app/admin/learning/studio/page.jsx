"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Search,
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
  Layers,
  FolderPlus,
  FileText,
  Code2,
  Check,
  RefreshCw,
  Terminal,
  Cpu,
  Box,
  Share2,
  Folder,
  Sliders,
  ListOrdered
} from "lucide-react";
import { api } from "@/lib/api";

const ICON_OPTIONS = [
  { value: "code", label: "Code", icon: Code2 },
  { value: "box", label: "Box (OOP)", icon: Box },
  { value: "cpu", label: "CPU (Algorithms)", icon: Cpu },
  { value: "share-2", label: "DSA (Data Structures)", icon: Share2 },
  { value: "terminal", label: "Terminal (Fast I/O)", icon: Terminal },
  { value: "sparkles", label: "Sparkles (Advanced)", icon: Sparkles },
  { value: "book-open", label: "Book (General)", icon: BookOpen },
];

export default function LearningStudioPage() {
  const router = useRouter();

  // User auth & role
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Active Main Tab: "lessons" | "topics" | "categories" | "hierarchy"
  const [activeMainTab, setActiveMainTab] = useState("lessons");

  // Dashboard Stats
  const [stats, setStats] = useState({
    categories_count: 0,
    active_categories_count: 0,
    topics_count: 0,
    lessons_count: 0,
    published_lessons_count: 0,
    private_lessons_count: 0,
    pending_lessons_count: 0,
  });

  // Data collections
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [availableProblems, setAvailableProblems] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Notification / Feedback banner
  const [actionNotice, setActionNotice] = useState({ text: "", type: "info" });

  // Language toggle
  const [activeLang, setActiveLang] = useState("uz");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  // --- Category Form & Modal ---
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    title_uz: "",
    title_en: "",
    slug: "",
    icon: "code",
    group: "Python",
    description_uz: "",
    description_en: "",
    order: 1,
    is_active: true,
  });

  // --- Topic Form & Modal ---
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({
    category_slug: "",
    title_uz: "",
    title_en: "",
    slug: "",
    description_uz: "",
    description_en: "",
    content_uz: "",
    content_en: "",
    order: 1,
  });

  // --- Lesson Editor / Modal ---
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonActiveSubTab, setLessonActiveSubTab] = useState("content"); // content, problems, preview
  const [lessonForm, setLessonForm] = useState({
    topic_slug: "",
    title_uz: "",
    title_en: "",
    slug: "",
    summary_uz: "",
    summary_en: "",
    content_uz: "",
    content_en: "",
    order: 1,
    selectedProblemIds: [],
  });

  // --- Review Modal (Admin approve/deny publication) ---
  const [reviewLessonTarget, setReviewLessonTarget] = useState(null);
  const [reviewDecision, setReviewDecision] = useState("approve");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // --- Delete confirmation modal ---
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'category' | 'topic' | 'lesson', item: ... }
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper notification
  function showNotification(text, type = "success") {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice({ text: "", type: "info" }), 4500);
  }

  // Load User
  useEffect(() => {
    async function init() {
      try {
        setLoadingUser(true);
        const me = await api.getMe();
        setCurrentUser(me);
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setLoadingUser(false);
      }
    }
    init();
  }, []);

  // Load Studio Data
  async function loadAllStudioData() {
    try {
      setLoadingData(true);
      const [statsData, catsData, topsData, lessData, probsData] = await Promise.all([
        api.getLearningStudioStats(),
        api.getCategories(),
        api.getTopics(),
        api.getLessons(),
        api.getProblems({ page_size: 150 }),
      ]);

      if (statsData) setStats(statsData);
      if (Array.isArray(catsData)) setCategories(catsData);
      if (Array.isArray(topsData)) setTopics(topsData);
      if (Array.isArray(lessData)) setLessons(lessData);
      const pList = Array.isArray(probsData) ? probsData : (probsData?.results || []);
      setAvailableProblems(pList);
    } catch (err) {
      console.error(err);
      showNotification("O'quv materiallari yuklanmadi", "error");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadAllStudioData();
    }
  }, [currentUser]);

  // Slug generator helper
  function generateSlug(text, prefix = "item") {
    if (!text || !text.trim()) return `${prefix}-${Date.now().toString(36)}`;
    return text
      .toLowerCase()
      .replace(/['`’"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // ================= CATEGORY HANDLERS =================
  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryForm({
      title_uz: "",
      title_en: "",
      slug: "",
      icon: "code",
      group: "Python",
      description_uz: "",
      description_en: "",
      order: categories.length + 1,
      is_active: true,
    });
    setShowCategoryModal(true);
  }

  function openEditCategory(cat) {
    setEditingCategory(cat);
    setCategoryForm({
      title_uz: cat.title_uz || "",
      title_en: cat.title_en || "",
      slug: cat.slug || "",
      icon: cat.icon || "code",
      group: cat.group || "Python",
      description_uz: cat.description_uz || "",
      description_en: cat.description_en || "",
      order: cat.order !== undefined ? cat.order : 1,
      is_active: cat.is_active !== undefined ? cat.is_active : true,
    });
    setShowCategoryModal(true);
  }

  async function handleSaveCategory(e) {
    e.preventDefault();
    const titleUz = (categoryForm.title_uz || categoryForm.title_en || "").trim();
    const titleEn = (categoryForm.title_en || titleUz).trim();
    if (!titleUz && !titleEn) {
      showNotification("Toifa nomini kiriting", "error");
      return;
    }
    const slugVal = (categoryForm.slug || "").trim() || generateSlug(titleEn || titleUz, "cat");

    const payload = {
      title_uz: titleUz,
      title_en: titleEn,
      slug: slugVal,
      icon: categoryForm.icon,
      group: categoryForm.group,
      description_uz: categoryForm.description_uz || titleUz,
      description_en: categoryForm.description_en || titleEn,
      order: parseInt(categoryForm.order, 10) || 1,
      is_active: categoryForm.is_active,
    };

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.slug, payload);
        showNotification("Toifa muvaffaqiyatli yangilandi!", "success");
      } else {
        await api.createCategory(payload);
        showNotification("Yangi toifa yaratildi!", "success");
      }
      setShowCategoryModal(false);
      loadAllStudioData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`, "error");
    }
  }

  // ================= TOPIC HANDLERS =================
  function openCreateTopic() {
    setEditingTopic(null);
    setTopicForm({
      category_slug: categories[0]?.slug || "",
      title_uz: "",
      title_en: "",
      slug: "",
      description_uz: "",
      description_en: "",
      content_uz: "",
      content_en: "",
      order: topics.length + 1,
    });
    setShowTopicModal(true);
  }

  function openEditTopic(topic) {
    setEditingTopic(topic);
    setTopicForm({
      category_slug: topic.category_slug || categories[0]?.slug || "",
      title_uz: topic.title_uz || "",
      title_en: topic.title_en || "",
      slug: topic.slug || "",
      description_uz: topic.description_uz || "",
      description_en: topic.description_en || "",
      content_uz: topic.content_uz || "",
      content_en: topic.content_en || "",
      order: topic.order !== undefined ? topic.order : 1,
    });
    setShowTopicModal(true);
  }

  async function handleSaveTopic(e) {
    e.preventDefault();
    const titleUz = (topicForm.title_uz || topicForm.title_en || "").trim();
    const titleEn = (topicForm.title_en || titleUz).trim();
    if (!titleUz && !titleEn) {
      showNotification("Mavzu nomini kiriting", "error");
      return;
    }
    const slugVal = (topicForm.slug || "").trim() || generateSlug(titleEn || titleUz, "topic");

    const payload = {
      category_slug: topicForm.category_slug,
      title_uz: titleUz,
      title_en: titleEn,
      slug: slugVal,
      description_uz: topicForm.description_uz,
      description_en: topicForm.description_en,
      content_uz: topicForm.content_uz || titleUz,
      content_en: topicForm.content_en || titleEn,
      order: parseInt(topicForm.order, 10) || 1,
    };

    try {
      if (editingTopic) {
        await api.updateTopic(editingTopic.slug, payload);
        showNotification("Mavzu muvaffaqiyatli yangilandi!", "success");
      } else {
        await api.createTopic(payload);
        showNotification("Yangi mavzu yaratildi!", "success");
      }
      setShowTopicModal(false);
      loadAllStudioData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`, "error");
    }
  }

  // ================= LESSON HANDLERS =================
  function openCreateLesson() {
    setEditingLesson(null);
    setLessonActiveSubTab("content");
    setLessonForm({
      topic_slug: topics[0]?.slug || "",
      title_uz: "",
      title_en: "",
      slug: "",
      summary_uz: "",
      summary_en: "",
      content_uz: "",
      content_en: "",
      order: lessons.length + 1,
      selectedProblemIds: [],
    });
    setShowLessonModal(true);
  }

  function openEditLesson(lesson) {
    setEditingLesson(lesson);
    setLessonActiveSubTab("content");
    const problemIds = (lesson.related_problems_detail || []).map((p) => p.id);
    setLessonForm({
      topic_slug: lesson.topic_slug || topics[0]?.slug || "",
      title_uz: lesson.title_uz || "",
      title_en: lesson.title_en || "",
      slug: lesson.slug || "",
      summary_uz: lesson.summary_uz || "",
      summary_en: lesson.summary_en || "",
      content_uz: lesson.content_uz || "",
      content_en: lesson.content_en || "",
      order: lesson.order !== undefined ? lesson.order : 1,
      selectedProblemIds: problemIds,
    });
    setShowLessonModal(true);
  }

  async function handleSaveLesson(e) {
    if (e) e.preventDefault();
    const titleUz = (lessonForm.title_uz || lessonForm.title_en || "").trim();
    const titleEn = (lessonForm.title_en || titleUz).trim();
    if (!titleUz && !titleEn) {
      showNotification("Dars nomini kiriting", "error");
      return;
    }
    const slugVal = (lessonForm.slug || "").trim() || generateSlug(titleEn || titleUz, "lesson");

    const payload = {
      topic_slug: lessonForm.topic_slug,
      title_uz: titleUz,
      title_en: titleEn,
      slug: slugVal,
      summary_uz: lessonForm.summary_uz,
      summary_en: lessonForm.summary_en,
      content_uz: lessonForm.content_uz || titleUz,
      content_en: lessonForm.content_en || titleEn,
      order: parseInt(lessonForm.order, 10) || 1,
      related_problem_ids: lessonForm.selectedProblemIds,
    };

    try {
      if (editingLesson) {
        await api.updateLesson(editingLesson.slug, payload);
        showNotification("Dars muvaffaqiyatli yangilandi!", "success");
      } else {
        await api.createLesson(payload);
        showNotification("Yangi dars xususiy (draft) holatda yaratildi!", "success");
      }
      setShowLessonModal(false);
      loadAllStudioData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`, "error");
    }
  }

  // Publication request for Lesson
  async function handleRequestLessonPublication(slug) {
    try {
      await api.requestLessonPublic(slug);
      showNotification("Darsni ommaviy qilish so'rovi adminga yuborildi!", "success");
      loadAllStudioData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`, "error");
    }
  }

  // Review publication for Lesson (Admin)
  async function handleSubmitLessonReview() {
    if (!reviewLessonTarget) return;
    try {
      setSubmittingReview(true);
      await api.reviewLesson(reviewLessonTarget.slug, reviewDecision, reviewFeedback);
      showNotification(
        reviewDecision === "approve"
          ? "Dars ommaviy qilindi va tasdiqlandi!"
          : "Dars so'rovi rad etildi va xususiy holatda qoldirildi.",
        reviewDecision === "approve" ? "success" : "info"
      );
      setReviewLessonTarget(null);
      setReviewFeedback("");
      loadAllStudioData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`, "error");
    } finally {
      setSubmittingReview(false);
    }
  }

  // Delete Action Confirmation
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { type, item } = deleteTarget;
      if (type === "category") {
        await api.deleteCategory(item.slug);
        showNotification(`"${item.title_uz || item.title_en}" toifasi o'chirildi.`, "success");
      } else if (type === "topic") {
        await api.deleteTopic(item.slug);
        showNotification(`"${item.title_uz || item.title_en}" mavzusi o'chirildi.`, "success");
      } else if (type === "lesson") {
        await api.deleteLesson(item.slug);
        showNotification(`"${item.title_uz || item.title_en}" darsi o'chirildi.`, "success");
      }
      setDeleteTarget(null);
      loadAllStudioData();
    } catch (err) {
      showNotification(`O'chirishda xatolik: ${err.message}`, "error");
    } finally {
      setIsDeleting(false);
    }
  }

  // Filtered Lessons
  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (l.title_uz || "").toLowerCase().includes(q) || (l.title_en || "").toLowerCase().includes(q);
        const matchTopic = (l.topic_title || "").toLowerCase().includes(q);
        const matchSlug = (l.slug || "").toLowerCase().includes(q);
        if (!matchTitle && !matchTopic && !matchSlug) return false;
      }
      if (categoryFilter !== "all" && l.category_slug !== categoryFilter) return false;
      if (topicFilter !== "all" && l.topic_slug !== topicFilter) return false;
      if (visibilityFilter !== "all" && l.visibility !== visibilityFilter) return false;
      return true;
    });
  }, [lessons, searchQuery, categoryFilter, topicFilter, visibilityFilter]);

  // Filtered Topics
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (t.title_uz || "").toLowerCase().includes(q) || (t.title_en || "").toLowerCase().includes(q);
        const matchSlug = (t.slug || "").toLowerCase().includes(q);
        if (!matchTitle && !matchSlug) return false;
      }
      if (categoryFilter !== "all" && t.category_slug !== categoryFilter) return false;
      return true;
    });
  }, [topics, searchQuery, categoryFilter]);

  // Auth gate
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Foydalanuvchi tekshirilmoqda...
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
            Learning Studio faqat mualliflar (Author), adminlar (Admin) va superadminlar uchun mo'ljallangan.
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
      {/* Top Navbar */}
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight">Learning Studio</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400">
                  AlgoSet Learn
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Darsliklar, mavzular va toifalarni boshqarish</p>
            </div>
          </div>
        </div>

        {/* Navbar Right Actions */}
        <div className="flex items-center gap-2">
          {activeMainTab === "lessons" && (
            <button
              onClick={openCreateLesson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Yangi dars
            </button>
          )}

          {activeMainTab === "topics" && (
            <button
              onClick={openCreateTopic}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Yangi mavzu
            </button>
          )}

          {activeMainTab === "categories" && isAdminOrSuper && (
            <button
              onClick={openCreateCategory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20"
            >
              <Plus className="w-4 h-4" />
              Yangi toifa
            </button>
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Dashboard Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase">Toifalar</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{stats.categories_count}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase">Mavzular</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{stats.topics_count}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Jami darslar</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{stats.lessons_count}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-semibold text-emerald-500 uppercase">Ommaviy darslar</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.published_lessons_count}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Xususiy darslar</div>
            <div className="text-xl font-black text-slate-600 dark:text-slate-300 mt-1">{stats.private_lessons_count}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-semibold text-amber-500 uppercase">Kutilmoqda</div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending_lessons_count}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-semibold text-slate-400 uppercase">Faol toifalar</div>
            <div className="text-xl font-black text-slate-700 dark:text-slate-200 mt-1">{stats.active_categories_count}</div>
          </div>
        </div>

        {/* Tab Selector & Search Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveMainTab("lessons")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeMainTab === "lessons"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Darslar ({lessons.length})
            </button>
            <button
              onClick={() => setActiveMainTab("topics")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeMainTab === "topics"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Mavzular ({topics.length})
            </button>
            <button
              onClick={() => setActiveMainTab("categories")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeMainTab === "categories"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Toifalar ({categories.length})
            </button>
            <button
              onClick={() => setActiveMainTab("hierarchy")}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                activeMainTab === "hierarchy"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Ierarxiya daraxti
            </button>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* ================= TAB 1: LESSONS LIST ================= */}
        {activeMainTab === "lessons" && (
          <div className="space-y-4">
            {/* Filter Bar for Lessons */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setTopicFilter("all");
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
              >
                <option value="all">Barcha toifalar</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title_uz || c.title_en}
                  </option>
                ))}
              </select>

              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
              >
                <option value="all">Barcha mavzular</option>
                {topics
                  .filter((t) => categoryFilter === "all" || t.category_slug === categoryFilter)
                  .map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.title_uz || t.title_en}
                    </option>
                  ))}
              </select>

              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
              >
                <option value="all">Barcha ko'rinishlar</option>
                <option value="public">Ommaviy</option>
                <option value="private">Xususiy</option>
                <option value="pending">Kutilmoqda</option>
                <option value="rejected">Rad etilgan</option>
              </select>
            </div>

            {/* Lessons Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
              {loadingData ? (
                <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  Darslar yuklanmoqda...
                </div>
              ) : filteredLessons.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Darslar topilmadi</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Tanlangan filtrlar bo'yicha hech qanday dars mavjud emas. Yangi dars yarating.
                  </p>
                  <button
                    onClick={openCreateLesson}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Dars yaratish
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-3.5 px-4">Dars nomi</th>
                        <th className="py-3.5 px-4">Mavzu / Toifa</th>
                        <th className="py-3.5 px-4">Ko'rinish</th>
                        <th className="py-3.5 px-4">Bog'langan masalalar</th>
                        <th className="py-3.5 px-4">Muallif</th>
                        <th className="py-3.5 px-4 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredLessons.map((lesson) => {
                        const isOwner = lesson.created_by === currentUser.id || lesson.author_username === currentUser.username;
                        const canManage = isOwner || isAdminOrSuper;

                        return (
                          <tr key={lesson.slug} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {activeLang === "uz" ? (lesson.title_uz || lesson.title_en) : (lesson.title_en || lesson.title_uz)}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{lesson.slug}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-700 dark:text-slate-300">
                                {lesson.topic_title || lesson.topic_slug}
                              </div>
                              <div className="text-[10px] text-slate-400">{lesson.category_title || lesson.category_slug}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  lesson.visibility === "public"
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                    : lesson.visibility === "pending"
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                    : lesson.visibility === "rejected"
                                    ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                }`}
                              >
                                {lesson.visibility === "public"
                                  ? "Ommaviy"
                                  : lesson.visibility === "pending"
                                  ? "Kutilmoqda"
                                  : lesson.visibility === "rejected"
                                  ? "Rad etilgan"
                                  : "Xususiy"}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {lesson.related_problems_detail?.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {lesson.related_problems_detail.map((p) => (
                                    <span
                                      key={p.slug}
                                      className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-[10px] font-semibold"
                                    >
                                      {p.title_uz || p.title_en}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-slate-500">{lesson.author_username || "Muallif"}</td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Preview link */}
                                <Link
                                  href={`/tutorials/${lesson.topic_slug}`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                                  title="Ko'rish"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>

                                {/* Request publication button for author */}
                                {(lesson.visibility === "private" || lesson.visibility === "rejected") && canManage && (
                                  <button
                                    onClick={() => handleRequestLessonPublication(lesson.slug)}
                                    className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-100 text-[10px]"
                                    title="Nashr so'rovini yuborish"
                                  >
                                    Nashr so'rovi
                                  </button>
                                )}

                                {/* Admin review button */}
                                {lesson.visibility === "pending" && isAdminOrSuper && (
                                  <button
                                    onClick={() => {
                                      setReviewLessonTarget(lesson);
                                      setReviewDecision("approve");
                                      setReviewFeedback("");
                                    }}
                                    className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-100 text-[10px]"
                                    title="So'rovni ko'rib chiqish"
                                  >
                                    Ko'rib chiqish
                                  </button>
                                )}

                                {/* Edit Lesson */}
                                {canManage && (
                                  <button
                                    onClick={() => openEditLesson(lesson)}
                                    className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold"
                                    title="Tahrirlash"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete Lesson */}
                                {canManage && (
                                  <button
                                    onClick={() => setDeleteTarget({ type: "lesson", item: lesson })}
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
        )}

        {/* ================= TAB 2: TOPICS LIST ================= */}
        {activeMainTab === "topics" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none"
              >
                <option value="all">Barcha toifalar</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title_uz || c.title_en}
                  </option>
                ))}
              </select>

              <button
                onClick={openCreateTopic}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                Mavzu qo'shish
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-3.5 px-4">Mavzu</th>
                      <th className="py-3.5 px-4">Biriktirilgan Toifa</th>
                      <th className="py-3.5 px-4">Tartib raqami</th>
                      <th className="py-3.5 px-4">Darslar soni</th>
                      <th className="py-3.5 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTopics.map((top) => {
                      const isOwner = top.created_by === currentUser.id || top.created_by_username === currentUser.username;
                      const canManage = isOwner || isAdminOrSuper;

                      return (
                        <tr key={top.slug} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {activeLang === "uz" ? (top.title_uz || top.title_en) : (top.title_en || top.title_uz)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{top.slug}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-semibold text-[10px]">
                              {top.category_title || top.category_slug}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 font-semibold">#{top.order}</td>

                          <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                            {top.lessons_count || 0} ta dars
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canManage && (
                                <button
                                  onClick={() => openEditTopic(top)}
                                  className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-bold"
                                  title="Tahrirlash"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {canManage && (
                                <button
                                  onClick={() => setDeleteTarget({ type: "topic", item: top })}
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
            </div>
          </div>
        )}

        {/* ================= TAB 3: CATEGORIES LIST ================= */}
        {activeMainTab === "categories" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Toifalar o'quv dasturining eng yuqori darajadagi yo'nalishlarini ifodalaydi.
              </p>
              {isAdminOrSuper && (
                <button
                  onClick={openCreateCategory}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                  Toifa yaratish
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.slug}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 flex items-center justify-center font-bold">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {activeLang === "uz" ? (cat.title_uz || cat.title_en) : (cat.title_en || cat.title_uz)}
                        </h4>
                        <div className="text-[10px] text-slate-400 font-mono">{cat.slug}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cat.is_active
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      {cat.is_active ? "Faol" : "Nofaol"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {activeLang === "uz" ? cat.description_uz : cat.description_en}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 font-medium">
                    <span>Tartib: #{cat.order}</span>
                    <span>{cat.topic_count || cat.topics?.length || 0} ta mavzu</span>
                  </div>

                  {isAdminOrSuper && (
                    <div className="flex items-center justify-end gap-1 pt-1">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 hover:bg-purple-100 font-bold"
                        title="Tahrirlash"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: "category", item: cat })}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: HIERARCHY TREE VIEW ================= */}
        {activeMainTab === "hierarchy" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                O'quv dasturi ierarxiyasi (Tree View)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toifalar $\rightarrow$ Mavzular $\rightarrow$ Darslar $\rightarrow$ Masalalar
              </p>
            </div>

            <div className="space-y-4">
              {categories.map((cat) => {
                const catTopics = topics.filter((t) => t.category_slug === cat.slug);

                return (
                  <div
                    key={cat.slug}
                    className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50"
                  >
                    {/* Category Header */}
                    <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 flex items-center justify-between border-b border-purple-100 dark:border-purple-900/40">
                      <div className="flex items-center gap-2.5">
                        <Folder className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-bold text-xs text-purple-950 dark:text-purple-200">
                          {cat.title_uz || cat.title_en}
                        </span>
                        <span className="text-[10px] text-purple-400 font-mono">({cat.slug})</span>
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        {catTopics.length} ta mavzu
                      </span>
                    </div>

                    {/* Topics inside Category */}
                    <div className="p-3 space-y-3">
                      {catTopics.length === 0 ? (
                        <div className="text-[11px] text-slate-400 pl-4 py-1 italic">
                          Ushbu toifaga hali mavzu kiritilmagan.
                        </div>
                      ) : (
                        catTopics.map((top) => {
                          const topLessons = lessons.filter((l) => l.topic_slug === top.slug);

                          return (
                            <div
                              key={top.slug}
                              className="ml-4 pl-3 border-l-2 border-blue-300 dark:border-blue-900 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                                    {top.title_uz || top.title_en}
                                  </span>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {topLessons.length} ta dars
                                </span>
                              </div>

                              {/* Lessons inside Topic */}
                              <div className="ml-4 pl-3 border-l border-slate-200 dark:border-slate-800 space-y-1.5">
                                {topLessons.length === 0 ? (
                                  <div className="text-[10px] text-slate-400 italic">Darslar yo'q</div>
                                ) : (
                                  topLessons.map((les) => (
                                    <div
                                      key={les.slug}
                                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                          {les.title_uz || les.title_en}
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                            les.visibility === "public"
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-slate-200 text-slate-600"
                                          }`}
                                        >
                                          {les.visibility === "public" ? "Ommaviy" : "Xususiy"}
                                        </span>
                                      </div>

                                      {/* Related problems count */}
                                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Code2 className="w-3 h-3 text-blue-500" />
                                        <span>{les.related_problems_detail?.length || 0} ta masala</span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL: CATEGORY CREATE / EDIT ================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-purple-600" />
                {editingCategory ? "Toifani tahrirlash" : "Yangi toifa qo'shish"}
              </h3>
              <button onClick={() => setShowCategoryModal(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Toifa nomi (Uz) *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.title_uz}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        title_uz: e.target.value,
                        slug: categoryForm.slug || generateSlug(e.target.value, "cat"),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Toifa nomi (En)
                  </label>
                  <input
                    type="text"
                    value={categoryForm.title_en}
                    onChange={(e) => setCategoryForm({ ...categoryForm, title_en: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: generateSlug(e.target.value, "cat") })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tartib</label>
                  <input
                    type="number"
                    min="1"
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Belgi (Icon)</label>
                  <select
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tavsif (Uz)</label>
                <textarea
                  rows={2}
                  value={categoryForm.description_uz}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description_uz: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cat_active"
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <label htmlFor="cat_active" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Toifa faol (foydalanuvchilarga ko'rinadi)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TOPIC CREATE / EDIT ================= */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                {editingTopic ? "Mavzuni tahrirlash" : "Yangi mavzu qo'shish"}
              </h3>
              <button onClick={() => setShowTopicModal(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Qaysi toifaga tegishli? *
                </label>
                <select
                  required
                  value={topicForm.category_slug}
                  onChange={(e) => setTopicForm({ ...topicForm, category_slug: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.title_uz || c.title_en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mavzu nomi (Uz) *
                  </label>
                  <input
                    type="text"
                    required
                    value={topicForm.title_uz}
                    onChange={(e) =>
                      setTopicForm({
                        ...topicForm,
                        title_uz: e.target.value,
                        slug: topicForm.slug || generateSlug(e.target.value, "topic"),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mavzu nomi (En)
                  </label>
                  <input
                    type="text"
                    value={topicForm.title_en}
                    onChange={(e) => setTopicForm({ ...topicForm, title_en: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={topicForm.slug}
                    onChange={(e) => setTopicForm({ ...topicForm, slug: generateSlug(e.target.value, "topic") })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tartib</label>
                  <input
                    type="number"
                    min="1"
                    value={topicForm.order}
                    onChange={(e) => setTopicForm({ ...topicForm, order: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mavzu tavsifi / Maqsadi
                </label>
                <textarea
                  rows={3}
                  value={topicForm.content_uz}
                  onChange={(e) => setTopicForm({ ...topicForm, content_uz: e.target.value })}
                  placeholder="Mavzu nimalarni o'rgatadi..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL / FULL EDITOR: LESSON ================= */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingLesson ? "Darslikni tahrirlash" : "Yangi dars yaratish"}
                  </h3>
                  <div className="text-[10px] text-slate-400">Boyitilgan dars matni va amaliy masalalar</div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setLessonActiveSubTab("content")}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    lessonActiveSubTab === "content"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm font-bold"
                      : "text-slate-500"
                  }`}
                >
                  Matn va Tavsif
                </button>
                <button
                  type="button"
                  onClick={() => setLessonActiveSubTab("problems")}
                  className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                    lessonActiveSubTab === "problems"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm font-bold"
                      : "text-slate-500"
                  }`}
                >
                  <span>Masalalar</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    {lessonForm.selectedProblemIds.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setLessonActiveSubTab("preview")}
                  className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                    lessonActiveSubTab === "preview"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm font-bold"
                      : "text-slate-500"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  Ko'rish
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {lessonActiveSubTab === "content" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mavzuni tanlang *
                      </label>
                      <select
                        required
                        value={lessonForm.topic_slug}
                        onChange={(e) => setLessonForm({ ...lessonForm, topic_slug: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                      >
                        {topics.map((t) => (
                          <option key={t.slug} value={t.slug}>
                            {t.title_uz || t.title_en} ({t.category_title || t.category_slug})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Dars URL identifikatori (Slug) *
                      </label>
                      <input
                        type="text"
                        value={lessonForm.slug}
                        onChange={(e) => setLessonForm({ ...lessonForm, slug: generateSlug(e.target.value, "lesson") })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Dars nomi (Uz) *
                      </label>
                      <input
                        type="text"
                        required
                        value={lessonForm.title_uz}
                        onChange={(e) =>
                          setLessonForm({
                            ...lessonForm,
                            title_uz: e.target.value,
                            slug: lessonForm.slug || generateSlug(e.target.value, "lesson"),
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Dars nomi (En)
                      </label>
                      <input
                        type="text"
                        value={lessonForm.title_en}
                        onChange={(e) => setLessonForm({ ...lessonForm, title_en: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Dars haqida qisqacha ma'lumot (Summary)
                    </label>
                    <textarea
                      rows={2}
                      value={lessonForm.summary_uz}
                      onChange={(e) => setLessonForm({ ...lessonForm, summary_uz: e.target.value })}
                      placeholder="Ushbu dars nimalarni o'rgatishi haqida qisqacha..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Dars matni va kod namunalari (HTML / Markdown) *
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Xavfsiz HTML teglar: &lt;p&gt;, &lt;code&gt;, &lt;pre&gt;, &lt;b&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;table&gt;
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      required
                      value={lessonForm.content_uz}
                      onChange={(e) => setLessonForm({ ...lessonForm, content_uz: e.target.value })}
                      placeholder="<h2>1. Kirish</h2><p>Dars tushuntirishi...</p><pre><code>print('Salom')</code></pre>"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-blue-500 leading-relaxed"
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tartib</label>
                    <input
                      type="number"
                      min="1"
                      value={lessonForm.order}
                      onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>
                </>
              )}

              {/* Sub-tab: Related Problems */}
              {lessonActiveSubTab === "problems" && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    Ushbu darsni o'zlashtirish uchun amaliy masalalarni biriktiring.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {availableProblems.map((p) => {
                      const isChecked = lessonForm.selectedProblemIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`p-3 rounded-2xl border text-xs flex items-center justify-between cursor-pointer transition ${
                            isChecked
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{p.title_uz || p.title_en}</div>
                            <div className="text-[10px] text-slate-400 font-semibold">{p.difficulty}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLessonForm({
                                  ...lessonForm,
                                  selectedProblemIds: [...lessonForm.selectedProblemIds, p.id],
                                });
                              } else {
                                setLessonForm({
                                  ...lessonForm,
                                  selectedProblemIds: lessonForm.selectedProblemIds.filter((id) => id !== p.id),
                                });
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-tab: Preview */}
              {lessonActiveSubTab === "preview" && (
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {lessonForm.title_uz || lessonForm.title_en || "Dars nomi"}
                  </h2>
                  {lessonForm.summary_uz && (
                    <p className="text-xs text-slate-500 italic border-l-2 border-emerald-500 pl-3">
                      {lessonForm.summary_uz}
                    </p>
                  )}
                  <div
                    className="prose dark:prose-invert text-xs max-w-none space-y-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: lessonForm.content_uz || "<p>Dars matni yo'q</p>" }}
                  />

                  {lessonForm.selectedProblemIds.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <h4 className="font-bold text-xs text-slate-400 uppercase mb-2">Amaliy masalalar</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {lessonForm.selectedProblemIds.map((id) => {
                          const prob = availableProblems.find((p) => p.id === id);
                          if (!prob) return null;
                          return (
                            <span
                              key={id}
                              className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 font-semibold text-xs flex items-center gap-1"
                            >
                              <Code2 className="w-3 h-3" />
                              {prob.title_uz || prob.title_en}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowLessonModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSaveLesson}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {editingLesson ? "O'zgarishlarni saqlash" : "Darsni saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADMIN REVIEW LESSON ================= */}
      {reviewLessonTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Dars nashr so'rovini ko'rib chiqish
              </h3>
              <button onClick={() => setReviewLessonTarget(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1">Dars:</div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {reviewLessonTarget.title_uz || reviewLessonTarget.title_en}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Mavzu: {reviewLessonTarget.topic_title} • Muallif: {reviewLessonTarget.author_username}
              </div>
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
                Muallifga xabar / Fikr
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
                onClick={() => setReviewLessonTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleSubmitLessonReview}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {submittingReview ? "Bajarilmoqda..." : "Qarorni saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {deleteTarget.type === "category"
                  ? "Toifani o'chirish"
                  : deleteTarget.type === "topic"
                  ? "Mavzuni o'chirish"
                  : "Darslikni o'chirish"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Haqiqatan ham{" "}
                <strong className="text-slate-900 dark:text-white">
                  {deleteTarget.item.title_uz || deleteTarget.item.title_en}
                </strong>{" "}
                elementini o'chirib tashlamoqchimisiz?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isDeleting ? "O'chirilmoqda..." : "Ha, o'chirilsin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

