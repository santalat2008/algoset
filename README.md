# AlgoSet — Raqobatbardosh Dasturlash va Ta'lim Platformasi

AlgoSet — LeetCode uslubidagi dasturlash masalalarini yechish, mualliflik qilish (Problem Authoring), dinamik darsliklar va reytingli musobaqalarni o'tkazishga mo'ljallangan zamonaviy platforma.

---

## 1. Talab qilinadigan dasturiy ta'minot (Prerequisites)

- **Docker Desktop** (Docker Engine 24+ va Docker Compose v2)
- **Node.js** v18+ va **npm** (lokal testlar yoki rivojlantirish uchun)
- **Python** 3.11+ (Docker ishlatilmagan holatlarda)
- **Git**

---

## 2. Muhitni sozlash (Environment Setup)

Loyiha ildizida `.env.example` shablonidan `.env` faylini nusxalang:

```bash
cp .env.example .env
```

Loyiha quyidagi asosiy o'zgaruvchilarni o'z ichiga oladi:

| O'zgaruvchi | Standart qiymat | Tavsif |
|---|---|---|
| `SECRET_KEY` | `algoset-super-secret-production-key-change-me` | Django xavfsizlik kaliti (Productionda maxfiy kalit o'rnatilishi shart) |
| `DEBUG` | `True` | Rivojlantirish rejimi (`False` bo'lganda shablon parollar taqiqlanadi) |
| `ALLOWED_HOSTS` | `*` | Ruxsat etilgan hostlar |
| `ENABLE_CODE_EXECUTION` | `True` | Kod ijrosini yoqish/o'chirish favqulodda kaliti |
| `POSTGRES_DB` | `algoset_db` | PostgreSQL ma'lumotlar bazasi nomi |
| `POSTGRES_USER` | `algoset_user` | Baza foydalanuvchisi |
| `POSTGRES_PASSWORD` | `algoset_pass` | Baza paroli |
| `POSTGRES_HOST` | `db` | Baza konteyner nomi |
| `POSTGRES_PORT` | `5432` | Baza porti |
| `EMAIL_BACKEND` | `django.core.mail.backends.console.EmailBackend` | Lokal sinov uchun konsol emaili |
| `NEXT_PUBLIC_API_URL`| `http://localhost:8000/api` | Frontend API manzili |

> [!IMPORTANT]
> **Production Xavfsizlik Himoyasi**: Agar `DEBUG=False` o'rnatilsa, Django startap vaqtida shablon yoki ochiq `SECRET_KEY` mavjudligini avtomatik tekshiradi va xavfsiz kalit taqdim etilmaguncha ishga tushishni to'xtatadi (`ImproperlyConfigured`).

---

## 3. Dasturlash Tillari Bo'yicha Holat (Supported Languages)

> [!NOTE]
> **MVP Dasturlash Tili**: Hozirgi MVP relizida **faqat Python 3 (3.11)** to'liq ijro etiladi va baholanadi.

- **Python 3**: To'liq qo'llab-quvvatlanadi (funktsiya-asosli LeetCode formati, test keyslar, AST xavfsizlik filtrlari, timeout va xotira chegaralari).
- **C++, Java, JavaScript**: Frontendda shablonlar mavjud, biroq judge darajasida haqiqiy `g++`, `javac` va `node` izolyatsiyasi o'rnatilmaguncha, ushbu tillar **"Tez kunda / Unavailable"** sifatida belgilangan.
- **Backend Himoyasi**: Backend no-Python so'rovlarni qabul qilmaydi (`400 Bad Request` qaytaradi) va soxta (simulated) `Accepted` natijalar berishi butunlay bartaraf etilgan.

---

## 4. Loyihani ishga tushirish (Start the Application)

### Rivojlantirish muhiti (Development):
```bash
docker compose up -d --build
```

### Ishlab chiqarish muhiti (Production):
To'liq ishlab chiqarish yo'riqnomasi va xavfsizlik sozlamalari [DEPLOYMENT.md](file:///d:/Santalat/algo_set/DEPLOYMENT.md) faylida keltirilgan:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Konteynerlar holatini tekshirish:
```bash
docker compose ps
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

## 5. Ma'lumotlar bazasi migratsiyalarini qo'llash (Apply Migrations)

Baza sxemasini yangilash uchun:

```bash
docker exec -it algoset_backend python manage.py migrate
```

---

## 6. Superadmin yaratish (Create Superadmin)

### Xavfsiz ishlab chiqarish usuli (Production):
```bash
docker exec -it algoset_backend python manage.py createsuperuser
```

### Rivojlantirish muhiti (Development Seed):
Lokal rivojlantirishda test hisoblarini yaratish uchun:
```bash
docker exec -it algoset_backend python manage.py seed_algoset
```
*Eslatma: Ushbu buyruq `DEBUG=False` bo'lganda standart parollar tarqalishini oldini olish uchun bloklanadi. Non-debug muhitda sinov uchun `--allow-insecure-seed` bayrog'i talab etiladi.*

Standart rivojlantirish hisoblari (standart parol: `algoset123`):
- **Superadmin**: `superadmin` (`superadmin@algoset.uz`)
- **Admin**: `admin` (`admin@algoset.uz`)
- **Muallif (Author)**: `author` (`author@algoset.uz`)
- **Talaba (Student)**: `student` (`student@algoset.uz`)

---

## 7. Dastlabki ma'lumotlarni yuklash (Seed Initial Content)

Idempotent seed skripti orqali toifalar, mavzular, testlangan masalalar va musobaqalarni yuklash:

```bash
docker exec -it algoset_backend python manage.py seed_algoset
```

To'liq qayta tozalab yuklash uchun `--force` bayrog'idan foydalaning:
```bash
docker exec -it algoset_backend python manage.py seed_algoset --force
```

---

## 8. Rollar va Huquqlar Matritsasi (RBAC)

| Imkoniyat | Student | Author | Admin | Superadmin |
|---|:---:|:---:|:---:|:---:|
| Ommaviy masalalarni yechish | ✅ | ✅ | ✅ | ✅ |
| Ommaviy darsliklar va qo'llanmalarni o'qish | ✅ | ✅ | ✅ | ✅ |
| Shaxsiy masalalar yaratish (Private by default) | ❌ | ✅ | ✅ | ✅ |
| Problem Authoring Studio (Testlar, Validatsiya) | ❌ | ✅ | ✅ | ✅ |
| Contest Studio (Musobaqa yaratish, tahrirlash) | ❌ | ✅ (O'z musobaqalari) | ✅ | ✅ |
| Learning Studio (Darsliklar, mavzular boshqaruvi) | ❌ | ✅ (O'z darslari) | ✅ (To'liq) | ✅ (To'liq) |
| Ommaviy qilishni so'rash (Masala, Musobaqa, Dars) | ❌ | ✅ | ✅ | ✅ |
| So'rovlarni ko'rib chiqish / tasdiqlash | ❌ | ❌ | ✅ | ✅ |
| Toifalar va Mavzularni boshqarish (CRUD) | ❌ | ❌ | ✅ | ✅ |
| Kaskadli o'chirish himoyasi (Topics/Lessons mavjud bo'lsa) | — | — | ✅ (Himoyalangan) | ✅ (Himoyalangan) |
| Yakunlangan musobaqalar o'zgarmasligi (Rating himoyasi) | — | — | ✅ (Bloklangan) | ✅ (Bloklangan) |
| Muallif rolini berish / bekor qilish | ❌ | ❌ | ✅ | ✅ |
| Admin rolini berish / bekor qilish | ❌ | ❌ | ❌ | ✅ |
| Superadmin rolini berish / boshqarish | ❌ | ❌ | ❌ | ✅ |
| Yagona faol superadmin himoyasi | ❌ | ❌ | ❌ | ✅ (O'chirish/pasaytirish bloklangan) |

---

## 9. Yangi Studiyalar (Studio Environments)

AlgoSet uchta mustaqil, to'liq ma'lumotlar bazasi bilan integratsiya qilingan studiya interfeysiga ega:

### 1. Problem Authoring Studio (`/admin/problems/studio`)
- Masalalar yaratish va versiyalash (v1, v2, ...).
- Markdown va LaTeX qo'llab-quvvatlanuvchi shartlar.
- Test keyslarni qo'lda va ZIP arxiv orqali yuklash, guruhlash va ommaviy sinovdan o'tkazish.
- Reference Solution va Wrong Solution orqali avtomatik validatsiya hamda ommaga chiqarish so'rovlari.

### 2. Contest Studio (`/admin/contests/studio`)
- **Ko'rsatkichlar (Dashboard)**: Barcha musobaqalar, kutilayotgan (upcoming), davom etayotgan (ongoing), yakunlangan (past), ommaviy va shaxsiy musobaqalar statistikasi.
- **Musobaqa Tahrirchisi**: Nomi, slugi, boshlanish vaqti, davomiyligi (daqiqalarda), qoidalari (Uzbek / English) va ko'rinishi.
- **Masalalar Tanlovchisi va Ballar Balansi**: Musobaqaga masalalarni qo'shish, ketma-ketlik tartibini o'zgartirish va har bir masalaga individual ballar (`points`) belgilash (`problem_order` tuzilmasi).
- **Ruxsat va Xavfsizlik**: Mualliflar faqat o'zlarining shaxsiy yoki barcha ommaviy masalalarni tanlay oladi; begonaning shaxsiy masalasi tanlansa backend qat'iy `400 Bad Request` qaytaradi.
- **Reyting va Natijalar Yaxlitligi**: Yakunlangan yoki reytingi hisoblangan musobaqalarning vaqti, davomiyligi va masalalar ro'yxatini o'zgartirish yoki musobaqani o'chirish taqiqlangan (`400 Bad Request`).
- **Ommaviy Qilish Zanjiri**: Mualliflar yaratgan musobaqalarni ommaga chiqarish uchun so'rov jo'natadi, Admin/Superadmin esa qoidalari va masalalarini ko'rib chiqib tasdiqlaydi yoki qaytaradi.

### 3. Learning Studio (`/admin/learning/studio`)
- **Ko'rsatkichlar**: Toifalar, mavzular, darslar, ommaviy/shaxsiy va tasdiqlash kutayotgan darslar hisoblagichi.
- **Darslar Boshqaruvi (Lessons)**:
  - Mavzuga bog'lash, tartib raqami (`order`), qisqacha tavsif va boy matnli mazmun (`content_uz`, `content_en`).
  - **HTML Sanitizatsiyasi**: Ta'limiy teglarni (`<p>`, `<code>`, `<pre>`, `<b>`, `<i>`, `<ul>`, `<ol>`, `<table>`, `<a>`) saqlaydi, ammo `<script>`, `<style>`, `<iframe>` va xavfli hodisalarni (`onclick`, `onerror`) tozalaydi.
  - **Amaliy Masalalarni Bog'lash**: Darsga doir AlgoSet masalalarini tanlash va biriktirish; talaba darsni o'qiyotganda ushbu masalalar dars ostida avtomatik chiqadi.
- **Mavzular (Topics) & Toifalar (Categories)**:
  - Yangi toifalar (ikonka, tartib, faollik) va mavzular yaratish.
  - **Kaskadli Himoya (Safe Cascade Protection)**: Ichida mavzulari bor toifani yoki ichida darslari bor mavzuni o'chirish bloklanadi va foydalanuvchiga tushunarli sabab ko'rsatiladi.
- **Ierarxiya Ko'rinishi (Visual Hierarchy Browser)**:
  - `Kategoriya -> Mavzu -> Dars -> Amaliy Masalalar` zanjirini to'liq ko'rish imkoniyati.
- **Ommaviy Qilish Zanjiri**: Darslarni mustaqil `draft` holatida saqlash, ko'rib chiqishga topshirish va administrator tomonidan tasdiqlash.

---

## 9. Kod Ijrosi Xavfsizlik Chegaralari (Security Boundary)

- **Subprocess Izolyatsiyasi**: Python kodi alohida subprocessda (`sys.executable -I`) bajariladi.
- **Maxfiy O'zgaruvchilar Himoyasi**: `safe_env` faqat minimal `PATH` va til parametrlarini uzatadi; Django backend jarayonining `SECRET_KEY`, `POSTGRES_PASSWORD` kabi muhit sirlari subprocessga meros qilib berilmaydi.
- **Hajm va Vaqt Cheklovlari**: Maksimal kod hajmi 64 KB, kiritish ma'lumotlari 100 KB, bajarilish vaqti qat'iy 5.0 soniya bilan cheklangan.
- **Cheklov**: Subprocess kernel-level sandbox (nsjail/gVisor) emas. Shu sababli, platformani internetga ommaviy ochishdan oldin untrusted public execution uchun alohida worker izolyatsiyasi zarur.

---

## 10. Testlarni ishga tushirish (Running Tests)

### Backend Testlari (Django Test Suite):
```bash
docker exec -it algoset_backend python manage.py test
```
*Natija: **44/44 test muvaffaqiyatli** (`OK`), shu jumladan RBAC, xavfsizlik chegaralari, Contest Studio (problem ordering, rating integrity, points) va Learning Studio (HTML sanitization, cascade protection, lesson progress) regressiya testlari.*

### Frontend va Integratsiya Testlari:
```bash
node frontend/test_edge_cases.js
```
*Natija: **35/35 test muvaffaqiyatli**.*

### Studiyalar Integratsiya Testlari (Contest & Learning Studios):
```bash
node frontend/test_studios_integration.js
```
*Natija: **12/12 test muvaffaqiyatli** (Dashboard ko'rsatkichlari, Darsliklar CRUD, HTML sanitizatsiyasi, Kaskadli himoya, Musobaqa yaratish, Masalalar ordering va ballar balansi, O'zgarmaslik tekshiruvlari).*

### To'liq End-to-End Tekshiruv Skripti:
```bash
node frontend/test_complete_e2e_verification.js
```
*Natija: **22/22 test muvaffaqiyatli** (Haqiqiy foydalanuvchilar oqimi, xavfsizlik cheklovlari, kaskadli himoya, o'zgarmaslik, muddat validatsiyasi).*

---

## 11. Muammolarni bartaraf etish (Troubleshooting)

- **Port bandligi (8000 yoki 3000)**:
  `docker compose down` qiling va portni band qilgan boshqa dasturlarni to'xtating.
- **Baza ulanishi**:
  `wait_for_db.py` backendning PostgreSQL tayyor bo'lguncha kutishini ta'minlaydi.
- **Frontendni qayta yuklash**:
  `docker compose restart frontend` buyrug'idan foydalaning.

---

## 12. Loyihani to'xtatish va qayta ishga tushirish

```bash
# To'xtatish
docker compose down

# To'xtatish va bazani tozalash
docker compose down -v

# Qayta ishga tushirish
docker compose restart
```
