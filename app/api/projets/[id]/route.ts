import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

// Import de la base de données simulée
const PROJETS_DB: any[] = []

/**
 * GET /api/projets/[id] - Récupère un projet spécifique
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const projet = PROJETS_DB.find((p) => p.id === params.id)

    if (!projet) {
      return NextResponse.json({ success: false, error: "Projet non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    if (
      currentUser.role !== "superadmin" &&
      !projet.utilisateurs.includes(currentUser.id) &&
      projet.createdBy !== currentUser.id
    ) {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: projet,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

/**
 * PUT /api/projets/[id] - Met à jour un projet
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = getCurrentUser(request)

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    const projetIndex = PROJETS_DB.findIndex((p) => p.id === params.id)

    if (projetIndex === -1) {
      return NextResponse.json({ success: false, error: "Projet non trouvé" }, { status: 404 })
    }

    const updates = await request.json()
    const updatedProjet = {
      ...PROJETS_DB[projetIndex],
      ...updates,
      dateModification: new Date(),
    }

    PROJETS_DB[projetIndex] = updatedProjet

    return NextResponse.json({
      success: true,
      data: updatedProjet,
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
