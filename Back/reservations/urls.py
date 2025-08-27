# reservations/urls.py
from django.urls import path
from django.urls import path
from .views_factures import FactureListAPI
from . import views_factures
from .views_factures import create_checkout_session, success_supplement
from django.urls import path
from .views_factures import create_checkout_session, success_supplement, FactureListAPI, liste_factures

urlpatterns = [
    path("create-checkout-session/", create_checkout_session, name="create_checkout_session"),
    path("success-supplement/", success_supplement, name="success_supplement"),
    # tes autres routes :
    path("api/factures/", FactureListAPI.as_view(), name="factures_api"),
    path("factures/", liste_factures, name="liste_factures"),
    
]
