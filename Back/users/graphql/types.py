# users/graphql/types.py
import graphene
from graphene_django import DjangoObjectType
from django.contrib.auth import get_user_model
from users.models import UserProfile, UserDocument

UserModel = get_user_model()  # ✅ le bon modèle (compat. AUTH_USER_MODEL)

class UserProfileType(DjangoObjectType):
    class Meta:
        model = UserProfile
        fields = ("country_code",)

    country_code = graphene.String(name="countryCode")

    def resolve_country_code(self, info):
        return (self.country_code or "").upper()

class UserDocumentType(DjangoObjectType):
    class Meta:
        model = UserDocument
        fields = ("file", "uploaded_at")

    file = graphene.String()

    def resolve_file(self, info):
        if not self.file:
            return None
        request = getattr(info, "context", None)
        try:
            return request.build_absolute_uri(self.file.url) if request else self.file.url
        except Exception:
            return str(self.file)

class UserType(DjangoObjectType):
    country_code = graphene.String(name="countryCode")
    full_name = graphene.String(name="fullName")

    class Meta:
        model = UserModel   # ✅ au lieu de django.contrib.auth.models.User
        fields = ("id", "username", "email", "first_name", "last_name")

    def resolve_country_code(self, info):
        profile = getattr(self, "profile", None)
        return (profile.country_code or "").upper() if profile else ""

    def resolve_full_name(self, info):
        fn = (self.first_name or "").strip()
        ln = (self.last_name or "").strip()
        return (fn + " " + ln).strip()
