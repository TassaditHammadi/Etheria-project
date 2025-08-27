import os
import requests
from graphql import GraphQLError

LOOKUP_URL = "https://engine.hotellook.com/api/v2/lookup.json"
CACHE_URL  = "https://engine.hotellook.com/api/v2/cache.json"

def _env(key, default=None):
    v = os.getenv(key)
    return v if v not in (None, "") else default

def get_location_id(city: str, lang: str = "fr") -> int:
    """Résout 'Paris' -> locationId via l'API lookup."""
    params = {
        "query": city,
        "lang": (lang or _env("HOTELS_LOCALE", "fr")).lower(),
        "lookFor": "both",
        "limit": 1,
    }
    try:
        r = requests.get(LOOKUP_URL, params=params, timeout=10)
    except requests.RequestException as e:
        raise GraphQLError(f"[Hotels/lookup] réseau: {e}")
    if r.status_code != 200:
        raise GraphQLError(f"[Hotels/lookup] {r.status_code} {r.text}")

    data = r.json() or {}
    locs = (data.get("results") or {}).get("locations") or []
    if not locs:
        raise GraphQLError(f"[Hotels/lookup] Aucun locationId pour la ville: {city}")
    return int(locs[0]["id"])

def fetch_hotels_by_location_id(location_id: int, check_in: str, check_out: str,
                                adults: int = 2, page: int = 1, limit: int = 10,
                                currency: str = "CAD", locale: str = "fr") -> list[dict]:
    params = {
        "locationId": int(location_id),
        "checkIn": check_in,          # YYYY-MM-DD
        "checkOut": check_out,        # YYYY-MM-DD
        "adults": max(1, int(adults)),
        "page": max(1, int(page)),
        "limit": max(1, int(limit)),
        "currency": (currency or _env("HOTELS_CURRENCY", "CAD")).lower(),
        "language": (locale or _env("HOTELS_LOCALE", "fr")).lower(),  # 'language' accepté ici
    }
    try:
        r = requests.get(CACHE_URL, params=params, timeout=12)
    except requests.RequestException as e:
        raise GraphQLError(f"[Hotels/cache] réseau: {e}")
    if r.status_code != 200:
        raise GraphQLError(f"[Hotels/cache] {r.status_code} {r.text}")

    data = r.json() if r.content else []
    return data if isinstance(data, list) else []


def normalize_hotels(raw: list, city: str, check_in: str, check_out: str, adults: int):
    from datetime import date
    
    # calcule le nombre de nuits
    d1, d2 = date.fromisoformat(check_in), date.fromisoformat(check_out)
    nuits = max(1, (d2 - d1).days)

    hotels = []
    for h in raw:
        hotel_id = h.get("hotelId") or h.get("id")
        prix_total = h.get("priceFrom", 0)
        prix_par_nuit = round(prix_total / nuits, 2) if prix_total else 0

        hotels.append({
            "id": str(hotel_id),
            "titre": h.get("hotelName"),
            "ville": city,
            "prixParNuit": prix_par_nuit,
            "prixTotalSejour": prix_total,
            "note": h.get("stars"),
            "capacite": adults,
            "chambres": None,
            "commodites": [],
            "photos": [
                {
                    "url": f"https://photo.hotellook.com/image_v2/limit/h{hotel_id}_1/800/520.auto"
                }
            ]
        })
    return hotels


def call_hotels_api(city: str, check_in: str, check_out: str,
                    adults: int = 2, page: int = 1, limit: int = 10):
    # 1. Trouver le locationId
    loc_id = get_location_id(city)

    # 2. Récupérer les hôtels
    raw = fetch_hotels_by_location_id(
        loc_id, check_in, check_out,
        adults=adults, page=page, limit=limit
    )

    # 3. Normaliser
    hotels = normalize_hotels(raw, city, check_in, check_out, adults)

    return {
        "total": len(hotels),
        "page": page,
        "taillePage": limit,
        "aSuivant": len(hotels) == limit,  # simplifié
        "elements": hotels
    }
