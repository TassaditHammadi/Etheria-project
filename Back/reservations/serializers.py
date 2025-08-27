# reservations/serializers.py
from rest_framework import serializers
from .models import Facture

class FactureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facture
        fields = ['id', 'fichier_pdf', 'date_creation']
