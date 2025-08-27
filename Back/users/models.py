from django.db import models
from django.contrib.auth.models import User

def user_upload_path(instance, filename):
    return f"user_{instance.user_id}/{filename}"

class UserDocument(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="document")
    file = models.FileField(upload_to=user_upload_path, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Doc({self.user.username})"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
   
    country_code = models.CharField(max_length=2, blank=True, default="")

    def __str__(self):
        return f"Profile({self.user.username})"