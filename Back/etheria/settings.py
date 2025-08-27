from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# charge le fichier .env qui est à la racine du back
load_dotenv(os.path.join(BASE_DIR, ".env"))


GRAPHENE = { 
    "SCHEMA": "core.schema.schema" ,
    "MIDDLEWARE": ["graphql_jwt.middleware.JSONWebTokenMiddleware"],
 }    

raw = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in raw.split(",") if o.strip()]

CORS_ALLOWED_ORIGINS = ALLOWED_ORIGINS
CSRF_TRUSTED_ORIGINS = ALLOWED_ORIGINS
CORS_ALLOW_CREDENTIALS = True  # si cook

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-vbzb)9q_mn1-nj)g3e&vf1ei#!q(&w#wvrrx)5ux_u))9i8cou'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
    "etheria-project-uqf4.vercel.app",
    "back-etheria.onrender.com",  
    "localhost",
    "127.0.0.1"
]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    "corsheaders",
    "graphene_django",
    "rest_framework",
    "core",
    "users",
    "graphql_jwt.refresh_token.apps.RefreshTokenConfig", 
    "reservations"

]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

GRAPHQL_JWT = {
     "JWT_AUTH_HEADER_PREFIX": "Bearer", 
    "JWT_LONG_RUNNING_REFRESH_TOKEN": True,  
    "JWT_VERIFY_EXPIRATION": True,
}

ROOT_URLCONF = 'etheria.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'etheria.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

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
AUTHENTICATION_BACKENDS = [
   "graphql_jwt.backends.JSONWebTokenBackend",
    "django.contrib.auth.backends.ModelBackend",
]

# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True
# Clés Stripe
import os
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

STRIPE_PUBLISHABLE_KEY = "pk_test_51R8CHoFaC4ABhVfvtcBNtizA9MT4Yl0DI6h3W3L3q0fW8nTqQsMPZqsabrr6imIXjPGzX88CngvGL7ismRjbXVpm001z2CWBTZ"


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

