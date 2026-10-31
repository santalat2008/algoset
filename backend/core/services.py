import ast
import json
import os
import subprocess
import sys
import tempfile
import time
import zipfile
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from .models import (
    User,
    Contest,
    ContestParticipation,
    Submission,
    Problem,
    ProblemVersion,
    TestCase,
    TestGroup,
    ValidationRun,
    ValidationResult,
    VisibilityStatus,
)

BLOCKED_MODULES = {
    "os", "sys", "subprocess", "shutil", "socket", "pathlib", "builtins",
    "importlib", "pty", "commands", "posix", "nt", "resource", "ctypes", "winreg"
}
BLOCKED_CALLS = {"eval", "exec", "compile", "open", "__import__"}

TYPE_MAP_CPP = {
    "int": "int",
    "float": "double",
    "str": "string",
    "bool": "bool",
    "list[int]": "vector<int>",
    "list[float]": "vector<double>",
    "list[str]": "vector<string>",
    "list[bool]": "vector<bool>",
    "list[list[int]]": "vector<vector<int>>",
    "dict": "unordered_map<string, int>",
    "None": "void",
}

TYPE_MAP_JAVA = {
    "int": "int",
    "float": "double",
    "str": "String",
    "bool": "boolean",
    "list[int]": "int[]",
    "list[float]": "double[]",
    "list[str]": "String[]",
    "list[bool]": "boolean[]",
    "list[list[int]]": "int[][]",
    "dict": "Map<String, Object>",
    "None": "void",
}


def validate_code_safety(code: str) -> tuple[bool, str]:
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, f"Syntax Error: {e.msg}"

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_module = alias.name.split(".")[0]
                if root_module in BLOCKED_MODULES:
                    return False, f"Import of '{root_module}' is restricted."
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                root_module = node.module.split(".")[0]
                if root_module in BLOCKED_MODULES:
                    return False, f"Import from '{root_module}' is restricted."
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in BLOCKED_CALLS:
                return False, f"Call to '{node.func.id}' is restricted."
        elif isinstance(node, ast.Attribute):
            if node.attr in {"__subclasses__", "__bases__", "__globals__", "__code__", "__builtins__", "__import__"}:
                return False, f"Access to dangerous attribute '{node.attr}' is restricted."
    return True, ""


def send_verification_email(user: User) -> bool:
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    verify_url = f"{frontend_url}/verify-email?token={user.verification_token}"
    subject = "Verify your AlgoSet account"
    message = (
        f"Salom {user.username}!\n\n"
        f"Welcome to AlgoSet. Please verify your email using this token: {user.verification_token}\n"
        f"Or click: {verify_url}"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
    return True


def record_user_activity(user: User, is_accepted: bool = False):
    today = timezone.localdate()
    if user.last_active_date is None:
        user.streak_days = 1
    elif user.last_active_date == today - timedelta(days=1):
        user.streak_days += 1
    elif user.last_active_date < today - timedelta(days=1):
        user.streak_days = 1
    user.last_active_date = today
    if is_accepted:
        user.xp += 50
    user.save()


def generate_starter_templates(execution_mode: str, signature: dict = None) -> dict:
    if execution_mode == ProblemVersion.ExecutionMode.STANDARD_IO:
        return {
            "python3": "import sys\n\ndef solve():\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        return\n    # TODO: Yechimni yozing\n\nif __name__ == '__main__':\n    solve()\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // TODO: Yechimni yozing\n    return 0;\n}\n",
            "java": "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // TODO: Yechimni yozing\n    }\n}\n",
            "javascript": "const fs = require('fs');\n\nfunction solve() {\n    const input = fs.readFileSync(0, 'utf-8').trim();\n    // TODO: Yechimni yozing\n}\n\nsolve();\n",
        }

    sig = signature or {}
    fn_name = sig.get("name", "solve") or "solve"
    params = sig.get("params", []) or []
    ret_type = sig.get("return_type", "None") or "None"

    py_params = ", ".join(f"{p.get('name', 'arg')}: {p.get('type', 'str')}" for p in params)
    py_code = f"class Solution:\n    def {fn_name}(self, {py_params}) -> {ret_type}:\n        pass\n"

    cpp_ret = TYPE_MAP_CPP.get(ret_type, "void")
    cpp_params = []
    for p in params:
        t = p.get("type", "str")
        cpp_t = TYPE_MAP_CPP.get(t, "auto")
        if "vector" in cpp_t or cpp_t == "string":
            cpp_params.append(f"{cpp_t}& {p.get('name', 'arg')}")
        else:
            cpp_params.append(f"{cpp_t} {p.get('name', 'arg')}")
    cpp_params_str = ", ".join(cpp_params)
    cpp_code = f"#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {{\npublic:\n    {cpp_ret} {fn_name}({cpp_params_str}) {{\n        \n    }}\n}};\n"

    java_ret = TYPE_MAP_JAVA.get(ret_type, "void")
    java_params = ", ".join(f"{TYPE_MAP_JAVA.get(p.get('type', 'str'), 'Object')} {p.get('name', 'arg')}" for p in params)
    java_code = f"class Solution {{\n    public {java_ret} {fn_name}({java_params}) {{\n        \n    }}\n}}\n"

    js_doc_params = "\n".join(f" * @param {{{p.get('type', 'any')}}} {p.get('name', 'arg')}" for p in params)
    js_param_names = ", ".join(p.get("name", "arg") for p in params)
    js_code = f"/**\n{js_doc_params}\n * @return {{{ret_type}}}\n */\nvar {fn_name} = function({js_param_names}) {{\n    \n}};\n"

    return {
        "python3": py_code,
        "cpp": cpp_code,
        "java": java_code,
        "javascript": js_code,
    }


def _build_test_harness(code: str, execution_mode: str = "function", function_name: str = None) -> str:
    if execution_mode == "standard_io":
        return f"""
import sys
{code}
"""

    fn_target = f'"{function_name}"' if function_name else "None"
    return f"""
import sys
import json

{code}

def _normalize(val):
    if val is None:
        return ""
    if isinstance(val, (list, tuple, dict)):
        return json.dumps(val)
    return str(val).strip()

def _run():
    raw_input = sys.stdin.read()
    target_fn = {fn_target}
    if "Solution" in globals() and isinstance(globals()["Solution"], type):
        sol = globals()["Solution"]()
        methods = [m for m in dir(sol) if not m.startswith("_") and callable(getattr(sol, m))]
        fn = None
        if target_fn and hasattr(sol, target_fn) and callable(getattr(sol, target_fn)):
            fn = getattr(sol, target_fn)
        elif methods:
            fn = getattr(sol, methods[0])

        if fn:
            lines = [l for l in raw_input.strip().splitlines() if l.strip()]
            args = []
            for line in lines:
                try:
                    args.append(json.loads(line))
                except Exception:
                    parts = line.split()
                    if len(parts) == 1:
                        try:
                            args.append(int(parts[0]))
                        except Exception:
                            args.append(parts[0])
                    else:
                        args.append(line)
            try:
                res = fn(*args)
                if res is not None:
                    print(_normalize(res))
                return
            except TypeError:
                flat_tokens = raw_input.strip().split()
                converted_args = []
                for tok in flat_tokens:
                    try:
                        converted_args.append(json.loads(tok))
                    except Exception:
                        try:
                            converted_args.append(int(tok))
                        except Exception:
                            try:
                                converted_args.append(float(tok))
                            except Exception:
                                converted_args.append(tok)
                try:
                    res = fn(*converted_args)
                    if res is not None:
                        print(_normalize(res))
                    return
                except TypeError:
                    try:
                        res = fn(raw_input)
                        if res is not None:
                            print(_normalize(res))
                        return
                    except Exception as e:
                        sys.stderr.write(str(e))
                        sys.exit(1)
                except Exception as e:
                    sys.stderr.write(str(e))
                    sys.exit(1)
            except Exception as e:
                sys.stderr.write(str(e))
                sys.exit(1)

    if "solve" in globals() and callable(globals()["solve"]):
        try:
            res = globals()["solve"](raw_input)
            if res is not None:
                print(_normalize(res))
            return
        except Exception as e:
            sys.stderr.write(str(e))
            sys.exit(1)

if __name__ == "__main__":
    _run()
"""


def _execute_case(harness_path: str, inp_data: str, timeout: float = 2.0):
    start_time = time.time()
    bounded_timeout = max(0.1, min(float(timeout or 2.0), 5.0))
    if inp_data and len(inp_data) > 100000:
        inp_data = inp_data[:100000]

    safe_env = {
        "PATH": "/usr/local/bin:/usr/bin:/bin",
        "LC_ALL": "C.UTF-8",
        "LANG": "C.UTF-8",
        "PYTHONIOENCODING": "utf-8",
    }
    try:
        proc = subprocess.run(
            [sys.executable, "-I", harness_path],
            input=inp_data,
            text=True,
            capture_output=True,
            timeout=bounded_timeout,
            env=safe_env,
        )
        duration_ms = int((time.time() - start_time) * 1000)
        stdout_bounded = proc.stdout[:50000].strip()
        stderr_bounded = proc.stderr[:10000].strip()
        return proc.returncode, stdout_bounded, stderr_bounded, duration_ms
    except subprocess.TimeoutExpired:
        duration_ms = int((time.time() - start_time) * 1000)
        return -1, "", "Time Limit Exceeded", duration_ms


def _deep_type_aware_compare(act, exp, tol=1e-6) -> bool:
    if isinstance(act, (int, float)) and isinstance(exp, (int, float)):
        diff = abs(float(act) - float(exp))
        return diff <= tol or diff <= (tol * abs(float(exp)))
    if isinstance(act, list) and isinstance(exp, list):
        if len(act) != len(exp):
            return False
        return all(_deep_type_aware_compare(a, e, tol) for a, e in zip(act, exp))
    if isinstance(act, dict) and isinstance(exp, dict):
        if set(act.keys()) != set(exp.keys()):
            return False
        return all(_deep_type_aware_compare(act[k], exp[k], tol) for k in exp.keys())
    return str(act).strip() == str(exp).strip()


def run_custom_checker(checker_code: str, input_data: str, expected_output: str, actual_output: str, timeout: float = 2.0) -> tuple[bool, str]:
    is_safe, err = validate_code_safety(checker_code)
    if not is_safe:
        return False, f"Xavfsizlik cheklovi: {err}"

    payload = json.dumps({
        "input": input_data,
        "expected": expected_output,
        "actual": actual_output,
    })

    checker_harness = f"""
import sys
import json

{checker_code}

def _main():
    data = json.loads(sys.stdin.read())
    inp = data.get("input", "")
    exp = data.get("expected", "")
    act = data.get("actual", "")
    try:
        if "check" in globals() and callable(globals()["check"]):
            res = globals()["check"](inp, exp, act)
            if isinstance(res, tuple):
                ok = bool(res[0])
                msg = str(res[1]) if len(res) > 1 else ""
            else:
                ok = bool(res)
                msg = "Accepted" if ok else "Wrong Answer"
            print(json.dumps({{"ok": ok, "msg": msg}}))
        else:
            print(json.dumps({{"ok": False, "msg": "Checker funksiyasi 'check(inp, exp, act)' topilmadi"}}))
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)

if __name__ == "__main__":
    _main()
"""
    tmp = tempfile.NamedTemporaryFile("w", suffix=".py", delete=False)
    try:
        tmp.write(checker_harness)
        tmp.close()
        code, stdout, stderr, _ = _execute_case(tmp.name, payload, timeout=timeout)
        if code != 0:
            return False, f"Tekshiruvchi xatosi (Checker Error): {stderr[:200]}"
        try:
            res_obj = json.loads(stdout.strip())
            return res_obj.get("ok", False), res_obj.get("msg", "")
        except Exception:
            return False, f"Tekshiruvchidan noto'g'ri javob formati: {stdout[:100]}"
    finally:
        if os.path.exists(tmp.name):
            try:
                os.remove(tmp.name)
            except OSError:
                pass


def compare_outputs(
    actual: str,
    expected: str,
    checker_type: str = "exact",
    float_tolerance: float = 1e-6,
    custom_checker_code: str = "",
    input_data: str = "",
) -> tuple[bool, str]:
    act = actual.strip()
    exp = expected.strip()

    if checker_type == "exact":
        if act == exp:
            return True, "Mos keldi (Exact Match)"
        return False, f"Kutilgan: '{exp}', Olingan: '{act}'"

    elif checker_type == "normalized":
        if act.split() == exp.split():
            return True, "Mos keldi (Normalized)"
        return False, f"Tokenlar mos kelmadi: Kutilgan: '{exp}', Olingan: '{act}'"

    elif checker_type == "float_tolerance":
        act_tokens = act.split()
        exp_tokens = exp.split()
        if len(act_tokens) != len(exp_tokens):
            return False, f"Sonlar miqdori mos kelmadi: Kutilgan {len(exp_tokens)} ta, olingan {len(act_tokens)} ta"
        for a_tok, e_tok in zip(act_tokens, exp_tokens):
            try:
                a_num = float(a_tok)
                e_num = float(e_tok)
                diff = abs(a_num - e_num)
                if diff > float_tolerance and diff > (float_tolerance * abs(e_num)):
                    return False, f"Xatolik chegarasi oshdi: {e_tok} o'rniga {a_tok} (farq: {diff})"
            except ValueError:
                if a_tok != e_tok:
                    return False, f"Satrlar mos kelmadi: '{e_tok}' != '{a_tok}'"
        return True, "Mos keldi (Float Tolerance)"

    elif checker_type == "type_aware":
        try:
            a_json = json.loads(act)
            e_json = json.loads(exp)
            if _deep_type_aware_compare(a_json, e_json, float_tolerance):
                return True, "Mos keldi (Type-Aware)"
            return False, f"Tuzilma mos kelmadi: Kutilgan: {exp}, Olingan: {act}"
        except Exception:
            if act.split() == exp.split():
                return True, "Mos keldi"
            return False, f"Kutilgan: '{exp}', Olingan: '{act}'"

    elif checker_type == "custom":
        if not custom_checker_code.strip():
            return (act == exp), f"Kutilgan: '{exp}', Olingan: '{act}'"
        return run_custom_checker(custom_checker_code, input_data, expected, actual)

    return (act == exp), f"Kutilgan: '{exp}', Olingan: '{act}'"


NON_PYTHON_BLOCKED = {"system(", "popen(", "execve(", "fork(", "Runtime.getRuntime", "child_process", "kill("}


def run_code(
    code: str,
    custom_input: str = None,
    sample_test_cases: list = None,
    language: str = "python3",
    problem: Problem = None,
) -> dict:
    if getattr(settings, "ENABLE_CODE_EXECUTION", True) is False:
        msg = "Kod ijrosi ma'muriyat tomonidan vaqtincha to'xtatilgan (Code execution disabled)."
        return {
            "status": Submission.Status.RUNTIME_ERROR,
            "passed": 0,
            "total": len(sample_test_cases or [1]),
            "runtime_ms": 0,
            "actual_output": "",
            "expected_output": "",
            "error": msg,
            "stderr": msg,
            "cases": [],
        }

    if language != "python3":
        msg = f"'{language}' dasturlash tili hozirda ijro etilmaydi. MVP bosqichida faqat Python 3 (python3) qo'llab-quvvatlanadi. Boshqa tillar tez kunda qo'shiladi."
        return {
            "status": Submission.Status.RUNTIME_ERROR,
            "passed": 0,
            "total": len(sample_test_cases or [1]),
            "runtime_ms": 0,
            "actual_output": "",
            "expected_output": "",
            "error": msg,
            "stderr": msg,
            "cases": [],
        }

    if len(code) > 65536:
        msg = "Kod hajmi ruxsat etilgan maksimal chegaradan oshdi (max 64 KB)."
        return {
            "status": Submission.Status.RUNTIME_ERROR,
            "passed": 0,
            "total": len(sample_test_cases or [1]),
            "runtime_ms": 0,
            "actual_output": "",
            "expected_output": "",
            "error": msg,
            "stderr": msg,
            "cases": [],
        }

    is_safe, error_msg = validate_code_safety(code)
    if not is_safe:
        return {
            "status": Submission.Status.RUNTIME_ERROR,
            "passed": 0,
            "total": 1,
            "runtime_ms": 0,
            "actual_output": "",
            "expected_output": "",
            "error": error_msg,
            "stderr": error_msg,
            "cases": [],
        }

    mode = "function"
    fn_name = None
    checker_type = "exact"
    float_tol = 1e-6
    custom_checker = ""

    if problem:
        v = problem.published_version or problem.latest_version
        if v:
            mode = v.execution_mode
            fn_name = v.function_signature.get("name") if isinstance(v.function_signature, dict) else None
            checker_type = v.checker_type
            float_tol = v.float_tolerance
            custom_checker = v.custom_checker_code

    harness = _build_test_harness(code, execution_mode=mode, function_name=fn_name)
    tmp = tempfile.NamedTemporaryFile("w", suffix=".py", delete=False)
    try:
        tmp.write(harness)
        tmp.close()

        if custom_input is not None:
            returncode, stdout, stderr, ms = _execute_case(tmp.name, str(custom_input))
            if returncode == -1:
                return {
                    "status": Submission.Status.TIME_LIMIT,
                    "passed": 0,
                    "total": 1,
                    "runtime_ms": ms,
                    "actual_output": "",
                    "expected_output": "",
                    "error": "Time Limit Exceeded (2.0s)",
                    "cases": [],
                }
            if returncode != 0:
                return {
                    "status": Submission.Status.RUNTIME_ERROR,
                    "passed": 0,
                    "total": 1,
                    "runtime_ms": ms,
                    "actual_output": stdout,
                    "expected_output": "",
                    "error": stderr[:300],
                    "cases": [],
                }
            return {
                "status": Submission.Status.ACCEPTED,
                "passed": 1,
                "total": 1,
                "runtime_ms": ms,
                "actual_output": stdout,
                "expected_output": "",
                "error": "",
                "cases": [{"input": custom_input, "output": stdout}],
            }

        cases = sample_test_cases or []
        passed = 0
        total_ms = 0
        cases_results = []
        for idx, case in enumerate(cases):
            inp = str(case.get("input", ""))
            exp = str(case.get("output", "")).strip()
            returncode, stdout, stderr, ms = _execute_case(tmp.name, inp)
            total_ms = max(total_ms, ms)
            if returncode == -1:
                return {
                    "status": Submission.Status.TIME_LIMIT,
                    "passed": passed,
                    "total": len(cases),
                    "runtime_ms": total_ms,
                    "actual_output": "",
                    "expected_output": exp,
                    "error": f"Case #{idx + 1}: Time Limit Exceeded",
                    "cases": cases_results,
                }
            if returncode != 0:
                return {
                    "status": Submission.Status.RUNTIME_ERROR,
                    "passed": passed,
                    "total": len(cases),
                    "runtime_ms": total_ms,
                    "actual_output": stdout,
                    "expected_output": exp,
                    "error": stderr[:300],
                    "cases": cases_results,
                }

            is_correct, comp_msg = compare_outputs(
                stdout, exp,
                checker_type=checker_type,
                float_tolerance=float_tol,
                custom_checker_code=custom_checker,
                input_data=inp
            )

            if is_correct:
                passed += 1
                cases_results.append({"case": idx + 1, "status": "Passed", "input": inp, "output": stdout, "expected": exp})
            else:
                cases_results.append({"case": idx + 1, "status": "Failed", "input": inp, "output": stdout, "expected": exp})
                return {
                    "status": Submission.Status.WRONG_ANSWER,
                    "passed": passed,
                    "total": len(cases),
                    "runtime_ms": total_ms,
                    "actual_output": stdout,
                    "expected_output": exp,
                    "error": comp_msg,
                    "cases": cases_results,
                }

        return {
            "status": Submission.Status.ACCEPTED,
            "passed": passed,
            "total": len(cases),
            "runtime_ms": total_ms,
            "actual_output": cases_results[-1]["output"] if cases_results else "",
            "expected_output": cases_results[-1]["expected"] if cases_results else "",
            "error": "",
            "cases": cases_results,
        }
    finally:
        if os.path.exists(tmp.name):
            try:
                os.remove(tmp.name)
            except OSError:
                pass


def evaluate_submission(
    code: str,
    test_cases: list,
    language: str = "python3",
    problem: Problem = None,
) -> dict:
    if getattr(settings, "ENABLE_CODE_EXECUTION", True) is False:
        msg = "Kod ijrosi ma'muriyat tomonidan vaqtincha to'xtatilgan (Code execution disabled)."
        return {
            "status": Submission.Status.RUNTIME_ERROR,
            "passed": 0,
            "total": len(test_cases),
            "runtime_ms": 0,
            "error": msg,
            "stderr": msg,
        }

    if language != "python3":
        msg = f"'{language}' dasturlash tili hozirda ijro etilmaydi. MVP bosqichida faqat Python 3 (python3) qo'llab-quvvatlanadi. Boshqa tillar tez kunda qo'shiladi."
        return {
            "status": Submission.Status.RUNTIME_ERROR,
            "passed": 0,
            "total": len(test_cases),
            "runtime_ms": 0,
            "error": msg,
            "stderr": msg,
        }

    if len(code) > 65536:
        msg = "Kod hajmi ruxsat etilgan maksimal chegaradan oshdi (max 64 KB)."
        return {
            "status": Submission.Status.RUNTIME_ERROR,
            "passed": 0,
            "total": len(test_cases),
            "runtime_ms": 0,
            "error": msg,
            "stderr": msg,
        }

    is_safe, error_msg = validate_code_safety(code)
    if not is_safe:
        return {
            "status": Submission.Status.RUNTIME_ERROR,
            "passed": 0,
            "total": len(test_cases),
            "runtime_ms": 0,
            "error": error_msg,
            "stderr": error_msg,
        }

    total = len(test_cases)
    if total == 0:
        return {
            "status": Submission.Status.ACCEPTED,
            "passed": 0,
            "total": 0,
            "runtime_ms": 0,
            "error": "",
        }

    mode = "function"
    fn_name = None
    checker_type = "exact"
    float_tol = 1e-6
    custom_checker = ""

    if problem:
        v = problem.published_version or problem.latest_version
        if v:
            mode = v.execution_mode
            fn_name = v.function_signature.get("name") if isinstance(v.function_signature, dict) else None
            checker_type = v.checker_type
            float_tol = v.float_tolerance
            custom_checker = v.custom_checker_code

    harness = _build_test_harness(code, execution_mode=mode, function_name=fn_name)
    passed = 0
    total_ms = 0
    tmp = tempfile.NamedTemporaryFile("w", suffix=".py", delete=False)
    try:
        tmp.write(harness)
        tmp.close()

        for case in test_cases:
            inp = str(case.get("input", ""))
            exp = str(case.get("output", "")).strip()
            returncode, stdout, stderr, ms = _execute_case(tmp.name, inp)
            total_ms = max(total_ms, ms)

            if returncode == -1:
                return {
                    "status": Submission.Status.TIME_LIMIT,
                    "passed": passed,
                    "total": total,
                    "runtime_ms": total_ms,
                    "error": "Time Limit Exceeded",
                }
            if returncode != 0:
                return {
                    "status": Submission.Status.RUNTIME_ERROR,
                    "passed": passed,
                    "total": total,
                    "runtime_ms": total_ms,
                    "error": stderr[:300],
                }

            is_correct, comp_msg = compare_outputs(
                stdout, exp,
                checker_type=checker_type,
                float_tolerance=float_tol,
                custom_checker_code=custom_checker,
                input_data=inp,
            )

            if is_correct:
                passed += 1
            else:
                return {
                    "status": Submission.Status.WRONG_ANSWER,
                    "passed": passed,
                    "total": total,
                    "runtime_ms": total_ms,
                    "error": comp_msg,
                }

        return {
            "status": Submission.Status.ACCEPTED,
            "passed": passed,
            "total": total,
            "runtime_ms": total_ms,
            "error": "",
        }
    finally:
        if os.path.exists(tmp.name):
            try:
                os.remove(tmp.name)
            except OSError:
                pass


def validate_problem_version(
    version: ProblemVersion,
    reference_code: str = None,
    wrong_code: str = None,
    user: User = None,
) -> ValidationRun:
    if getattr(settings, "ENABLE_CODE_EXECUTION", True) is False:
        run = ValidationRun.objects.create(
            version=version,
            initiated_by=user,
            reference_solution=reference_code or version.reference_solution or "",
            status=ValidationRun.Status.FAILED,
            summary="Kod ijrosi ma'muriyat tomonidan vaqtincha to'xtatilgan (Code execution disabled). Ishlab chiqarish rejimida xavfsiz izolyatsiyalangan runner talab etiladi.",
        )
        return run

    ref_code = reference_code or version.reference_solution
    if not ref_code or not ref_code.strip():
        run = ValidationRun.objects.create(
            version=version,
            initiated_by=user,
            reference_solution="",
            status=ValidationRun.Status.FAILED,
            summary="Referens yechim kodi kiritilmagan. Validatsiyadan oldin to'g'ri yechim kiriting."
        )
        return run

    starter_valid = True
    starter_err = ""
    py_starter = version.starter_templates.get("python3") or version.problem.starter_code
    if py_starter:
        s_safe, s_msg = validate_code_safety(py_starter)
        if not s_safe:
            starter_valid = False
            starter_err = s_msg

    checker_valid = True
    checker_err = ""
    if version.checker_type == ProblemVersion.CheckerType.CUSTOM and version.custom_checker_code.strip():
        c_safe, c_msg = validate_code_safety(version.custom_checker_code)
        if not c_safe:
            checker_valid = False
            checker_err = c_msg

    test_cases = list(version.test_cases.all().order_by("order", "id"))
    run = ValidationRun.objects.create(
        version=version,
        initiated_by=user,
        reference_solution=ref_code,
        status=ValidationRun.Status.RUNNING,
        total_cases=len(test_cases),
        passed_cases=0,
        starter_code_valid=starter_valid,
        checker_valid=checker_valid,
    )

    if not starter_valid:
        run.status = ValidationRun.Status.FAILED
        run.summary = f"Boshlang'ich kodda sintaktik yoki xavfsizlik xatoligi: {starter_err}"
        run.completed_at = timezone.now()
        run.save()
        return run

    if not checker_valid:
        run.status = ValidationRun.Status.FAILED
        run.summary = f"Custom tekshiruvchi kodida xavfsizlik xatoligi: {checker_err}"
        run.completed_at = timezone.now()
        run.save()
        return run

    if len(test_cases) == 0:
        run.status = ValidationRun.Status.FAILED
        run.summary = "Validatsiya qilish uchun kamida bitta test keys kerak."
        run.completed_at = timezone.now()
        run.save()
        return run

    r_safe, r_msg = validate_code_safety(ref_code)
    if not r_safe:
        run.status = ValidationRun.Status.FAILED
        run.summary = f"Referens yechimda xavfsizlik cheklovi: {r_msg}"
        run.completed_at = timezone.now()
        run.save()
        return run

    mode = version.execution_mode
    fn_name = version.function_signature.get("name") if isinstance(version.function_signature, dict) else None
    harness = _build_test_harness(ref_code, execution_mode=mode, function_name=fn_name)
    tmp = tempfile.NamedTemporaryFile("w", suffix=".py", delete=False)
    passed_count = 0

    try:
        tmp.write(harness)
        tmp.close()

        for case in test_cases:
            timeout_sec = (case.time_limit_override_ms or version.time_limit_ms) / 1000.0
            returncode, stdout, stderr, ms = _execute_case(tmp.name, case.input_data, timeout=timeout_sec)

            case_status = "Passed"
            error_msg = ""

            if returncode == -1:
                case_status = "Time Limit Exceeded"
                error_msg = f"Vaqt chegarasidan oshdi ({timeout_sec}s)"
            elif returncode != 0:
                case_status = "Runtime Error"
                error_msg = stderr[:300]
            else:
                expected = case.expected_output
                is_correct, comp_msg = compare_outputs(
                    actual=stdout,
                    expected=expected,
                    checker_type=version.checker_type,
                    float_tolerance=version.float_tolerance,
                    custom_checker_code=version.custom_checker_code,
                    input_data=case.input_data,
                )
                if is_correct:
                    case_status = "Passed"
                    passed_count += 1
                else:
                    case_status = "Wrong Answer"
                    error_msg = comp_msg

            ValidationResult.objects.create(
                run=run,
                test_case=case,
                case_order=case.order,
                is_sample=case.is_sample,
                status=case_status,
                runtime_ms=ms,
                actual_output=stdout[:5000],
                expected_output=case.expected_output[:5000],
                error_message=error_msg[:1000],
            )

        run.passed_cases = passed_count
        if passed_count == len(test_cases):
            wrong_check_passed = True
            if wrong_code and wrong_code.strip():
                w_harness = _build_test_harness(wrong_code, execution_mode=mode, function_name=fn_name)
                w_tmp = tempfile.NamedTemporaryFile("w", suffix=".py", delete=False)
                try:
                    w_tmp.write(w_harness)
                    w_tmp.close()
                    any_wrong_failed = False
                    for case in test_cases:
                        w_ret, w_out, _, _ = _execute_case(w_tmp.name, case.input_data, timeout=2.0)
                        if w_ret != 0:
                            any_wrong_failed = True
                            break
                        is_corr, _ = compare_outputs(
                            w_out, case.expected_output,
                            checker_type=version.checker_type,
                            float_tolerance=version.float_tolerance,
                            custom_checker_code=version.custom_checker_code,
                            input_data=case.input_data,
                        )
                        if not is_corr:
                            any_wrong_failed = True
                            break
                    if not any_wrong_failed:
                        wrong_check_passed = False
                        run.summary = "Salbiy test xatoligi: Xato deb taqdim etilgan yechim barcha testlardan o'tib ketdi."
                finally:
                    if os.path.exists(w_tmp.name):
                        try:
                            os.remove(w_tmp.name)
                        except OSError:
                            pass

            if wrong_check_passed:
                run.status = ValidationRun.Status.PASSED
                run.summary = f"Barcha {passed_count}/{len(test_cases)} ta test muvaffaqiyatli tekshirildi. Masala nashrga tayyor!"
                version.status = ProblemVersion.Status.READY_FOR_REVIEW
                version.save()
            else:
                run.status = ValidationRun.Status.FAILED
        else:
            run.status = ValidationRun.Status.FAILED
            run.summary = f"{len(test_cases)} ta testdan {passed_count} tasi o'tdi. {len(test_cases) - passed_count} ta testda xatolik yuz berdi."

        run.completed_at = timezone.now()
        run.save()
        return run
    finally:
        if os.path.exists(tmp.name):
            try:
                os.remove(tmp.name)
            except OSError:
                pass


def generate_testcase_outputs(version: ProblemVersion, reference_code: str = None) -> list[dict]:
    ref_code = reference_code or version.reference_solution
    if not ref_code or not ref_code.strip():
        raise ValueError("Referens yechim kodi bo'sh bo'lishi mumkin emas.")

    is_safe, err = validate_code_safety(ref_code)
    if not is_safe:
        raise ValueError(f"Referens yechimda xavfsizlik cheklovi: {err}")

    mode = version.execution_mode
    fn_name = version.function_signature.get("name") if isinstance(version.function_signature, dict) else None
    harness = _build_test_harness(ref_code, execution_mode=mode, function_name=fn_name)

    tmp = tempfile.NamedTemporaryFile("w", suffix=".py", delete=False)
    results = []
    try:
        tmp.write(harness)
        tmp.close()

        for case in version.test_cases.all().order_by("order", "id"):
            timeout_sec = (case.time_limit_override_ms or version.time_limit_ms) / 1000.0
            returncode, stdout, stderr, ms = _execute_case(tmp.name, case.input_data, timeout=timeout_sec)
            if returncode == 0:
                case.expected_output = stdout
                case.save(update_fields=["expected_output"])
                results.append({"id": case.id, "order": case.order, "output": stdout, "success": True})
            else:
                results.append({"id": case.id, "order": case.order, "error": stderr[:200] or "Execution failed", "success": False})
        return results
    finally:
        if os.path.exists(tmp.name):
            try:
                os.remove(tmp.name)
            except OSError:
                pass


def import_testcases_from_zip(
    version: ProblemVersion,
    zip_file,
    is_sample: bool = False,
    group_name: str = None,
) -> list[TestCase]:
    if not zipfile.is_zipfile(zip_file):
        raise ValueError("Yuborilgan fayl to'g'ri ZIP formatida emas.")

    created_cases = []
    group = None
    if group_name:
        group, _ = TestGroup.objects.get_or_create(version=version, name=group_name)

    with zipfile.ZipFile(zip_file, "r") as zf:
        file_list = zf.namelist()
        if len(file_list) > 500:
            raise ValueError("Xavfsizlik cheklovi: ZIP ichida juda ko'p fayllar mavjud (maksimal 500 ta).")
        total_size = sum(zf.getinfo(name).file_size for name in file_list)
        if total_size > 25 * 1024 * 1024:
            raise ValueError("Xavfsizlik cheklovi: ZIP faylning umumiy hajmi 25 MB dan oshmasligi kerak.")
        for name in file_list:
            if zf.getinfo(name).file_size > 5 * 1024 * 1024:
                raise ValueError(f"Xavfsizlik cheklovi: '{name}' fayli hajmi 5 MB dan oshmasligi kerak.")
            if ".." in name or name.startswith("/") or name.startswith("\\"):
                raise ValueError(f"Xavfsizlik cheklovi: ZIP ichida xavfli fayl yo'li aniqlandi ('{name}').")

        if "tests.json" in file_list:
            data = json.loads(zf.read("tests.json").decode("utf-8"))
            if not isinstance(data, list):
                raise ValueError("'tests.json' fayli testlar ro'yxati (array) bo'lishi kerak.")
            curr_order = version.test_cases.count() + 1
            with transaction.atomic():
                for item in data:
                    tc = TestCase.objects.create(
                        version=version,
                        group=group,
                        input_data=item.get("input", ""),
                        expected_output=item.get("output", ""),
                        is_sample=item.get("is_sample", is_sample),
                        explanation=item.get("explanation", ""),
                        order=curr_order,
                    )
                    curr_order += 1
                    created_cases.append(tc)
            return created_cases

        in_files = {}
        out_files = {}
        for name in file_list:
            if name.endswith("/") or name.endswith("\\") or name.startswith("__MACOSX"):
                continue
            base = os.path.basename(name)
            lower = base.lower()
            if any(lower.endswith(ext) for ext in [".in", ".input", ".in.txt"]):
                key = base.split(".")[0].replace("input", "").replace("in_", "").replace("in", "").strip("_- ")
                in_files[key or base] = name
            elif any(lower.endswith(ext) for ext in [".out", ".output", ".ans", ".out.txt"]):
                key = base.split(".")[0].replace("output", "").replace("out_", "").replace("out", "").replace("ans", "").strip("_- ")
                out_files[key or base] = name

        keys = sorted(in_files.keys())
        curr_order = version.test_cases.count() + 1
        with transaction.atomic():
            for key in keys:
                in_name = in_files[key]
                out_name = out_files.get(key)

                in_content = zf.read(in_name).decode("utf-8", errors="replace")
                out_content = zf.read(out_name).decode("utf-8", errors="replace") if out_name else ""

                tc = TestCase.objects.create(
                    version=version,
                    group=group,
                    input_data=in_content,
                    expected_output=out_content,
                    is_sample=is_sample,
                    order=curr_order,
                )
                curr_order += 1
                created_cases.append(tc)

    return created_cases


def publish_problem_version(version: ProblemVersion, user: User = None) -> ProblemVersion:
    latest_run = version.validation_runs.first()
    if not latest_run or latest_run.status != ValidationRun.Status.PASSED:
        raise ValueError("Masalani nashr qilishdan oldin validatsiyadan to'liq o'tkazish shart.")

    if version.test_cases.count() == 0:
        raise ValueError("Masalada kamida 1 ta test keys bo'lishi shart.")

    with transaction.atomic():
        version.problem.versions.filter(is_published=True).update(is_published=False)
        version.is_published = True
        version.status = ProblemVersion.Status.PUBLISHED
        version.save()

        problem = version.problem
        if version.statement_uz:
            problem.statement_uz = version.statement_uz
        if version.statement_en:
            problem.statement_en = version.statement_en

        if version.starter_templates.get("python3"):
            problem.starter_code = version.starter_templates["python3"]

        sample_cases = []
        hidden_cases = []
        for tc in version.test_cases.all().order_by("order", "id"):
            c_dict = {
                "input": tc.input_data,
                "output": tc.expected_output,
            }
            if tc.explanation:
                c_dict["explanation"] = tc.explanation
            if tc.is_sample:
                sample_cases.append(c_dict)
            else:
                hidden_cases.append(c_dict)

        problem.sample_test_cases = sample_cases
        problem.hidden_test_cases = hidden_cases
        problem.visibility = VisibilityStatus.PUBLIC
        problem.save()

    return version


def calculate_elo_delta(rating_a: int, rating_b: int, actual_score: float, k: int = 32) -> int:
    expected_a = 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400.0))
    return round(k * (actual_score - expected_a))


def update_contest_ratings(contest: Contest) -> list:
    if not contest.is_rated or contest.ratings_calculated or contest.visibility != VisibilityStatus.PUBLIC:
        return []

    participations = list(
        ContestParticipation.objects.filter(contest=contest)
        .select_related("user")
        .order_by("-score", "penalty_minutes", "id")
    )
    n = len(participations)
    if n == 0:
        return []

    for idx, p in enumerate(participations):
        p.rank = idx + 1
        p.rating_before = p.user.rating

    if n == 1:
        p = participations[0]
        p.rating_after = p.rating_before
        p.save()
        contest.ratings_calculated = True
        contest.save()
        return participations

    deltas = [0] * n
    for i in range(n):
        total_delta = 0
        for j in range(n):
            if i == j:
                continue
            if participations[i].rank < participations[j].rank:
                score_ij = 1.0
            elif participations[i].rank > participations[j].rank:
                score_ij = 0.0
            else:
                score_ij = 0.5
            total_delta += calculate_elo_delta(
                participations[i].rating_before,
                participations[j].rating_before,
                score_ij,
                k=max(16, 48 // max(1, n - 1)),
            )
        deltas[i] = total_delta

    for i, p in enumerate(participations):
        p.rating_after = max(800, p.rating_before + deltas[i])
        p.save()
        user = p.user
        user.rating = p.rating_after
        user.max_rating = max(user.max_rating, user.rating)
        user.save()

    contest.ratings_calculated = True
    contest.save()
    return participations


run_python_code = run_code
evaluate_python_submission = evaluate_submission
