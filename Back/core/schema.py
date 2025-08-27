import hashlib
import graphene
from graphql import GraphQLError
from core.tp_hotels import call_hotels_api

from .iata import to_city_code, to_airline_code
from .tp_client import appel_tp

from graphene.types.datetime import Date   

# =======================
# == ENUMS & INPUTS    ==
# =======================
class TriVol(graphene.Enum):
    PRIX_ASC = "PRIX_ASC"
    PRIX_DESC = "PRIX_DESC"
    DATE_ASC = "DATE_ASC"
    DATE_DESC = "DATE_DESC"

class TriLogement(graphene.Enum):
    PRIX_ASC = "PRIX_ASC"
    PRIX_DESC = "PRIX_DESC"
    NOTE_DESC = "NOTE_DESC"

class CompagnieVol(graphene.Enum):
    AIR_CANADA = "AIR_CANADA"
    AIR_FRANCE = "AIR_FRANCE"
    TRANSAT = "TRANSAT"
    LUFTHANSA = "LUFTHANSA"
    EMIRATES = "EMIRATES"
    QATAR_AIRWAYS = "QATAR_AIRWAYS"
    AUTRE = "AUTRE"

class FiltresVol(graphene.InputObjectType):
    depart = graphene.String()
    destination = graphene.String()
    dateDepartMin = Date()      # ✅ Date ISO (YYYY-MM-DD)
    dateDepartMax = Date()
    prixMin = graphene.Float()
    prixMax = graphene.Float()
    compagnie = CompagnieVol()
    escale = graphene.Boolean()
    voyageurs = graphene.Int()
    tri = TriVol()
    page = graphene.Int(default_value=1)
    taillePage = graphene.Int(default_value=10)

class FiltresLogement(graphene.InputObjectType):
    ville = graphene.String()
    dateArrivee = Date()
    dateDepart = Date()
    prixMin = graphene.Float()
    prixMax = graphene.Float()
    voyageurs = graphene.Int()
    chambres = graphene.Int()
    commodites = graphene.List(graphene.NonNull(graphene.String))
    tri = TriLogement()
    page = graphene.Int(default_value=1)
    taillePage = graphene.Int(default_value=10)

# ==============
# == TYPES    ==
# ==============
class Vol(graphene.ObjectType):
    id = graphene.ID()
    depart = graphene.NonNull(graphene.String)
    destination = graphene.NonNull(graphene.String)
    date = graphene.NonNull(graphene.String)
    compagnie = graphene.NonNull(CompagnieVol)
    prix = graphene.NonNull(graphene.Float)
    duree = graphene.Int()

class PhotoType(graphene.ObjectType):
    url = graphene.String()

class LogementType(graphene.ObjectType):
    id = graphene.String()
    titre = graphene.String()
    ville = graphene.String()
    prixParNuit = graphene.Float()
    prixTotalSejour = graphene.Float()
    note = graphene.Float()
    capacite = graphene.Int()
    chambres = graphene.Int()
    placesParChambre = graphene.Int()
    commodites = graphene.List(graphene.String)
    photos = graphene.List(PhotoType)
    urlReservation = graphene.String()   

class PageVols(graphene.ObjectType):
    elements = graphene.List(graphene.NonNull(Vol), required=True)
    total = graphene.NonNull(graphene.Int)
    page = graphene.NonNull(graphene.Int)
    taillePage = graphene.NonNull(graphene.Int)
    aSuivant = graphene.NonNull(graphene.Boolean)

class PageLogements(graphene.ObjectType):
    elements = graphene.List(graphene.NonNull(LogementType), required=True)
    total = graphene.NonNull(graphene.Int)
    page = graphene.NonNull(graphene.Int)
    taillePage = graphene.NonNull(graphene.Int)
    aSuivant = graphene.NonNull(graphene.Boolean)

# =========================
# == UTILS vols ==========
# =========================
AIRLINE_TO_ENUM = {
    "AC": "AIR_CANADA",
    "AF": "AIR_FRANCE",
    "TS": "TRANSAT",
    "LH": "LUFTHANSA",
    "EK": "EMIRATES",
    "QR": "QATAR_AIRWAYS",
}

ENUM_TO_AIRLINE = {
    "AIR CANADA": "AC", "AC": "AC",
    "TRANSAT": "TS", "AIR TRANSAT": "TS",
    "WESTJET": "WS",
    "AIR FRANCE": "AF", "AF": "AF",
    "LUFTHANSA": "LH", "LH": "LH",
    "KLM": "KL",
    "BRITISH AIRWAYS": "BA",
    "EASYJET": "U2",
    "RYANAIR": "FR",
    "TAP": "TP", "TAP AIR PORTUGAL": "TP",
    "SWISS": "LX",
    "EMIRATES": "EK", "EK": "EK",
    "QATAR AIRWAYS": "QR", "QR": "QR",
    "TURKISH AIRLINES": "TK",
    "ETIHAD": "EY",
    "SINGAPORE AIRLINES": "SQ",
    "ANA": "NH",
    "JAPAN AIRLINES": "JL",
    "DELTA": "DL",
    "UNITED": "UA",
    "AMERICAN AIRLINES": "AA",
    "ALASKA AIRLINES": "AS",
    "JETBLUE": "B6",
    "SOUTHWEST": "WN",
}

def _compagnie_enum_from_iata(code: str) -> str:
    if not code:
        return "AUTRE"
    return AIRLINE_TO_ENUM.get(code.upper(), "AUTRE")

def _mk_id(vol: dict) -> str:
    key = f"{vol.get('depart')}-{vol.get('destination')}-{vol.get('date')}-{vol.get('compagnie')}-{vol.get('prix')}"
    return hashlib.md5(key.encode("utf-8")).hexdigest()

def _trier(vols: list[dict], tri: str | None) -> list[dict]:
    tri = tri or "PRIX_ASC"
    if tri == "PRIX_ASC":
        return sorted(vols, key=lambda v: v["prix"])
    if tri == "PRIX_DESC":
        return sorted(vols, key=lambda v: v["prix"], reverse=True)
    if tri == "DATE_ASC":
        return sorted(vols, key=lambda v: v["date"])
    if tri == "DATE_DESC":
        return sorted(vols, key=lambda v: v["date"], reverse=True)
    return vols

# =======================
# == QUERIES (Core) ====
# =======================
class CoreQuery(graphene.ObjectType):
    vols = graphene.Field(PageVols, filtres=graphene.Argument(graphene.NonNull(FiltresVol)))
    logements = graphene.Field(PageLogements, filtres=graphene.Argument(graphene.NonNull(FiltresLogement)))

    def resolve_vols(self, info, filtres: FiltresVol):
        if not filtres or not (filtres.get("depart") or filtres.get("destination")):
            raise GraphQLError("Vous devez fournir au moins 'depart' ou 'destination'.")

        origin = to_city_code(filtres.get("depart") or "")
        dest = to_city_code(filtres.get("destination") or "")

        dep_min = filtres.get("dateDepartMin")
        dep_max = filtres.get("dateDepartMax")

        range_dep = None
        if dep_min and dep_max:
            range_dep = f"{dep_min.isoformat()}:{dep_max.isoformat()}"
        elif dep_min:
            range_dep = f"{dep_min.isoformat()}:{dep_min.isoformat()}"
        elif dep_max:
            range_dep = f"{dep_max.isoformat()}:{dep_max.isoformat()}"

        params = {
            "origin": origin or None,
            "destination": dest or None,
            "departure_at": range_dep,
            "limit": filtres.get("taillePage") or 10,
            "page": filtres.get("page") or 1,
            "sorting": "price",
            "one_way": "true",
            "currency": "cad",
        }
        params = {k: v for k, v in params.items() if v not in (None, "", [])}
        tickets = appel_tp(params)

        vols_map = []
        for t in tickets:
            depart = (t.get("origin") or t.get("origin_iata") or "").upper()
            destination = (t.get("destination") or t.get("destination_iata") or "").upper()
            date = t.get("departure_at") or t.get("departure_time") or ""
            price = float(t.get("price") or t.get("value") or 0)

            airline = to_airline_code(t.get("airline") or t.get("airline_iata") or "")
            compagnie = _compagnie_enum_from_iata(airline)

            vol = {
                "depart": depart or origin,
                "destination": destination or dest,
                "date": date,
                "compagnie": compagnie,
                "prix": price,
                "duree": None,
            }

            if filtres.get("prixMin") is not None and price < float(filtres["prixMin"]):
                continue
            if filtres.get("prixMax") is not None and price > float(filtres["prixMax"]):
                continue

            vol["id"] = _mk_id(vol)
            vols_map.append(vol)

        vols_map = _trier(vols_map, filtres.get("tri"))
        total = len(vols_map)
        page = max(1, int(filtres.get("page") or 1))
        taille = max(1, int(filtres.get("taillePage") or 10))
        start = (page - 1) * taille
        end = start + taille
        elements = vols_map[start:end]
        a_suivant = end < total

        return PageVols(
            elements=[Vol(**e) for e in elements],
            total=total,
            page=page,
            taillePage=taille,
            aSuivant=a_suivant,
        )

    def resolve_logements(root, info, filtres=None):
        if not filtres or not filtres.get("ville"):
            return {"total": 0, "page": 1, "taillePage": 0, "aSuivant": False, "elements": []}

        try:
            result = call_hotels_api(
                city=filtres["ville"],
                check_in=filtres["dateArrivee"].isoformat() if filtres.get("dateArrivee") else None,
                check_out=filtres["dateDepart"].isoformat() if filtres.get("dateDepart") else None,
                adults=filtres.get("voyageurs", 2),
                page=filtres.get("page", 1),
                limit=filtres.get("taillePage", 10),
            )
            return result
        except Exception as e:
            raise Exception(f"[Hotels] {e}")

# ===================
# == MUTATIONS     ==
# ===================
class CoreMutation(graphene.ObjectType):
    ping = graphene.String()
    def resolve_ping(self, info):
        return "pong"

# ===================
# == ROOT SCHEMA ===
# ===================
from users.graphql import schema as users_schema
from reservations import schema as reservations_schema

class Query(CoreQuery, users_schema.Query, reservations_schema.Query, graphene.ObjectType):
    """Schéma racine: core + users + reservations"""
    pass

class Mutation(CoreMutation, users_schema.Mutation, reservations_schema.Mutation, graphene.ObjectType):
    """Mutations racines: core + users + reservations"""
    pass

schema = graphene.Schema(query=Query, mutation=Mutation)
