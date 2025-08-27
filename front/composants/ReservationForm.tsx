// src/composants/ReservationForm.tsx
import { useState, useEffect } from "react";
import { useMutation, gql } from "@apollo/client";
import { useNavigate, useLocation } from "react-router-dom";

const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: ReservationInput!) {
    createReservation(input: $input) {
      reservation {
        id
        nom
        prenom
        email
        destination
        dateVoyage
        nombrePersonnes
        statut
      }
    }
  }
`;

export default function ReservationForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const depart = query.get("depart") || "";
  const destination = query.get("destination") || "";
  const prix = query.get("prix") || "";

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    destination: destination,
    dateVoyage: "",
    nombrePersonnes: 1,
  });

  useEffect(() => {
    if (destination) {
      setFormData((prev) => ({ ...prev, destination }));
    }
  }, [destination]);

  const [createReservation, { loading, error }] = useMutation(CREATE_RESERVATION);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await createReservation({
        variables: { input: { ...formData } },
      });

      const reservationId = data?.createReservation?.reservation?.id;
      if (!reservationId) {
        alert("Erreur : réservation non créée.");
        return;
      }

      // ✅ au lieu de payer ici → on redirige vers ReservationDetail
      navigate(`/reservation/${reservationId}`);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la réservation.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-bold mb-4">Réserver un voyage</h2>
      <p className="text-gray-600 mb-2">
        {depart} → {destination} ({prix && `${prix} $CAD`})
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input name="destination" placeholder="Destination" value={formData.destination} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input type="date" name="dateVoyage" value={formData.dateVoyage} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input type="number" name="nombrePersonnes" placeholder="Nombre de personnes" value={formData.nombrePersonnes} onChange={handleChange} className="w-full border px-3 py-2 rounded" />

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          {loading ? "En cours..." : "Confirmer la réservation"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-2">Erreur : {error.message}</p>}
    </div>
  );
}
