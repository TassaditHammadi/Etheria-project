# reservations/views_factures.py
import os
import json
import stripe

from django.utils import timezone
from django.conf import settings
from django.http import JsonResponse, HttpResponseRedirect
from django.template.loader import get_template
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from xhtml2pdf import pisa

from .models import Reservation, Facture
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import FactureSerializer

# Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Prix par personne en cents CAD
PRICE_PER_PERSON_CAD_CENTS = 20000  # 200,00 $ CAD


def generer_facture_pdf(reservation_id, modification=None):
    """
    Génère/écrase le PDF puis met à jour ou crée la facture.
    'modification' peut contenir:
      {type, old, new, delta, montant, currency, date}
    """
    try:
        reservation = Reservation.objects.get(id=reservation_id)
    except Reservation.DoesNotExist:
        print(f"[FACTURE] Réservation avec l'id {reservation_id} introuvable.")
        return None

    context = {
        "reservation": reservation,
        "modification": modification,
        "date_aujourdhui": timezone.localdate(),
    }

    template = get_template("facture_template.html")
    html = template.render(context)

    facture_dir = os.path.join(settings.MEDIA_ROOT, "factures")
    os.makedirs(facture_dir, exist_ok=True)
    path_pdf = os.path.join(facture_dir, f"facture_{reservation.id}.pdf")

    with open(path_pdf, "wb") as output:
        result = pisa.CreatePDF(html, dest=output)
        if result.err:
            print(f"[FACTURE] Erreur génération PDF : {result.err}")
            return None

    rel_path = f"factures/facture_{reservation.id}.pdf"
    try:
        facture = Facture.objects.get(reservation=reservation)
        facture.fichier_pdf = rel_path
        facture.save(update_fields=["fichier_pdf"])
        print(f"[FACTURE] Mise à jour facture pour réservation {reservation.id}")
    except Facture.DoesNotExist:
        facture = Facture.objects.create(reservation=reservation, fichier_pdf=rel_path)
        print(f"[FACTURE] Création facture pour réservation {reservation.id}")

    return facture


def liste_factures(request):
    factures = Facture.objects.all()
    return render(request, "liste_factures.html", {"factures": factures})


class FactureListAPI(APIView):
    def get(self, request):
        factures = Facture.objects.all()
        serializer = FactureSerializer(factures, many=True)
        return Response(serializer.data)


@csrf_exempt
def create_checkout_session(request):
    """Créer une session Stripe pour payer le supplément si le nb de personnes augmente."""
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    try:
        payload = json.loads(request.body or "{}")
        reservation_id = payload.get("reservation_id")
        new_nombre_personnes = payload.get("new_nombre_personnes")

        if not reservation_id:
            return JsonResponse({"error": "reservation_id manquant"}, status=400)

        try:
            reservation = Reservation.objects.get(id=reservation_id)
        except Reservation.DoesNotExist:
            return JsonResponse({"error": "Réservation introuvable"}, status=404)

        if new_nombre_personnes is None:
            return JsonResponse({"error": "new_nombre_personnes est requis"}, status=400)

        try:
            new_nombre_personnes = int(new_nombre_personnes)
        except (TypeError, ValueError):
            return JsonResponse({"error": "new_nombre_personnes invalide"}, status=400)

        delta = new_nombre_personnes - reservation.nombre_personnes
        if delta <= 0:
            return JsonResponse({"error": "Aucun supplément requis"}, status=400)

        supplement_cents = delta * PRICE_PER_PERSON_CAD_CENTS

        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{
                "price_data": {
                    "currency": "cad",
                    "product_data": {
                        "name": f"Supplément – Réservation #{reservation.id} (+{delta} personne{'s' if delta > 1 else ''})"
                    },
                    "unit_amount": supplement_cents,
                },
                "quantity": 1,
            }],
            # 🔁 Succès → callback backend puis redirection frontend /reservations
            success_url="http://localhost:8000/success-supplement/?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=f"http://localhost:3000/reservation-edit/{reservation.id}?payment=cancel",
            metadata={
                "reservation_id": str(reservation.id),
                "old_nombre_personnes": str(reservation.nombre_personnes),
                "new_nombre_personnes": str(new_nombre_personnes),
                "supplement_cents": str(supplement_cents),
                "currency": "CAD",
                "type": "supplement_personnes",
            },
        )

        print(f"[STRIPE] Checkout session créée: {session.id}")
        return JsonResponse({"url": session.url})

    except Exception as e:
        print(f"[STRIPE] create_checkout_session ERROR: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def success_supplement(request):
    """Stripe callback après paiement du supplément."""
    session_id = request.GET.get("session_id")
    if not session_id:
        return JsonResponse({"error": "session_id manquant"}, status=400)

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        meta = getattr(session, "metadata", {}) or {}

        reservation_id = meta.get("reservation_id")
        old_nombre = int(meta.get("old_nombre_personnes", "0") or 0)
        new_nombre = int(meta.get("new_nombre_personnes", "0") or 0)
        supplement_cents = int(meta.get("supplement_cents", "0") or 0)
        currency = meta.get("currency", "CAD")

        print(f"[STRIPE] success_supplement: old={old_nombre}, new={new_nombre}")

        if not reservation_id or not new_nombre:
            return JsonResponse({"error": "metadata incomplètes"}, status=400)

        try:
            reservation = Reservation.objects.get(id=reservation_id)
        except Reservation.DoesNotExist:
            return JsonResponse({"error": "Réservation introuvable"}, status=404)

        # ✅ Mise à jour DB
        reservation.nombre_personnes = new_nombre
        if not reservation.statut:
            reservation.statut = "PAYEE"
        reservation.save(update_fields=["nombre_personnes", "statut"])

        # 🔖 Infos modification pour le PDF
        modification = {
            "type": "supplement_personnes",
            "old": old_nombre,
            "new": new_nombre,
            "delta": new_nombre - old_nombre,
            "montant": supplement_cents / 100.0,
            "currency": currency,
            "date": timezone.localtime(timezone.now()),
        }

        generer_facture_pdf(reservation.id, modification=modification)

        # 🔁 Redirection vers la liste → Apollo refetch
        return HttpResponseRedirect("http://localhost:3000/reservations?paid=1")

    except Exception as e:
        print(f"[STRIPE] success_supplement ERROR: {e}")
        return JsonResponse({"error": str(e)}, status=500)
