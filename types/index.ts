export type UserRole =
  | "superadmin"
  | "technicien"
  | "conducteur_travaux"
  | "responsable_qhse"
  | "responsable_appro"
  | "charge_affaire"

export type DemandeType = "materiel" | "outillage"

export type DemandeStatus =
  | "brouillon"
  | "soumise"
  | "en_attente_validation_conducteur"
  | "en_attente_validation_qhse"
  | "validee_conducteur"
  | "validee_qhse"
  | "rejetee"
  | "en_attente_sortie"
  | "sortie_preparee"
  | "en_attente_validation_charge_affaire"
  | "validee_charge_affaire"
  | "en_attente_validation_finale"
  | "validee_finale"
  | "archivee"

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: UserRole
  projets: string[] // IDs des projets assignés
  createdAt: Date
}

export interface Projet {
  id: string
  nom: string
  description: string
  dateDebut: Date
  dateFin?: Date
  createdBy: string // SuperAdmin ID
  utilisateurs: string[] // User IDs
  actif: boolean
  createdAt: Date
}

export interface Article {
  id: string
  nom: string
  description: string
  reference: string
  unite: string
  type: DemandeType
  stock?: number
  prixUnitaire?: number
  createdAt: Date
}

export interface ItemDemande {
  id: string
  articleId: string
  article?: Article
  quantiteDemandee: number
  quantiteValidee?: number
  quantiteSortie?: number
  quantiteRecue?: number
  commentaire?: string
}

export interface Demande {
  id: string
  numero: string
  projetId: string
  projet?: Projet
  technicienId: string
  technicien?: User
  type: DemandeType
  items: ItemDemande[]
  status: DemandeStatus
  dateCreation: Date
  dateModification: Date
  dateSortie?: Date
  dateValidationFinale?: Date

  // Validations et signatures
  validationConducteur?: ValidationSignature
  validationQHSE?: ValidationSignature
  sortieAppro?: SortieSignature
  validationChargeAffaire?: ValidationSignature
  validationFinale?: ValidationSignature

  commentaires?: string
  rejetMotif?: string
}

export interface ValidationSignature {
  userId: string
  user?: User
  date: Date
  commentaire?: string
  signature: string // Hash de validation
}

export interface SortieSignature extends ValidationSignature {
  quantitesSorties: { [itemId: string]: number }
  modifiable: boolean // true si < 45 minutes
  dateModificationLimite: Date
}

export interface HistoryEntry {
  id: string
  demandeId: string
  userId: string
  user?: User
  action: string
  ancienStatus?: DemandeStatus
  nouveauStatus?: DemandeStatus
  commentaire?: string
  timestamp: Date
  signature: string
}

export interface Notification {
  id: string
  userId: string
  titre: string
  message: string
  lu: boolean
  createdAt: Date
  demandeId?: string
  projetId?: string
}
