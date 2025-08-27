CITY_TO_IATA = {
    # Canada
    "MONTREAL": "YUL", "YMQ": "YUL",
    "TORONTO": "YYZ", "YTO": "YTO",
    "VANCOUVER": "YVR",
    "QUEBEC": "YQB",
    "OTTAWA": "YOW",
    "CALGARY": "YYC",

    # USA
    "NEW YORK": "NYC", "NY": "NYC", "JFK": "JFK", "LGA": "LGA", "EWR": "EWR",
    "LOS ANGELES": "LAX", "LA": "LAX",
    "MIAMI": "MIA",
    "CHICAGO": "CHI", "ORD": "ORD",
    "SAN FRANCISCO": "SFO",
    "BOSTON": "BOS",

    # Europe
    "PARIS": "PAR", "CDG": "CDG", "ORY": "ORY",
    "LONDRES": "LON", "LONDON": "LON", "LHR": "LHR", "LGW": "LGW",
    "BERLIN": "BER",
    "ROME": "ROM", "FCO": "FCO",
    "MADRID": "MAD",
    "BARCELONE": "BCN",
    "BRUXELLES": "BRU",
    "GENEVE": "GVA",
    "AMSTERDAM": "AMS",

    # Afrique
    "CASABLANCA": "CMN",
    "DAKAR": "DSS",
    "TUNIS": "TUN",
    "ALGER": "ALG",
    "LE CAIRE": "CAI", "CAIRO": "CAI",

    # Moyen-Orient & Asie
    "DUBAI": "DXB",
    "DOHA": "DOH",
    "ISTANBUL": "IST",
    "DELHI": "DEL",
    "PEKIN": "PEK", "BEIJING": "PEK",
    "TOKYO": "TYO", "HND": "HND", "NRT": "NRT",
    "BANGKOK": "BKK",
    "SINGAPOUR": "SIN", "SINGAPORE": "SIN",
}

AIRLINE_NAME_TO_IATA = {
    # Canada
    "AIR CANADA": "AC", "AC": "AC",
    "TRANSAT": "TS", "AIR TRANSAT": "TS",
    "WESTJET": "WS",

    # Europe
    "AIR FRANCE": "AF", "AF": "AF",
    "LUFTHANSA": "LH", "LH": "LH",
    "KLM": "KL",
    "BRITISH AIRWAYS": "BA",
    "EASYJET": "U2",
    "RYANAIR": "FR",
    "TAP": "TP", "TAP AIR PORTUGAL": "TP",
    "SWISS": "LX",

    # Moyen-Orient & Asie
    "EMIRATES": "EK", "EK": "EK",
    "QATAR AIRWAYS": "QR", "QR": "QR",
    "TURKISH AIRLINES": "TK",
    "ETIHAD": "EY",
    "SINGAPORE AIRLINES": "SQ",
    "ANA": "NH",
    "JAPAN AIRLINES": "JL",

    # USA
    "DELTA": "DL",
    "UNITED": "UA",
    "AMERICAN AIRLINES": "AA",
    "ALASKA AIRLINES": "AS",
    "JETBLUE": "B6",
    "SOUTHWEST": "WN",
}


def to_city_code(value: str) -> str:
    if not value:
        return ""
    return CITY_TO_IATA.get(value.strip().upper(), value.strip().upper())

def to_airline_code(value: str) -> str | None:
    if not value:
        return None
    return AIRLINE_NAME_TO_IATA.get(value.strip().upper(), value.strip().upper())