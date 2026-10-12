import os
from pathlib import Path
from datetime import timedelta

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

ENVIRONMENT = os.getenv('DJANGO_ENV', 'development').strip().lower()
if ENVIRONMENT not in {'development', 'test', 'production'}:
    raise ImproperlyConfigured('DJANGO_ENV must be development, test, or production.')


def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized not in {'1', 'true', 'yes', 'on', '0', 'false', 'no', 'off'}:
        raise ImproperlyConfigured(f'{name} must be a boolean value.')
    return normalized in {'1', 'true', 'yes', 'on'}


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', '').strip()
if not SECRET_KEY and ENVIRONMENT != 'production':
    SECRET_KEY = 'development-only-insecure-secret-key'
if ENVIRONMENT == 'production' and (
    not SECRET_KEY or SECRET_KEY == 'change-me-in-backend-env'
):
    raise ImproperlyConfigured('DJANGO_SECRET_KEY must be set to a unique secret in production.')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env_bool('DJANGO_DEBUG', ENVIRONMENT == 'development')
if ENVIRONMENT == 'production' and DEBUG:
    raise ImproperlyConfigured('DJANGO_DEBUG must be false in production.')

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
    if host.strip()
]
if ENVIRONMENT == 'production' and (not ALLOWED_HOSTS or '*' in ALLOWED_HOSTS):
    raise ImproperlyConfigured('DJANGO_ALLOWED_HOSTS must contain explicit production hosts.')

SECURE_SSL_REDIRECT = env_bool(
    'DJANGO_SECURE_SSL_REDIRECT', ENVIRONMENT == 'production',
)
SESSION_COOKIE_SECURE = ENVIRONMENT == 'production'
CSRF_COOKIE_SECURE = ENVIRONMENT == 'production'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = int(os.getenv(
    'DJANGO_SECURE_HSTS_SECONDS', '31536000' if ENVIRONMENT == 'production' else '0',
))
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool(
    'DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS', ENVIRONMENT == 'production',
)
SECURE_HSTS_PRELOAD = env_bool(
    'DJANGO_SECURE_HSTS_PRELOAD', ENVIRONMENT == 'production',
)
if env_bool('DJANGO_TRUST_X_FORWARDED_PROTO', False):
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

AUTH_USER_MODEL = 'users.User'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'users',
    'products',
    'orders',
    'payments',
    'cart',
    'coupons',
    'banners',
    'dashboard',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DEFAULT_DB_ENGINE = 'django.db.backends.sqlite3' if ENVIRONMENT == 'test' else 'django.db.backends.postgresql'
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', DEFAULT_DB_ENGINE),
        'NAME': os.getenv('DB_NAME', str(BASE_DIR / 'test.sqlite3' if ENVIRONMENT == 'test' else 'ecommerce_db')),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR.parent
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    if origin.strip()
]

BANK_TRANSFER_DETAILS = {
    'holder': os.getenv('BANK_ACCOUNT_HOLDER', 'Tienda Demo S.L.'),
    'bank': os.getenv('BANK_NAME', 'Banco Demo'),
    'iban': os.getenv('BANK_IBAN', 'ESXX XXXX XXXX XXXX XXXX XXXX'),
}

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'pedidos@example.com')
EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend' if DEBUG
    else 'django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST = os.getenv('EMAIL_HOST', '')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = env_bool('EMAIL_USE_TLS', True)
TAX_RATE = os.getenv('TAX_RATE', '0.00')
SHIPPING_FLAT_RATE = os.getenv('SHIPPING_FLAT_RATE', '0.00')
PAYMENT_SIMULATION_ENABLED = env_bool('PAYMENT_SIMULATION_ENABLED', DEBUG)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'loggers': {
        'orders': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'payments': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
    },
}
