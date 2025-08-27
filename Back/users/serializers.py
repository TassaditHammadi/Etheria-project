from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserDocument, UserProfile

# --- Auth / Register ---
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=4)
    class Meta:
        model = User
        fields = ("id", "username", "email", "password")
    def create(self, validated_data):
        # Le signal crée automatiquement UserProfile
        return User.objects.create_user(**validated_data)

# --- Profil (expose countryCode mappé vers UserProfile.country_code) ---
class ProfileSerializer(serializers.ModelSerializer):
    countryCode = serializers.CharField(
        source="profile.country_code", required=False, allow_blank=True
    )

    class Meta:
        model = User
        fields = ("id", "username", "email", "countryCode")

    def validate(self, attrs):
        # Normalisation/validation du code pays si fourni
        profile_data = attrs.get("profile", {})
        code = profile_data.get("country_code")
        if code is not None:
            code = code.strip().upper()
            if code and len(code) != 2:
                raise serializers.ValidationError({"countryCode": "Code pays ISO-2 attendu (ex: FR, CA)."})
            profile_data["country_code"] = code
            attrs["profile"] = profile_data
        return attrs

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})
        instance = super().update(instance, validated_data)
        if profile_data:
            profile = getattr(instance, "profile", None)
            if not profile:
                profile = UserProfile.objects.create(user=instance)
            if "country_code" in profile_data:
                profile.country_code = profile_data["country_code"]
                profile.save()
        return instance

# --- Document utilisateur ---
class UserDocumentSerializer(serializers.ModelSerializer):
    # DRF construira une URL absolue si le serializer est instancié avec context={"request": request}
    file = serializers.FileField(required=False, allow_null=True)
    class Meta:
        model = UserDocument
        fields = ("file", "uploaded_at")

# --- Changement de mot de passe ---
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Ancien mot de passe incorrect.")
        return value
