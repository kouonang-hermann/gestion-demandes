import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
import { updateDemandeStatusSchema } from "@/lib/validations"

/**
 * Détermine le prochain statut selon le statut actuel et le rôle
 */
function getNextStatus(currentStatus: string, userRole: string): string | null {
  const transitions: Record<string, Record<string, string>> = {
    "en_attente_validation_conducteur": {
      "conducteur_travaux": "en_attente_validation_appro"
    },
    "en_attente_validation_qhse": {
      "responsable_qhse": "en_attente_validation_appro"
    },
    "en_attente_validation_appro": {
      "responsable_appro": "en_attente_validation_charge_affaire"
    },
    "en_attente_validation_charge_affaire": {
      "charge_affaire": "en_attente_validation_logistique"
    },
    "en_attente_validation_logistique": {
      "responsable_logistique": "en_attente_confirmation_demandeur"
    },
    "en_attente_confirmation_demandeur": {
      "technicien": "confirmee_demandeur"
    }
  }

  return transitions[currentStatus]?.[userRole] || null
}

/**
 * GET /api/demandes/[id] - Récupère une demande spécifique
 */
export const GET = withAuth(async (request: NextRequest, currentUser: any, { params }: { params: { id: string } }) => {
  try {
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
      include: {
        projet: {
          select: { id: true, nom: true }
        },
        technicien: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        items: {
          include: {
            article: true
          }
        },
        validationSignatures: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true, role: true }
            }
          },
          orderBy: { dateSignature: 'asc' }
        },
        historyEntries: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true }
            }
          },
          orderBy: { dateAction: 'desc' }
        }
      }
    })

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    // Vérifier les permissions d'accès
    const hasAccess = currentUser.role === "superadmin" || 
                     demande.technicienId === currentUser.id ||
                     await prisma.userProjet.findFirst({
                       where: {
                         userId: currentUser.id,
                         projetId: demande.projetId
                       }
                     })

    if (!hasAccess) {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: demande,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération de la demande:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

/**
 * PUT /api/demandes/[id] - Met à jour le statut d'une demande (validation/rejet)
 */
export const PUT = withAuth(async (request: NextRequest, currentUser: any, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json()
    const validatedData = updateDemandeStatusSchema.parse(body)

    // Récupérer la demande actuelle
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
      include: {
        projet: true,
        technicien: true
      }
    })

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    // Vérifier les permissions selon le statut actuel
    const canValidate = await canUserValidateStatus(demande.status, currentUser, demande.projetId)
    if (!canValidate) {
      return NextResponse.json({ success: false, error: "Vous n'avez pas les permissions pour cette action" }, { status: 403 })
    }

    let newStatus = validatedData.status

    // Si c'est une validation (pas un rejet), déterminer le prochain statut automatiquement
    if (validatedData.status !== "rejetee") {
      const nextStatus = getNextStatus(demande.status, currentUser.role)
      if (nextStatus) {
        newStatus = nextStatus
      }
    }

    // Mettre à jour la demande
    const updatedDemande = await prisma.demande.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        dateModification: new Date(),
      },
      include: {
        projet: {
          select: { id: true, nom: true }
        },
        technicien: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        items: {
          include: {
            article: true
          }
        }
      }
    })

    // Créer une signature de validation
    await prisma.validationSignature.create({
      data: {
        demandeId: params.id,
        userId: currentUser.id,
        role: currentUser.role,
        action: validatedData.status === "rejetee" ? "Rejet" : "Validation",
        commentaire: validatedData.commentaire,
        signature: `${currentUser.role}-${Date.now()}`,
      }
    })

    // Créer une entrée dans l'historique
    await prisma.historyEntry.create({
      data: {
        demandeId: params.id,
        userId: currentUser.id,
        action: validatedData.status === "rejetee" ? 
          `Demande rejetée par ${currentUser.role}` : 
          `Demande validée par ${currentUser.role}`,
        nouveauStatus: newStatus,
        commentaire: validatedData.commentaire,
        signature: `${currentUser.role}-validation-${Date.now()}`,
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedDemande,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: "Données invalides", details: error }, { status: 400 })
    }
    
    console.error("Erreur lors de la mise à jour de la demande:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

/**
 * Vérifie si un utilisateur peut valider une demande selon son statut
 */
async function canUserValidateStatus(status: string, user: any, projetId: string): Promise<boolean> {
  // Superadmin peut tout faire
  if (user.role === "superadmin") return true

  // Vérifier que l'utilisateur est assigné au projet
  const userProjet = await prisma.userProjet.findFirst({
    where: {
      userId: user.id,
      projetId: projetId
    }
  })

  if (!userProjet && user.role !== "superadmin") return false

  // Permissions selon le statut et le rôle
  const permissions: Record<string, string[]> = {
    "en_attente_validation_conducteur": ["conducteur_travaux"],
    "en_attente_validation_qhse": ["responsable_qhse"],
    "en_attente_validation_appro": ["responsable_appro"],
    "en_attente_validation_charge_affaire": ["charge_affaire"],
    "en_attente_validation_logistique": ["responsable_logistique"],
    "en_attente_confirmation_demandeur": ["technicien"]
  }

  return permissions[status]?.includes(user.role) || false
}

/**
 * DELETE /api/demandes/[id] - Supprime une demande (seulement si brouillon)
 */
export const DELETE = withAuth(async (request: NextRequest, currentUser: any, { params }: { params: { id: string } }) => {
  try {
    const demande = await prisma.demande.findUnique({
      where: { id: params.id }
    })

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    // Seul le créateur ou un superadmin peut supprimer une demande brouillon
    if (demande.technicienId !== currentUser.id && currentUser.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    if (demande.status !== "brouillon") {
      return NextResponse.json({ success: false, error: "Seules les demandes en brouillon peuvent être supprimées" }, { status: 400 })
    }

    await prisma.demande.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression de la demande:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})
