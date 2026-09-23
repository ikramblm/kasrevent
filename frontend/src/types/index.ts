export type Role = "ADMIN" | "GERANT" | "USER";

export interface CurrentUser {
  id: string;
  nom: string;
  email: string | null;
  role: Role;
  telephone?: string | null;
}

export interface Client {
  id: string;
  nom: string;
  prenom?: string | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
}

export interface Salle {
  id: string;
  nom: string;
  localisation?: string | null;
  capacite?: number | null;
  tarif?: string | number | null;
  equipementsInclus: string[];
}

export type StatutReservation = "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE" | "CLOTURE";
export type TypeEvenement = "MARIAGE" | "SEMINAIRE" | "ANNIVERSAIRE" | "EVENEMENT" | "AUTRE";

export interface Reservation {
  id: string;
  clientId: string;
  client?: Client;
  salleId?: string | null;
  salle?: Salle | null;
  dateDebut: string;
  dateFin: string;
  typeEvenement: TypeEvenement;
  nombreInvites: number;
  statut: StatutReservation;
  totalAPayer: string | number;
  avanceVersee: string | number;
  resteAPayer: string | number;
  confiscationPolicy: boolean;
  creerFacture: boolean;
  invitationLink?: string;
}

export interface Invite {
  id: string;
  reservationId: string;
  nom: string;
  prenom?: string | null;
  telephone?: string | null;
  statut: "CONFIRME" | "NON_CONFIRME";
  heureEntree?: string | null;
  heureSortie?: string | null;
  qrCodeToken: string;
}

export interface Employe {
  id: string;
  nom: string;
  prenom?: string | null;
  role: string;
  telephone?: string | null;
  email?: string | null;
  disponibilite: boolean;
  typePaie: "MENSUELLE" | "JOURNALIERE";
  paieMensuelle?: string | number | null;
  paieParJour?: string | number | null;
  montantAPayer: string | number;
  jourDePaie?: number | null;
}

export interface Fournisseur {
  id: string;
  company: string;
  nom?: string | null;
  tel?: string | null;
  dettes: string | number;
}

export interface Traiteur {
  id: string;
  nom: string;
  telephone?: string | null;
  dettes: string | number;
}

export interface DashboardKpis {
  chiffreAffaireTotal: number;
  revenusNet: number;
  charges: number;
  chargesFiltre: number;
  paiementDeDettes: number;
  investissements: number;
  paiementSalaires: number;
  resultatFiltre: number;
  creanceTotal: number;
}
