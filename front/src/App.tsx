// src/App.tsx
import { Routes, Route, useNavigate } from "react-router-dom";
import { useState } from "react";

import Accueil from "../pages/Acceuil";
import Header from "../composants/Header";
import ListeLogements from "../composants/ListeLogements";
import ListeVols from "../composants/ListeVols";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import ReservationDetail from "../pages/ReservationDetail";
import Reservations from "../pages/Reservations";
import Factures from "../pages/Factures";
import Annulation from "../pages/Annulation";
import Success from "../pages/Success";

import ReservationForm from "../composants/ReservationForm";
import PrivateRoute from "./PrivateRoute";
import { useAuth } from "./auth";

function App() {
  const navigate = useNavigate();
  const { token } = useAuth(); // état connecté

  // pagination
  const [pageLogs, setPageLogs] = useState(1);
  const [pageVols, setPageVols] = useState(1);

  // format prix
  const fmtPrix = (n: number) =>
    new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(n);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          {/* Pages publiques */}
          <Route path="/" element={<Accueil />} />
          {!token && <Route path="/login" element={<Login />} />}
          {!token && <Route path="/register" element={<Register />} />}

          {/* Pages protégées */}
          {token && (
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
          )}

          {/* Liste logements & vols */}
          <Route
            path="/logements"
            element={
              <ListeLogements
                pageLogs={pageLogs}
                goPageLogs={setPageLogs}
                fmtPrix={fmtPrix}
                navigate={navigate}
              />
            }
          />
          <Route
            path="/vols"
            element={
              <ListeVols
                pageVols={pageVols}
                goPageVols={setPageVols}
                fmtPrix={fmtPrix}
                navigate={navigate}
              />
            }
          />

          {/* ✅ Routes réservation */}
          <Route path="/reservation/new" element={<ReservationForm />} />
          <Route path="/reservation/:id" element={<ReservationDetail />} />
          <Route path="/reservations" element={<Reservations />} />

          {/* ✅ Autres pages liées */}
          <Route path="/factures" element={<Factures />} />
          <Route path="/annulation/:id/:date" element={<Annulation />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

