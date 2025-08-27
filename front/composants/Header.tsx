import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../src/auth";
import logo from "../src/assets/logo.png"

export default function Header() {
  const { token, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/"); // Redirige vers l'accueil
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="w-[80px] h-auto" />
        </Link>

        <nav className="space-x-4">

          {token ? (
            <>
              <Link to="/reservations" className="text-blue-600 font-semibold">Mes réservations</Link>
              <Link to="/factures" className="hover:text-blue-600">Mes factures</Link>    
              <Link to="/profile" className="hover:underline">Voir mon profil</Link>
              <button onClick={handleLogout} className="hover:underline text-red-600">
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:underline">Connexion</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
