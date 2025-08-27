// src/pages/Accueil.tsx
import { useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_VOLS } from "../src/graphql/vols";
import { GET_LOGEMENTS } from "../src/graphql/logements";
import bgImage from "../src/assets/photo.jpg";
import { Link } from "react-router-dom";


// helpers
const fmtPrix = (n: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);

type Onglet = "vols" | "logements";

export default function Accueil() {
  const [onglet, setOnglet] = useState<Onglet>("vols");

  // ---- états vols ----
  const [typeVol, setTypeVol] = useState<"aller-simple" | "aller-retour">("aller-simple");
  const [villeDepart, setVilleDepart] = useState("");
  const [villeDestination, setVilleDestination] = useState("");
  const [dateAller, setDateAller] = useState("");
  const [dateRetour, setDateRetour] = useState("");
  const [volAllerChoisi, setVolAllerChoisi] = useState<any>(null);
  const today = new Date().toISOString().split("T")[0];


  // ---- états logements ----
  const [villeLogement, setVilleLogement] = useState("");
  const [dateArrivee, setDateArrivee] = useState("");
  const [dateDepart, setDateDepart] = useState("");
  const [voyageurs, setVoyageurs] = useState(1);
  const [tri, setTri] = useState("prix-asc");


  // ---- queries ----
    const [fetchVols, { data: volsData, loading: _volsLoading, error: _volsError }] =
    useLazyQuery(GET_VOLS);

  const [
    fetchLogements,
    { data: logementsData, loading: logementsLoading, error: logementsError },
  ] = useLazyQuery(GET_LOGEMENTS);

  // ---- handlers ----
  const chercherVols = () => {
    if (typeVol === "aller-retour" && volAllerChoisi) {
      // Étape 2 : recherche du retour
      fetchVols({
        variables: {
          filtres: {
            depart: villeDestination,
            destination: villeDepart,
            dateDepartMin: dateRetour,
            dateDepartMax: dateRetour,
            page: 1,
            taillePage: 5,
          },
        },
      });
    } else {
      // Étape 1 : recherche de l’aller (ou aller simple)
      fetchVols({
        variables: {
          filtres: {
            depart: villeDepart,
            destination: villeDestination,
            dateDepartMin: dateAller,
            dateDepartMax: dateAller,
            page: 1,
            taillePage: 5,
          },
        },
      });
    }
  };

  const chercherLogements = () => {
    fetchLogements({
      variables: {
        filtres: {
          ville: villeLogement,
          dateArrivee,
          dateDepart,
          voyageurs,
          page: 1,
          taillePage: 5,
        },
      },
    });
  };

  // ---- rendu ----
    return (
        <div className="w-full min-h-screen">
            {/* HERO avec image de fond */}
            <div
            className="relative w-full  h-[500px] flex flex-col items-center text-white"
            style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                height: "60vh"
            }}
            >
            {/* Overlay sombre */}
            <div className="absolute inset-0 bg-black/40"></div>

            {/* Onglets en haut gauche */}
            <div className="absolute top-6 left-6 z-10 flex gap-4">
                <button
                    onClick={() => setOnglet("vols")}
                    className={`px-5 py-2 rounded-xl font-semibold transition backdrop-blur-md shadow-lg border ${
                        onglet === "vols"
                        ? "bg-blue-600/80 text-white border-white"
                        : "bg-white/20 text-white hover:bg-white/30 border-white/50"
                    }`}
                >
                    ✈️ Vols
                </button>

                <button
                onClick={() => setOnglet("logements")}
                className={`px-5 py-2 rounded-lg font-semibold transition backdrop-blur-md shadow ${
                    onglet === "logements"
                    ? "bg-green-700/70 text-white"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
                >
                🏠 Logements
                </button>

            </div>

            {/* Texte centré */}
            <div className="relative z-10 text-center mt-24 mb-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Découvrez le monde avec Éthéria
                </h1>
                <p className="text-lg">Vols ✈️ et logements 🏡 au meilleur prix</p>
            </div>
            
            
            <div className="relative z-10 w-[95%] max-w-5xl  rounded-2xl p-6">
            {/* ---- Vols ---- */}

                {onglet === "vols" && (
                <section className="bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700">
                    ✈️ Rechercher un vol
                    </h2>

                    {/* Choix aller simple / aller-retour */}
                    <div className="flex gap-6 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-800 ">
                        <input
                        type="radio"
                        value="aller-simple"
                        checked={typeVol === "aller-simple"}
                        onChange={() => setTypeVol("aller-simple")}
                        className="accent-blue-600 w-4 h-4"
                        />
                        Aller simple
                    </label>
                    <label className="flex items-center gap-2 text-gray-800 ">
                        <input
                        type="radio"
                        checked={typeVol === "aller-retour"}
                        onChange={() => {
                            setTypeVol("aller-retour");
                            setVolAllerChoisi(null);
                        }}
                        />
                        Aller-retour
                    </label>
                    </div>

                    {/* Formulaire */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Ville de départ"
                        value={villeDepart}
                        onChange={(e) => setVilleDepart(e.target.value)}
                        className="border border-gray-300 bg-gray-50 text-gray-800 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                        type="text"
                        placeholder="Ville d'arrivée"
                        value={villeDestination}
                        onChange={(e) => setVilleDestination(e.target.value)}
                        className="border border-gray-300 bg-gray-50 text-gray-800 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                        type="date"
                        value={dateAller}
                        min={today}
                        onChange={(e) => setDateAller(e.target.value)}
                        className=" border-gray-300 bg-gray-50 text-gray-800 border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
                    />
                    {typeVol === "aller-retour" && (
                        <input
                        type="date"
                        value={dateRetour}
                        min={dateAller || today}
                        onChange={(e) => setDateRetour(e.target.value)}
                        className=" border-gray-300 bg-gray-50 text-gray-800 border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
                        />
                    )}
                    </div>

                    <button
                    onClick={() => {
                        if (!dateAller || dateAller < today) {
                        alert("La date d'aller doit être aujourd'hui ou après.");
                        return;
                        }
                        if (typeVol === "aller-retour") {
                        if (!dateRetour) {
                            alert("Veuillez choisir une date de retour.");
                            return;
                        }
                        if (dateRetour <= dateAller) {
                            alert("La date de retour doit être postérieure à la date d'aller.");
                            return;
                        }
                        }
                        chercherVols();
                    }}
                    className="border border-gray-300 bg-gray-50 text-gray-800 py-3 rounded-lg font-semibold shadow transition"
                    >
                    {typeVol === "aller-retour" && volAllerChoisi ? "Rechercher retour" : "Rechercher"}
                    </button>

                    {/* Résultats */}
                    {volsData && (
                    <div className="mt-6 space-y-4">
                        {volsData.vols.elements.length === 0 && (
                        <p className="text-red-500">
                            {typeVol === "aller-retour" && volAllerChoisi
                            ? "Aucun vol retour disponible."
                            : "Aucun vol trouvé."}
                        </p>
                        )}

                        {volsData.vols.elements.map((v: any) => (
                        <div
                            key={v.id}
                            className={`border p-4 rounded-lg shadow flex justify-between items-center ${
                            volAllerChoisi?.id === v.id ? "border-blue-600 bg-blue-50" : ""
                            }`}
                        >
                            <div>
                            <p className="font-semibold">
                                {v.depart} → {v.destination}
                            </p>
                            <p className="text-sm text-gray-500">
                                {v.date} — {v.compagnie}
                            </p>
                            <p className="text-blue-600 font-bold">{fmtPrix(v.prix)}</p>
                            </div>
                            {typeVol === "aller-retour" && !volAllerChoisi ? (
                            <button
                                onClick={() => setVolAllerChoisi(v)}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                                Choisir ce vol aller
                            </button>
                            ) : (
                                
                            <Link
                            to={`/reservation/new?depart=${v.depart}&destination=${v.destination}&prix=${v.prix}`}
                            className="mt-3 inline-block bg-blue-500 !text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                            >
                            Réserver
                            </Link>
                            )}
                        </div>
                        ))}
                    </div>
                    )}
                </section>
                )}

            {/* ---- Logements ---- */}
                {onglet === "logements" && (
                <section className="bg-white shadow-lg rounded-2xl p-8 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
                    🏠 Rechercher un logement
                    </h2>
                    {/* Formulaire */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Ville"
                        value={villeLogement}
                        onChange={(e) => setVilleLogement(e.target.value)}
                        className="border border-gray-300 bg-gray-50 text-gray-800 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                        type="number"
                        min={1}
                        value={voyageurs}
                        onChange={(e) => setVoyageurs(Number(e.target.value))}
                        className=" border-gray-300 bg-gray-50 text-gray-800 border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"
                        placeholder="Voyageurs"
                    />
                    <input
                        type="date"
                        value={dateArrivee}
                        min={today}
                        onChange={(e) => setDateArrivee(e.target.value)}
                        className=" border-gray-300 bg-gray-50 text-gray-800 border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"

                    />
                    <input
                        type="date"
                        value={dateDepart}
                        min={dateArrivee || today}
                        onChange={(e) => setDateDepart(e.target.value)}
                        className=" border-gray-300 bg-gray-50 text-gray-800 border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-400"                       
                    />
                    </div>

                    <button
                    onClick={() => {
                        const today = new Date().toISOString().split("T")[0];
                        if (!dateArrivee || !dateDepart) {
                        alert("Veuillez choisir une date d'arrivée et une date de départ.");
                        return;
                        }
                        if (dateArrivee < today) {
                        alert("La date d'arrivée doit être aujourd'hui ou après.");
                        return;
                        }
                        if (dateDepart <= dateArrivee) {
                        alert("La date de départ doit être postérieure à la date d'arrivée.");
                        return;
                        }
                        chercherLogements();
                    }}
                    className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition"
                    >
                    Rechercher
                    </button>

                    {logementsLoading && <p className="mt-4">Chargement...</p>}
                    {logementsError && (
                    <p className="mt-4 text-red-500">Erreur: {logementsError.message}</p>
                    )}
                    {logementsData && (
                    <>
                        {/* Barre de tri */}
                        <div className="flex justify-end mt-6">
                        <select
                            value={tri}
                            onChange={(e) => setTri(e.target.value)}
                            className="border rounded-lg p-2 focus:ring-2 focus:ring-green-400"
                        >
                            <option value="prix-asc">Prix : croissant</option>
                            <option value="prix-desc">Prix : décroissant</option>
                            <option value="note">Note</option>
                            <option value="capacite">Capacité</option>
                        </select>
                        </div>

                        {/* Résultats */}
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {logementsData.logements.elements.length === 0 && (
                            <p className="text-red-500">Aucun logement trouvé.</p>
                        )}

                        {logementsData.logements.elements
                            .slice() // copie pour éviter de muter
                            .sort((a: any, b: any) => {
                            if (tri === "prix-asc") return a.prixParNuit - b.prixParNuit;
                            if (tri === "prix-desc") return b.prixParNuit - a.prixParNuit;
                            if (tri === "note") return b.note - a.note;
                            if (tri === "capacite") return b.capacite - a.capacite;
                            return 0;
                            })
                            .map((l: any) => (
                            <div
                                key={l.id}
                                className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition bg-white flex flex-col"
                            >
                                <img
                                src={l.photos?.[0]?.url || "/placeholder.jpg"}
                                alt={l.titre}
                                className="h-48 w-full object-cover"
                                />
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-lg text-black">{l.titre}</h3>
                                    <p className="text-sm text-gray-600">
                                    Capacité : {l.capacite} pers. • {l.chambres} chambres
                                    </p>
                                    <p className="text-yellow-500 font-semibold">⭐ {l.note}/5</p>
                                    <p className="text-green-600 font-bold">
                                    {fmtPrix(l.prixParNuit)} / nuit
                                    </p>
                                </div>
                                    <Link
                                            to={`/reservation/new?destination=${encodeURIComponent(
                                                l.titre
                                            )}&prix=${l.prixParNuit}&ville=${l.ville}`}
                                            className="mt-4 w-full bg-blue-500 !text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition text-center"
                                            >
                                            Réserver
                                    </Link>
                                </div>
                            </div>
                            ))}
                        </div>
                    </>
                    )}
                </section>
                )}

            </div>
        </div>
    </div>
  );
}
