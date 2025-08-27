from django.contrib.auth.models import User
from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from .serializers import (
    RegisterSerializer,
    ProfileSerializer,
    UserDocumentSerializer,
    ChangePasswordSerializer,
)
from .models import UserDocument


# --- Auth / Register ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = []  # public


# --- Profil (GET/PUT) ---
class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(ProfileSerializer(request.user).data)

    def put(self, request):
        serializer = ProfileSerializer(instance=request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# --- Upload de document utilisateur ---
class DocumentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        doc, _ = UserDocument.objects.get_or_create(user=request.user)
        ser = UserDocumentSerializer(doc, context={"request": request})  # URL absolue
        return Response(ser.data)

    def post(self, request):
        doc, _ = UserDocument.objects.get_or_create(user=request.user)
        ser = UserDocumentSerializer(doc, data=request.data, partial=True, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


# --- Changement de mot de passe ---
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        user = request.user
        user.set_password(ser.validated_data["new_password"])
        user.save()
        return Response({"detail": "Mot de passe changé avec succès."})
