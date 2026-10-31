"""
AlgoSet — Content Quality and Uzbek Language Validator
Ensures all educational tutorials meet strict pedagogical and linguistic standards:
- 100% natural Latin Uzbek
- Required educational components (theory, Python example, complexity, explanation)
- Rejection of untranslated English prose while preserving Python syntax and keywords
"""

import re
from urllib.parse import urlparse

# Words typical to English prose that indicate untranslated paragraphs
ENGLISH_STOPWORDS = {
    "the", "and", "this", "that", "with", "from", "have", "more", "which",
    "will", "about", "there", "their", "would", "these", "other", "into",
    "should", "could", "because", "between", "through", "during", "before"
}

# Technical Python terms allowed in code and technical descriptions
PYTHON_KEYWORDS = {
    "def", "class", "return", "import", "from", "for", "while", "if", "elif",
    "else", "try", "except", "finally", "with", "as", "pass", "break",
    "continue", "lambda", "yield", "raise", "assert", "global", "nonlocal",
    "True", "False", "None", "self", "init", "print", "range", "len", "list",
    "dict", "set", "tuple", "int", "float", "str", "bool", "sys", "math",
    "collections", "heapq", "bisect", "itertools", "functools"
}

# Known placeholder markers that indicate unfinished content
PLACEHOLDER_MARKERS = [
    "lorem ipsum", "todo", "tbd", "coming soon", "under construction",
    "hozircha bo'sh", "keyinroq qo'shiladi", "qoralama matn"
]


def _strip_code_blocks(html_or_md: str) -> str:
    """Removes code blocks and inline code so we only validate prose text."""
    text = re.sub(r"<pre[\s\S]*?</pre>", " ", html_or_md, flags=re.IGNORECASE)
    text = re.sub(r"<code[\s\S]*?</code>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r"`[^`]*`", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    return text


def validate_lesson_content(lesson_dict: dict) -> tuple[bool, list[str]]:
    """
    Validates a lesson dictionary against strict quality and language criteria.
    Returns: (is_valid, list_of_issues)
    """
    issues = []

    title_uz = (lesson_dict.get("title_uz") or "").strip()
    summary_uz = (lesson_dict.get("summary_uz") or "").strip()
    content_uz = (lesson_dict.get("content_uz") or "").strip()
    source_url = (lesson_dict.get("source_url") or "").strip()
    is_imported = lesson_dict.get("is_imported", False)

    # 1. Title validation
    if not title_uz:
        issues.append("Sarlavha (title_uz) bo'sh bo'lmasligi kerak.")
    elif len(title_uz.split()) < 2:
        issues.append(f"Sarlavha juda qisqa: '{title_uz}' (kamida 2 ta so'zdan iborat bo'lishi lozim).")

    # 2. Summary validation
    if not summary_uz:
        issues.append("Qisqacha mazmun (summary_uz) kiritilishi shart.")
    elif len(summary_uz.split()) < 5:
        issues.append("Qisqacha mazmun kamida 5 ta so'zdan iborat bo'lishi kerak.")

    # 3. Content existence & length
    if not content_uz:
        issues.append("Dars mazmuni (content_uz) bo'sh bo'lmasligi kerak.")
    elif len(content_uz) < 150:
        issues.append(f"Dars matni juda qisqa ({len(content_uz)} belgi). Kamida 150 belgi talab qilinadi.")

    # 4. Placeholder detection
    combined_lower = f"{title_uz} {summary_uz} {content_uz}".lower()
    for marker in PLACEHOLDER_MARKERS:
        if marker in combined_lower:
            issues.append(f"Matnda qoralama/placeholder belgisi aniqlandi: '{marker}'.")

    # 5. Required components (Theory, Code example, Complexity)
    has_code = bool(
        re.search(r"<(pre|code)[^>]*>", content_uz, re.IGNORECASE)
        or "```" in content_uz
        or "def " in content_uz
        or "class " in content_uz
    )
    if not has_code:
        issues.append("Darsda kamida bitta Python kod namunasi bo'lishi shart.")

    # Complexity notation presence (O(1), O(N), O(log N), etc. or Vaqt murakkabligi)
    has_complexity = bool(
        re.search(r"\bO\([1nNmMkK\s\+\*\^\/\.\w]+\)", content_uz)
        or "murakkablik" in content_uz.lower()
        or "vaqt" in content_uz.lower()
    )
    if not has_complexity:
        issues.append("Darsda vaqt/xotira murakkabligi tahlili (masalan, O(1), O(N) yoki 'Vaqt murakkabligi') bo'lishi shart.")

    # 6. English prose leakage detection (strictly checking non-code text)
    prose_text = _strip_code_blocks(content_uz)
    words = re.findall(r"\b[a-zA-Z]{3,}\b", prose_text.lower())
    if words:
        english_stopword_matches = [w for w in words if w in ENGLISH_STOPWORDS]
        # If there are multiple consecutive or high-frequency English stopwords, flag untranslated prose
        if len(english_stopword_matches) >= 3:
            issues.append(
                f"Matnda tarjima qilinmagan inglizcha iboralar aniqlandi ({', '.join(english_stopword_matches[:5])}). Barcha tushuntirishlar o'zbek tilida bo'lishi shart."
            )

    # 7. Source URL validation if imported
    if is_imported and source_url:
        parsed = urlparse(source_url)
        if not (parsed.scheme in ("http", "https") and parsed.netloc):
            issues.append(f"Manba havolasi noto'g'ri URL: '{source_url}'.")

    return (len(issues) == 0, issues)
