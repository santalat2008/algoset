# AlgoSet — Comprehensive Production-Readiness Security Audit Report

**Date:** 2026-10-31  
**Auditor:** Senior Application Security Engineer, DevSecOps Engineer & Backend Security Architect  
**Classification:** STRICT AUDIT & REMEDIATION REPORT  
**Target Codebase:** `D:\Santalat\algo_set` (Django REST Framework + Next.js 14 + PostgreSQL)

---

## 1. Executive Summary

A comprehensive application security and production-readiness audit was performed on the AlgoSet platform before public production release. The audit covered frontend components, backend views, serializers, authentication workflows, authorization and role enforcement, code execution boundaries, rate limiting, and archive/upload handling.

During the audit, multiple critical and high-severity security vulnerabilities and development shortcuts were identified, including hardcoded credentials with one-click administrator login buttons in the UI, verification token leakage in authentication endpoints, data exposure of private draft topics to unauthenticated visitors, and unvalidated password updating.

All confirmed code-level vulnerabilities have been remediated with minimal, targeted changes. A dedicated security test suite (`AlgoSetProductionSecurityHardeningTests`) with 7 new regression tests was introduced, and all 53 backend unit, integration, and security tests passed with zero errors (100% pass rate).

---

## 2. All Discovered Vulnerabilities & Classification

| # | Vulnerability Description | Severity | Status | Affected Files |
|---|---|---|---|---|
| 1 | Hardcoded Administrator & Student Quick-Login Buttons in UI | **CRITICAL** | **FIXED** | `frontend/src/components/AuthModal.jsx`, `frontend/src/app/profile/page.jsx`, `frontend/src/app/progress/page.jsx` |
| 2 | Secret Verification Token Leakage in Resend Verification API | **HIGH** | **FIXED** | `backend/core/views.py`, `frontend/src/lib/api.js` |
| 3 | Information Disclosure: Private & Draft Topics Exposed to Public & Students | **MEDIUM** | **FIXED** | `backend/core/views.py` |
| 4 | Insecure Password Change Without Current Password or Complexity Validation | **MEDIUM** | **FIXED** | `backend/core/views.py` |
| 5 | Missing Rate Limiting on Email Verification Endpoint | **MEDIUM** | **FIXED** | `backend/core/views.py` |
| 6 | Stored Cross-Site Scripting (XSS) in Discussions and Comments | **MEDIUM** | **FIXED** | `backend/core/serializers.py` |
| 7 | Potential Denial of Service (Zip Bomb) on Testcase Archive Upload | **LOW** | **FIXED** | `backend/core/services.py` |
| 8 | Python Code Runner AST Reflection & Dunder Traversal Bypass Risk | **LOW** | **FIXED** | `backend/core/services.py` |
| 9 | Default Seed Password in Production Environment | **HIGH** | **NEEDS MANUAL ACTION** | Remote VPS Database / Management Command |

---

## 3. Vulnerability Details & Impact Analysis

### Finding 1: Hardcoded Administrator & Student Quick-Login Buttons in UI
* **Classification:** **FIXED**
* **Severity:** **CRITICAL**
* **Location:** 
  * `frontend/src/components/AuthModal.jsx` (lines 46–61, 200–221)
  * `frontend/src/app/profile/page.jsx` (lines 114–123)
  * `frontend/src/app/progress/page.jsx` (lines 97–107)
* **Vulnerability Analysis:**
  The frontend login modal included a "Tezkor sinov hisoblari" (Quick test accounts) block featuring buttons that directly called `api.login("admin", "algoset123")` and `api.login("student", "algoset123")`. Additionally, unauthenticated users browsing the profile or progress pages were offered buttons that automatically authenticated as `student` using hardcoded credentials.
* **Exploitation / Potential Impact:**
  Any visitor without credentials could click "Administrator" to instantly obtain an administrative JWT and compromise the platform, user accounts, and problem data.
* **Remediation Implemented:**
  Removed `handleQuickLogin` and all hardcoded quick-login buttons from `AuthModal.jsx`, `profile/page.jsx`, and `progress/page.jsx`. Replaced with standard authentication modals requiring genuine credentials.

---

### Finding 2: Secret Verification Token Leakage in Resend Verification API
* **Classification:** **FIXED**
* **Severity:** **HIGH**
* **Location:** `backend/core/views.py` (`ResendVerificationView`)
* **Vulnerability Analysis:**
  The endpoint returned `{"detail": "Verification email sent.", "token": str(user.verification_token)}`. Returning the secret verification UUID token in the HTTP response allowed an attacker to register with any target email address and immediately verify the account without having access to the email inbox.
* **Exploitation / Potential Impact:**
  Account hijacking, spoofing of email identities, and complete bypass of email verification requirements.
* **Remediation Implemented:**
  Removed the `token` field from the response. Converted `ResendVerificationView` to accept `email` anonymously (`AllowAny`) with `AuthRateThrottle`, checking if the user exists and is unverified, and returning a generic success message without leaking account existence or token secrets.

---

### Finding 3: Information Disclosure: Private & Draft Topics Exposed
* **Classification:** **FIXED**
* **Severity:** **MEDIUM**
* **Location:** `backend/core/views.py` (`TopicViewSet.get_queryset`, lines 457–463)
* **Vulnerability Analysis:**
  `TopicViewSet.get_queryset` returned `qs.all()` for unauthenticated users and students, while filtering `visibility=PUBLIC` only for authors. Consequently, unreleased, draft, and private topics were visible to all public visitors.
* **Exploitation / Potential Impact:**
  Unauthorized access to proprietary educational materials and unpublished curricula.
* **Remediation Implemented:**
  Updated `get_queryset` so unauthenticated visitors and students are strictly scoped to `qs.filter(visibility=VisibilityStatus.PUBLIC)`.

---

### Finding 4: Insecure Password Change in `MeView.patch`
* **Classification:** **FIXED**
* **Severity:** **MEDIUM**
* **Location:** `backend/core/views.py` (`MeView.patch`, lines 179–181)
* **Vulnerability Analysis:**
  `MeView.patch` allowed updating the account password without supplying or validating the current password (`current_password`), and without checking Django password complexity rules or minimum length constraints.
* **Exploitation / Potential Impact:**
  If a user session or token was temporarily intercepted, an attacker could permanently lock out the victim by resetting their password to an arbitrary string without knowing their existing credentials.
* **Remediation Implemented:**
  Mandated `current_password` verification using `user.check_password()`. Enforced minimum 8-character length and validated against Django's configured password validators (`validate_password`).

---

### Finding 5: Missing Rate Limiting on Email Verification
* **Classification:** **FIXED**
* **Severity:** **MEDIUM**
* **Location:** `backend/core/views.py` (`VerifyEmailView`)
* **Vulnerability Analysis:**
  `VerifyEmailView` lacked explicit throttle classes, leaving the token verification endpoint vulnerable to high-frequency token enumeration and automated scanning.
* **Remediation Implemented:**
  Configured `throttle_classes = [AuthRateThrottle]`.

---

### Finding 6: Stored Cross-Site Scripting (XSS) in Discussions & Contests
* **Classification:** **FIXED**
* **Severity:** **MEDIUM**
* **Location:** `backend/core/serializers.py` (`DiscussionSerializer`, `DiscussionCommentSerializer`, `ContestSerializer`)
* **Vulnerability Analysis:**
  Discussion titles, comments, and contest announcements were saved directly to the database without running through `sanitize_html`.
* **Exploitation / Potential Impact:**
  Malicious users or compromised author accounts could submit `<script>`, `<iframe>`, or `onload/onerror` attributes that execute in the context of other users browsing discussions or contest descriptions.
* **Remediation Implemented:**
  Added validation hooks in `DiscussionSerializer`, `DiscussionCommentSerializer`, and `ContestSerializer` that sanitize inputs via `sanitize_html`, stripping disallowed tags and unsafe attributes.

---

### Finding 7: Denial of Service (Zip Bomb) on Testcase Archive Upload
* **Classification:** **FIXED**
* **Severity:** **LOW**
* **Location:** `backend/core/services.py` (`import_testcases_from_zip`)
* **Vulnerability Analysis:**
  Uploaded ZIP archives were checked for path traversal (`..`), but there were no constraints on the number of files or total uncompressed byte size.
* **Exploitation / Potential Impact:**
  An author could upload a heavily compressed archive (Zip Bomb) expanding to gigabytes in memory, exhausting RAM and causing a server Out-Of-Memory (OOM) crash.
* **Remediation Implemented:**
  Enforced a maximum of 500 files, 25 MB total uncompressed size limit, and 5 MB per-file size limit.

---

### Finding 8: Python Sandbox AST Dunder Traversal Bypass
* **Classification:** **FIXED**
* **Severity:** **LOW**
* **Location:** `backend/core/services.py` (`validate_code_safety`)
* **Vulnerability Analysis:**
  While untrusted execution is disabled by default in production (`ENABLE_CODE_EXECUTION=False`), AST safety validation checked `ast.Import` and `ast.Call`, but did not inspect `ast.Attribute` for Python reflection dunder attributes (e.g., `__subclasses__`, `__globals__`, `__builtins__`).
* **Remediation Implemented:**
  Added inspection of `ast.Attribute` nodes to reject access to `__subclasses__`, `__bases__`, `__globals__`, `__code__`, `__builtins__`, and `__import__`.

---

### Finding 9: Default Seed Credentials in Production Database
* **Classification:** **NEEDS MANUAL ACTION**
* **Severity:** **HIGH**
* **Location:** Database State / Management Command `seed_algoset.py`
* **Vulnerability Analysis:**
  When seeded with `--allow-insecure-seed`, test accounts (`superadmin`, `admin`, `author`, `student`) are initialized with `algoset123`.
* **Remediation Action Required:**
  On the production VPS, administrators must reset passwords for all administrative accounts using `python manage.py set_password`.

---

## 4. Modified Files Summary

| File | Changes Made |
|---|---|
| `frontend/src/components/AuthModal.jsx` | Removed `handleQuickLogin` function and the "Tezkor sinov hisoblari" quick-login UI buttons. |
| `frontend/src/app/profile/page.jsx` | Removed hardcoded `api.login("student", "algoset123")` button; added standard login modal trigger. |
| `frontend/src/app/progress/page.jsx` | Removed hardcoded `api.login("student", "algoset123")` quick-test button. |
| `frontend/src/lib/api.js` | Updated `resendVerification(email)` to support anonymous email payload. |
| `backend/core/views.py` | Added rate-limiting to `VerifyEmailView`; removed token leakage in `ResendVerificationView`; required `current_password` and strength validation in `MeView.patch`; scoped `TopicViewSet` to public topics for unauthenticated/student visitors. |
| `backend/core/serializers.py` | Added HTML sanitization for discussions, discussion comments, contest announcements, and problem versions. |
| `backend/core/services.py` | Added reflection/dunder blocking in AST validator; added Zip Bomb limits (max 500 files, 25MB total). |
| `backend/core/tests.py` | Added 7 security regression tests under `AlgoSetProductionSecurityHardeningTests`. |

---

## 5. Tests Executed & Verification Results

### 1. Security Hardening Suite (`AlgoSetProductionSecurityHardeningTests`)
Executed command:
`backend\.venv\Scripts\python.exe backend\manage.py test core.tests.AlgoSetProductionSecurityHardeningTests`

```text
Creating test database for alias 'default'...
.......
----------------------------------------------------------------------
Ran 7 tests in 18.925s

OK
Destroying test database for alias 'default'...
```
* **Result:** **7 passed, 0 failed, 0 errors** (**PASS**)

### 2. Full Backend Test Suite
Executed command:
`backend\.venv\Scripts\python.exe backend\manage.py test core`

```text
Creating test database for alias 'default'...
.........................................................
----------------------------------------------------------------------
Ran 53 tests in 130.913s

OK
Destroying test database for alias 'default'...
```
* **Result:** **53 passed, 0 failed, 0 errors** (**PASS**, 100% success rate)

---

## 6. Production Deployment Security Checklist (Pre-Flight)

Before public VPS launch, verify the following operational safeguards:

- [x] **No hardcoded credentials in UI**: All quick-login test buttons and credentials removed from frontend.
- [x] **No token leakage in APIs**: Email verification tokens are only transmitted via email, never in HTTP responses.
- [x] **Strict RBAC enforcement**: Backend permissions verified; authors and students cannot access or publish private resources.
- [x] **Input sanitization & XSS protection**: Content fields passed through `sanitize_html`.
- [x] **Zip Bomb & path traversal protection**: Upload archives bounded by file count and size limits.
- [x] **Docker port isolation**: Database container (`5432`) is exposed only internally; backend (`8000`) and frontend (`3000`) bound to `127.0.0.1`.
- [x] **Reverse proxy & HTTPS**: Nginx terminates SSL via Let's Encrypt for `algoset.study` and `www.algoset.study`.
- [ ] **Reset administrative passwords**: On VPS, execute `docker exec algoset_backend python manage.py set_password superadmin <new_complex_password>`.
- [ ] **Rotate SECRET_KEY**: Verify that production `.env` contains a unique random `SECRET_KEY` of 50+ characters.
- [ ] **Ensure DEBUG=False**: Confirm `DEBUG=False` in production `.env`.

