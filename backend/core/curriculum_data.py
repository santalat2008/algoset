"""
AlgoSet Curriculum Data — 100% Uzbek, Python-Only Competitive Programming Curriculum
Structured into 3 Core Pillars:
1. Python Asoslari (Python Fundamentals)
2. Python OOP (Object-Oriented Programming)
3. Algoritmlar va Ma'lumotlar Tuzilmalari (Algorithms & Data Structures)

All explanations are natural, grammatically correct Latin Uzbek.
Includes code examples, line-by-line analyses, complexity annotations, and legitimate educational attribution.
"""

CURRICULUM_DATA = [
    # =========================================================================
    # PILLAR 1: PYTHON ASOSLARI
    # =========================================================================
    {
        "category": {
            "slug": "python-basics",
            "icon": "terminal",
            "group": "Python",
            "title_uz": "Python Asoslari",
            "title_en": "Python Basics",
            "description_uz": "Python sintaksisi, o'zgaruvchilar, tezkor kiritish-chiqarish, shartlar, sikllar va to'plamlar.",
            "description_en": "Python syntax, variables, fast I/O, conditions, loops, collections and functions.",
            "order": 1,
        },
        "topics": [
            {
                "slug": "intro-and-variables",
                "title_uz": "Python tiliga kirish va O'zgaruvchilar",
                "title_en": "Introduction to Python & Variables",
                "description_uz": "Python tili xususiyatlari, o'zgaruvchilarni e'lon qilish, asosiy turlar va tiplash.",
                "description_en": "Python features, dynamic typing, primitive data types and type conversion.",
                "order": 1,
                "source_url": "https://docs.python.org/3/tutorial/introduction.html",
                "lessons": [
                    {
                        "slug": "python-variables-and-types",
                        "title_uz": "O'zgaruvchilar va Asosiy Ma'lumot Turlari",
                        "title_en": "Variables and Primitive Data Types",
                        "summary_uz": "Dinamik tiplash, butun va haqiqiy sonlar, satrlar hamda mantiqiy turlar.",
                        "summary_en": "Dynamic typing, integers, floats, strings, and boolean types.",
                        "order": 1,
                        "source_url": "https://docs.python.org/3/tutorial/introduction.html",
                        "source_author": "Python Software Foundation",
                        "source_license": "Python Software Foundation License",
                        "related_problem_slugs": ["two-sum"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Python tilida o'zgaruvchilarning mohiyati</h2>
<p>Python — dinamik tiplangan dasturlash tili. Bu degani, o'zgaruvchi yaratishda uning turini oldindan ko'rsatish (masalan, C++ yoki Java kabi <code>int x</code>) shart emas. O'zgaruvchiga qiymat yuklangan zahoti uning turi avtomatik aniqlanadi.</p>

<h2>2. Asosiy ma'lumot turlari</h2>
<ul>
  <li><strong>int</strong> — butun sonlar (masalan, <code>42</code>, <code>-17</code>). Python-da butun sonlar xotira ruxsat bergan darajada cheksiz aniqlikda saqlanadi va 64-bit to'lib ketish (overflow) xavfi yo'q.</li>
  <li><strong>float</strong> — haqiqiy (o'nli) sonlar (masalan, <code>3.14159</code>, <code>-0.001</code>). IEEE 754 64-bit aniqlikka ega.</li>
  <li><strong>str</strong> — satrlar (matnlar). Satrlar o'zgarmas (immutable) bo'lib, bir marta yaratilgach o'zgartirib bo'lmaydi.</li>
  <li><strong>bool</strong> — mantiqiy qiymatlar: <code>True</code> yoki <code>False</code>.</li>
</ul>

<h2>3. Python kod namunasi</h2>
<pre><code class="language-python"># O'zgaruvchilar va tiplar bilan ishlash
yosh = 20                   # int
vazn = 68.5                 # float
ism = "Sardor"              # str
talabami = True             # bool

# Turini aniqlash (type tekshiruvi)
print(type(yosh))           # &lt;class 'int'&gt;
print(type(ism))            # &lt;class 'str'&gt;

# Tipni o'zgartirish (Type Casting)
satr_son = "125"
butun_son = int(satr_son)   # Satrni int ga o'tkazish
print(butun_son + 5)        # 130
</code></pre>

<h2>4. Qadamma-qadam tahlil</h2>
<ol>
  <li><code>yosh = 20</code> satrida Python xotirada 20 qiymatini yaratadi va <code>yosh</code> nomli havolani unga bog'laydi.</li>
  <li><code>int(satr_son)</code> funksiyasi matnli satrni haqiqiy butun songa aylantiradi. Agar satrda son bo'lmagan belgilar bo'lsa, <code>ValueError</code> yuzaga keladi.</li>
</ol>

<h2>5. Vaqt va xotira murakkabligi tahlili</h2>
<p>O'zgaruvchiga qiymat berish va asosiy arifmetik amallar <strong>Vaqt murakkabligi: O(1)</strong> oladi. Xotira murakkabligi bitta skalyar qiymat uchun <strong>O(1)</strong> bo'ladi.</p>

<h2>6. Musobaqa dasturlashda tavsiyalar</h2>
<p>Katta sonlar bilan ishlaganda Python qulay, chunki $10^{100}$ darajadagi sonlar ham aniq hisoblanadi. Biroq float turlarida suzuvchi nuqta xatoliklariga ehtiyot bo'lish zarur (masalan, <code>0.1 + 0.2 != 0.3</code>).</p>
</div>""",
                    },
                    {
                        "slug": "python-type-casting-and-strings",
                        "title_uz": "Satrlar va Ma'lumot Turlarini O'zgartirish",
                        "title_en": "Strings and Type Conversions",
                        "summary_uz": "Satrlarni kesish (slicing), formatlash va raqamli tiplarga o'tkazish.",
                        "summary_en": "String slicing, formatting, and numeric type conversions.",
                        "order": 2,
                        "source_url": "https://docs.python.org/3/tutorial/introduction.html#text",
                        "source_author": "Python Software Foundation",
                        "source_license": "Python Software Foundation License",
                        "related_problem_slugs": ["reverse-integer"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Satrlar (Strings) bilan ishlash asoslari</h2>
<p>Python tilida satrlar indekslanadi va qirqish (slicing) amali juda tez ishlaydi. Indekslar 0 dan boshlanadi, manfiy indekslar esa satr oxiridan hisoblanadi.</p>

<h2>2. Python kod namunasi</h2>
<pre><code class="language-python"># Satrlar bilan amallar
matn = "AlgoSet Platformasi"

# Indekslash va Qirqish (Slicing): matn[start:stop:step]
birinchi_soz = matn[0:7]      # "AlgoSet"
oxirgi_belgi = matn[-1]       # "i"
teskari_matn = matn[::-1]     # Satrni teskari o'girish

# Satr metodlari
katta = matn.upper()          # Hammasini katta harf qilish
sozlar = matn.split()         # Bo'shliq bo'yicha bo'laklarga ajratish

# F-satrlar (Formatted string literals)
natija = 100
xabar = f"Maksimal ball: {natija}"
print(xabar)
</code></pre>

<h2>3. Qadamma-qadam tahlil</h2>
<ol>
  <li><code>matn[::-1]</code> ifodasi satrni to'liq teskari tartibda nusxalaydi. Ushbu usul C++ dagi <code>std::reverse</code> bilan teng kuchga ega.</li>
  <li><code>f"..."</code> satrlari o'zgaruvchilarni matn ichiga tez va tushunarli formatda kiritish imkonini beradi.</li>
</ol>

<h2>4. Vaqt va xotira murakkabligi tahlili</h2>
<p>Uzunligi $N$ ga teng satrni qirqish yoki teskari qilish <strong>Vaqt murakkabligi: O(N)</strong> va yangi satr yaratilgani sababli <strong>Xotira murakkabligi: O(N)</strong> talab qiladi.</p>

<h2>5. Amaliy mashq</h2>
<p>Ushbu bilimni mustahkamlash uchun platformadagi <strong>Butun sonni teskari qilish</strong> masalasini yechish tavsiya etiladi.</p>
</div>""",
                    },
                ],
            },
            {
                "slug": "io-and-fast-io",
                "title_uz": "Kiritish-Chiqarish va Fast I/O Texnikalari",
                "title_en": "Input/Output & Fast I/O Techniques",
                "description_uz": "Musobaqalarda TLE xatoligining oldini olish uchun tezkor ma'lumot o'qish.",
                "description_en": "Fast input/output parsing to prevent Time Limit Exceeded in competitions.",
                "order": 2,
                "source_url": "https://docs.python.org/3/library/sys.html",
                "lessons": [
                    {
                        "slug": "fast-io-for-competitive-programming",
                        "title_uz": "Musobaqalar uchun Tezkor Kiritish va Chiqarish",
                        "title_en": "Fast I/O for Competitive Programming",
                        "summary_uz": "sys.stdin.readline yordamida $10^5$ va $10^6$ qatorli testlarni tezkor o'qish.",
                        "summary_en": "Using sys.stdin.readline for fast input parsing on large datasets.",
                        "order": 1,
                        "source_url": "https://docs.python.org/3/library/sys.html#sys.stdin",
                        "source_author": "Python Software Foundation",
                        "source_license": "Python Software Foundation License",
                        "related_problem_slugs": ["two-sum"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Nega standart input() sekin ishlaydi?</h2>
<p>Python-dagi standart <code>input()</code> funksiyasi har safar chaqirilganda kiritish oqimini tozalaydi, prompt tekshiradi va oxirgi yangi qator belgisini qirqib tashlaydi. Agar musobaqa masalasida testlar soni $10^5$ yoki $10^6$ qatordan iborat bo'lsa, oddiy <code>input()</code> ko'p vaqt oladi va <strong>Time Limit Exceeded (TLE)</strong> xatoligi keltirib chiqaradi.</p>

<h2>2. Tezkor yechim: sys.stdin.readline</h2>
<p><code>sys.stdin.readline</code> operatsion tizim buferidan to'g'ridan-to'g'ri butun qatorni o'qiydi va bir necha barobar tez ishlaydi.</p>

<pre><code class="language-python">import sys

# Standart kiritishni tezkor o'qishga qayta yo'naltirish
input = sys.stdin.readline

def solve():
    # Bitta qatordagi ikkita sonni o'qish
    # strip() satr oxiridagi '\\n' belgisini tozalaydi
    n, m = map(int, input().split())
    
    # N ta sondan iborat massivni bir zumda o'qish
    arr = list(map(int, input().split()))
    
    # Tezkor chiqarish
    sys.stdout.write(f"Elementlar soni: {len(arr)}\\n")

if __name__ == "__main__":
    solve()
</code></pre>

<h2>3. Qadamma-qadam tahlil</h2>
<ol>
  <li><code>input = sys.stdin.readline</code>: Kelgusi barcha <code>input()</code> chaqiruvlari avtomatik ravishda buferlangan tezkor funksiyaga ulanadi.</li>
  <li><code>map(int, input().split())</code>: Satrni bo'shliqlar bo'yicha ajratib, har bir elementni bir yo'la butun songa aylantiradi.</li>
</ol>

<h2>4. Vaqt va xotira murakkabligi tahlili</h2>
<p>Uzunligi $K$ bo'lgan qatordagi $N$ ta sonni o'qish <strong>Vaqt murakkabligi: O(K + N)</strong> bo'lib, C++ dagi <code>cin.tie(NULL)</code> tezligiga yaqinlashadi.</p>
</div>""",
                    }
                ],
            },
            {
                "slug": "conditional-statements",
                "title_uz": "Shartli Operatorlar va Tarmoqlanish",
                "title_en": "Conditional Statements & Branching",
                "description_uz": "if, elif, else bloklari, qisqa ifodalar va mantiqiy operatorlar.",
                "description_en": "if, elif, else blocks, ternary operators and logical boolean conditions.",
                "order": 3,
                "source_url": "https://docs.python.org/3/tutorial/controlflow.html#if-statements",
                "lessons": [
                    {
                        "slug": "if-elif-else-control-flow",
                        "title_uz": "if, elif va else Shartli Operatorlari",
                        "title_en": "if, elif and else Control Flow",
                        "summary_uz": "Mantiqiy shartlar, and, or, not operatorlari va bir qatorli shartlar (Ternary Operator).",
                        "summary_en": "Logical conditions, boolean algebra and ternary conditional expressions.",
                        "order": 1,
                        "source_url": "https://docs.python.org/3/tutorial/controlflow.html",
                        "source_author": "Python Software Foundation",
                        "source_license": "Python Software Foundation License",
                        "related_problem_slugs": ["reverse-integer"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Shartli operatorlar va bloklar</h2>
<p>Python tilida shart bloklari jingalak qavslar (<code>{}</code>) o'rniga <strong>4 ta bo'sh joy (indentation)</strong> orqali ajratiladi. Bu kodning o'qilishi va tozaligini ta'minlaydi.</p>

<h2>2. Python kod namunasi</h2>
<pre><code class="language-python"># Ballga qarab bahoni aniqlash
ball = 88

if ball &gt;= 90:
    natija = "A'lo"
elif ball &gt;= 75 and ball &lt; 90:
    natija = "Yaxshi"
elif ball &gt;= 60:
    natija = "Qoniqarli"
else:
    natija = "Qoniqarsiz"

print(f"Natija: {natija}")

# Qisqartirilgan shart (Ternary Operator)
x = 15
holat = "Juft" if x % 2 == 0 else "Toq"
print(f"{x} soni: {holat}")
</code></pre>

<h2>3. Qadamma-qadam tahlil</h2>
<ol>
  <li><code>elif</code> — 'else if' ning qisqartmasi bo'lib, oldingi shart bajarilmaganda navbatdagi shartni tekshiradi.</li>
  <li><code>x if shart else y</code> sintaksisi C++ dagi <code>shart ? x : y</code> operatorining o'rnini bosadi va kodni ixcham qiladi.</li>
</ol>

<h2>4. Vaqt murakkabligi</h2>
<p>Shartlarni tekshirish <strong>Vaqt murakkabligi: O(1)</strong> bo'lib, bir zumda amalga oshiriladi.</p>
</div>""",
                    }
                ],
            },
            {
                "slug": "loops-and-iteration",
                "title_uz": "Takrorlash Operatorlari (Sikllar)",
                "title_en": "Loops & Iteration",
                "description_uz": "for va while sikllari, range() funksiyasi, break va continue ko'rsatmalari.",
                "description_en": "for and while loops, range generation, break, continue, and loop-else semantics.",
                "order": 4,
                "source_url": "https://docs.python.org/3/tutorial/controlflow.html#for-statements",
                "lessons": [
                    {
                        "slug": "for-and-while-loops",
                        "title_uz": "for va while Sikllari hamda Loop Boshqaruvi",
                        "title_en": "for and while Loops in Python",
                        "summary_uz": "Massivlar ustida iteratsiya, range() parametrlari, break va continue bilan siklni boshqarish.",
                        "summary_en": "Array iterations, range configurations, break and continue control statements.",
                        "order": 1,
                        "source_url": "https://docs.python.org/3/tutorial/controlflow.html#for-statements",
                        "source_author": "Python Software Foundation",
                        "source_license": "Python Software Foundation License",
                        "related_problem_slugs": ["two-sum"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Python-da takrorlash operatorlari</h2>
<p>Python tilida ikkita asosiy sikl operatori mavjud:</p>
<ul>
  <li><code>for</code> — to'plamlar (ro'yxat, satr, lug'at) yoki <code>range()</code> bo'ylab ketma-ket harakatlanish uchun.</li>
  <li><code>while</code> — ma'lum bir mantiqiy shart <code>True</code> bo'lib turguniga qadar takrorlash uchun.</li>
</ul>

<h2>2. Python kod namunasi</h2>
<pre><code class="language-python"># 1 dan 5 gacha bo'lgan sonlar yig'indisi
yigindi = 0
for i in range(1, 6):
    yigindi += i
print("Yig'indi:", yigindi) # 15

# Juft sonlarni ekranga chiqarish (continue yordamida)
for son in range(10):
    if son % 2 != 0:
        continue # Toq sonlarni tashlab o'tish
    if son &gt; 6:
        break    # 6 dan kattalashganda siklni to'xtatish
    print(son, end=" ") # 0 2 4 6
print()

# While sikli namunasi
n = 16
bolish_soni = 0
while n &gt; 1:
    n //= 2
    bolish_soni += 1
print(f"2 ga bo'linishlar soni: {bolish_soni}") # 4
</code></pre>

<h2>3. Qadamma-qadam tahlil</h2>
<ol>
  <li><code>range(start, stop, step)</code>: Generatsiya qilinadigan sonlar <code>start</code> dan boshlanadi va <code>stop - 1</code> da to'xtaydi.</li>
  <li><code>continue</code> siklning joriy qadamini to'xtatib, keyingisiga o'tadi. <code>break</code> esa butun siklni muddatidan oldin yakunlaydi.</li>
</ol>

<h2>4. Vaqt murakkabligi</h2>
<p>$N$ marta aylanuvchi siklning <strong>Vaqt murakkabligi: O(N)</strong> bo'ladi.</p>
</div>""",
                    }
                ],
            },
            {
                "slug": "data-structures-basics",
                "title_uz": "Asosiy To'plamlar: List, Dict, Set, Tuple",
                "title_en": "Core Built-in Collections: List, Dict, Set, Tuple",
                "description_uz": "Dinamik massivlar, xesh-jadvallar va ularning amaliyotdagi murakkabliklari.",
                "description_en": "Dynamic arrays, hash maps, sets, tuples and their theoretical complexities.",
                "order": 5,
                "source_url": "https://docs.python.org/3/tutorial/datastructures.html",
                "lessons": [
                    {
                        "slug": "python-lists-dicts-and-sets",
                        "title_uz": "Ro'yxat (List), Lug'at (Dict) va To'plam (Set)",
                        "title_en": "Lists, Dictionaries and Sets in Depth",
                        "summary_uz": "Dinamik ro'yxat operatsiyalari, lug'at va to'plam orqali O(1) o'rtacha vaqtda qidiruv.",
                        "summary_en": "Dynamic list operations, average O(1) lookups using dict and set.",
                        "order": 1,
                        "source_url": "https://docs.python.org/3/tutorial/datastructures.html",
                        "source_author": "Python Software Foundation",
                        "source_license": "Python Software Foundation License",
                        "related_problem_slugs": ["two-sum"],
                        "content_uz": """<div class="space-y-4">
<h2>1. To'plamlarning turlari va xususiyatlari</h2>
<p>Musobaqa dasturlashda to'g'ri to'plamni tanlash masala yechimining samaradorligini belgilaydi:</p>
<ul>
  <li><strong>list (Ro'yxat)</strong> — dinamik massiv. Oxiriga element qo'shish (<code>append</code>) amortizatsiyalangan $O(1)$, lekin o'rtasidan qidirish yoki o'chirish $O(N)$ vaqt oladi.</li>
  <li><strong>dict (Lug'at)</strong> — kalit-qiymat xesh-jadvali. Kalit bo'yicha qidirish, qo'shish va o'chirish o'rtacha $O(1)$ vaqt oladi.</li>
  <li><strong>set (To'plam)</strong> — takrorlanmas elementlar to'plami. Element mavjudligini tekshirish (<code>x in s</code>) o'rtacha $O(1)$ vaqt oladi.</li>
</ul>

<h2>2. Python kod namunasi</h2>
<pre><code class="language-python"># List va Set bilan ishlash
sonlar = [1, 2, 2, 3, 4, 4, 5]
noyob_sonlar = set(sonlar) # {1, 2, 3, 4, 5}

# Tezkor qidiruv (O(1))
if 3 in noyob_sonlar:
    print("3 to'plamda mavjud!")

# Lug'at (dict) yordamida chastotani hisoblash
chastota = {}
for x in sonlar:
    chastota[x] = chastota.get(x, 0) + 1

print(chastota) # {1: 1, 2: 2, 3: 1, 4: 2, 5: 1}
</code></pre>

<h2>3. Murakkablik jadvali</h2>
<table class="w-full text-xs border border-slate-200">
  <tr class="bg-slate-100 font-bold">
    <td class="p-2 border">Operatsiya</td>
    <td class="p-2 border">List (Ro'yxat)</td>
    <td class="p-2 border">Dict / Set (Lug'at/To'plam)</td>
  </tr>
  <tr>
    <td class="p-2 border">Qidirish (x in col)</td>
    <td class="p-2 border">O(N)</td>
    <td class="p-2 border">O(1) o'rtacha</td>
  </tr>
  <tr>
    <td class="p-2 border">Qo'shish</td>
    <td class="p-2 border">O(1) oxiriga</td>
    <td class="p-2 border">O(1) o'rtacha</td>
  </tr>
  <tr>
    <td class="p-2 border">O'chirish</td>
    <td class="p-2 border">O(N)</td>
    <td class="p-2 border">O(1) o'rtacha</td>
  </tr>
</table>

<h2>4. Amaliy maslahat</h2>
<p>Agar sizga elementlarni qidirish kerak bo'lsa, hech qachon <code>list</code> dan emas, balki <code>set</code> yoki <code>dict</code> dan foydalaning. Bu dasturni minglab marta tezlashtiradi.</p>
</div>""",
                    }
                ],
            },
            {
                "slug": "functions-and-modules",
                "title_uz": "Funksiyalar, Rekursiya va Generatorlar",
                "title_en": "Functions, Recursion & Comprehensions",
                "description_uz": "def kalit so'zi, rekursiv funksiyalar, list comprehensions va lambda.",
                "description_en": "Function declarations, recursive calls, list comprehensions, and lambda expressions.",
                "order": 6,
                "source_url": "https://docs.python.org/3/tutorial/controlflow.html#defining-functions",
                "lessons": [
                    {
                        "slug": "python-functions-and-recursion",
                        "title_uz": "Funksiyalar va Rekursiya Asoslari",
                        "title_en": "Functions & Recursive Problem Solving",
                        "summary_uz": "Funksiyalarni e'lon qilish, rekursiyaning bazaviy holati (base case) va stek xotirasi.",
                        "summary_en": "Declaring functions, base cases in recursion, and recursion call stack depth.",
                        "order": 1,
                        "source_url": "https://docs.python.org/3/tutorial/controlflow.html#defining-functions",
                        "source_author": "Python Software Foundation",
                        "source_license": "Python Software Foundation License",
                        "related_problem_slugs": ["reverse-integer"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Funksiya nima va nima uchun kerak?</h2>
<p>Funksiya — ma'lum bir vazifani bajarish uchun mo'ljallangan va qayta ishlatiluvchi kod blokidir. <code>def</code> kalit so'zi bilan e'lon qilinadi va <code>return</code> orqali natija qaytaradi.</p>

<h2>2. Rekursiya tushunchasi</h2>
<p>Rekursiya — funksiyaning o'z-o'zini chaqirishi. Har qanday rekursiv funksiyada ikkita shart bo'lishi shart:</p>
<ol>
  <li><strong>Bazaviy holat (Base case)</strong> — rekursiya to'xtaydigan shart (aks holda cheksiz rekursiya va <code>RecursionError</code> yuz beradi).</li>
  <li><strong>Rekursiv qadam</strong> — masalani kichikroq bo'lakka qisqartirib o'zini chaqirish.</li>
</ol>

<h2>3. Python kod namunasi</h2>
<pre><code class="language-python"># 1. Oddiy funksiya
def daraja(asos, korsatkich):
    return asos ** korsatkich

# 2. Rekursiv faktorial funksiyasi
def faktorial(n):
    if n &lt;= 1:       # Bazaviy holat
        return 1
    return n * faktorial(n - 1) # Rekursiv chaqiruv

print("5! =", faktorial(5)) # 120

# 3. List Comprehension (Ro'yxat generatori)
kvadratlar = [x ** 2 for x in range(1, 6)]
print("Kvadratlar:", kvadratlar) # [1, 4, 9, 16, 25]
</code></pre>

<h2>4. Vaqt va xotira murakkabligi tahlili</h2>
<p><code>faktorial(n)</code> funksiyasi $N$ ta chaqiruv amalga oshiradi. <strong>Vaqt murakkabligi: O(N)</strong>. Har bir chaqiruv chaqiruvlar stekida joy olgani sababli <strong>Xotira murakkabligi: O(N)</strong> bo'ladi.</p>
</div>""",
                    }
                ],
            },
        ],
    },

    # =========================================================================
    # PILLAR 2: PYTHON OOP
    # =========================================================================
    {
        "category": {
            "slug": "python-classes",
            "icon": "box",
            "group": "Python OOP",
            "title_uz": "Python OOP va Klasslar",
            "title_en": "Python Object-Oriented Programming",
            "description_uz": "Obyektga yo'naltirilgan dasturlash asoslari, dunder metodlar va arxitektura tamoyillari.",
            "description_en": "OOP principles, classes, constructors, dunder methods, inheritance, polymorphism.",
            "order": 2,
        },
        "topics": [
            {
                "slug": "classes-and-objects",
                "title_uz": "Sinflar va Obyektlar Asoslari",
                "title_en": "Classes, Objects & Constructors",
                "description_uz": "Class e'lon qilish, konstruktor (__init__), self kalit so'zi va obyektlar.",
                "description_en": "Class definition, __init__ constructor, self keyword, and instantiating objects.",
                "order": 1,
                "source_url": "https://docs.python.org/3/tutorial/classes.html",
                "lessons": [
                    {
                        "slug": "classes-objects-and-constructors",
                        "title_uz": "Sinf (Class) va Obyekt (Object) Yaratish",
                        "title_en": "Creating Classes, Objects and Constructors",
                        "summary_uz": "Obyektga yo'naltirilgan dasturlash modeli, __init__ konstruktori va self kalit so'zi.",
                        "summary_en": "Object-oriented programming paradigm, __init__ constructor and the self parameter.",
                        "order": 1,
                        "source_url": "https://docs.python.org/3/tutorial/classes.html#class-objects",
                        "source_author": "Python Software Foundation",
                        "source_license": "Python Software Foundation License",
                        "related_problem_slugs": ["two-sum"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Obyektga yo'naltirilgan dasturlash (OOP) nima?</h2>
<p>OOP — dasturiy ta'minotni real olamdagi obyektlar kabi modellashtirish usuli. <strong>Sinf (Class)</strong> — bu obyektning chizmasi (qolipi), <strong>Obyekt (Object)</strong> esa ushbu qolip asosida xotirada yaratilgan aniq nusxadir.</p>

<h2>2. Konstruktor (__init__) va self</h2>
<ul>
  <li><code>__init__</code> — yangi obyekt yaratilgan zahoti avtomatik chaqiriladigan maxsus metod (konstruktor).</li>
  <li><code>self</code> — ayni paytda ishlayotgan obyekt nusxasiga havola. U orqali obyekt atributlariga kiriladi.</li>
</ul>

<h2>3. Python kod namunasi</h2>
<pre><code class="language-python">class Foydalanuvchi:
    def __init__(self, username, reyting=1400):
        # Obyekt atributlari
        self.username = username
        self.reyting = reyting
        self.yechilgan_masalalar = 0

    def masala_yechdi(self, ball):
        self.yechilgan_masalalar += 1
        self.reyting += ball
        print(f"{self.username} masalani yechdi! Yangi reyting: {self.reyting}")

# Obyektlarni yaratish
f1 = Foydalanuvchi("santalat", 1500)
f2 = Foydalanuvchi("dasturchi_99")

f1.masala_yechdi(25) # santalat masalani yechdi! Yangi reyting: 1525
print(f"Jami yechilgan: {f1.yechilgan_masalalar}")
</code></pre>

<h2>4. Qadamma-qadam tahlil</h2>
<ol>
  <li><code>Foydalanuvchi("santalat", 1500)</code> chaqirilganda, Python xotirada joy ajratadi va <code>__init__</code> ga birinchi argument qilib yangi obyektni (<code>self</code>) yuboradi.</li>
  <li>Har bir yaratilgan obyekt (f1, f2) o'zining mustaqil <code>username</code> va <code>reyting</code> qiymatlariga ega bo'ladi.</li>
</ol>

<h2>5. Vaqt va xotira murakkabligi tahlili</h2>
<p>Obyekt yaratish va metodlarni chaqirish <strong>Vaqt murakkabligi: O(1)</strong> oladi. Xotira har bir obyekt atributlari hajmiga qarab <strong>O(1)</strong> sarflanadi.</p>
</div>""",
                    }
                ],
            },
            {
                "slug": "oop-principles",
                "title_uz": "OOP ning 4 Asosiy Tamoyili",
                "title_en": "Four Pillars of OOP in Python",
                "description_uz": "Inkapsulyatsiya, Vorislik (Inheritance), Polimorfizm va Abstraksiya.",
                "description_en": "Encapsulation, Inheritance, Polymorphism and Abstraction in Python.",
                "order": 2,
                "source_url": "https://docs.python.org/3/tutorial/classes.html#inheritance",
                "lessons": [
                    {
                        "slug": "four-pillars-of-oop",
                        "title_uz": "Inkapsulyatsiya, Vorislik, Polimorfizm va Abstraksiya",
                        "title_en": "Encapsulation, Inheritance, Polymorphism & Abstraction",
                        "summary_uz": "super() bilan vorislik olish, private atributlar va metodlarni qayta aniqlash (override).",
                        "summary_en": "Inheritance with super(), private attributes, and method overriding.",
                        "order": 1,
                        "source_url": "https://docs.python.org/3/tutorial/classes.html#inheritance",
                        "source_author": "Python Software Foundation",
                        "source_license": "Python Software Foundation License",
                        "related_problem_slugs": ["two-sum"],
                        "content_uz": """<div class="space-y-4">
<h2>1. OOP ning to'rt ustuni</h2>
<ol>
  <li><strong>Vorislik (Inheritance)</strong> — mavjud sinf xususiyatlarini yangi sinfga meros qilib o'tkazish (kod takrorlanishini kamaytiradi).</li>
  <li><strong>Inkapsulyatsiya (Encapsulation)</strong> — ichki ma'lumotlarni tashqi ruxsatsiz o'zgarishlardan himoyalash (boshida <code>_</code> yoki <code>__</code> bilan).</li>
  <li><strong>Polimorfizm (Polymorphism)</strong> — turli sinflarda bir xil nomli metodlarning har xil ishlash qobiliyati.</li>
  <li><strong>Abstraksiya (Abstraction)</strong> — faqat muhim interfeysni ko'rsatib, murakkab ichki detallarni yashirish.</li>
</ol>

<h2>2. Python kod namunasi</h2>
<pre><code class="language-python"># Vorislik va Polimorfizm namunasi
class Masala:
    def __init__(self, slug, vaqt_chegarasi):
        self.slug = slug
        self.vaqt_chegarasi = vaqt_chegarasi

    def tekshir(self):
        return "Standart tekshiruv"

# Voris sinf
class InteraktivMasala(Masala):
    def __init__(self, slug, vaqt_chegarasi, protokol):
        super().__init__(slug, vaqt_chegarasi) # Ota sinf konstruktorini chaqirish
        self.protokol = protokol

    # Polimorfizm: metodni qayta yozish (override)
    def tekshir(self):
        return f"Interaktiv tekshiruv (protokol: {self.protokol})"

oddiy = Masala("two-sum", 1.0)
interaktiv = InteraktivMasala("guess-number", 2.0, "pipe")

print(oddiy.tekshir())      # Standart tekshiruv
print(interaktiv.tekshir()) # Interaktiv tekshiruv (protokol: pipe)
</code></pre>

<h2>3. Qadamma-qadam tahlil</h2>
<ol>
  <li><code>super().__init__(...)</code> orqali <code>Masala</code> sinfidagi <code>slug</code> va <code>vaqt_chegarasi</code> kabi umumiy maydonlar qayta yozilmasdan o'zlashtiriladi.</li>
  <li><code>tekshir()</code> metodi ikkala sinfda ham mavjud, lekin o'ziga xos tarzda ishlaydi (Polimorfizm).</li>
</ol>

<h2>4. Vaqt murakkabligi</h2>
<p>Vorislik va polimorfik metodlarni chaqirish <strong>Vaqt murakkabligi: O(1)</strong> bo'lib, dinamik dispatch orqali amalga oshadi.</p>
</div>""",
                    }
                ],
            },
            {
                "slug": "dunder-methods",
                "title_uz": "Maxsus Metodlar (Dunder Methods)",
                "title_en": "Dunder / Magic Methods",
                "description_uz": "__str__, __repr__, heapq va saralash uchun __lt__, __len__ metodlari.",
                "description_en": "Special dunder methods: __str__, __repr__, __lt__ for heap comparison, __len__.",
                "order": 3,
                "source_url": "https://docs.python.org/3/reference/datamodel.html#special-method-names",
                "lessons": [
                    {
                        "slug": "dunder-methods-for-competitive-programming",
                        "title_uz": "Musobaqalar uchun Dunder Metodlar (__lt__, __str__)",
                        "title_en": "Dunder Methods in Competitive Programming",
                        "summary_uz": "Obyektlarni heapq yoki sort() da tartiblash uchun __lt__ metodini qayta yozish.",
                        "summary_en": "Implementing __lt__ for custom sorting and priority queues (heapq).",
                        "order": 1,
                        "source_url": "https://docs.python.org/3/reference/datamodel.html#special-method-names",
                        "source_author": "Python Software Foundation",
                        "source_license": "Python Software Foundation License",
                        "related_problem_slugs": ["merge-intervals"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Dunder metodlar nima?</h2>
<p>Dunder metodlar (Double Underscore — <code>__nom__</code>) Python-da operatorlar va tizimli funksiyalarning sinflar bilan qanday ishlashini belgilaydi.</p>

<h2>2. Musobaqa dasturlashda eng muhim dunder metod: __lt__ (Less Than)</h2>
<p>Musobaqalarda qatnashuvchilar ko'pincha murakkab obyektlarni saralashi yoki ularni <code>heapq</code> (prioritetli navbat) ga solishi kerak bo'ladi. Agar siz o'z sinfingizda <code>__lt__</code> (kichikmi) metodini yozmasangiz, Python <code>TypeError: '&lt;' not supported between instances</code> xatoligini beradi.</p>

<h2>3. Python kod namunasi</h2>
<pre><code class="language-python">import heapq

class Ishtirokchi:
    def __init__(self, ism, ball, jarima):
        self.ism = ism
        self.ball = ball
        self.jarima = jarima

    # Saralash qoidasi: ball ko'p bo'lsa yuqori, teng bo'lsa jarima kam bo'lsa yuqori
    def __lt__(self, boshqa):
        if self.ball != boshqa.ball:
            return self.ball &gt; boshqa.ball # Ko'proq ball yuqori o'rinda
        return self.jarima &lt; boshqa.jarima # Kamroq jarima yuqori o'rinda

    def __repr__(self):
        return f"{self.ism} (Ball: {self.ball}, Jarima: {self.jarima})"

# Ishtirokchilarni saralash
jadval = [
    Ishtirokchi("Ali", 300, 45),
    Ishtirokchi("Vali", 400, 60),
    Ishtirokchi("G'ani", 300, 30),
]

jadval.sort()
print("Saralangan reyting:")
for o_rin, kishi in enumerate(jadval, 1):
    print(f"{o_rin}. {kishi}")
</code></pre>

<h2>4. Qadamma-qadam tahlil</h2>
<ol>
  <li><code>jadval.sort()</code> chaqirilganda, Python har ikki obyektni solishtirish uchun avtomatik ravishda <code>self.__lt__(boshqa)</code> metodidan foydalanadi.</li>
  <li>Natijada: 1-o'rin: Vali (400 ball), 2-o'rin: G'ani (300 ball, 30 jarima), 3-o'rin: Ali (300 ball, 45 jarima).</li>
</ol>

<h2>5. Vaqt va xotira murakkabligi tahlili</h2>
<p><code>__lt__</code> solishtiruvi <strong>Vaqt murakkabligi: O(1)</strong> oladi. $N$ ta elementni saralash Timsort algoritmi bilan <strong>O(N \\log N)</strong> vaqtda bajariladi.</p>
</div>""",
                    }
                ],
            },
        ],
    },

    # =========================================================================
    # PILLAR 3: ALGORITMLAR VA MA'LUMOTLAR TUZILMALARI
    # =========================================================================
    {
        "category": {
            "slug": "algorithms",
            "icon": "cpu",
            "group": "Algoritmlar",
            "title_uz": "Algoritmlar va Ma'lumotlar Tuzilmalari",
            "title_en": "Algorithms & Data Structures",
            "description_uz": "Asimptotik tahlil, ikkilik qidiruv, ikki ko'rsatkich, stek, slayding oyna va dinamik dasturlash.",
            "description_en": "Asymptotic analysis, binary search, two pointers, stacks, sliding window, and DP.",
            "order": 3,
        },
        "topics": [
            {
                "slug": "algorithmic-complexity",
                "title_uz": "Algoritmik Murakkablik va Big-O Tahlili",
                "title_en": "Asymptotic Complexity & Big-O Notation",
                "description_uz": "Vaqt va xotira murakkabligi, asimptotik baholash va 1 soniyalik cheklovlar.",
                "description_en": "Time and space complexity, asymptotic Big-O bounds and 1-second execution limits.",
                "order": 1,
                "source_url": "https://cp-algorithms.com/",
                "lessons": [
                    {
                        "slug": "big-o-time-and-space-complexity",
                        "title_uz": "Vaqt va Xotira Murakkabligi (Big-O Notatsiyasi)",
                        "title_en": "Time & Space Complexity with Big-O",
                        "summary_uz": "O(1), O(log N), O(N), O(N log N), O(N^2) murakkabliklarini taqqoslash va amaliy hisoblash.",
                        "summary_en": "Comparing asymptotic growth rates and judging code efficiency against 1s time limit.",
                        "order": 1,
                        "source_url": "https://cp-algorithms.com/",
                        "source_author": "CP-Algorithms Contributors",
                        "source_license": "CC BY-SA 4.0",
                        "related_problem_slugs": ["two-sum"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Asimptotik tahlil va Big-O nima?</h2>
<p>Algoritmik musobaqalarda kodning kompyuter tezligiga bog'liq bo'lmagan holda, kiruvchi ma'lumotlar hajmi ($N$) oshishi bilan qanday sekinlashishini o'lchash uchun <strong>Big-O notatsiyasi</strong> qo'llaniladi.</p>

<h2>2. 1 soniyada qancha amal bajariladi?</h2>
<p>Zamonaviy baholash tizimlarida (shu jumladan AlgoSet-da) 1 soniya ichida o'rtacha $10^7$ dan $10^8$ tagacha oddiy operatsiyalar bajarilishi mumkin:</p>
<ul>
  <li>$N \\le 10^5$ yoki $10^6$ bo'lsa: <strong>O(N)</strong> yoki <strong>O(N \\log N)</strong> algoritm talab qilinadi.</li>
  <li>$N \\le 5000$ bo'lsa: <strong>O(N^2)</strong> yechim o'tadi.</li>
  <li>$N \\le 20$ bo'lsa: <strong>O(2^N)</strong> eksponensial yechim o'tadi.</li>
</ul>

<h2>3. Murakkabliklar ierarxiyasi (Tezdan sekinga)</h2>
<pre><code>O(1) &lt; O(log N) &lt; O(N) &lt; O(N log N) &lt; O(N^2) &lt; O(2^N) &lt; O(N!)</code></pre>

<h2>4. Python kod namunasi</h2>
<pre><code class="language-python"># O(1) — O'zgarmas vaqt
def birinchi_element(arr):
    return arr[0] if arr else None

# O(N) — Chiziqli vaqt
def chiziqli_qidiruv(arr, x):
    for i, son in enumerate(arr):
        if son == x:
            return i
    return -1

# O(N^2) — Kvadratik vaqt (ikki qavatli sikl)
def barcha_juftliklar(arr):
    n = len(arr)
    natija = []
    for i in range(n):
        for j in range(i + 1, n):
            natija.append((arr[i], arr[j]))
    return natija
</code></pre>

<h2>5. Xotira murakkabligi (Space Complexity)</h2>
<p>Faqatgina vaqt emas, balki algoritm ishlatadigan qo'shimcha xotira ham muhim. O'zgaruvchilar <strong>O(1)</strong> xotira talab qilsa, $N$ o'lchamli yangi massiv yaratish <strong>O(N)</strong> xotira sarflaydi.</p>
</div>""",
                    }
                ],
            },
            {
                "slug": "binary-search-and-two-pointers",
                "title_uz": "Ikkilik Qidiruv va Ikki Ko'rsatkich Uslubi",
                "title_en": "Binary Search & Two Pointers Technique",
                "description_uz": "Tartiblangan fazoda O(log N) qidiruv va O(N) ikki ko'rsatkich algoritmi.",
                "description_en": "Binary search on sorted arrays in O(log N) time and O(N) two pointers method.",
                "order": 2,
                "source_url": "https://cp-algorithms.com/num_methods/binary_search.html",
                "lessons": [
                    {
                        "slug": "binary-search-algorithm",
                        "title_uz": "Ikkilik Qidiruv (Binary Search) Algoritmi",
                        "title_en": "Binary Search Algorithm in Depth",
                        "summary_uz": "Tartiblangan massivda O(log N) vaqtda qidirish, cheksiz sikllardan saqlanish va bisect moduli.",
                        "summary_en": "O(log N) search on sorted arrays, preventing infinite loops and Python's bisect module.",
                        "order": 1,
                        "source_url": "https://cp-algorithms.com/num_methods/binary_search.html",
                        "source_author": "CP-Algorithms Contributors",
                        "source_license": "CC BY-SA 4.0",
                        "related_problem_slugs": ["binary-search"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Ikkilik qidiruv (Binary Search) qanday ishlaydi?</h2>
<p>Agar ma'lumotlar to'plami <strong>tartiblangan (sorted)</strong> bo'lsa, elementni bittalab tekshirish ($O(N)$) o'rniga, har bir qadamda qidiruv sohasini <strong>ikkiga bo'lish</strong> orqali $O(\\log N)$ vaqtda topish mumkin. 1,000,000 ta element ichidan qiymatni topish uchun ko'pi bilan 20 ta taqqoslash kifoya qiladi ($2^{20} \\approx 10^6$).</p>

<h2>2. Python kod namunasi</h2>
<pre><code class="language-python">def ikkilik_qidiruv(arr, target):
    chap = 0
    ong = len(arr) - 1

    while chap &lt;= ong:
        orta = (chap + ong) // 2
        
        if arr[orta] == target:
            return orta # Element topildi
        elif arr[orta] &lt; target:
            chap = orta + 1 # O'ng yarmidan qidiramiz
        else:
            ong = orta - 1  # Chap yarmidan qidiramiz

    return -1 # Element topilmadi

# Sinov
massiv = [-1, 0, 3, 5, 9, 12]
maqsad = 9
print("Indeks:", ikkilik_qidiruv(massiv, maqsad)) # 4
</code></pre>

<h2>3. Qadamma-qadam tahlil</h2>
<ol>
  <li>Dastlab <code>chap = 0</code> va <code>ong = 5</code>. O'rtadagi indeks <code>orta = 2</code>, qiymati <code>arr[2] = 3</code>.</li>
  <li>$3 &lt; 9$ bo'lgani sababli maqsad o'ng tomonda joylashgan. Shuning uchun <code>chap = 3</code> ga o'tadi.</li>
  <li>Yangi <code>orta = (3 + 5) // 2 = 4</code>. <code>arr[4] == 9</code> bo'lib element topildi va indeks 4 qaytariladi.</li>
</ol>

<h2>4. Vaqt va xotira murakkabligi tahlili</h2>
<p>Har qadamda qidiruv sohasi 2 barobar qisqaradi. <strong>Vaqt murakkabligi: O(log N)</strong>. Qo'shimcha xotira talab qilinmaydi: <strong>Xotira murakkabligi: O(1)</strong>.</p>

<h2>5. Amaliy mashq</h2>
<p>Ushbu bilimni mustahkamlash uchun AlgoSet platformasidagi <strong>Ikkilik qidiruv (Binary Search)</strong> masalasini yeching.</p>
</div>""",
                    },
                    {
                        "slug": "two-pointers-technique",
                        "title_uz": "Ikki Ko'rsatkich (Two Pointers) Texnikasi",
                        "title_en": "Two Pointers Technique",
                        "summary_uz": "Ikki tomondan harakatlanuvchi ko'rsatkichlar orqali O(N^2) masalalarni O(N) ga tushirish.",
                        "summary_en": "Optimizing O(N^2) problems down to O(N) using converging two-pointer sweeps.",
                        "order": 2,
                        "source_url": "https://cp-algorithms.com/",
                        "source_author": "CP-Algorithms Contributors",
                        "source_license": "CC BY-SA 4.0",
                        "related_problem_slugs": ["two-sum"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Ikki ko'rsatkich texnikasining mohiyati</h2>
<p>Ikki ko'rsatkich usuli tartiblangan massivlarda juftliklar yoki oraliqlarni qidirishda ikki qavatli sikl ($O(N^2)$) o'rniga massivning boshidan va oxiridan harakatlanib, <strong>bitta qadamda ($O(N)$)</strong> natijaga erishish imkonini beradi.</p>

<h2>2. Python kod namunasi</h2>
<pre><code class="language-python">def two_sum_sorted(arr, target):
    \"\"\"
    Tartiblangan massivda yig'indisi target ga teng
    bo'lgan ikkita sonning indekslarini qaytaradi.
    \"\"\"
    chap = 0
    ong = len(arr) - 1

    while chap &lt; ong:
        joriy_yigindi = arr[chap] + arr[ong]
        if joriy_yigindi == target:
            return [chap, ong]
        elif joriy_yigindi &lt; target:
            chap += 1 # Yig'indini kattalashtirish uchun chapni suramiz
        else:
            ong -= 1  # Yig'indini kichraytirish uchun o'ngni suramiz

    return []

# Sinov
sonlar = [2, 7, 11, 15]
print("Topilgan indekslar:", two_sum_sorted(sonlar, 9)) # [0, 1]
</code></pre>

<h2>3. Qadamma-qadam tahlil</h2>
<ol>
  <li>Dastlab <code>chap = 0</code> ($2$) va <code>ong = 3</code> ($15$). Yig'indi: $2 + 15 = 17 &gt; 9$. Demak, yig'indini kichraytirish kerak, <code>ong -= 1</code> qilamiz.</li>
  <li>Keyingi qadamda <code>chap = 0</code> ($2$) va <code>ong = 2</code> ($11$). Yig'indi: $2 + 11 = 13 &gt; 9$, yana <code>ong -= 1</code>.</li>
  <li>Uchinchi qadamda <code>chap = 0</code> ($2$) va <code>ong = 1</code> ($7$). Yig'indi: $2 + 7 = 9 == 9$. To'g'ri juftlik topildi!</li>
</ol>

<h2>4. Vaqt va xotira murakkabligi tahlili</h2>
<p>Har bir qadamda kamida bitta ko'rsatkich siljiydi va ular hech qachon orqaga qaytmaydi. Jami ko'pi bilan $N$ ta qadam bo'ladi: <strong>Vaqt murakkabligi: O(N)</strong>, <strong>Xotira murakkabligi: O(1)</strong>.</p>
</div>""",
                    },
                ],
            },
            {
                "slug": "prefix-and-intervals",
                "title_uz": "Prefiks Yig'indilar va Intervallar",
                "title_en": "Prefix Sums & Interval Management",
                "description_uz": "Oraliq so'rovlarini O(1) vaqtda hisoblash va intervallarni birlashtirish.",
                "description_en": "O(1) range sum queries using prefix sums and merging overlapping intervals.",
                "order": 3,
                "source_url": "https://cp-algorithms.com/",
                "lessons": [
                    {
                        "slug": "prefix-sums-and-range-queries",
                        "title_uz": "Prefiks Yig'indilar (Prefix Sums) va O(1) Oraliq So'rovlari",
                        "title_en": "Prefix Sums and O(1) Range Queries",
                        "summary_uz": "Massivning istalgan [L, R] oralig'idagi yig'indisini O(1) vaqtda hisoblash.",
                        "summary_en": "Computing range sums on [L, R] in O(1) query time using precomputed prefix sums.",
                        "order": 1,
                        "source_url": "https://cp-algorithms.com/",
                        "source_author": "CP-Algorithms Contributors",
                        "source_license": "CC BY-SA 4.0",
                        "related_problem_slugs": ["merge-intervals", "maximum-subarray"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Prefiks yig'indilar nima uchun kerak?</h2>
<p>Agar sizga $N$ ta sondan iborat massiv berilgan bo'lsa va $Q$ ta so'rovda [L, R] oraliqdagi sonlar yig'indisini so'ralsa, har safar sikl aylantirish $O(Q \\times N)$ vaqt olib, TLE beradi. <strong>Prefiks yig'indilar massivi</strong> yordamida har bir so'rovga <strong>O(1)</strong> vaqtda javob berish mumkin.</p>

<h2>2. Matematik formula</h2>
<p>$$P[i] = A[0] + A[1] + \\dots + A[i-1]$$</p>
<p>U holda $[L, R]$ oraliqdagi yig'indi: $$\\text{Sum}(L, R) = P[R+1] - P[L]$$</p>

<h2>3. Python kod namunasi</h2>
<pre><code class="language-python">class PrefiksYigindi:
    def __init__(self, arr):
        self.pref = [0] * (len(arr) + 1)
        for i in range(len(arr)):
            self.pref[i + 1] = self.pref[i] + arr[i]

    def oraliq_yigindi(self, chap, ong):
        # [chap, ong] indekslar oralig'idagi yig'indi (0-indekslangan)
        return self.pref[ong + 1] - self.pref[chap]

# Sinov
massiv = [2, 4, 1, 7, 5]
py = PrefiksYigindi(massiv)

# [1, 3] oraliq: 4 + 1 + 7 = 12
print("Oraliq [1, 3] yig'indisi:", py.oraliq_yigindi(1, 3)) # 12
# [0, 4] butun massiv yig'indisi: 19
print("Butun massiv yig'indisi:", py.oraliq_yigindi(0, 4)) # 19
</code></pre>

<h2>4. Vaqt va xotira murakkabligi tahlili</h2>
<p>Dastlabki tayyorlash (precomputation): <strong>O(N)</strong> vaqt. Har bir so'rovga javob: <strong>O(1)</strong> vaqt. Qo'shimcha xotira: <strong>O(N)</strong>.</p>

<h2>5. Amaliy mashq</h2>
<p>Ushbu konseptni mustahkamlash uchun <strong>Intervallarni birlashtirish</strong> masalasini tahlil qiling.</p>
</div>""",
                    }
                ],
            },
            {
                "slug": "intro-to-dp",
                "title_uz": "Dinamik Dasturlash Asoslari (DP)",
                "title_en": "Introduction to Dynamic Programming",
                "description_uz": "Memoizatsiya, tabulyatsiya va Kadane algoritmi orqali optimal qism-tuzilmalar.",
                "description_en": "Memoization, tabulation, optimal substructure, and Kadane's maximum subarray algorithm.",
                "order": 4,
                "source_url": "https://cp-algorithms.com/dynamic_programming/intro-to-dp.html",
                "lessons": [
                    {
                        "slug": "dynamic-programming-kadanes-algorithm",
                        "title_uz": "Dinamik Dasturlash va Kadane Algoritmi",
                        "title_en": "Dynamic Programming and Kadane's Algorithm",
                        "summary_uz": "Maksimal qism-massiv yig'indisini O(N) vaqtda topuvchi Kadane algoritmi tahlili.",
                        "summary_en": "Finding maximum subarray sum in O(N) time with O(1) space using Kadane's algorithm.",
                        "order": 1,
                        "source_url": "https://cp-algorithms.com/dynamic_programming/intro-to-dp.html",
                        "source_author": "CP-Algorithms Contributors",
                        "source_license": "CC BY-SA 4.0",
                        "related_problem_slugs": ["maximum-subarray"],
                        "content_uz": """<div class="space-y-4">
<h2>1. Dinamik dasturlash (DP) nima?</h2>
<p>Dinamik dasturlash — murakkab masalani bir-birini takrorlovchi kichikroq qism-masalalarga ajratib, har bir qism-masalaning javobini <strong>bir marta hisoblab xotirada saqlash</strong> usulidir. Bu eksponensial ($O(2^N)$) murakkablikdagi masalalarni chiziqli ($O(N)$) yoki ko'phadli ($O(N^2)$) vaqtda yechish imkonini beradi.</p>

<h2>2. Kadane algoritmi — Maksimal qism-massiv yig'indisi</h2>
<p>Berilgan $N$ ta son ichidan yig'indisi eng katta bo'lgan uzluksiz qism-massivni topish talab etiladi. Barcha oraliqlarni tekshirish $O(N^2)$ vaqt oladi. Kadane algoritmi har bir $i$-indeksda to'xtaganda faqat ikkita variantni ko'rib chiqadi:</p>
<ol>
  <li>Oldingi qism-massivga joriy sonni qo'shish: <code>joriy_yigindi + x</code></li>
  <li>Eski qism-massivni tashlab, yangisini aynan shu sondan boshlash: <code>x</code></li>
</ol>

<h2>3. Python kod namunasi</h2>
<pre><code class="language-python">def max_sub_array(nums):
    \"\"\"
    Kadane algoritmi: O(N) vaqt, O(1) xotira
    \"\"\"
    if not nums:
        return 0

    joriy_yigindi = nums[0]
    maksimal_yigindi = nums[0]

    for son in nums[1:]:
        # Qism-massivni davom ettiramizmi yoki yangisini boshlaymizmi?
        joriy_yigindi = max(son, joriy_yigindi + son)
        maksimal_yigindi = max(maksimal_yigindi, joriy_yigindi)

    return maksimal_yigindi

# Sinov
massiv = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
# Maksimal qism-massiv: [4, -1, 2, 1], yig'indisi: 6
print("Maksimal yig'indi:", max_sub_array(massiv)) # 6
</code></pre>

<h2>4. Qadamma-qadam tahlil</h2>
<ol>
  <li>Dastlab <code>joriy = -2</code>, <code>maksimal = -2</code>.</li>
  <li>Son <code>1</code> kelganda: <code>max(1, -2 + 1) = 1</code>. Maksimal: <code>1</code>.</li>
  <li>Son <code>-3</code> kelganda: <code>max(-3, 1 - 3) = -2</code>. Maksimal: <code>1</code>.</li>
  <li>Son <code>4</code> kelganda: <code>max(4, -2 + 4) = 4</code>. Maksimal: <code>4</code>.</li>
  <li>Son <code>-1</code> kelganda: <code>max(-1, 4 - 1) = 3</code>.</li>
  <li>Son <code>2</code> kelganda: <code>max(2, 3 + 2) = 5</code>. Maksimal: <code>5</code>.</li>
  <li>Son <code>1</code> kelganda: <code>max(1, 5 + 1) = 6</code>. Maksimal: <code>6</code>.</li>
</ol>

<h2>5. Vaqt va xotira murakkabligi tahlili</h2>
<p>Massiv bo'ylab faqat bitta sikl aylanadi: <strong>Vaqt murakkabligi: O(N)</strong>. Faqat ikkita sonli o'zgaruvchi saqlanadi: <strong>Xotira murakkabligi: O(1)</strong>.</p>

<h2>6. Amaliy mashq</h2>
<p>AlgoSet platformasidagi <strong>Maksimal qism-massiv yig'indisi</strong> masalasiga ushbu yechimni yuborib, 100 ball to'plashingiz mumkin!</p>
</div>""",
                    }
                ],
            },
        ],
    },
]

