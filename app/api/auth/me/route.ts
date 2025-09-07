import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

/**
 * GET /api/auth/me - Récupère les informations de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}
