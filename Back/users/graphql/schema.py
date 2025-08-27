# users/graphql/schema.py

import graphene
import requests
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from graphql import GraphQLError
from graphql_jwt.shortcuts import get_token, create_refresh_token
import graphql_jwt
from graphene_file_upload.scalars import Upload

from users.models import UserProfile, UserDocument
from .types import UserType, UserDocumentType


# -----------------------
#         QUERIES
# -----------------------
class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    my_document = graphene.Field(UserDocumentType)

    def resolve_me(self, info):
        user = info.context.user
        if getattr(user, "is_authenticated", False):
            return user
        return None

    def resolve_my_document(self, info):
        user = info.context.user
        if not user.is_authenticated:
            return None
        doc, _ = UserDocument.objects.get_or_create(user=user)
        return doc


# -----------------------
#       MUTATIONS
# -----------------------

class RegisterUser(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)

    user = graphene.Field(UserType)
    token = graphene.String()
    refresh_token = graphene.String(name="refreshToken")

    @classmethod
    def mutate(cls, root, info, username, email, password, first_name, last_name):
        if User.objects.filter(username=username).exists():
            raise GraphQLError("Ce nom d'utilisateur existe déjà.")
        if User.objects.filter(email=email).exists():
            raise GraphQLError("Cet email est déjà utilisé.")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        token = get_token(user)
        refresh = create_refresh_token(user)

        return RegisterUser(user=user, token=token, refresh_token=refresh)


class UpdateProfile(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=False)
        email = graphene.String(required=False)
        country_code = graphene.String(required=False)
        first_name = graphene.String(required=False)
        last_name = graphene.String(required=False)

    user = graphene.Field(UserType)

    @classmethod
    def mutate(cls, root, info, username=None, email=None, country_code=None, first_name=None, last_name=None):
        user = info.context.user
        if not user.is_authenticated:
            raise GraphQLError("Authentification requise.")

        if username and username != user.username:
            if User.objects.filter(username=username).exists():
                raise GraphQLError("Ce nom d'utilisateur est déjà pris.")
            user.username = username

        if email:
            user.email = email
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name

        user.save()
        return UpdateProfile(user=user)


class ChangePassword(graphene.Mutation):
    class Arguments:
        old_password = graphene.String(required=True)
        new_password = graphene.String(required=True)

    ok = graphene.Boolean()

    @classmethod
    def mutate(cls, root, info, old_password, new_password):
        user = info.context.user
        if not user.is_authenticated:
            raise GraphQLError("Authentification requise.")
        if not user.check_password(old_password):
            raise GraphQLError("Ancien mot de passe incorrect.")
        if len(new_password) < 6:
            raise GraphQLError("Le nouveau mot de passe doit contenir au moins 6 caractères.")
        user.set_password(new_password)
        user.save()
        return ChangePassword(ok=True)


class UploadUserDocument(graphene.Mutation):
    class Arguments:
        file = Upload(required=True)

    document = graphene.Field(UserDocumentType)

    @classmethod
    def mutate(cls, root, info, file):
        user = info.context.user
        if not user.is_authenticated:
            raise GraphQLError("Authentification requise.")

        doc, _ = UserDocument.objects.get_or_create(user=user)
        doc.file = file
        doc.save()
        return UploadUserDocument(document=doc)


class HybridLogin(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    token = graphene.String()
    refreshToken = graphene.String()
    user = graphene.Field(UserType)
    source = graphene.String()

    @classmethod
    def mutate(cls, root, info, username, password):
        user = authenticate(username=username, password=password)
        if user is not None:
            token = get_token(user)
            refresh = create_refresh_token(user)
            return HybridLogin(token=token, refreshToken=str(refresh), user=user, source="local")

        try:
            resp = requests.post(
                "https://dummyjson.com/auth/login",
                json={"username": username, "password": password, "expiresInMins": 30},
                timeout=6,
            )
            if resp.status_code != 200:
                raise GraphQLError("Identifiants invalides.")
            data = resp.json()
            email = data.get("email") or ""
            user, created = User.objects.get_or_create(username=username, defaults={"email": email})
            if created:
                user.set_unusable_password()
                user.save()
            token = get_token(user)
            refresh = create_refresh_token(user)
            return HybridLogin(token=token, refreshToken=str(refresh), user=user, source="dummyjson")

        except GraphQLError:
            raise
        except Exception:
            raise GraphQLError("Identifiants invalides.")


class Mutation(graphene.ObjectType):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()

    register_user = RegisterUser.Field()
    update_profile = UpdateProfile.Field()
    change_password = ChangePassword.Field()
    upload_user_document = UploadUserDocument.Field()
    hybrid_login = HybridLogin.Field()
