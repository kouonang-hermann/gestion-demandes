import { type NextRequest, NextResponse } from "next/server"
import type { Demande, DemandeStatus, SortieSignature, User } from "@/types"

// Base de données simulée pour les utilisateurs
const USERS_DB: User[] = [
  {
    id: "1",
    nom: "Admin",
    prenom: "Super",
    email: "admin@example.com",
    role: "superadmin",
    projets: [],
    createdAt: new Date(),
  },
  {
    id: "2",
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@example.com",
    role: "technicien",
    projets: ["1"],
    createdAt: new Date(),
  },
  {
    id: "3",
    nom: "Martin",
    prenom: "Pierre",
    email: "pierre.martin@example.com",
    role: "conducteur_travaux",
    projets: ["1"],
    createdAt: new Date(),
  },
  {
    id: "4",
    nom: "Durand",
    prenom: "Marie",
    email: "marie.durand@example.com",
    role: "responsable_qhse",
    projets: ["1"],
    createdAt: new Date(),
  },
  {
    id: "5",
    nom: "Bernard",
    prenom: "Paul",
    email: "paul.bernard@example.com",
    role: "responsable_appro",
    projets: ["1"],
    createdAt: new Date(),
  },
  {
    id: "6",
    nom: "Moreau",
    prenom: "Sophie",
    email: "sophie.moreau@example.com",
    role: "charge_affaire",
    projets: ["1"],
    createdAt: new Date(),
  },
]

// Import de la base de données simulée
const DEMANDES_DB: Demande[] = []

function createValidationSignature(user: User, action: string, commentaire?: string) {
  const timestamp = new Date()
  const signature = `${user.id}-${action}-${timestamp.getTime()}`

  return {
    userId: user.id,
    date: timestamp,
    commentaire,
    signature,
  }
}

function canModifySortie(dateSortie: Date): boolean {
  const now = new Date()
  const diffMinutes = (now.getTime() - dateSortie.getTime()) / (1000 * 60)
  return diffMinutes <= 45
}

/**
 * POST /api/demandes/[id]/actions - Exécute une action sur une demande
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const currentUser = USERS_DB.find((u) => u.id === userId)
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Utilisateur non trouvé" }, { status: 401 })
    }

    const { action, commentaire, data } = await request.json()

    const demandeIndex = DEMANDES_DB.findIndex((d) => d.id === params.id)

    if (demandeIndex === -1) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    const demande = DEMANDES_DB[demandeIndex]
    let newStatus: DemandeStatus = demande.status
    const updates: Partial<Demande> = {}

    // Vérifier les permissions et exécuter l'action
    switch (action) {
      case "soumettre":
        if (demande.status === "brouillon" && demande.technicienId === currentUser.id) {
          newStatus = "soumise"
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée" }, { status: 403 })
        }
        break

      case "valider_materiel":
        if (
          demande.status === "soumise" &&
          demande.type === "materiel" &&
          currentUser.role === "conducteur_travaux" &&
          currentUser.projets.includes(demande.projetId)
        ) {
          newStatus = "validee_conducteur"
          updates.validationConducteur = createValidationSignature(currentUser, "validation_materiel", commentaire)
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée" }, { status: 403 })
        }
        break

      case "valider_outillage":
        if (
          demande.status === "soumise" &&
          demande.type === "outillage" &&
          currentUser.role === "responsable_qhse" &&
          currentUser.projets.includes(demande.projetId)
        ) {
          newStatus = "validee_qhse"
          updates.validationQHSE = createValidationSignature(currentUser, "validation_outillage", commentaire)
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée" }, { status: 403 })
        }
        break

      case "rejeter":
        if (
          demande.status === "soumise" &&
          ((demande.type === "materiel" && currentUser.role === "conducteur_travaux") ||
            (demande.type === "outillage" && currentUser.role === "responsable_qhse") ||
            currentUser.role === "superadmin") &&
          (currentUser.role === "superadmin" || currentUser.projets.includes(demande.projetId))
        ) {
          newStatus = "rejetee"
          updates.rejetMotif = commentaire
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée" }, { status: 403 })
        }
        break

      case "preparer_sortie":
        if (
          (demande.status === "validee_conducteur" || demande.status === "validee_qhse") &&
          currentUser.role === "responsable_appro" &&
          (currentUser.role === "superadmin" || currentUser.projets.includes(demande.projetId))
        ) {
          newStatus = "sortie_preparee"

          const dateSortie = new Date()
          const sortieSignature: SortieSignature = {
            ...createValidationSignature(currentUser, "preparation_sortie", commentaire),
            quantitesSorties: {},
            modifiable: true,
            dateModificationLimite: new Date(dateSortie.getTime() + 45 * 60 * 1000), // +45 minutes
          }

          updates.sortieAppro = sortieSignature
          updates.dateSortie = dateSortie
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée" }, { status: 403 })
        }
        break

      case "modifier_sortie":
        if (
          demande.status === "sortie_preparee" &&
          currentUser.role === "responsable_appro" &&
          demande.sortieAppro &&
          canModifySortie(demande.sortieAppro.date) &&
          (currentUser.role === "superadmin" || currentUser.projets.includes(demande.projetId))
        ) {
          updates.sortieAppro = {
            ...demande.sortieAppro,
            commentaire: commentaire || demande.sortieAppro.commentaire,
          }
        } else {
          return NextResponse.json(
            { success: false, error: "Modification non autorisée ou délai dépassé" },
            { status: 403 },
          )
        }
        break

      case "valider_preparation":
        if (
          demande.status === "sortie_preparee" &&
          currentUser.role === "charge_affaire" &&
          (currentUser.role === "superadmin" || currentUser.projets.includes(demande.projetId))
        ) {
          newStatus = "validee_charge_affaire"
          updates.validationChargeAffaire = createValidationSignature(
            currentUser,
            "validation_preparation",
            commentaire,
          )

          // Rendre la sortie non modifiable
          if (demande.sortieAppro) {
            updates.sortieAppro = {
              ...demande.sortieAppro,
              modifiable: false,
            }
          }
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée" }, { status: 403 })
        }
        break

      case "validation_finale":
        if (
          demande.status === "validee_charge_affaire" &&
          currentUser.role === "technicien" &&
          demande.technicienId === currentUser.id
        ) {
          newStatus = "validee_finale"
          updates.validationFinale = createValidationSignature(currentUser, "validation_finale", commentaire)
          updates.dateValidationFinale = new Date()
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée" }, { status: 403 })
        }
        break

      case "archiver":
        if (demande.status === "validee_finale" && currentUser.role === "superadmin") {
          newStatus = "archivee"
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée" }, { status: 403 })
        }
        break

      default:
        return NextResponse.json({ success: false, error: "Action non reconnue" }, { status: 400 })
    }

    // Mettre à jour la demande
    const updatedDemande = {
      ...demande,
      ...updates,
      status: newStatus,
      dateModification: new Date(),
    }

    DEMANDES_DB[demandeIndex] = updatedDemande

    // Créer une notification pour les utilisateurs concernés
    const notification = {
      id: Date.now().toString(),
      userId: demande.technicienId,
      titre: "Mise à jour de demande",
      message: `Votre demande ${demande.numero} a été ${getActionLabel(action)}`,
      lu: false,
      createdAt: new Date(),
      demandeId: params.id,
      projetId: demande.projetId,
    }

    // Créer une entrée d'historique
    const historyEntry = {
      id: Date.now().toString(),
      demandeId: params.id,
      userId: currentUser.id,
      action: getActionLabel(action),
      ancienStatus: demande.status,
      nouveauStatus: newStatus,
      commentaire: commentaire,
      timestamp: new Date(),
      signature: `${currentUser.id}-${Date.now()}-${action}`,
    }

    return NextResponse.json({
      success: true,
      data: {
        demande: updatedDemande,
        notification,
        historyEntry,
      },
    })
  } catch (error) {
    console.error("Erreur lors de l'exécution de l'action:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    soumettre: "soumise",
    valider_materiel: "validée par le conducteur",
    valider_outillage: "validée par le responsable QHSE",
    rejeter: "rejetée",
    preparer_sortie: "préparée pour sortie",
    modifier_sortie: "modifiée",
    valider_preparation: "validée par le chargé d'affaire",
    validation_finale: "validée définitivement",
    archiver: "archivée",
  }
  return labels[action] || "mise à jour"
}
