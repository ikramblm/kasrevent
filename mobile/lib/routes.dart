import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';
import 'screens/reservations/reservations_screen.dart';
import 'screens/reservations/reservation_detail_screen.dart';
import 'screens/clients_screen.dart';
import 'screens/salles_screen.dart';
import 'screens/checkin_screen.dart';
import 'screens/confiscations_screen.dart';
import 'screens/charges_screen.dart';
import 'screens/fournisseurs_screen.dart';
import 'screens/traiteurs_screen.dart';
import 'screens/decorations_screen.dart';
import 'screens/employes_screen.dart';
import 'screens/historique_paie_screen.dart';
import 'screens/users_screen.dart';

const routeDashboard = '/';
const routeReservations = '/reservations';
const routeReservationDetail = '/reservation-detail';
const routeClients = '/clients';
const routeSalles = '/salles';
const routeCheckin = '/checkin';
const routeConfiscations = '/confiscations';
const routeCharges = '/charges';
const routeFournisseurs = '/fournisseurs';
const routeTraiteurs = '/traiteurs';
const routeDecorations = '/decorations';
const routeEmployes = '/employes';
const routeHistoriquePaie = '/historique-paie';
const routeUtilisateurs = '/utilisateurs';

Route<dynamic> generateAppRoute(RouteSettings settings) {
  Widget page;
  switch (settings.name) {
    case routeReservations:
      page = const ReservationsScreen();
      break;
    case routeReservationDetail:
      page = ReservationDetailScreen(reservationId: settings.arguments as String);
      break;
    case routeClients:
      page = const ClientsScreen();
      break;
    case routeSalles:
      page = const SallesScreen();
      break;
    case routeCheckin:
      page = const CheckInScreen();
      break;
    case routeConfiscations:
      page = const ConfiscationsScreen();
      break;
    case routeCharges:
      page = const ChargesScreen();
      break;
    case routeFournisseurs:
      page = const FournisseursScreen();
      break;
    case routeTraiteurs:
      page = const TraiteursScreen();
      break;
    case routeDecorations:
      page = const DecorationsScreen();
      break;
    case routeEmployes:
      page = const EmployesScreen();
      break;
    case routeHistoriquePaie:
      page = const HistoriquePaieScreen();
      break;
    case routeUtilisateurs:
      page = const UsersScreen();
      break;
    case routeDashboard:
    default:
      page = const DashboardScreen();
  }
  return MaterialPageRoute(builder: (_) => page, settings: settings);
}
