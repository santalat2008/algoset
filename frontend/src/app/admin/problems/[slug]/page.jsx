"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sliders,
  FileText,
  Code2,
  ListOrdered,
  Scale,
  ShieldCheck,
  Eye,
  Plus,
  Trash2,
  Edit,
  Upload,
  RefreshCw,
  Play,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  FileCode2,
  Lock,
  Layers
} from "lucide-react";
import { api } from "@/lib/api";

export default function ProblemAuthoringStudioPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [problemData, setProblemData] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [activeLangTab, setActiveLangTab] = useState("python3");
  const [actionNotice, setActionNotice] = useState("");

  const [form, setForm] = useState({
    title_uz: "",
    title_en: "",
    difficulty: "Easy",
    tags: ["Arrays"],
    execution_mode: "function",
    time_limit_ms: 2000,
    memory_limit_mb: 256,
    statement_uz: "",
    statement_en: "",
    input_description_uz: "",
    output_description_uz: "",
    constraints: "",
    function_signature: {
      name: "twoSum",
      params: [{ name: "nums", type: "list[int]" }, { name: "target", type: "int" }],
      return_type: "list[int]",
    },
    starter_templates: {
      python3: "",
      cpp: "",
      java: "",
      javascript: "",
    },
    checker_type: "exact",
    float_tolerance: 1e-6,
    custom_checker_code: "",
    reference_solution: "",
    wrong_solution: "",
  });

  const [testCases, setTestCases] = useState([]);
  const [showAddTcModal, setShowAddTcModal] = useState(false);
  const [editingTc, setEditingTc] = useState(null);
  const [newTc, setNewTc] = useState({
    input_data: "",
    expected_output: "",
    is_sample: false,
    explanation: "",
    order: 1,
  });

  const [showZipModal, setShowZipModal] = useState(false);
  const [zipFile, setZipFile] = useState(null);
  const [zipIsSample, setZipIsSample] = useState(false);
  const [zipGroupName, setZipGroupName] = useState("");
  const [zipUploading, setZipUploading] = useState(false);

  const [validating, setValidating] = useState(false);
  const [generatingOutputs, setGeneratingOutputs] = useState(false);
  const [validationRun, setValidationRun] = useState(null);
  const [previewInput, setPreviewInput] = useState("");
  const [previewOutput, setPreviewOutput] = useState("");
  const [previewRunning, setPreviewRunning] = useState(false);

  useEffect(() => {
    loadProblemData();
  }, [slug]);

  function notify(msg) {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(""), 4500);
  }

  async function loadProblemData() {
    setLoading(true);
    try {
      const data = await api.getProblemAuthoring(slug);
      setProblemData(data);
      const v = data.active_version;
      if (v) {
        setForm({
          title_uz: data.title_uz || "",
          title_en: data.title_en || "",
          difficulty: data.difficulty || "Easy",
          tags: Array.isArray(data.tags) ? data.tags : [],
          execution_mode: v.execution_mode || "function",
          time_limit_ms: v.time_limit_ms || 2000,
          memory_limit_mb: v.memory_limit_mb || 256,
          statement_uz: v.statement_uz || "",
          statement_en: v.statement_en || "",
          input_description_uz: v.input_description_uz || "",
          output_description_uz: v.output_description_uz || "",
          constraints: v.constraints || "",
          function_signature: v.function_signature || {
            name: "solve",
            params: [{ name: "inp", type: "str" }],
            return_type: "str",
          },
          starter_templates: v.starter_templates || {
            python3: "",
            cpp: "",
            java: "",
            javascript: "",
          },
          checker_type: v.checker_type || "exact",
          float_tolerance: v.float_tolerance || 1e-6,
          custom_checker_code: v.custom_checker_code || "",
          reference_solution: v.reference_solution || "",
          wrong_solution: "",
        });
        setTestCases(v.test_cases || []);
        if (v.latest_validation) {
          setValidationRun(v.latest_validation);
        }
      }
    } catch (err) {
      notify(`Xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAll() {
    if (!problemData || !problemData.active_version) return;
    setSaving(true);
    try {
      await api.updateProblemAuthoring(slug, form);
      notify("Barcha o'zgarishlar muvaffaqiyatli saqlandi!");
      await loadProblemData();
    } catch (err) {
      notify(`Saqlashda xatolik: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleAutoGenerateTemplates() {
    try {
      const res = await api.generateCodeTemplates(form.execution_mode, form.function_signature);
      if (res && res.starter_templates) {
        setForm((prev) => ({
          ...prev,
          starter_templates: res.starter_templates,
        }));
        notify("Barcha dasturlash tillari uchun shablonlar generatsiya qilindi!");
      }
    } catch (err) {
      notify(`Xatolik: ${err.message}`);
    }
  }

  function handleAddParam() {
    setForm((prev) => {
      const sig = { ...prev.function_signature };
      const params = [...(sig.params || [])];
      params.push({ name: `arg${params.length + 1}`, type: "int" });
      return {
        ...prev,
        function_signature: { ...sig, params },
      };
    });
  }

  function handleRemoveParam(idx) {
    setForm((prev) => {
      const sig = { ...prev.function_signature };
      const params = [...(sig.params || [])];
      params.splice(idx, 1);
      return {
        ...prev,
        function_signature: { ...sig, params },
      };
    });
  }

  function handleParamChange(idx, field, val) {
    setForm((prev) => {
      const sig = { ...prev.function_signature };
      const params = [...(sig.params || [])];
      params[idx] = { ...params[idx], [field]: val };
      return {
        ...prev,
        function_signature: { ...sig, params },
      };
    });
  }

  async function handleCreateTestCase(e) {
    e.preventDefault();
    if (!problemData?.active_version) return;
    const vNum = problemData.active_version.version_number;
    try {
      await api.addVersionTestcase(slug, vNum, newTc);
      notify("Test keys muvaffaqiyatli qo'shildi!");
      setShowAddTcModal(false);
      setNewTc({ input_data: "", expected_output: "", is_sample: false, explanation: "", order: testCases.length + 2 });
      const updated = await api.getVersionTestcases(slug, vNum);
      setTestCases(updated || []);
    } catch (err) {
      notify(`Xatolik: ${err.message}`);
    }
  }

  async function handleUpdateTestCase(e) {
    e.preventDefault();
    if (!problemData?.active_version || !editingTc) return;
    const vNum = problemData.active_version.version_number;
    try {
      await api.updateVersionTestcase(slug, vNum, editingTc.id, editingTc);
      notify("Test keys muvaffaqiyatli yangilandi!");
      setEditingTc(null);
      const updated = await api.getVersionTestcases(slug, vNum);
      setTestCases(updated || []);
    } catch (err) {
      notify(`Xatolik: ${err.message}`);
    }
  }

  async function handleDeleteTestCase(caseId) {
    if (!confirm("Ushbu test keysni butunlay o'chirmoqchimisiz?")) return;
    if (!problemData?.active_version) return;
    const vNum = problemData.active_version.version_number;
    try {
      await api.deleteVersionTestcase(slug, vNum, caseId);
      notify("Test keys o'chirildi!");
      setTestCases((prev) => prev.filter((tc) => tc.id !== caseId));
    } catch (err) {
      notify(`Xatolik: ${err.message}`);
    }
  }

  async function handleUploadZip(e) {
    e.preventDefault();
    if (!zipFile || !problemData?.active_version) return;
    const vNum = problemData.active_version.version_number;
    setZipUploading(true);
    try {
      const res = await api.uploadTestcasesZip(slug, vNum, zipFile, zipIsSample, zipGroupName);
      notify(res.detail || "ZIP muvaffaqiyatli yuklandi!");
      setShowZipModal(false);
      setZipFile(null);
      const updated = await api.getVersionTestcases(slug, vNum);
      setTestCases(updated || []);
    } catch (err) {
      notify(`ZIP yuklashda xatolik: ${err.message}`);
    } finally {
      setZipUploading(false);
    }
  }

  async function handleGenerateOutputs() {
    if (!form.reference_solution.trim()) {
      notify("Avvalo 'Validatsiya' bo'limida to'g'ri referens yechim kodini yozing.");
      setActiveTab("validation");
      return;
    }
    if (!confirm("Barcha test keyslarning kutilgan natijalari referens yechim orqali hisoblanib yangilanadi. Davom etasizmi?")) return;
    if (!problemData?.active_version) return;
    const vNum = problemData.active_version.version_number;
    setGeneratingOutputs(true);
    try {
      const res = await api.generateExpectedOutputs(slug, vNum, form.reference_solution);
      notify(res.detail || "Natijalar muvaffaqiyatli yangilandi!");
      const updated = await api.getVersionTestcases(slug, vNum);
      setTestCases(updated || []);
    } catch (err) {
      notify(`Xatolik: ${err.message}`);
    } finally {
      setGeneratingOutputs(false);
    }
  }

  async function handleRunValidation() {
    if (!form.reference_solution.trim()) {
      notify("Validatsiya uchun referens yechim kiritilishi shart.");
      return;
    }
    if (!problemData?.active_version) return;
    const vNum = problemData.active_version.version_number;
    setValidating(true);
    try {
      await api.updateProblemAuthoring(slug, form);
      const res = await api.validateProblemVersion(slug, vNum, form.reference_solution, form.wrong_solution);
      setValidationRun(res);
      if (res.status === "passed") {
        notify("Tabriklaymiz! Barcha testlar muvaffaqiyatli tekshirildi va tasdiqlandi!");
      } else {
        notify(`Validatsiyada xatolik: ${res.summary}`);
      }
      const p = await api.getProblemAuthoring(slug);
      setProblemData(p);
    } catch (err) {
      notify(`Validatsiya xatosi: ${err.message}`);
    } finally {
      setValidating(false);
    }
  }

  async function handlePublishVersion() {
    if (!problemData?.active_version) return;
    const vNum = problemData.active_version.version_number;
    if (!confirm(`v${vNum} versiyasini ommaviy platformaga nashr qilmoqchimisiz?`)) return;
    try {
      const res = await api.publishProblemVersion(slug, vNum);
      notify(res.detail || "Masala muvaffaqiyatli nashr qilindi!");
      await loadProblemData();
    } catch (err) {
      notify(`Nashr qilishda xatolik: ${err.message}`);
    }
  }

  async function handleCreateNewDraftVersion() {
    try {
      await api.createProblemVersion(slug);
      notify("Yangi qoralama versiya ochildi!");
      await loadProblemData();
    } catch (err) {
      notify(`Xatolik: ${err.message}`);
    }
  }

  async function handlePreviewRunCode() {
    setPreviewRunning(true);
    setPreviewOutput("");
    try {
      const pyCode = form.starter_templates?.python3 || form.reference_solution;
      const res = await api.runCode(slug, pyCode, previewInput, "python3");
      setPreviewOutput(res.actual_output || res.error || "Natija yo'q");
    } catch (err) {
      setPreviewOutput(`Xatolik: ${err.message}`);
    } finally {
      setPreviewRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Problem Authoring Studio yuklanmoqda...</p>
      </div>
    );
  }

  if (!problemData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-bold">Masala topilmadi</h2>
        <Link href="/admin" className="mt-4 inline-block text-xs text-blue-600 font-bold">
          Admin panelga qaytish
        </Link>
      </div>
    );
  }

  const v = problemData.active_version || {};
  const isPublished = v.is_published;
  const isReady = v.status === "ready_for_review" || (validationRun && validationRun.status === "passed");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Admin
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400 font-mono">{slug}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              v{v.version_number || 1} ({isPublished ? "Nashr qilingan" : "Qoralama"})
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            {form.title_uz || slug}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              form.difficulty === "Easy" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400" :
              form.difficulty === "Medium" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400" :
              "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
            }`}>
              {form.difficulty}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={`/problems/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-xs font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            O'quvchi ko'rinishi
          </Link>

          {!isPublished && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md transition-all hover:opacity-90"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          )}

          {!isPublished ? (
            <button
              onClick={handlePublishVersion}
              disabled={!isReady}
              title={!isReady ? "Validatsiyadan muvaffaqiyatli o'tganidan so'ng ochiladi" : "Ommaviy nashr qilish"}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isReady
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Nashr qilish
            </button>
          ) : (
            <button
              onClick={handleCreateNewDraftVersion}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Yangi qoralama ochish (v{(v.version_number || 1) + 1})
            </button>
          )}
        </div>
      </div>

      {actionNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice("")} className="text-blue-500 hover:text-blue-700 font-bold">
            yopish
          </button>
        </div>
      )}

      {isPublished && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              <strong>Ushbu versiya (v{v.version_number}) nashr qilingan va o'zgarmasdir (immutable).</strong>{" "}
              O'zgartirish kiritish uchun yuqoridagi <em>"Yangi qoralama ochish"</em> tugmasini bosing.
            </span>
          </div>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px mb-6 scrollbar-none text-xs font-bold">
        {[
          { id: "general", label: "Asosiy", icon: Sliders },
          { id: "statement", label: "Shart va Matn", icon: FileText },
          { id: "templates", label: "Kod va Funksiya", icon: Code2 },
          { id: "testcases", label: `Testlar (${testCases.length})`, icon: ListOrdered },
          { id: "checker", label: "Tekshiruvchi", icon: Scale },
          { id: "validation", label: "Validatsiya", icon: ShieldCheck },
          { id: "preview", label: "Simulyatsiya", icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === "general" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                Masala nomi (O'zbekcha)
              </label>
              <input
                type="text"
                disabled={isPublished}
                value={form.title_uz}
                onChange={(e) => setForm({ ...form, title_uz: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                Masala nomi (Inglizcha)
              </label>
              <input
                type="text"
                disabled={isPublished}
                value={form.title_en}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                Qiyinlik darajasi
              </label>
              <select
                disabled={isPublished}
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-bold"
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
                disabled={isPublished}
                value={form.execution_mode}
                onChange={(e) => setForm({ ...form, execution_mode: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-bold"
              >
                <option value="function">Funksiya-asosli (LeetCode-uslubida)</option>
                <option value="standard_io">Standart kiritish-chiqarish (stdin/stdout)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                Mavzu teglari (vergul bilan ajratilgan)
              </label>
              <input
                type="text"
                disabled={isPublished}
                value={form.tags.join(", ")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                Vaqt chegarasi (millisekundda, masalan 2000 ms)
              </label>
              <input
                type="number"
                disabled={isPublished}
                value={form.time_limit_ms}
                onChange={(e) => setForm({ ...form, time_limit_ms: Number(e.target.value) || 2000 })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                Xotira chegarasi (Megabaytda, masalan 256 MB)
              </label>
              <input
                type="number"
                disabled={isPublished}
                value={form.memory_limit_mb}
                onChange={(e) => setForm({ ...form, memory_limit_mb: Number(e.target.value) || 256 })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATEMENT */}
      {activeTab === "statement" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Shart muharriri (Markdown & LaTeX)</h3>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Masala bayoni (O'zbekcha)
              </label>
              <textarea
                rows={10}
                disabled={isPublished}
                value={form.statement_uz}
                onChange={(e) => setForm({ ...form, statement_uz: e.target.value })}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kiritish tavsifi (Input)
                </label>
                <textarea
                  rows={4}
                  disabled={isPublished}
                  value={form.input_description_uz}
                  onChange={(e) => setForm({ ...form, input_description_uz: e.target.value })}
                  placeholder="Birinchi qatorda butun son n berilgan..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chiqarish tavsifi (Output)
                </label>
                <textarea
                  rows={4}
                  disabled={isPublished}
                  value={form.output_description_uz}
                  onChange={(e) => setForm({ ...form, output_description_uz: e.target.value })}
                  placeholder="Yagona qatorda masalaning javobini chiqaring..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Cheklovlar (Constraints)
              </label>
              <textarea
                rows={3}
                disabled={isPublished}
                value={form.constraints}
                onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                placeholder="1 <= nums.length <= 10^5&#10;-10^9 <= nums[i] <= 10^9"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm overflow-y-auto max-h-[750px]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              Jonli ko'rinish (Preview)
            </h3>

            <div className="prose dark:prose-invert max-w-none text-xs space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-2">{form.title_uz || "Masala sarlavhasi"}</h4>
                <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                  {form.statement_uz || "Shart hali kiritilmagan..."}
                </div>
              </div>

              {form.input_description_uz && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Kiritish ma'lumotlari:</p>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{form.input_description_uz}</p>
                </div>
              )}

              {form.output_description_uz && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Chiqarish ma'lumotlari:</p>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{form.output_description_uz}</p>
                </div>
              )}

              {form.constraints && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Cheklovlar:</p>
                  <pre className="font-mono text-[11px] whitespace-pre-wrap text-slate-700 dark:text-slate-300">{form.constraints}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CODE TEMPLATES & SIGNATURE */}
      {activeTab === "templates" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
          {form.execution_mode === "function" && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Funksiya signaturasi sozlamalari</h3>
                  <p className="text-slate-500 text-[11px]">Metod nomi, parametrlari va qaytaruvchi ma'lumot turi</p>
                </div>
                <button
                  onClick={handleAutoGenerateTemplates}
                  disabled={isPublished}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Shablonlarni avto-generatsiya qilish
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Metod nomi (masalan: twoSum, solve, maxSubArray)
                  </label>
                  <input
                    type="text"
                    disabled={isPublished}
                    value={form.function_signature.name || "solve"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        function_signature: { ...form.function_signature, name: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Qaytarish turi (Return Type: int, str, list[int], bool)
                  </label>
                  <input
                    type="text"
                    disabled={isPublished}
                    value={form.function_signature.return_type || "None"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        function_signature: { ...form.function_signature, return_type: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Funksiya parametrlari</label>
                  <button
                    onClick={handleAddParam}
                    disabled={isPublished}
                    className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Parametr qo'shish
                  </button>
                </div>

                <div className="space-y-2">
                  {(form.function_signature.params || []).map((param, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="text"
                        disabled={isPublished}
                        placeholder="Nomi (nums)"
                        value={param.name}
                        onChange={(e) => handleParamChange(idx, "name", e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px]"
                      />
                      <input
                        type="text"
                        disabled={isPublished}
                        placeholder="Turi (list[int], int, str)"
                        value={param.type}
                        onChange={(e) => handleParamChange(idx, "type", e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px]"
                      />
                      {!isPublished && (
                        <button
                          onClick={() => handleRemoveParam(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Boshlang'ich kod shablonlari (Starter Templates)</h3>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {["python3", "cpp", "java", "javascript"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLangTab(lang)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase transition-all ${
                      activeLangTab === lang
                        ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {lang === "python3" ? "Python 3 (Faol)" : `${lang === "cpp" ? "C++" : lang} (Tez kunda)`}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={12}
              disabled={isPublished}
              value={form.starter_templates[activeLangTab] || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  starter_templates: {
                    ...form.starter_templates,
                    [activeLangTab]: e.target.value,
                  },
                })
              }
              className="w-full p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* TAB 4: TESTCASES */}
      {activeTab === "testcases" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Test keyslar ro'yxati ({testCases.length} ta)</h3>
              <p className="text-slate-500 text-[11px]">
                {testCases.filter((t) => t.is_sample).length} ta namunaviy (ochiq),{" "}
                {testCases.filter((t) => !t.is_sample).length} ta yashirin testlar
              </p>
            </div>

            {!isPublished && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleGenerateOutputs}
                  disabled={generatingOutputs}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold hover:bg-purple-100"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generatingOutputs ? "animate-spin" : ""}`} />
                  {generatingOutputs ? "Hisoblanmoqda..." : "Kutilgan natijalarni generatsiya qilish"}
                </button>

                <button
                  onClick={() => setShowZipModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                >
                  <Upload className="w-3.5 h-3.5" />
                  ZIP import
                </button>

                <button
                  onClick={() => setShowAddTcModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Test qo'shish
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Turi</th>
                  <th className="py-2.5 px-3">Kiritish (Input)</th>
                  <th className="py-2.5 px-3">Kutilgan natija (Expected Output)</th>
                  <th className="py-2.5 px-3">Izoh</th>
                  {!isPublished && <th className="py-2.5 px-3 text-right">Amallar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {testCases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Hech qanday test keys mavjud emas. Yuqoridagi tugma orqali test qo'shing yoki ZIP yuklang.
                    </td>
                  </tr>
                ) : (
                  testCases.map((tc, idx) => (
                    <tr key={tc.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold">{tc.order || idx + 1}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tc.is_sample
                              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          {tc.is_sample ? "Namuna" : "Yashirin"}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono max-w-xs truncate text-[11px] text-slate-800 dark:text-slate-200">
                        {tc.input_data.slice(0, 80)}
                      </td>
                      <td className="py-3 px-3 font-mono max-w-xs truncate text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                        {tc.expected_output ? tc.expected_output.slice(0, 80) : <span className="text-amber-500 italic">Bo'sh</span>}
                      </td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[150px]">{tc.explanation || "-"}</td>
                      {!isPublished && (
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingTc(tc)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-blue-600"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTestCase(tc.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CHECKER & JUDGING */}
      {activeTab === "checker" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">Baholash strategiyasi (Judging Strategy)</h3>
            <p className="text-slate-500 text-[11px] mb-4">
              Dastur chiqargan natija va kutilgan javob qay tartibda taqqoslanishi kerak?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: "exact", label: "Exact Match", desc: "Har bir belgi (bo'sh joylardan tashqari) to'liq mos kelishi shart" },
                { id: "normalized", label: "Normalized Whitespace", desc: "Tokenlar bo'yicha taqqoslash (qatorlar va probellar farqi inobatga olinmaydi)" },
                { id: "float_tolerance", label: "Float Tolerance", desc: "Haqiqiy sonlar uchun eps xatolik (masalan 1e-6) oralig'ida tekshirish" },
                { id: "type_aware", label: "Type-Aware (JSON)", desc: "JSON massivlar yoki obyektlarni strukturaviy chuqur taqqoslash" },
                { id: "custom", label: "Custom Python Checker", desc: "Maxsus python check() funksiyasi orqali ixtiyoriy tekshirish" },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => !isPublished && setForm({ ...form, checker_type: opt.id })}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    form.checker_type === opt.id
                      ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/30"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <p className="font-bold text-slate-900 dark:text-white mb-1">{opt.label}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {form.checker_type === "float_tolerance" && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Ruxsat etilgan xatolik (Float Tolerance Epsilon)
              </label>
              <input
                type="number"
                step="0.000001"
                disabled={isPublished}
                value={form.float_tolerance}
                onChange={(e) => setForm({ ...form, float_tolerance: parseFloat(e.target.value) || 1e-6 })}
                className="w-48 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px]"
              />
            </div>
          )}

          {form.checker_type === "custom" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Maxsus tekshiruvchi kodi (Custom Checker)
                </label>
                <span className="text-[11px] text-slate-400 font-mono">def check(inp, exp, act) -&gt; (bool, str)</span>
              </div>
              <textarea
                rows={10}
                disabled={isPublished}
                value={form.custom_checker_code}
                onChange={(e) => setForm({ ...form, custom_checker_code: e.target.value })}
                placeholder={`def check(input_data: str, expected_output: str, actual_output: str) -> tuple[bool, str]:\n    # Masalan bir nechta to'g'ri javoblarni tekshirish\n    if actual_output.strip() == expected_output.strip():\n        return True, "Accepted"\n    return False, "Not match"`}
                className="w-full p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 6: VALIDATION */}
      {activeTab === "validation" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Referens Yechim va Validatsiya</h3>
              <p className="text-slate-500 text-[11px]">
                Masalani nashr qilishdan oldin to'g'ri referens yechim barcha testlardan 100% o'tishi shart.
              </p>
            </div>

            <button
              onClick={handleRunValidation}
              disabled={validating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-md shadow-blue-500/25 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              {validating ? "Validatsiya bajarilmoqda..." : "Validatsiyani ishga tushirish"}
            </button>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Ishonchli to'g'ri yechim kodi (Python 3 Reference Solution) *
            </label>
            <textarea
              rows={10}
              value={form.reference_solution}
              onChange={(e) => setForm({ ...form, reference_solution: e.target.value })}
              placeholder={`class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, n in enumerate(nums):\n            diff = target - n\n            if diff in seen:\n                return [seen[diff], i]\n            seen[n] = i\n        return []`}
              className="w-full p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Salbiy test uchun xato yechim (Ixtiyoriy - noto'g'ri kod albatta yiqilishi tekshiriladi)
            </label>
            <textarea
              rows={4}
              value={form.wrong_solution}
              onChange={(e) => setForm({ ...form, wrong_solution: e.target.value })}
              placeholder={`class Solution:\n    def twoSum(self, nums, target):\n        return [0, 0] # Deliberately wrong`}
              className="w-full p-3 bg-slate-900/90 text-slate-200 rounded-2xl font-mono text-xs outline-none"
            />
          </div>

          {validationRun && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {validationRun.status === "passed" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Validatsiya holati: {validationRun.status === "passed" ? "MUVAFFAQIYATLI (PASSED)" : "XATOLIK (FAILED)"}
                    </h4>
                    <p className="text-slate-500 text-[11px]">{validationRun.summary}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm">
                    {validationRun.passed_cases} / {validationRun.total_cases}
                  </span>
                  <span className="text-[10px] text-slate-400 block">testlar o'tdi</span>
                </div>
              </div>

              {validationRun.results && validationRun.results.length > 0 && (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2 px-2.5">Test #</th>
                        <th className="py-2 px-2.5">Holat</th>
                        <th className="py-2 px-2.5">Vaqt (ms)</th>
                        <th className="py-2 px-2.5">Olingan natija</th>
                        <th className="py-2 px-2.5">Xatolik</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono text-[11px]">
                      {validationRun.results.map((res, idx) => (
                        <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/80">
                          <td className="py-2 px-2.5 font-bold">#{res.case_order || idx + 1}</td>
                          <td className="py-2 px-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                res.status === "Passed"
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                              }`}
                            >
                              {res.status}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-slate-500">{res.runtime_ms} ms</td>
                          <td className="py-2 px-2.5 truncate max-w-xs">{res.actual_output || "-"}</td>
                          <td className="py-2 px-2.5 text-rose-500 truncate max-w-xs">{res.error_message || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: PREVIEW & SIMULATION */}
      {activeTab === "preview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              O'quvchi nigohi: Masala sharti
            </h3>
            <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
              {form.statement_uz || "Shart kiritilmagan."}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Namunaviy testlar:</h4>
              <div className="space-y-3">
                {testCases.filter((tc) => tc.is_sample).length === 0 ? (
                  <p className="text-slate-400 italic">Namuna testlar qo'shilmagan.</p>
                ) : (
                  testCases
                    .filter((tc) => tc.is_sample)
                    .map((tc, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl font-mono text-[11px] space-y-1 border border-slate-200 dark:border-slate-700">
                        <p className="font-bold text-slate-600 dark:text-slate-400">{idx + 1}-namuna:</p>
                        <p><strong className="text-slate-800 dark:text-slate-200">Kiritish:</strong> {tc.input_data}</p>
                        <p><strong className="text-slate-800 dark:text-slate-200">Chiqarish:</strong> {tc.expected_output}</p>
                        {tc.explanation && <p className="text-slate-500 font-sans italic text-[10px]">Izoh: {tc.explanation}</p>}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              Muharrir simulyatsiyasi
            </h3>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kiritish qiymati (Custom Input):
              </label>
              <textarea
                rows={3}
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                placeholder="Masalan: [2, 7, 11, 15]&#10;9"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviewRunCode}
                disabled={previewRunning}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <Play className="w-3.5 h-3.5" />
                {previewRunning ? "Ijro etilmoqda..." : "Kodni ishga tushirish"}
              </button>
            </div>

            {previewOutput && (
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase">Chiqarilgan natija:</p>
                <pre className="whitespace-pre-wrap">{previewOutput}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD TESTCASE */}
      {showAddTcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Yangi test keys qo'shish</h3>
            <form onSubmit={handleCreateTestCase} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kiritish ma'lumotlari (Input) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newTc.input_data}
                  onChange={(e) => setNewTc({ ...newTc, input_data: e.target.value })}
                  placeholder="[2, 7, 11, 15]&#10;9"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kutilgan natija (Expected Output)
                </label>
                <textarea
                  rows={3}
                  value={newTc.expected_output}
                  onChange={(e) => setNewTc({ ...newTc, expected_output: e.target.value })}
                  placeholder="[0, 1]"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={newTc.is_sample}
                    onChange={(e) => setNewTc({ ...newTc, is_sample: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  Namunaviy test (O'quvchiga ko'rinadi)
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Izoh (Explanation)
                </label>
                <input
                  type="text"
                  value={newTc.explanation}
                  onChange={(e) => setNewTc({ ...newTc, explanation: e.target.value })}
                  placeholder="1-misol izohi"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTcModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TESTCASE */}
      {editingTc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Test keysni tahrirlash</h3>
            <form onSubmit={handleUpdateTestCase} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kiritish ma'lumotlari (Input) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingTc.input_data}
                  onChange={(e) => setEditingTc({ ...editingTc, input_data: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kutilgan natija (Expected Output)
                </label>
                <textarea
                  rows={3}
                  value={editingTc.expected_output}
                  onChange={(e) => setEditingTc({ ...editingTc, expected_output: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingTc.is_sample}
                    onChange={(e) => setEditingTc({ ...editingTc, is_sample: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  Namunaviy test (O'quvchiga ko'rinadi)
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Izoh (Explanation)
                </label>
                <input
                  type="text"
                  value={editingTc.explanation || ""}
                  onChange={(e) => setEditingTc({ ...editingTc, explanation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTc(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD ZIP */}
      {showZipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">ZIP arxiv orqali testlarni yuklash</h3>
            <p className="text-slate-500 text-[11px]">
              Arxivda <code>1.in / 1.out</code> juftliklari yoki <code>tests.json</code> fayli bo'lishi mumkin.
            </p>

            <form onSubmit={handleUploadZip} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ZIP faylni tanlang *
                </label>
                <input
                  type="file"
                  required
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Guruh nomi (Ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="Katta testlar, Chekka holatlar (Edge Cases)"
                  value={zipGroupName}
                  onChange={(e) => setZipGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="zipSample"
                  checked={zipIsSample}
                  onChange={(e) => setZipIsSample(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <label htmlFor="zipSample" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Namuna test sifatida belgilash
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowZipModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={zipUploading || !zipFile}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold"
                >
                  {zipUploading ? "Yuklanmoqda..." : "Yuklash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

