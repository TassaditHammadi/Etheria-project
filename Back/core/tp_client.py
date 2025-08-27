import os
import re
from datetime import datetime
import requests
from graphql import GraphQLError

BASE_URL = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates"

# IATA strict 3 lettres
IATA_RE = re.compile(r"^[A-Z]{3}$")
ISO_D_REGEX = re.compile(r"^\d{4}-\d{2}(-\d{2})?$")  # YYYY-MM ou YYYY-MM-DD


def _clean_iata(s: str | None) -> str | None:
    """Nettoie et valide un code IATA (3 lettres maj)."""
    if not s:
        return None
    cleaned = re.sub(r"[^A-Za-z]", "", str(s)).upper()
    return cleaned if IATA_RE.fullmatch(cleaned) else None


def _coerce_departure_at(value: str | None) -> str | None:
    """
    Normalise une date pour TravelPayouts.
    Accepte :
      - YYYY-MM ou YYYY-MM-DD
      - DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD
      - YYYY-MM-DDTHH:mm:ss
      - YYYY-MM-DD:YYYY-MM-DD -> garde la 1ère
    """
    if not value:
        return None

    s = str(value).strip()

    # plage -> garder la 1ère
    if ":" in s and re.fullmatch(r"\d{4}-\d{2}-\d{2}:\d{4}-\d{2}-\d{2}", s):
        s = s.split(":", 1)[0]

    # tronquer l'heure si présente
    if "T" in s:
        s = s.split("T", 1)[0]

    # déjà ISO valide
    if ISO_D_REGEX.match(s):
        return s

    # formats FR courants -> ISO
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass

    return None


def _int_or(default: int, v):
    try:
        return int(v)
    except Exception:
        return default


def _build_tp_params(filtres: dict) -> dict:
    """Prépare les paramètres pour l'appel TravelPayouts."""
    if not isinstance(filtres, dict):
        raise GraphQLError("Filtres invalides: attendu un objet.")

    # --- origin / destination ---
    origin = filtres.get("origin") or _clean_iata(filtres.get("depart"))
    dest = filtres.get("destination") or _clean_iata(filtres.get("destination"))

    if not origin or not dest:
        raise GraphQLError("Codes IATA invalides (ex. YMQ, PAR).")

    # --- departure_at ---
    dep_at = _coerce_departure_at(filtres.get("departure_at"))
    if not dep_at:
        # fallback min/max
        dmin = _coerce_departure_at(filtres.get("dateDepartMin"))
        dmax = _coerce_departure_at(filtres.get("dateDepartMax"))
        if dmin and dmax and dmin == dmax:
            dep_at = dmin
        elif dmin and not dmax:
            dep_at = dmin
        elif dmax and not dmin:
            dep_at = dmax

    # --- tri/pagination/currency/locale ---
    tri_raw = filtres.get("sorting") or filtres.get("tri") or ""
    tri = str(tri_raw).lower()
    sorting = "price" if "price" in tri or "prix" in tri else None

    page = max(1, _int_or(1, filtres.get("page")))
    limit = max(1, min(50, _int_or(10, filtres.get("limit") or filtres.get("taillePage"))))

    currency = (filtres.get("currency") or "CAD").upper()
    locale = (filtres.get("locale") or "fr").lower()

    params = {
        "origin": origin,
        "destination": dest,
        "currency": currency,
        "locale": locale,
        "page": page,
        "limit": limit,
    }
    if dep_at:
        params["departure_at"] = dep_at
    if sorting:
        params["sorting"] = sorting

    if "one_way" in filtres:
        params["one_way"] = str(filtres["one_way"]).lower()

    return params


def appel_tp(params: dict) -> list[dict]:
    """Appelle l’API TravelPayouts et retourne une liste de tickets."""
    token = os.getenv("TP_API_TOKEN")
    if not token:
        raise GraphQLError("TP_API_TOKEN manquant dans l'environnement.")

    try:
        q = _build_tp_params(params or {})
    except GraphQLError:
        raise
    except Exception as e:
        raise GraphQLError(f"Filtres invalides: {e}")

    if not isinstance(q, dict):
        raise GraphQLError("Erreur interne: les paramètres API ne sont pas un dict.")

    q["token"] = token

    try:
        r = requests.get(BASE_URL, params=q, headers={"X-Access-Token": token}, timeout=12)
    except requests.RequestException as e:
        raise GraphQLError(f"[TP] échec réseau: {e}")

    if r.status_code != 200:
        ct = (r.headers.get("Content-Type") or "")
        txt = r.text if "application/json" not in ct else r.json()
        raise GraphQLError(f"[TP] {r.status_code} {txt}")

    data = r.json() if r.content else {}
    tickets = data.get("data") or data.get("results") or data.get("tickets") or []
    if isinstance(tickets, dict):
        tickets = tickets.get("tickets") or []
    if not isinstance(tickets, list):
        tickets = []

    return tickets
