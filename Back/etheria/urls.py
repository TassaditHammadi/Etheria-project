from django.contrib import admin
from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt
from graphene_file_upload.django import FileUploadGraphQLView  # ✅ on garde l’upload

from reservations.views_stripe import create_checkout_session, paiement_success
from reservations.views_factures import liste_factures, FactureListAPI

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # ✅ GraphQL avec upload (hérité de etheria)
    path("graphql/", csrf_exempt(FileUploadGraphQLView.as_view(graphiql=True))),

    # ✅ Routes Stripe (héritées du projet 2)
    path("create-checkout-session/", csrf_exempt(create_checkout_session), name="create-checkout-session"),
    path("success/", paiement_success, name="paiement_success"),

    # ✅ Factures (héritées du projet 2)
    path("api/factures/html/", liste_factures, name="factures_html"),
    path("api/factures/", FactureListAPI.as_view(), name="factures_api"),

    # ✅ Inclure les routes de reservations
    path("", include("reservations.urls")),
]

# ✅ Servir les fichiers médias (factures PDF, uploads…)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
