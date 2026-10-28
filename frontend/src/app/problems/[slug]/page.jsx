"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Play, 
  Send, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileCode2, 
  RotateCcw,
  Sparkles,
  X,
  Sliders,
  Maximize2,
  Copy,
  Check,
  Edit
} from "lucide-react";
import { api } from "@/lib/api";

const STARTER_CODES = {
  python3: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        pass
`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};
`,
  java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}
`,
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    
};
`
};

export default function ProblemDetailPage() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [testCaseTab, setTestCaseTab] = useState("cases");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [language, setLanguage] = useState("python3");
  const [codes, setCodes] = useState(STARTER_CODES);
  const [runResult, setRunResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedEditorCode, setCopiedEditorCode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  
  const [showSettings, setShowSettings] = useState(false);
  const [editorSettings, setEditorSettings] = useState({
    fontSize: 14,
    tabSize: 4,
    theme: "vs-dark",
    showLineNumbers: true,
  });

  const textareaRef = useRef(null);

  const defaultProblem = {
    id: 1,
    slug: "two-sum",
    title_uz: "Two Sum (Ikkita son yig'indisi)",
    title_en: "Two Sum",
    difficulty: "Oson",
    solved_count: 1250,
    acceptance_rate: 98,
    statement_uz: `
      <p class="leading-relaxed">Butun sonlardan iborat <code>nums</code> massivi va <code>target</code> butun soni berilgan. Yig'indisi <code>target</code> ga teng bo'lgan ikkita sonning indekslarini massiv ko'rinishida qaytaring.</p>
      <p class="mt-3 leading-relaxed">Har doim aniq <strong>bitta to'g'ri yechim</strong> mavjud deb hisoblashingiz mumkin. Bitta elementdan ikki marta foydalanish taqiqlanadi.</p>
      <div class="mt-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs space-y-2">
        <p class="font-bold text-slate-900 dark:text-white">1-misol:</p>
        <p><strong>Kiritish:</strong> nums = [2, 7, 11, 15], target = 9</p>
        <p><strong>Chiqarish:</strong> [0, 1]</p>
        <p class="text-slate-500 dark:text-slate-400">Izoh: nums[0] + nums[1] == 9 bo'lgani uchun [0, 1] qaytariladi.</p>
      </div>
      <div class="mt-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-xs space-y-2">
        <p class="font-bold text-slate-900 dark:text-white">2-misol:</p>
        <p><strong>Kiritish:</strong> nums = [3, 2, 4], target = 6</p>
        <p><strong>Chiqarish:</strong> [1, 2]</p>
      </div>
      <div class="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
        <p class="font-bold text-slate-800 dark:text-slate-200">Cheklovlar:</p>
        <p>• 2 &le; nums.length &le; 10<sup>4</sup></p>
        <p>• -10<sup>9</sup> &le; nums[i] &le; 10<sup>9</sup></p>
        <p>• -10<sup>9</sup> &le; target &le; 10<sup>9</sup></p>
      </div>
    `,
    starter_code: STARTER_CODES.python3,
    sample_test_cases: [
      { input: "[2, 7, 11, 15]\n9", output: "[0, 1]" },
      { input: "[3, 2, 4]\n6", output: "[1, 2]" },
    ],
  };

  useEffect(() => {
    const saved = localStorage.getItem("algoset_editor_settings");
    if (saved) {
      try {
        setEditorSettings(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    api.getMe().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    async function loadProblem() {
      try {
        const data = await api.getProblem(slug);
        if (data && (data.title_uz || data.title_en)) {
          setProblem(data);
          if (data.starter_code) {
            setCodes((prev) => ({ ...prev, python3: data.starter_code }));
          }
          if (data.sample_test_cases && data.sample_test_cases.length > 0) {
            setCustomInput(data.sample_test_cases[0].input);
          }
        } else {
          setProblem(defaultProblem);
          setCustomInput(defaultProblem.sample_test_cases[0].input);
        }
      } catch {
        setProblem(defaultProblem);
        setCustomInput(defaultProblem.sample_test_cases[0].input);
      }
    }
    loadProblem();
  }, [slug]);

  useEffect(() => {
    if (activeTab === "submissions") {
      api.getProblemSubmissions(slug).then((subs) => {
        if (subs && subs.length) setSubmissions(subs);
      });
    }
  }, [activeTab, slug]);

  function handleCodeChange(val) {
    setCodes((prev) => ({ ...prev, [language]: val }));
    updateCursor();
  }

  function handleKeyDown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentCode = codes[language] || "";
      const spaces = " ".repeat(editorSettings.tabSize || 4);
      const newCode = currentCode.substring(0, start) + spaces + currentCode.substring(end);
      setCodes((prev) => ({ ...prev, [language]: newCode }));
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + spaces.length;
        updateCursor();
      }, 0);
    }
  }

  function updateCursor() {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = (codes[language] || "").substring(0, pos);
    const lines = textBefore.split("\n");
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  }

  function handleResetCode() {
    if (confirm("Kodingizni dastlabki holatga qaytarmoqchimisiz?")) {
      const defaultForLang = language === "python3" && problem?.starter_code
        ? problem.starter_code
        : STARTER_CODES[language] || "";
      setCodes((prev) => ({ ...prev, [language]: defaultForLang }));
    }
  }

  function saveSettings(newSettings) {
    setEditorSettings(newSettings);
    localStorage.setItem("algoset_editor_settings", JSON.stringify(newSettings));
  }

  async function handleRun() {
    setIsRunning(true);
    setRunResult(null);
    try {
      const inputToRun = testCaseTab === "custom" ? customInput : null;
      const currentCode = codes[language] || "";
      const res = await api.runCode(slug, currentCode, inputToRun, language);
      setRunResult(res);
    } catch (err) {
      setRunResult({
        status: "Xatolik",
        stderr: err.message || "Kod bajarilishida kutilmagan xatolik yuz berdi.",
      });
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setRunResult(null);
    try {
      const currentCode = codes[language] || "";
      const res = await api.submitCode(slug, currentCode, null, language);
      setRunResult(res);
      api.getProblemSubmissions(slug).then((subs) => {
        if (subs && subs.length) setSubmissions(subs);
      });
    } catch (err) {
      setRunResult({
        status: "Xatolik",
        stderr: err.message || "Yuborishda xatolik yuz berdi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const p = problem || defaultProblem;
  const currentCode = codes[language] || "";
  const codeLines = currentCode.split("\n");

  const themeClasses = {
    "vs-dark": "bg-slate-950 text-slate-100",
    "monokai": "bg-[#1e1f1c] text-[#f8f8f2]",
    "github-dark": "bg-[#0d1117] text-[#c9d1d9]",
    "light": "bg-slate-50 text-slate-900",
  }[editorSettings.theme] || "bg-slate-950 text-slate-100";

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-1">
              <Link
                href="/problems"
                className="p-2 -ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                title="Masalalar ro'yxatiga qaytish"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setActiveTab("description")}
                className={`px-3 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "description"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                Tavsif
              </button>
              <button
                onClick={() => setActiveTab("submissions")}
                className={`px-3 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "submissions"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Urinishlar {submissions.length > 0 && `(${submissions.length})`}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {currentUser && (["admin", "superadmin"].includes(currentUser.role) || p.author === currentUser.id || p.author_username === currentUser.username) && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  title="Boshqaruv panelida tahrirlash"
                >
                  <Edit className="w-3 h-3" />
                  Tahrirlash
                </Link>
              )}
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                p.difficulty === "Easy" || p.difficulty === "Oson"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                  : p.difficulty === "Medium" || p.difficulty === "O'rtacha"
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
              }`}>
                {p.difficulty === "Easy" ? "Oson" : p.difficulty === "Medium" ? "O'rtacha" : p.difficulty === "Hard" ? "Qiyin" : p.difficulty}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {activeTab === "description" && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {p.title_uz || p.title_en}
                  </h1>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                    <span>Yechganlar: {p.solved_count || 1200}</span>
                    <span>Qabul foizi: {p.acceptance_rate || 98}%</span>
                  </div>
                </div>

                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: p.statement_uz || p.statement_en }}
                />
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Mening urinishlarim tarixi
                </h3>
                {submissions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                    Ushbu masala bo'yicha hali yechim yuborilmagan.
                  </div>
                ) : (
                  submissions.map((sub, i) => (
                    <div
                      key={sub.id || i}
                      onClick={() => setSelectedSubmission(sub)}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer flex items-center justify-between text-xs group"
                    >
                      <div className="flex items-center gap-2.5">
                        {sub.status === "Accepted" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                        <div>
                          <span className={`font-bold ${sub.status === "Accepted" ? "text-emerald-600" : "text-rose-600"}`}>
                            {sub.status === "Accepted" ? "Qabul qilindi" : sub.status}
                          </span>
                          <span className="ml-2 text-[10px] text-slate-400 uppercase font-mono">
                            {sub.language || "python3"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                        <span>{sub.passed_cases}/{sub.total_cases} test</span>
                        <span>{sub.runtime_ms}ms</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">Batafsil &rarr;</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col bg-slate-900 text-white overflow-hidden">
          <div className="bg-slate-800/90 border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="python3">Python 3.11 (Faol)</option>
                <option value="cpp" disabled>C++ (Tez kunda / Unavailable)</option>
                <option value="java" disabled>Java (Tez kunda / Unavailable)</option>
                <option value="javascript" disabled>JavaScript (Tez kunda / Unavailable)</option>
              </select>

              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                title="Muharrir sozlamalari"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleResetCode}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                title="Dastlabki kodni qayta tiklash"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(codes[language] || "");
                  setCopiedEditorCode(true);
                  setTimeout(() => setCopiedEditorCode(false), 2000);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                title="Kodni nusxalash"
              >
                {copiedEditorCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRun}
                disabled={isRunning || isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current text-blue-400" />
                {isRunning ? "Bajarilmoqda..." : "Ishga tushirish"}
              </button>

              <button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                {isSubmitting ? "Yuborilmoqda..." : "Yuborish"}
              </button>
            </div>
          </div>

          <div className="flex-1 relative flex overflow-hidden">
            {editorSettings.showLineNumbers && (
              <div className="w-12 bg-slate-900/90 text-slate-600 font-mono text-xs select-none py-4 text-right pr-3 border-r border-slate-800 shrink-0 leading-relaxed overflow-hidden">
                {codeLines.map((_, i) => (
                  <div
                    key={i}
                    className={cursorPos.line === i + 1 ? "text-blue-400 font-bold" : ""}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            )}

            <div className="flex-1 relative flex overflow-hidden">
              <textarea
                ref={textareaRef}
                value={currentCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={updateCursor}
                onKeyUp={updateCursor}
                className={`flex-1 p-4 font-mono leading-relaxed resize-none focus:outline-none ${themeClasses}`}
                style={{ fontSize: `${editorSettings.fontSize || 14}px` }}
                spellCheck="false"
              />
            </div>
          </div>

          <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span>{language.toUpperCase()}</span>
              <span>{codeLines.length} qator</span>
              <span>{currentCode.length} belgi</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>Tab: {editorSettings.tabSize || 4}</span>
              <span>UTF-8</span>
            </div>
          </div>

          <div className="border-t border-slate-800 bg-slate-950 flex flex-col max-h-60">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Testlar paneli
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTestCaseTab("cases")}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                      testCaseTab === "cases"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Namunaviy testlar
                  </button>
                  <button
                    onClick={() => setTestCaseTab("custom")}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                      testCaseTab === "custom"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Maxsus kiritish (Custom)
                  </button>
                </div>
              </div>

              {runResult && (
                <div className="flex items-center gap-2 text-xs">
                  <span className={`font-bold ${
                    runResult.status === "Accepted"
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}>
                    {runResult.status === "Accepted" ? "Qabul qilindi (Accepted)" : runResult.status}
                  </span>
                  {runResult.runtime_ms !== undefined && (
                    <span className="text-slate-400 font-mono">({runResult.runtime_ms}ms)</span>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 overflow-y-auto space-y-2 text-xs font-mono">
              {testCaseTab === "cases" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {(p.sample_test_cases || []).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedCaseIdx(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          selectedCaseIdx === idx
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        {idx + 1}-test
                      </button>
                    ))}
                  </div>

                  {p.sample_test_cases && p.sample_test_cases[selectedCaseIdx] && (
                    <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Kiritish (Input):</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(p.sample_test_cases[selectedCaseIdx].input);
                              setCopiedInput(true);
                              setTimeout(() => setCopiedInput(false), 2000);
                            }}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            {copiedInput ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            {copiedInput ? "Nusxalandi" : "Nusxalash"}
                          </button>
                        </div>
                        <pre className="text-slate-200 mt-1 whitespace-pre-wrap">{p.sample_test_cases[selectedCaseIdx].input}</pre>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Kutilayotgan natija (Expected):</span>
                        <pre className="text-slate-200 mt-1 whitespace-pre-wrap">{p.sample_test_cases[selectedCaseIdx].output}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {testCaseTab === "custom" && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">O'zingizning test qiymatlaringiz:</span>
                  <textarea
                    rows={2}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="[2, 7, 11, 15]&#10;9"
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs resize-none focus:outline-none"
                  />
                </div>
              )}

              {runResult && (
                <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                  {runResult.actual_output && (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Sizning natijangiz:</span>
                      <pre className="text-emerald-400 mt-0.5">{runResult.actual_output}</pre>
                    </div>
                  )}
                  {(runResult.stderr || runResult.error || runResult.error_output) && (
                    <div>
                      <span className="text-[10px] text-rose-500 uppercase font-bold">Xatolik xabari:</span>
                      <pre className="text-rose-400 mt-0.5 whitespace-pre-wrap">{runResult.stderr || runResult.error || runResult.error_output}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm">Muharrir sozlamalari</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Shrift o'lchami (Font size)
                </label>
                <select
                  value={editorSettings.fontSize}
                  onChange={(e) => saveSettings({ ...editorSettings, fontSize: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value={12}>12px (Kichik)</option>
                  <option value={14}>14px (Standart)</option>
                  <option value={16}>16px (Katta)</option>
                  <option value={18}>18px (Juda katta)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tab oralig'i (Indentation)
                </label>
                <select
                  value={editorSettings.tabSize}
                  onChange={(e) => saveSettings({ ...editorSettings, tabSize: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value={2}>2 ta bo'sh joy</option>
                  <option value={4}>4 ta bo'sh joy</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Muharrir mavzusi (Theme)
                </label>
                <select
                  value={editorSettings.theme}
                  onChange={(e) => saveSettings({ ...editorSettings, theme: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="vs-dark">VS Dark (To'q qora)</option>
                  <option value="monokai">Monokai Pro</option>
                  <option value="github-dark">GitHub Dark</option>
                  <option value="light">Yorug' rejim (Light)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Qator raqamlarini ko'rsatish</span>
                <input
                  type="checkbox"
                  checked={editorSettings.showLineNumbers}
                  onChange={(e) => saveSettings({ ...editorSettings, showLineNumbers: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/25"
            >
              Tayyor
            </button>
          </div>
        </div>
      )}

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
                  <p className="text-xs text-slate-400">
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
