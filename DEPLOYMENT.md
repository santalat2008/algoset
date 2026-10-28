# AlgoSet — Production Deployment Runbook & Operations Guide

Ushbu qo'llanma AlgoSet platformasini ishlab chiqarish (production) muhitiga xavfsiz joylashtirish, sozlash, zaxiralash va monitoring qilish bo'yicha to'liq operatsion yo'riqnomadir.

---

## 1. Talablar va Arxitektura (Architecture Overview)

AlgoSet uchta asosiy konteynerdan tashkil topgan:
1. **`algoset_db`** (`postgres:16-alpine`): PostgreSQL 16 ma'lumotlar bazasi. Ishlab chiqarishda tashqi tarmoqqa (host) port ochilmaydi (`expose: 5432`), faqat Docker ichki tarmog'ida ishlaydi.
2. **`algoset_backend`** (Python 3.12 / Django 5 + DRF): Gunicorn WSGI serveri (4 worker, 2 thread) orqali ishga tushadi. Imtiyozsiz `algoset` tizim foydalanuvchisi huquqida ishlaydi.
3. **`algoset_frontend`** (Node.js 20 / Next.js 14): Optimallashtirilgan standalone/production build (`npm start`) orqali ishga tushadi. Imtiyozsiz `nextjs` foydalanuvchisi ostida xizmat qiladi.

---

## 2. Muhit O'zgaruvchilari (Production Environment Variables)

Ishlab chiqarishda barcha o'zgaruvchilar `.env` faylida ko'rsatilishi shart. `.env` faylini Git repozitoriyasiga aslo qo'shmang!

| O'zgaruvchi | Tavsiya etilgan qiymat | Tavsif |
|---|---|---|
| `DEBUG` | `False` | Ishlab chiqarishda qat'iy `False` bo'lishi shart |
| `SECRET_KEY` | `kamida 50 ta tasodifiy belgi` | Django xavfsizlik kaliti. Standart yoki qisqa kalit bo'lsa server ishga tushmaydi |
| `ALLOWED_HOSTS` | `algoset.uz,api.algoset.uz` | Ruxsat etilgan aniq domenlar (vergul bilan). `*` taqiqlangan |
| `CORS_ALLOWED_ORIGINS` | `https://algoset.uz` | Frontend domenlari |
| `CSRF_TRUSTED_ORIGINS` | `https://algoset.uz` | CSRF himoyalangan domenlar |
| `ENABLE_CODE_EXECUTION`| `False` | Kod ijrosini o'chirish. Haqiqiy izolyatsiyalangan runner qo'yilguncha `False` saqlanadi |
| `POSTGRES_DB` | `algoset_db` | Baza nomi |
| `POSTGRES_USER` | `algoset_prod_user` | Baza foydalanuvchisi |
| `POSTGRES_PASSWORD` | `murakkab_xavfsiz_parol` | Baza paroli |
| `POSTGRES_HOST` | `db` | Baza xost nomi |
| `POSTGRES_PORT` | `5432` | Baza porti |
| `DB_CONN_MAX_AGE` | `60` | Baza ulanishini qayta ishlatish vaqti (soniya) |
| `SECURE_SSL_REDIRECT` | `True` | HTTP so'rovlarni HTTPS ga yo'naltirish |
| `SESSION_COOKIE_SECURE`| `True` | Sessiya cookielarini faqat HTTPS orqali uzatish |
| `CSRF_COOKIE_SECURE` | `True` | CSRF cookielarini faqat HTTPS orqali uzatish |
| `ENABLE_HSTS` | `True` | HTTP Strict Transport Security yoqish |
| `USE_X_FORWARDED_PROTO`| `True` | Reverse proxy (Nginx/Cloudflare) orqasida ishlaganda |
| `NEXT_PUBLIC_API_URL` | `https://api.algoset.uz/api` | Klient brauzeri murojaat qiladigan API manzili |

---

## 3. Ishga Tushirish (Production Deployment with Docker Compose)

### 1-qadam: Repozitoriyani yuklash va muhit faylini yaratish
```bash
cp .env.example .env
nano .env  # Barcha ishlab chiqarish parollari va domenlarini kiriting
```

### 2-qadam: Production konfiguratsiyasini tekshirish
```bash
docker compose -f docker-compose.prod.yml build
```

### 3-qadam: Xizmatlarni ishga tushirish
```bash
docker compose -f docker-compose.prod.yml up -d
```

### 4-qadam: Migratsiyalarni qo'llash va Superadmin yaratish
```bash
# Migratsiyalar avtomatik docker-entrypoint orqali qo'llanadi, qo'lda tekshirish:
docker exec algoset_backend python manage.py migrate --noinput

# Superadmin yaratish:
docker exec -it algoset_backend python manage.py createsuperuser
```

---

## 4. Statik Fayllar va Reverse Proxy (Nginx / Caddy)

Django statik fayllarini yig'ish:
```bash
docker exec algoset_backend python manage.py collectstatic --noinput
```

### Nginx Konfiguratsiyasi namunasi (`/etc/nginx/sites-available/algoset`):

```nginx
server {
    listen 80;
    server_name algoset.uz api.algoset.uz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.algoset.uz;

    ssl_certificate /etc/letsencrypt/live/algoset.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/algoset.uz/privkey.pem;

    client_max_body_size 10M;

    location /static/ {
        alias /var/www/algoset/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}

server {
    listen 443 ssl http2;
    server_name algoset.uz;

    ssl_certificate /etc/letsencrypt/live/algoset.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/algoset.uz/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

---

## 5. Zaxira Nusxa Olish va Qayta Tiklash (Backup & Recovery)

### Ma'lumotlar bazasidan zaxira olish (Daily Backup):
```bash
docker exec algoset_db pg_dump -U algoset_user -d algoset_db | gzip > /backups/algoset_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Zaxiradan qayta tiklash (Restore):
```bash
gunzip < /backups/algoset_backup.sql.gz | docker exec -i algoset_db psql -U algoset_user -d algoset_db
```

---

## 6. Xavfsiz Kod Ijrochi Xizmati (Secure Runner Roadmap)

### Hozirgi holat:
- `DEBUG=False` holatida `ENABLE_CODE_EXECUTION=False` qilib belgilangan.
- O'quvchilarga xavfsizlik va vaqtinchalik texnik xizmat ko'rsatish haqida tushunarli xabar beriladi.
- Darsliklar, masalalar katalogi, musobaqa studiyasi va reyting tizimi to'liq va uzluksiz ishlaydi.

### Ochiq Internet (Public Production) uchun talab etiladigan Runner arxitekturasi:
1. **Alohida Worker Xizmati**:
   - Kod ijrosi Django veb-so'rovlaridan ajratilib, Celery / Redis orqali izolyatsiyalangan konteynerga yuboriladi.
2. **Yadro darajasidagi izolyatsiya (Nsjail / gVisor)**:
   - Tarmoq to'liq o'chirilgan (`--disable_clone_newnet`, 0 network access).
   - Linux cgroups orqali 256MB RAM va 1 vCPU qat'iy cheklovi.
   - Read-only ildiz tizimi va faqat xotiradagi `tmpfs`.
   - Seccomp filtrlari orqali xavfli system call'lar (fork, clone, socket, ptrace) taqiqlanadi.
   - Imtiyozsiz `nobody` foydalanuvchisi ostida yurgaziladi.

---

## 7. Versiyani Qaytarish (Rollback Procedure)

Agar yangi relizda nosozlik aniqlansa:
1. Konteynerlarni to'xtatish:
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```
2. Oldingi barqaror Docker obrazlarini yoki Git commit'ini tanlash:
   ```bash
   git checkout <previous_stable_tag>
   ```
3. Ma'lumotlar bazasi migratsiyalarini orqaga qaytarish (agar kerak bo'lsa):
   ```bash
   docker exec algoset_backend python manage.py migrate core <previous_migration_name>
   ```
4. Qayta ishga tushirish:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

