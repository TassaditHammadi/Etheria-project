from django.db import models
from django.contrib.auth.models import User

class Reservation(models.Model):
    STATUT_CHOICES = [
        ('CONFIRMEE', 'Confirmée'),
        ('PAYEE', 'Payée'),
        ('ANNULEE', 'Annulée'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations')
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField()
    destination = models.CharField(max_length=255)
    date_voyage = models.DateField()
    nombre_personnes = models.PositiveIntegerField(default=1)
    date_reservation = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='CONFIRMEE')

    def __str__(self):
        return f"{self.nom} {self.prenom} - {self.destination} ({self.date_voyage})"


class Facture(models.Model):
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name='facture')
    fichier_pdf = models.FileField(upload_to='factures/')
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Facture pour réservation {self.reservation.id}"
