import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

// Import de la base de données simulée
const NOTIFICATIONS_DB: any[] = []

/**
 * PUT /api/notifications/[id]/read - Marque une notification comme lue
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const notificationIndex = NOTIFICATIONS_DB.findIndex((n) => n.id === params.id && n.userId === currentUser.id)

    if (notificationIndex === -1) {
      return NextResponse.json({ success: false, error: "Notification non trouvée" }, { status: 404 })
    }

    NOTIFICATIONS_DB[notificationIndex].lu = true

    return NextResponse.json({
      success: true,
      data: NOTIFICATIONS_DB[notificationIndex],
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
