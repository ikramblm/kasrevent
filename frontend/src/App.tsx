import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import ReservationDetail from "./pages/ReservationDetail";
import Clients from "./pages/Clients";
import Salles from "./pages/Salles";
import CheckIn from "./pages/CheckIn";
import Confiscations from "./pages/Confiscations";
import Charges from "./pages/Charges";
import Fournisseurs from "./pages/Fournisseurs";
import Traiteurs from "./pages/Traiteurs";
import Decorations from "./pages/Decorations";
import Employes from "./pages/Employes";
import HistoriquePaie from "./pages/HistoriquePaie";
import Users from "./pages/Users";
import AdminConfig from "./pages/AdminConfig";
import DemandesReservation from "./pages/DemandesReservation";
import Rsvp from "./pages/Rsvp";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/rsvp/:reservationId" element={<Rsvp />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
      <Route path="/reservations/:id" element={<ProtectedRoute><ReservationDetail /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/salles" element={<ProtectedRoute><Salles /></ProtectedRoute>} />
      <Route path="/checkin" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
      <Route path="/confiscations" element={<ProtectedRoute><Confiscations /></ProtectedRoute>} />
      <Route path="/demandes" element={<ProtectedRoute><DemandesReservation /></ProtectedRoute>} />
      <Route path="/charges" element={<ProtectedRoute roles={["ADMIN", "GERANT"]}><Charges /></ProtectedRoute>} />
      <Route path="/fournisseurs" element={<ProtectedRoute roles={["ADMIN"]}><Fournisseurs /></ProtectedRoute>} />
      <Route path="/traiteurs" element={<ProtectedRoute><Traiteurs /></ProtectedRoute>} />
      <Route path="/decorations" element={<ProtectedRoute><Decorations /></ProtectedRoute>} />
      <Route path="/employes" element={<ProtectedRoute roles={["ADMIN"]}><Employes /></ProtectedRoute>} />
      <Route path="/historique-paie" element={<ProtectedRoute roles={["ADMIN", "GERANT"]}><HistoriquePaie /></ProtectedRoute>} />
      <Route path="/utilisateurs" element={<ProtectedRoute roles={["ADMIN"]}><Users /></ProtectedRoute>} />
      <Route path="/admin-config" element={<ProtectedRoute roles={["ADMIN"]}><AdminConfig /></ProtectedRoute>} />
    </Routes>
  );
}
