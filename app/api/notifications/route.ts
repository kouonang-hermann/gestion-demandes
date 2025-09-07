import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import type { Notification } from "@/types"

// Base de données simulée
const NOTIFICATIONS_DB: Notification[] = []

/**
 * GET /api/notifications - Récupère les notifications de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const nonLues = searchParams.get("nonLues") === "true"

    let userNotifications = NOTIFICATIONS_DB.filter((n) => n.userId === currentUser.id)

    if (nonLues) {
      userNotifications = userNotifications.filter((n) => !n.lu)
    }

    // Trier par date décroissante
    userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      success: true,
      data: userNotifications,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

/**
 * POST /api/notifications - Crée une nouvelle notification
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const { userId, titre, message, demandeId, projetId } = await request.json()

    if (!userId || !titre || !message) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 })
    }

    const notification: Notification = {
      id: Date.now().toString(),
      userId,
      titre,
      message,
      lu: false,
      createdAt: new Date(),
      demandeId,
      projetId,
    }

    NOTIFICATIONS_DB.push(notification)

    return NextResponse.json(
      {
        success: true,
        data: notification,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
