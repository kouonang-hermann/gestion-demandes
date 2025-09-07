import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import type { HistoryEntry } from "@/types"

// Base de données simulée
const HISTORY_DB: HistoryEntry[] = []

/**
 * GET /api/historique - Récupère l'historique filtrable
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projetId = searchParams.get("projetId")
    const dateDebut = searchParams.get("dateDebut")
    const dateFin = searchParams.get("dateFin")
    const userId = searchParams.get("userId")
    const action = searchParams.get("action")

    let filteredHistory = HISTORY_DB

    // Filtrer selon les projets accessibles à l'utilisateur
    if (currentUser.role !== "superadmin") {
      // Récupérer les demandes des projets où l'utilisateur est assigné
      filteredHistory = HISTORY_DB.filter((entry) => {
        // Ici on devrait vérifier si la demande appartient à un projet accessible
        // Pour la simulation, on filtre par userId si ce n'est pas un admin
        return entry.userId === currentUser.id || currentUser.projets.length > 0
      })
    }

    // Filtres additionnels
    if (projetId) {
      // Filtrer par projet (nécessiterait une jointure avec les demandes)
      // Pour la simulation, on garde tous les résultats
    }

    if (dateDebut) {
      const debut = new Date(dateDebut)
      filteredHistory = filteredHistory.filter((entry) => new Date(entry.timestamp) >= debut)
    }

    if (dateFin) {
      const fin = new Date(dateFin)
      fin.setHours(23, 59, 59, 999) // Fin de journée
      filteredHistory = filteredHistory.filter((entry) => new Date(entry.timestamp) <= fin)
    }

    if (userId) {
      filteredHistory = filteredHistory.filter((entry) => entry.userId === userId)
    }

    if (action) {
      filteredHistory = filteredHistory.filter((entry) => entry.action.toLowerCase().includes(action.toLowerCase()))
    }

    // Trier par date décroissante
    filteredHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      success: true,
      data: filteredHistory,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

/**
 * POST /api/historique - Ajoute une entrée à l'historique
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const { demandeId, action, ancienStatus, nouveauStatus, commentaire } = await request.json()

    if (!demandeId || !action) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 })
    }

    const historyEntry: HistoryEntry = {
      id: Date.now().toString(),
      demandeId,
      userId: currentUser.id,
      action,
      ancienStatus,
      nouveauStatus,
      commentaire,
      timestamp: new Date(),
      signature: `${currentUser.id}-${Date.now()}-${action}`, // Signature simplifiée
    }

    HISTORY_DB.push(historyEntry)

    return NextResponse.json(
      {
        success: true,
        data: historyEntry,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erreur lors de l'ajout à l'historique:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
