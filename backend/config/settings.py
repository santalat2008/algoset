import os
from pathlib import Path
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

# ------------------------------------------------------------------------------
# Core Security Settings
# ------------------------------------------------------------------------------
DEBUG = os.environ.get("DEBUG", "True").lower() in ("true", "1")

# SECRET_KEY: Fail fast in production if missing, default, or weak
default_secret = "algoset-secure-secret-key-prod-default" if DEBUG else ""
SECRET_KEY = os.environ.get("SECRET_KEY", default_secret)

if not DEBUG:
    if not SECRET_KEY or len(SECRET_KEY) < 40 or any(
        k in SECRET_KEY for k in ("change-me", "prod-default", "change-in-production", "algoset-secure-secret-key")
    ):
        raise ImproperlyConfigured(
            "XAVFSIZLIK XATOLIGI: Ishlab chiqarish rejimida (DEBUG=False) kamida 40 ta belgidan iborat "
            "xavfsiz SECRET_KEY muhit o'zgaruvchisi ko'rsatilishi shart! Standart shablonlardan foydalanish taqiqlanadi."
        )

# ALLOWED_HOSTS: In production, explicit domains are mandatory (no wildcards)
raw_allowed_hosts = os.environ.get("ALLOWED_HOSTS", "*" if DEBUG else "").strip()
if not DEBUG:
    if not raw_allowed_hosts or raw_allowed_hosts == "*":
        raise ImproperlyConfigured(
            "XAVFSIZLIK XATOLIGI: Ishlab chiqarish rejimida (DEBUG=False) ALLOWED_HOSTS uchun aniq domenlar "
            "ko'rsatilishi shart (masalan: ALLOWED_HOSTS=algoset.uz,api.algoset.uz). Wildcard '*' taqiqlangan."
        )
    ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(",") if h.strip()]
else:
    ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(",") if h.strip()]

# Code Execution Sandbox Boundary:
# In production, untrusted code execution is DISABLED by default until an isolated runner service is enabled.
default_exec = "True" if DEBUG else "False"
ENABLE_CODE_EXECUTION = os.environ.get("ENABLE_CODE_EXECUTION", default_exec).lower() in ("true", "1")

# ------------------------------------------------------------------------------
# Applications & Middleware
# ------------------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ------------------------------------------------------------------------------
# Database Configuration
# ------------------------------------------------------------------------------
is_docker = os.path.exists("/.dockerenv") or os.environ.get("RUNNING_IN_DOCKER") == "true"
use_postgres = os.environ.get("USE_POSTGRES") == "True" or (is_docker and os.environ.get("POSTGRES_HOST") == "db")

db_conn_max_age = int(os.environ.get("DB_CONN_MAX_AGE", "60" if not DEBUG else "0"))

if use_postgres:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "algoset_db"),
            "USER": os.environ.get("POSTGRES_USER", "algoset_user"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "algoset_pass"),
            "HOST": os.environ.get("POSTGRES_HOST", "db"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
            "CONN_MAX_AGE": db_conn_max_age,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
            "CONN_MAX_AGE": db_conn_max_age,
        }
    }

# ------------------------------------------------------------------------------
# Password Validation
# ------------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

AUTH_USER_MODEL = "core.User"

# ------------------------------------------------------------------------------
# Internationalization
# ------------------------------------------------------------------------------
LANGUAGE_CODE = "uz"
LANGUAGES = [
    ("uz", "Uzbek"),
    ("en", "English"),
]
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------------------------
# Static & Media Files
# ------------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ------------------------------------------------------------------------------
# CORS & CSRF Configuration
# ------------------------------------------------------------------------------
cors_allowed_origins_env = os.environ.get("CORS_ALLOWED_ORIGINS", "").strip()
if cors_allowed_origins_env:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in cors_allowed_origins_env.split(",") if o.strip()]
    CORS_ALLOW_ALL_ORIGINS = False
elif DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = []

CORS_ALLOW_CREDENTIALS = True

csrf_trusted_origins_env = os.environ.get("CSRF_TRUSTED_ORIGINS", "").strip()
if csrf_trusted_origins_env:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in csrf_trusted_origins_env.split(",") if o.strip()]
elif not DEBUG and cors_allowed_origins_env:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in cors_allowed_origins_env.split(",") if o.strip()]
else:
    CSRF_TRUSTED_ORIGINS = []

# ------------------------------------------------------------------------------
# HTTPS, Cookies & Security Headers
# ------------------------------------------------------------------------------
SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "False").lower() in ("true", "1")
SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "False" if DEBUG else "True").lower() in ("true", "1")
CSRF_COOKIE_SECURE = os.environ.get("CSRF_COOKIE_SECURE", "False" if DEBUG else "True").lower() in ("true", "1")
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

if not DEBUG and os.environ.get("ENABLE_HSTS", "False").lower() in ("true", "1"):
    SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.environ.get("SECURE_HSTS_INCLUDE_SUBDOMAINS", "True").lower() in ("true", "1")
    SECURE_HSTS_PRELOAD = os.environ.get("SECURE_HSTS_PRELOAD", "False").lower() in ("true", "1")
else:
    SECURE_HSTS_SECONDS = 0

if os.environ.get("USE_X_FORWARDED_PROTO", "False").lower() in ("true", "1"):
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# ------------------------------------------------------------------------------
# Request & Upload Size Limits
# ------------------------------------------------------------------------------
DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get("DATA_UPLOAD_MAX_MEMORY_SIZE", str(5 * 1024 * 1024)))
FILE_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get("FILE_UPLOAD_MAX_MEMORY_SIZE", str(10 * 1024 * 1024)))

# ------------------------------------------------------------------------------
# Email Configuration
# ------------------------------------------------------------------------------
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "noreply@algoset.uz")

# ------------------------------------------------------------------------------
# Django REST Framework & Throttling
# ------------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.environ.get("THROTTLE_ANON_RATE", "120/minute"),
        "user": os.environ.get("THROTTLE_USER_RATE", "600/minute"),
        "auth": os.environ.get("THROTTLE_AUTH_RATE", "30/minute"),
        "execution": os.environ.get("THROTTLE_EXECUTION_RATE", "120/minute"),
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

# ------------------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] [{levelname}] [{name}:{lineno}] {message}",
            "style": "{",
        },
        "simple": {
            "format": "[{levelname}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose" if not DEBUG else "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.environ.get("DJANGO_LOG_LEVEL", "INFO"),
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "WARNING" if not DEBUG else "INFO",
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
