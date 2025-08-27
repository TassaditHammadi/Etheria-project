import stripe
import json
import os
from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.template.loader import get_template
from xhtml2pdf import pisa


from .models import Reservation, Facture

stripe.api_key = settings.STRIPE_SECRET_KEY


@csrf_exempt
def create_checkout_session(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body or "{}")
            reservation_id = data.get('reservation_id')

            YOUR_DOMAIN = "http://localhost:8000"

            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'cad',
                        'unit_amount': 20000,
                        'product_data': {
                            'name': 'Réservation de voyage',
                        },
                    },
                    'quantity': 1,
                }],
                mode='payment',
                metadata={'reservation_id': str(reservation_id)},
                success_url=YOUR_DOMAIN + '/success/?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=YOUR_DOMAIN + '/cancel/',
            )

            return JsonResponse({'url': checkout_session.url})

        except Exception as e:
            return JsonResponse({'error': str(e)})


@csrf_exempt
def paiement_success(request):
    session_id = request.GET.get('session_id')
    if not session_id:
        return JsonResponse({'error': 'Aucune session_id fournie.'})

    session = stripe.checkout.Session.retrieve(session_id)
    reservation_id = session.metadata.get('reservation_id')

    try:
        reservation = Reservation.objects.get(id=reservation_id)
        reservation.statut = "PAYEE"
        reservation.save()

        # Génère ou met à jour la facture
        generer_facture_pdf(reservation)

        # ✅ Redirige vers ton frontend (port 5173, pas 3000)
        return HttpResponseRedirect("http://localhost:5174/reservations?paid=1")

    except Reservation.DoesNotExist:
        return JsonResponse({'error': 'Réservation introuvable'})


def generer_facture_pdf(reservation):
    """
    Génère/écrase le PDF sur disque puis fait un UPSERT de la Facture :
    - si une facture existe déjà pour cette réservation → MAJ fichier_pdf
    - sinon → création
    Évite l'IntegrityError (UNIQUE constraint) sur reservation_id.
    """
    template = get_template("facture_template.html")  # Assure-toi que ce fichier existe bien
    html = template.render({'reservation': reservation})

    facture_dir = os.path.join(settings.MEDIA_ROOT, 'factures')
    os.makedirs(facture_dir, exist_ok=True)

    path_pdf = os.path.join(facture_dir, f"facture_{reservation.id}.pdf")
    try:
        with open(path_pdf, "wb") as output:
            result = pisa.CreatePDF(html, dest=output)
            if result.err:
                print(f"❌ Erreur lors de la génération PDF : {result.err}")
                return None
    except Exception as e:
        print(f"❌ Exception lors de la génération PDF : {e}")
        return None

    # 🔁 UPSERT en base (pas de doublon)
    rel_path = f"factures/facture_{reservation.id}.pdf"
    try:
        facture = Facture.objects.get(reservation=reservation)
        facture.fichier_pdf = rel_path
        facture.save(update_fields=["fichier_pdf"])
        print(f"✅ Facture mise à jour pour la réservation {reservation.id}")
    except Facture.DoesNotExist:
        facture = Facture.objects.create(
            reservation=reservation,
            fichier_pdf=rel_path
        )
        print(f"✅ Facture créée pour la réservation {reservation.id}")

    return facture
