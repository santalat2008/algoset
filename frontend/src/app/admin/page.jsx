"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Users, 
  Code2, 
  Trophy, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  AlertCircle, 
  Search, 
  ArrowRight,
  Zap, 
  Layers, 
  X,
  Edit,
  Trash2,
  FolderPlus,
  ExternalLink,
  Save,
  Sparkles,
  Sliders
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("problems");

  const [problems, setProblems] = useState([]);
  const [contests, setContests] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [pendingProblems, setPendingProblems] = useState([]);
  const [pendingContests, setPendingContests] = useState([]);

  const [showCreateProblemModal, setShowCreateProblemModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);

  const [showCreateContestModal, setShowCreateContestModal] = useState(false);
  const [editingContest, setEditingContest] = useState(null);

  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [showCreateTopicModal, setShowCreateTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);

  const [userSearch, setUserSearch] = useState("");
  const [problemSearch, setProblemSearch] = useState("");
  const [contestSearch, setContestSearch] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [newProblem, setNewProblem] = useState({
    title_uz: "",
    title_en: "",
    slug: "",
    difficulty: "Easy",
    statement_uz: "",
    starter_code: "class Solution:\n    def solve(self):\n        pass\n",
    sample_input: "",
    sample_output: "",
    hidden_input: "",
    hidden_output: "",
    tags_str: "Arrays",
    time_limit_ms: 2000,
    memory_limit_mb: 256,
  });

  const [newContest, setNewContest] = useState({
    title_uz: "",
    title_en: "",
    slug: "",
    division: "Div. 2",
    is_rated: true,
    start_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    duration_minutes: 120,
    problem_ids: [],
    announcement_uz: "",
  });

  const [newCategory, setNewCategory] = useState({
    title_uz: "",
    title_en: "",
    slug: "",
    description_uz: "",
    description_en: "",
    order: 1,
    icon: "code",
  });

  const [newTopic, setNewTopic] = useState({
    category_slug: "python-basics",
    title_uz: "",
    title_en: "",
    slug: "",
    content_uz: "",
    order: 1,
  });

  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      try {
        const me = await api.getMe();
        setCurrentUser(me);

        if (me && ["author", "admin", "superadmin"].includes(me.role)) {
          await loadAllData(me);
        }
      } catch (err) {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  async function loadAllData(userObj = currentUser) {
    try {
      const [probsData, contestsData, catsData, topicsData] = await Promise.all([
        api.getProblems().catch(() => []),
        api.getContests("all").catch(() => []),
        api.getCategories().catch(() => []),
        api.getTopics().catch(() => []),
      ]);
      setProblems(Array.isArray(probsData) ? probsData : (probsData?.results || []));
      setContests(Array.isArray(contestsData) ? contestsData : (contestsData?.results || []));
      setCategories(catsData || []);
      setAllTopics(topicsData || []);

      if (userObj && ["admin", "superadmin"].includes(userObj.role)) {
        const [pendingP, pendingC, usersList] = await Promise.all([
          api.getPendingProblems().catch(() => []),
          api.getPendingContests().catch(() => []),
          api.getUsers().catch(() => []),
        ]);
        setPendingProblems(pendingP || []);
        setPendingContests(pendingC || []);
        setUsers(usersList || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function showNotification(msg) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(""), 4000);
  }

  function generateSlug(text, fallbackPrefix = "item") {
    if (!text || !text.trim()) {
      return `${fallbackPrefix}-${Date.now().toString(36)}`;
    }
    const clean = text
      .toLowerCase()
      .replace(/['`’"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return clean || `${fallbackPrefix}-${Date.now().toString(36)}`;
  }

  async function handleCreateProblem(e) {
    e.preventDefault();
    try {
      const titleUz = (newProblem.title_uz || newProblem.title_en || "").trim();
      const titleEn = (newProblem.title_en || titleUz).trim();
      const slugVal = (newProblem.slug || "").trim() || generateSlug(titleEn || titleUz, "problem");
      const tags = (newProblem.tags_str || "").split(",").map((t) => t.trim()).filter(Boolean);

      const payload = {
        title_uz: titleUz,
        title_en: titleEn,
        slug: slugVal,
        difficulty: newProblem.difficulty,
        statement_uz: newProblem.statement_uz,
        statement_en: newProblem.statement_uz,
        starter_code: newProblem.starter_code,
        tags: tags.length ? tags : ["Arrays"],
        sample_test_cases: newProblem.sample_input
          ? [{ input: newProblem.sample_input, output: newProblem.sample_output, explanation: "Misol" }]
          : [],
        hidden_test_cases: newProblem.hidden_input
          ? [{ input: newProblem.hidden_input, output: newProblem.hidden_output }]
          : [],
      };
      await api.createProblem(payload);
      showNotification("Yangi masala muvaffaqiyatli saqlandi!");
      setShowCreateProblemModal(false);
      setNewProblem({
        title_uz: "",
        title_en: "",
        slug: "",
        difficulty: "Easy",
        statement_uz: "",
        starter_code: "class Solution:\n    def solve(self):\n        pass\n",
        sample_input: "",
        sample_output: "",
        hidden_input: "",
        hidden_output: "",
        tags_str: "Arrays",
        time_limit_ms: 2000,
        memory_limit_mb: 256,
      });
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  function openEditProblem(prob) {
    const tagsStr = Array.isArray(prob.tags)
      ? prob.tags.map((t) => (typeof t === "string" ? t : t.name)).join(", ")
      : "";
    const sampleInput = prob.sample_test_cases?.[0]?.input || "";
    const sampleOutput = prob.sample_test_cases?.[0]?.output || "";
    const hiddenInput = prob.hidden_test_cases?.[0]?.input || "";
    const hiddenOutput = prob.hidden_test_cases?.[0]?.output || "";

    setEditingProblem({
      ...prob,
      tags_str: tagsStr,
      sample_input: sampleInput,
      sample_output: sampleOutput,
      hidden_input: hiddenInput,
      hidden_output: hiddenOutput,
    });
  }

  async function handleUpdateProblem(e) {
    e.preventDefault();
    if (!editingProblem) return;
    try {
      const tags = (editingProblem.tags_str || "").split(",").map((t) => t.trim()).filter(Boolean);
      const payload = {
        title_uz: editingProblem.title_uz,
        title_en: editingProblem.title_en,
        difficulty: editingProblem.difficulty,
        statement_uz: editingProblem.statement_uz,
        statement_en: editingProblem.statement_en || editingProblem.statement_uz,
        starter_code: editingProblem.starter_code,
        time_limit_ms: Number(editingProblem.time_limit_ms) || 2000,
        memory_limit_mb: Number(editingProblem.memory_limit_mb) || 256,
        tags: tags,
      };
      if (editingProblem.sample_input) {
        payload.sample_test_cases = [
          { input: editingProblem.sample_input, output: editingProblem.sample_output, explanation: "Misol" }
        ];
      }
      if (editingProblem.hidden_input) {
        payload.hidden_test_cases = [
          { input: editingProblem.hidden_input, output: editingProblem.hidden_output }
        ];
      }
      await api.updateProblem(editingProblem.slug, payload);
      showNotification("Masala ma'lumotlari muvaffaqiyatli yangilandi!");
      setEditingProblem(null);
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleDeleteProblem(slug) {
    if (!confirm(`"${slug}" masalasini butunlay o'chirmoqchimisiz?`)) return;
    try {
      await api.deleteProblem(slug);
      showNotification("Masala muvaffaqiyatli o'chirildi!");
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleRequestProblemPublic(slug) {
    try {
      await api.requestProblemPublic(slug);
      showNotification("Ommaviy qilish so'rovi yuborildi!");
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleReviewProblem(slug, decision) {
    try {
      await api.reviewProblem(slug, decision);
      showNotification(`Masala ${decision === "approve" ? "tasdiqlandi" : "rad etildi"}!`);
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleCreateContest(e) {
    e.preventDefault();
    try {
      const titleUz = (newContest.title_uz || newContest.title_en || "").trim();
      const titleEn = (newContest.title_en || titleUz).trim();
      const slugVal = (newContest.slug || "").trim() || generateSlug(titleEn || titleUz, "contest");

      const payload = {
        title_uz: titleUz,
        title_en: titleEn,
        slug: slugVal,
        division: newContest.division,
        is_rated: Boolean(newContest.is_rated),
        start_time: new Date(newContest.start_time).toISOString(),
        duration_minutes: Number(newContest.duration_minutes),
        problem_ids: newContest.problem_ids,
        announcement_uz: newContest.announcement_uz || "Musobaqa qoidalari.",
        announcement_en: newContest.announcement_uz || "Musobaqa qoidalari.",
      };
      await api.createContest(payload);
      showNotification("Yangi musobaqa yaratildi!");
      setShowCreateContestModal(false);
      setNewContest({
        title_uz: "",
        title_en: "",
        slug: "",
        division: "Div. 2",
        is_rated: true,
        start_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        duration_minutes: 120,
        problem_ids: [],
        announcement_uz: "",
      });
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  function openEditContest(c) {
    router.push(`/admin/contests/studio?edit=${c.slug}`);
  }

  async function handleUpdateContest(e) {
    e.preventDefault();
    if (!editingContest) return;
    try {
      const payload = {
        title_uz: editingContest.title_uz,
        title_en: editingContest.title_en,
        division: editingContest.division,
        is_rated: Boolean(editingContest.is_rated),
        start_time: new Date(editingContest.start_time).toISOString(),
        duration_minutes: Number(editingContest.duration_minutes),
        announcement_uz: editingContest.announcement_uz,
        announcement_en: editingContest.announcement_en || editingContest.announcement_uz,
        problem_ids: editingContest.problem_ids,
      };
      await api.updateContest(editingContest.slug, payload);
      showNotification("Musobaqa muvaffaqiyatli yangilandi!");
      setEditingContest(null);
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleDeleteContest(slug) {
    if (!confirm(`"${slug}" musobaqasini butunlay o'chirmoqchimisiz?`)) return;
    try {
      await api.deleteContest(slug);
      showNotification("Musobaqa muvaffaqiyatli o'chirildi!");
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleRequestContestPublic(slug) {
    try {
      await api.requestContestPublic(slug);
      showNotification("Musobaqani ommaviy qilish so'rovi yuborildi!");
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleReviewContest(slug, decision) {
    try {
      await api.reviewContest(slug, decision);
      showNotification(`Musobaqa ${decision === "approve" ? "tasdiqlandi" : "rad etildi"}!`);
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleFinalizeRatings(slug) {
    if (!confirm("Ushbu musobaqa bo'yicha Elo reytinglarini hisoblab yakunlamoqchimisiz?")) return;
    try {
      await api.finalizeContestRatings(slug);
      showNotification("Musobaqa ishtirokchilarining reytinglari muvaffaqiyatli yangilandi!");
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    try {
      const titleUz = (newCategory.title_uz || newCategory.title_en || "").trim();
      const titleEn = (newCategory.title_en || titleUz).trim();
      const slugVal = (newCategory.slug || "").trim() || generateSlug(titleEn || titleUz, "category");

      const payload = {
        title_uz: titleUz,
        title_en: titleEn,
        slug: slugVal,
        description_uz: newCategory.description_uz || "Toifa tavsifi.",
        description_en: newCategory.description_en || newCategory.description_uz || "Toifa tavsifi.",
        order: Number(newCategory.order) || 1,
        icon: newCategory.icon || "code",
      };
      await api.createCategory(payload);
      showNotification("Yangi toifa (kategoriya) yaratildi!");
      setShowCreateCategoryModal(false);
      setNewCategory({ title_uz: "", title_en: "", slug: "", description_uz: "", description_en: "", order: 1, icon: "code" });
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  function openEditCategory(cat) {
    setEditingCategory({ ...cat });
  }

  async function handleUpdateCategory(e) {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const payload = {
        title_uz: editingCategory.title_uz,
        title_en: editingCategory.title_en,
        description_uz: editingCategory.description_uz,
        description_en: editingCategory.description_en || editingCategory.description_uz,
        order: Number(editingCategory.order) || 1,
        icon: editingCategory.icon || "code",
      };
      await api.updateCategory(editingCategory.slug, payload);
      showNotification("Toifa muvaffaqiyatli yangilandi!");
      setEditingCategory(null);
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleDeleteCategory(slug) {
    if (!confirm(`"${slug}" toifasini va uning barcha mavzularini o'chirmoqchimisiz?`)) return;
    try {
      await api.deleteCategory(slug);
      showNotification("Toifa muvaffaqiyatli o'chirildi!");
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleCreateTopic(e) {
    e.preventDefault();
    try {
      const cat = categories.find((c) => c.slug === newTopic.category_slug) || categories[0];
      const titleUz = (newTopic.title_uz || newTopic.title_en || "").trim();
      const titleEn = (newTopic.title_en || titleUz).trim();
      const slugVal = (newTopic.slug || "").trim() || generateSlug(titleEn || titleUz, "topic");

      const payload = {
        category: cat ? cat.id : 1,
        category_slug: newTopic.category_slug,
        slug: slugVal,
        title_uz: titleUz,
        title_en: titleEn,
        content_uz: newTopic.content_uz || "Dars mazmuni.",
        content_en: newTopic.content_uz || "Dars mazmuni.",
        order: Number(newTopic.order) || 1,
      };
      await api.createTopic(payload);
      showNotification("Yangi darslik mavzusi yaratildi!");
      setShowCreateTopicModal(false);
      setNewTopic({
        category_slug: categories[0]?.slug || "python-basics",
        title_uz: "",
        title_en: "",
        slug: "",
        content_uz: "",
        order: 1,
      });
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  function openEditTopic(topic) {
    setEditingTopic({
      ...topic,
      category_slug: topic.category_slug || topic.category?.slug || categories[0]?.slug,
    });
  }

  async function handleUpdateTopic(e) {
    e.preventDefault();
    if (!editingTopic) return;
    try {
      const cat = categories.find((c) => c.slug === editingTopic.category_slug) || categories[0];
      const payload = {
        category: cat ? cat.id : editingTopic.category,
        category_slug: editingTopic.category_slug,
        title_uz: editingTopic.title_uz,
        title_en: editingTopic.title_en || editingTopic.title_uz,
        content_uz: editingTopic.content_uz,
        content_en: editingTopic.content_en || editingTopic.content_uz,
        order: Number(editingTopic.order) || 1,
      };
      await api.updateTopic(editingTopic.slug, payload);
      showNotification("Darslik mavzusi muvaffaqiyatli yangilandi!");
      setEditingTopic(null);
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleDeleteTopic(slug) {
    if (!confirm(`"${slug}" mavzusini o'chirmoqchimisiz?`)) return;
    try {
      await api.deleteTopic(slug);
      showNotification("Darslik mavzusi o'chirildi!");
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleSetRole(userId, newRole) {
    try {
      await api.setUserRole(userId, newRole);
      showNotification("Foydalanuvchi roli yangilandi!");
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  async function handleVerifyUserEmail(userId) {
    try {
      await api.verifyUserEmailAdmin(userId);
      showNotification("Foydalanuvchi emaili tasdiqlandi!");
      loadAllData();
    } catch (err) {
      showNotification(`Xatolik: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Boshqaruv paneli yuklanmoqda...</p>
      </div>
    );
  }

  if (!currentUser || !["author", "admin", "superadmin"].includes(currentUser.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kirish ruxsati cheklangan</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Ushbu boshqaruv paneli faqat <strong>Muallif (Author)</strong>, <strong>Admin</strong> yoki <strong>Superadmin</strong> rollariga ega foydalanuvchilar uchun ochiq.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/problems"
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs text-center"
          >
            Masalalar sahifasiga qaytish
          </Link>
        </div>
      </div>
    );
  }

  const isSuperAdmin = currentUser.role === "superadmin";
  const isAdmin = currentUser.role === "admin";
  const isAuthor = currentUser.role === "author";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{actionMessage}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              AlgoSet Boshqaruv Paneli
            </h1>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
              isSuperAdmin
                ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                : isAdmin
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
            }`}>
              {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Muallif"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isSuperAdmin
              ? "Platformaning to'liq boshqaruvi: barcha detallarni tahrirlash, o'chirish, rollar va darsliklar."
              : isAdmin
              ? "Masalalar, musobaqalar, toifalar, darsliklar va so'rovlarni tahrirlash hamda tasdiqlash."
              : "Shaxsiy masalalar va musobaqalar yaratish hamda ularni tahrirlash."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/problems/new"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            title="Masalalar yaratish va tekshirish studiyasi"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Problem Studio
          </Link>
          <Link
            href="/admin/contests/studio"
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
            title="Musobaqalar boshqaruvi va Contest Studio"
          >
            <Trophy className="w-3.5 h-3.5" />
            Contest Studio
          </Link>
          <Link
            href="/admin/learning/studio"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
            title="Darsliklar va toifalar studiyasi"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Learning Studio
          </Link>
          <Link
            href="/profile"
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
          >
            Profil
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("problems")}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "problems"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Code2 className="w-4 h-4" />
          Masalalar ({problems.length})
        </button>

        <button
          onClick={() => setActiveTab("contests")}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "contests"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Musobaqalar ({contests.length})
        </button>

        {(isAdmin || isSuperAdmin) && (
          <>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "requests"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <AlertCircle className="w-4 h-4 text-amber-500" />
              So'rovlar ({pendingProblems.length + pendingContests.length})
            </button>

            <button
              onClick={() => setActiveTab("topics")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "topics"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Darsliklar va Toifalar ({categories.length})
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "users"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <Users className="w-4 h-4" />
              Foydalanuvchilar va Rollar ({users.length})
            </button>
          </>
        )}
      </div>

      {activeTab === "problems" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Masalalarni qidirish..."
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/problems/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                <Sparkles className="w-4 h-4" />
                Problem Authoring Studio
              </Link>
              <button
                onClick={() => setShowCreateProblemModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                Tezkor qo'shish
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3.5 px-4">Masala nomi</th>
                    <th className="py-3.5 px-4">Qiyinlik</th>
                    <th className="py-3.5 px-4">Ko'rinish (Visibility)</th>
                    <th className="py-3.5 px-4">Muallif</th>
                    <th className="py-3.5 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {problems
                    .filter((p) => !problemSearch || (p.title_uz || p.title_en || "").toLowerCase().includes(problemSearch.toLowerCase()))
                    .map((prob) => {
                      const isOwner = prob.author === currentUser.id || prob.author_username === currentUser.username;
                      const canManage = isOwner || isAdmin || isSuperAdmin;
                      return (
                        <tr key={prob.slug} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3.5 px-4">
                            <Link href={`/problems/${prob.slug}`} className="font-bold text-slate-900 dark:text-white hover:text-blue-600 flex items-center gap-1.5">
                              {prob.title_uz || prob.title_en}
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                            <div className="text-[10px] text-slate-400 font-mono">{prob.slug}</div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold">{prob.difficulty}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              prob.visibility === "public"
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                : prob.visibility === "pending"
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}>
                              {prob.visibility === "public" ? "Ommaviy" : prob.visibility === "pending" ? "Kutilmoqda" : "Xususiy"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{prob.author_username || "Muallif"}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {prob.visibility === "private" && canManage && (
                                <button
                                  onClick={() => handleRequestProblemPublic(prob.slug)}
                                  className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 text-[11px]"
                                  title="Ommaviy qilishni so'rash"
                                >
                                  So'rov
                                </button>
                              )}

                              {canManage && (
                                <Link
                                  href={`/admin/problems/${prob.slug}`}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 flex items-center gap-1 text-[11px]"
                                  title="Problem Authoring Studio'da to'liq sozlash"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                  Studio
                                </Link>
                              )}

                              {canManage && (
                                <button
                                  onClick={() => openEditProblem(prob)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                  title="Tezkor tahrirlash"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {canManage && (
                                <button
                                  onClick={() => handleDeleteProblem(prob.slug)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
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

      {activeTab === "contests" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Musobaqalarni qidirish..."
                value={contestSearch}
                onChange={(e) => setContestSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/contests/studio"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20"
                title="Contest Studio'da to'liq boshqarish"
              >
                <Trophy className="w-4 h-4" />
                Contest Studio
              </Link>
              <button
                onClick={() => setShowCreateContestModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                Tezkor qo'shish
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3.5 px-4">Musobaqa nomi</th>
                    <th className="py-3.5 px-4">Holat</th>
                    <th className="py-3.5 px-4">Ko'rinish</th>
                    <th className="py-3.5 px-4">Boshlanish vaqti</th>
                    <th className="py-3.5 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {contests
                    .filter((c) => !contestSearch || (c.title_uz || c.title_en || "").toLowerCase().includes(contestSearch.toLowerCase()))
                    .map((c) => {
                      const isOwner = c.author === currentUser.id || c.author_username === currentUser.username;
                      const canManage = isOwner || isAdmin || isSuperAdmin;
                      return (
                        <tr key={c.slug} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3.5 px-4">
                            <Link href={`/contests/${c.slug}`} className="font-bold text-slate-900 dark:text-white hover:text-blue-600 flex items-center gap-1.5">
                              {c.title_uz || c.title_en}
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                            <div className="text-[10px] text-slate-400 font-mono">{c.division} • {c.duration_minutes} daqiqa</div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold uppercase text-[10px]">
                            {c.status === "upcoming" ? "Kelgusi" : c.status === "ongoing" ? "Davom etmoqda" : "Yakunlangan"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.visibility === "public"
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
                                : c.visibility === "pending"
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}>
                              {c.visibility === "public" ? "Ommaviy" : c.visibility === "pending" ? "Kutilmoqda" : "Xususiy"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500" suppressHydrationWarning>
                            {new Date(c.start_time).toLocaleString("uz-UZ")}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {c.status === "past" && !c.ratings_calculated && (isAdmin || isSuperAdmin) && (
                                <button
                                  onClick={() => handleFinalizeRatings(c.slug)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 text-[11px]"
                                  title="Reytinglarni hisoblash"
                                >
                                  Reyting
                                </button>
                              )}

                              {c.visibility === "private" && canManage && (
                                <button
                                  onClick={() => handleRequestContestPublic(c.slug)}
                                  className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 text-[11px]"
                                  title="Ommaviy qilishni so'rash"
                                >
                                  So'rov
                                </button>
                              )}

                              {canManage && (
                                <Link
                                  href={`/admin/contests/studio?edit=${c.slug}`}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-100 flex items-center gap-1 text-[11px]"
                                  title="Contest Studio'da to'liq sozlash va tahrirlash"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                  Studio
                                </Link>
                              )}

                              {canManage && (
                                <Link
                                  href={`/admin/contests/studio?edit=${c.slug}`}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                  title="Contest Studio formatida tahrirlash"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Link>
                              )}

                              {canManage && (
                                <button
                                  onClick={() => handleDeleteContest(c.slug)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
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

      {activeTab === "requests" && (isAdmin || isSuperAdmin) && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-500" />
              Tasdiqlash kutilayotgan masalalar ({pendingProblems.length})
            </h3>
            {pendingProblems.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">Hozircha kutilayotgan masalalar yo'q.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingProblems.map((prob) => (
                  <div key={prob.slug} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{prob.title_uz || prob.title_en}</p>
                      <p className="text-[11px] text-slate-400">Muallif: {prob.author_username || "author"} • {prob.difficulty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewProblem(prob.slug, "approve")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                      >
                        Tasdiqlash (Ommaviy)
                      </button>
                      <button
                        onClick={() => handleReviewProblem(prob.slug, "deny")}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 font-semibold hover:bg-rose-100"
                      >
                        Rad etish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Tasdiqlash kutilayotgan musobaqalar ({pendingContests.length})
            </h3>
            {pendingContests.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">Hozircha kutilayotgan musobaqalar yo'q.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingContests.map((c) => (
                  <div key={c.slug} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{c.title_uz || c.title_en}</p>
                      <p className="text-[11px] text-slate-400">Muallif: {c.author_username} • {c.division}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewContest(c.slug, "approve")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                      >
                        Tasdiqlash
                      </button>
                      <button
                        onClick={() => handleReviewContest(c.slug, "deny")}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 font-semibold hover:bg-rose-100"
                      >
                        Rad etish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "topics" && (isAdmin || isSuperAdmin) && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Toifalar va Darsliklar Boshqaruvi</h2>
              <p className="text-xs text-slate-500">Barcha toifalar va darsliklarni tahrirlash, qo'shish va o'chirish</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/learning/studio"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                title="Learning Studio'da to'liq boshqarish"
              >
                <BookOpen className="w-4 h-4" />
                Learning Studio
              </Link>
              <button
                onClick={() => setShowCreateCategoryModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              >
                <FolderPlus className="w-4 h-4 text-purple-600" />
                Yangi Toifa
              </button>
              <button
                onClick={() => setShowCreateTopicModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Yangi Mavzu
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {categories.map((cat) => {
              const catTopics = allTopics.filter(
                (t) => t.category === cat.id || t.category_slug === cat.slug || t.category?.slug === cat.slug
              );
              return (
                <div key={cat.slug} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{cat.title_uz || cat.title_en}</h3>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{cat.slug}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cat.description_uz}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50"
                        title="Toifani tahrirlash"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.slug)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                        title="Toifani o'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                      <span>Darslar ro'yxati ({catTopics.length} ta)</span>
                      <button
                        onClick={() => {
                          setNewTopic((prev) => ({ ...prev, category_slug: cat.slug }));
                          setShowCreateTopicModal(true);
                        }}
                        className="text-blue-600 hover:underline text-[11px] font-bold"
                      >
                        + Dars qo'shish
                      </button>
                    </div>

                    {catTopics.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2 italic px-1">Bu toifada hozircha darsliklar mavjud emas.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                        {catTopics.map((topic, idx) => (
                          <div key={topic.slug} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-500 font-bold">
                                {topic.order || idx + 1}
                              </span>
                              <div>
                                <Link href={`/tutorials/${topic.slug}`} className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 flex items-center gap-1">
                                  {topic.title_uz || topic.title_en}
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </Link>
                                <span className="text-[10px] text-slate-400 font-mono">{topic.slug}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEditTopic(topic)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600"
                                title="Darsni tahrirlash"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTopic(topic.slug)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600"
                                title="Darsni o'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "users" && (isAdmin || isSuperAdmin) && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Foydalanuvchilarni qidirish..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3.5 px-4">Foydalanuvchi</th>
                    <th className="py-3.5 px-4">Email & Holat</th>
                    <th className="py-3.5 px-4">Reyting & XP</th>
                    <th className="py-3.5 px-4">Joriy rol</th>
                    <th className="py-3.5 px-4 text-right">Rolni boshqarish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users
                    .filter((u) => !userSearch || (u.username + u.email).toLowerCase().includes(userSearch.toLowerCase()))
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {u.username}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-600 dark:text-slate-400">{u.email}</p>
                          {u.is_email_verified ? (
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Tasdiqlangan
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVerifyUserEmail(u.id)}
                              className="text-[10px] text-amber-600 underline font-semibold hover:text-amber-700"
                            >
                              Tasdiqlash
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {u.rating} ball • {u.xp || 0} XP
                        </td>
                        <td className="py-3.5 px-4 font-bold uppercase text-[11px]">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            u.role === "superadmin"
                              ? "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                              : u.role === "admin"
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                              : u.role === "author"
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isSuperAdmin ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleSetRole(u.id, e.target.value)}
                              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold"
                            >
                              <option value="student">student (Talaba)</option>
                              <option value="author">author (Muallif)</option>
                              <option value="admin">admin</option>
                              <option value="superadmin">superadmin</option>
                            </select>
                          ) : isAdmin ? (
                            u.role === "admin" || u.role === "superadmin" ? (
                              <span className="text-slate-400 text-xs">Cheklangan</span>
                            ) : (
                              <select
                                value={u.role}
                                onChange={(e) => handleSetRole(u.id, e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold"
                              >
                                <option value="student">student (Talaba)</option>
                                <option value="author">author (Muallif)</option>
                              </select>
                            )
                          ) : null}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCreateProblemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Yangi Masala Yaratish</h3>
              <button onClick={() => setShowCreateProblemModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProblem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Masala nomi (O'zbekcha) *</label>
                  <input
                    type="text"
                    required
                    placeholder="masalan: Ikkita son yig'indisi"
                    value={newProblem.title_uz}
                    onChange={(e) => setNewProblem({ ...newProblem, title_uz: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Qiyinlik darajasi</label>
                  <select
                    value={newProblem.difficulty}
                    onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Easy">Oson (Easy)</option>
                    <option value="Medium">O'rtacha (Medium)</option>
                    <option value="Hard">Qiyin (Hard)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Masala nomi (Inglizcha, ixtiyoriy)</label>
                  <input
                    type="text"
                    placeholder="Two Sum"
                    value={newProblem.title_en}
                    onChange={(e) => setNewProblem({ ...newProblem, title_en: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Slug (URL, ixtiyoriy)</label>
                  <input
                    type="text"
                    placeholder="two-sum"
                    value={newProblem.slug}
                    onChange={(e) => setNewProblem({ ...newProblem, slug: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Teglar (vergul bilan)</label>
                  <input
                    type="text"
                    placeholder="Arrays, Two Pointers"
                    value={newProblem.tags_str}
                    onChange={(e) => setNewProblem({ ...newProblem, tags_str: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Vaqt limiti (ms)</label>
                  <input
                    type="number"
                    value={newProblem.time_limit_ms}
                    onChange={(e) => setNewProblem({ ...newProblem, time_limit_ms: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Xotira limiti (MB)</label>
                  <input
                    type="number"
                    value={newProblem.memory_limit_mb}
                    onChange={(e) => setNewProblem({ ...newProblem, memory_limit_mb: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Masala sharti (HTML yoki matn)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="<p>Berilgan massivdan...</p>"
                  value={newProblem.statement_uz}
                  onChange={(e) => setNewProblem({ ...newProblem, statement_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Boshlang'ich kod andozasi (Skeleton)</label>
                <textarea
                  rows={3}
                  required
                  value={newProblem.starter_code}
                  onChange={(e) => setNewProblem({ ...newProblem, starter_code: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Namunaviy test (Input)</label>
                  <textarea
                    rows={2}
                    value={newProblem.sample_input}
                    onChange={(e) => setNewProblem({ ...newProblem, sample_input: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    placeholder="[2, 7, 11, 15]&#10;9"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Kutilayotgan natija (Output)</label>
                  <textarea
                    rows={2}
                    value={newProblem.sample_output}
                    onChange={(e) => setNewProblem({ ...newProblem, sample_output: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    placeholder="[0, 1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Yashirin test (Input)</label>
                  <textarea
                    rows={2}
                    value={newProblem.hidden_input}
                    onChange={(e) => setNewProblem({ ...newProblem, hidden_input: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    placeholder="[3, 3]&#10;6"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Yashirin natija (Output)</label>
                  <textarea
                    rows={2}
                    value={newProblem.hidden_output}
                    onChange={(e) => setNewProblem({ ...newProblem, hidden_output: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    placeholder="[0, 1]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
              >
                Masalani saqlash (Xususiy)
              </button>
            </form>
          </div>
        </div>
      )}

      {editingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Masalani tahrirlash</h3>
                <p className="text-[11px] text-slate-400 font-mono">{editingProblem.slug}</p>
              </div>
              <button onClick={() => setEditingProblem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProblem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Masala nomi (O'zbekcha)</label>
                  <input
                    type="text"
                    required
                    value={editingProblem.title_uz || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, title_uz: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Qiyinlik darajasi</label>
                  <select
                    value={editingProblem.difficulty}
                    onChange={(e) => setEditingProblem({ ...editingProblem, difficulty: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Easy">Oson (Easy)</option>
                    <option value="Medium">O'rtacha (Medium)</option>
                    <option value="Hard">Qiyin (Hard)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Teglar (vergul bilan)</label>
                  <input
                    type="text"
                    value={editingProblem.tags_str || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, tags_str: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Vaqt limiti (ms)</label>
                  <input
                    type="number"
                    value={editingProblem.time_limit_ms || 2000}
                    onChange={(e) => setEditingProblem({ ...editingProblem, time_limit_ms: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Xotira limiti (MB)</label>
                  <input
                    type="number"
                    value={editingProblem.memory_limit_mb || 256}
                    onChange={(e) => setEditingProblem({ ...editingProblem, memory_limit_mb: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Masala sharti (HTML yoki matn)</label>
                <textarea
                  rows={4}
                  required
                  value={editingProblem.statement_uz || ""}
                  onChange={(e) => setEditingProblem({ ...editingProblem, statement_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Boshlang'ich kod andozasi</label>
                <textarea
                  rows={3}
                  required
                  value={editingProblem.starter_code || ""}
                  onChange={(e) => setEditingProblem({ ...editingProblem, starter_code: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Namunaviy test (Input)</label>
                  <textarea
                    rows={2}
                    value={editingProblem.sample_input || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, sample_input: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Kutilayotgan natija (Output)</label>
                  <textarea
                    rows={2}
                    value={editingProblem.sample_output || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, sample_output: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Yashirin test (Input)</label>
                  <textarea
                    rows={2}
                    value={editingProblem.hidden_input || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, hidden_input: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Yashirin natija (Output)</label>
                  <textarea
                    rows={2}
                    value={editingProblem.hidden_output || ""}
                    onChange={(e) => setEditingProblem({ ...editingProblem, hidden_output: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProblem(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  <Save className="w-4 h-4" />
                  O'zgarishlarni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateContestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Yangi Musobaqa Yaratish</h3>
              <button onClick={() => setShowCreateContestModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Musobaqa nomi *</label>
                  <input
                    type="text"
                    required
                    placeholder="masalan: Talabalar uchun haftalik sinov"
                    value={newContest.title_uz}
                    onChange={(e) => setNewContest({ ...newContest, title_uz: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Slug (ixtiyoriy)</label>
                  <input
                    type="text"
                    placeholder="masalan: haftalik-sinov-1"
                    value={newContest.slug}
                    onChange={(e) => setNewContest({ ...newContest, slug: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Divizion</label>
                  <select
                    value={newContest.division}
                    onChange={(e) => setNewContest({ ...newContest, division: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Div. 2">Div. 2</option>
                    <option value="Div. 1">Div. 1</option>
                    <option value="Educational">Ta'limiy (Educational)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Davomiyligi (daqiqa)</label>
                  <input
                    type="number"
                    value={newContest.duration_minutes}
                    onChange={(e) => setNewContest({ ...newContest, duration_minutes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Boshlanish vaqti</label>
                <input
                  type="datetime-local"
                  required
                  value={newContest.start_time}
                  onChange={(e) => setNewContest({ ...newContest, start_time: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Musobaqa tavsifi / Qoidalari</label>
                <textarea
                  rows={2}
                  placeholder="Musobaqa qoidalari va tafsilotlari..."
                  value={newContest.announcement_uz}
                  onChange={(e) => setNewContest({ ...newContest, announcement_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Masalalarni tanlash (Musobaqa uchun)</label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1">
                  {problems.map((p) => {
                    const selected = newContest.problem_ids.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewContest({ ...newContest, problem_ids: [...newContest.problem_ids, p.id] });
                            } else {
                              setNewContest({ ...newContest, problem_ids: newContest.problem_ids.filter((id) => id !== p.id) });
                            }
                          }}
                        />
                        <span>{p.title_uz || p.title_en} ({p.difficulty})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
              >
                Musobaqani yaratish (Xususiy)
              </button>
            </form>
          </div>
        </div>
      )}

      {editingContest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Musobaqani tahrirlash</h3>
                <p className="text-[11px] text-slate-400 font-mono">{editingContest.slug}</p>
              </div>
              <button onClick={() => setEditingContest(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateContest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Musobaqa nomi</label>
                <input
                  type="text"
                  required
                  value={editingContest.title_uz || ""}
                  onChange={(e) => setEditingContest({ ...editingContest, title_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Divizion</label>
                  <select
                    value={editingContest.division}
                    onChange={(e) => setEditingContest({ ...editingContest, division: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Div. 2">Div. 2</option>
                    <option value="Div. 1">Div. 1</option>
                    <option value="Educational">Ta'limiy (Educational)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Davomiyligi (daqiqa)</label>
                  <input
                    type="number"
                    value={editingContest.duration_minutes || 120}
                    onChange={(e) => setEditingContest({ ...editingContest, duration_minutes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Boshlanish vaqti</label>
                <input
                  type="datetime-local"
                  required
                  value={editingContest.start_time || ""}
                  onChange={(e) => setEditingContest({ ...editingContest, start_time: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Musobaqa tavsifi / E'lon</label>
                <textarea
                  rows={2}
                  value={editingContest.announcement_uz || ""}
                  onChange={(e) => setEditingContest({ ...editingContest, announcement_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Masalalarni tanlash (Musobaqa uchun)</label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1">
                  {problems.map((p) => {
                    const selected = (editingContest.problem_ids || []).includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingContest({ ...editingContest, problem_ids: [...(editingContest.problem_ids || []), p.id] });
                            } else {
                              setEditingContest({ ...editingContest, problem_ids: (editingContest.problem_ids || []).filter((id) => id !== p.id) });
                            }
                          }}
                        />
                        <span>{p.title_uz || p.title_en} ({p.difficulty})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingContest(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  <Save className="w-4 h-4" />
                  O'zgarishlarni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Yangi Toifa (Kategoriya)</h3>
              <button onClick={() => setShowCreateCategoryModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Toifa nomi (O'zbekcha)</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Dinamik Dasturlash"
                  value={newCategory.title_uz}
                  onChange={(e) => setNewCategory({ ...newCategory, title_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Slug (URL uchun)</label>
                <input
                  type="text"
                  placeholder="masalan: dynamic-programming"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Tavsifi</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ushbu toifada..."
                  value={newCategory.description_uz}
                  onChange={(e) => setNewCategory({ ...newCategory, description_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
              >
                Toifani saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Toifani tahrirlash</h3>
                <p className="text-[11px] text-slate-400 font-mono">{editingCategory.slug}</p>
              </div>
              <button onClick={() => setEditingCategory(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Toifa nomi</label>
                <input
                  type="text"
                  required
                  value={editingCategory.title_uz || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, title_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Tavsifi</label>
                <textarea
                  rows={3}
                  required
                  value={editingCategory.description_uz || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Tartib raqami</label>
                <input
                  type="number"
                  value={editingCategory.order || 1}
                  onChange={(e) => setEditingCategory({ ...editingCategory, order: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  <Save className="w-4 h-4" />
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Yangi Darslik Mavzusi</h3>
              <button onClick={() => setShowCreateTopicModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Toifa (Kategoriya)</label>
                  <select
                    value={newTopic.category_slug}
                    onChange={(e) => setNewTopic({ ...newTopic, category_slug: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.title_uz || c.title_en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tartib raqami</label>
                  <input
                    type="number"
                    value={newTopic.order}
                    onChange={(e) => setNewTopic({ ...newTopic, order: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Mavzu sarlavhasi (O'zbekcha)</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Qidiruv Daraxtlari va BST"
                  value={newTopic.title_uz}
                  onChange={(e) => setNewTopic({ ...newTopic, title_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Dars mazmuni (HTML yoki matn)</label>
                <textarea
                  rows={6}
                  required
                  placeholder="<p>Ushbu darsda...</p>"
                  value={newTopic.content_uz}
                  onChange={(e) => setNewTopic({ ...newTopic, content_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
              >
                Mavzuni qo'shish
              </button>
            </form>
          </div>
        </div>
      )}

      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Darslikni tahrirlash</h3>
                <p className="text-[11px] text-slate-400 font-mono">{editingTopic.slug}</p>
              </div>
              <button onClick={() => setEditingTopic(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTopic} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Toifa</label>
                  <select
                    value={editingTopic.category_slug}
                    onChange={(e) => setEditingTopic({ ...editingTopic, category_slug: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.title_uz || c.title_en}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tartib raqami</label>
                  <input
                    type="number"
                    value={editingTopic.order || 1}
                    onChange={(e) => setEditingTopic({ ...editingTopic, order: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Mavzu sarlavhasi</label>
                <input
                  type="text"
                  required
                  value={editingTopic.title_uz || ""}
                  onChange={(e) => setEditingTopic({ ...editingTopic, title_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Dars mazmuni</label>
                <textarea
                  rows={6}
                  required
                  value={editingTopic.content_uz || ""}
                  onChange={(e) => setEditingTopic({ ...editingTopic, content_uz: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  <Save className="w-4 h-4" />
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
