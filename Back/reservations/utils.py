from django.template.loader import render_to_string
from django.conf import settings
import os
from .models import Facture
from xhtml2pdf import pisa

def generer_facture_pdf(reservation):
    html_string = render_to_string("facture_template.html", {"reservation": reservation})
    
    # Définir le chemin de destination du PDF
    dossier_factures = os.path.join(settings.MEDIA_ROOT, "factures")
    os.makedirs(dossier_factures, exist_ok=True)

    nom_fichier = f"facture_reservation_{reservation.id}.pdf"
    chemin_complet = os.path.join(dossier_factures, nom_fichier)

    # Générer le PDF avec xhtml2pdf
    with open(chemin_complet, "wb") as f:
        pisa.CreatePDF(src=html_string, dest=f)

    # Enregistrer la facture dans la base de données
    facture = Facture.objects.create(
        reservation=reservation,
        fichier_pdf=f"factures/{nom_fichier}"
    )

    return facture
